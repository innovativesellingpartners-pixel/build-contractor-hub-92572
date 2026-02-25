import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ProvisionRequest {
  contractor_id: string;
  business_name: string;
  business_type: string;
  doing_business_as?: string;
  business_phone?: string;
  business_tax_id?: string;
  incorporation_date?: string;
  url?: string;
  principal_percentage_ownership?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  tax_id: string;
  date_of_birth: string;
  business_address_line1: string;
  business_address_line2?: string;
  business_address_city: string;
  business_address_state: string;
  business_address_postal_code: string;
  business_address_country?: string;
  bank_account_name: string;
  bank_routing_number: string;
  bank_account_number: string;
  bank_account_type: string;
  mcc?: string;
  max_transaction_amount?: number;
  annual_card_volume?: number;
  default_statement_descriptor?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin auth
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Not authenticated');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error('Not authenticated');

    // Check admin role
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'super_admin']);

    if (!roles || roles.length === 0) {
      throw new Error('Unauthorized: Admin access required');
    }

    const body: ProvisionRequest = await req.json();

    const finixApiKey = Deno.env.get('FINIX_API_KEY')!;
    const finixEnv = Deno.env.get('FINIX_ENVIRONMENT') || 'sandbox';
    const finixBaseUrl = finixEnv === 'live'
      ? 'https://finix.live-payments-api.com'
      : 'https://finix.sandbox-payments-api.com';

    const authHeaderValue = `Basic ${btoa(finixApiKey)}`;
    const finixHeaders = {
      'Authorization': authHeaderValue,
      'Content-Type': 'application/json',
      'Finix-Version': '2022-02-01',
    };

    console.log('Provisioning Finix merchant for contractor:', body.contractor_id);

    // Step 1: Create Identity (the merchant's business/owner info)
    const isNonSoleProp = body.business_type && body.business_type !== 'INDIVIDUAL_SOLE_PROPRIETORSHIP';

    // Finix sandbox app limit is 1,000,000 cents ($10,000) for max transaction amount.
    // Body values are expected in dollars from the UI.
    const requestedMaxTransactionAmount = Number(body.max_transaction_amount ?? 10000);
    const normalizedMaxTransactionAmount = Number.isFinite(requestedMaxTransactionAmount)
      ? Math.min(Math.max(requestedMaxTransactionAmount, 1), 10000)
      : 10000;

    const requestedAnnualCardVolume = Number(body.annual_card_volume ?? 1000000);
    const normalizedAnnualCardVolume = Number.isFinite(requestedAnnualCardVolume)
      ? Math.max(requestedAnnualCardVolume, 0)
      : 1000000;
    
    // Strip non-digits from tax IDs and phone numbers for Finix validation
    const stripNonDigits = (val: string | undefined | null) => (val || '').replace(/\D/g, '');
    const sanitizedTaxId = stripNonDigits(body.tax_id);
    const sanitizedBusinessTaxId = stripNonDigits(body.business_tax_id);
    const sanitizedPhone = stripNonDigits(body.phone);
    const sanitizedBusinessPhone = stripNonDigits(body.business_phone);

    const entityPayload: Record<string, any> = {
      business_name: body.business_name,
      business_type: body.business_type || 'INDIVIDUAL_SOLE_PROPRIETORSHIP',
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email,
      phone: sanitizedPhone,
      tax_id: sanitizedTaxId,
      dob: {
        year: parseInt(body.date_of_birth.split('-')[0]),
        month: parseInt(body.date_of_birth.split('-')[1]),
        day: parseInt(body.date_of_birth.split('-')[2]),
      },
      business_address: {
        line1: body.business_address_line1,
        line2: body.business_address_line2 || '',
        city: body.business_address_city,
        region: body.business_address_state,
        postal_code: body.business_address_postal_code,
        country: 'USA',
      },
      personal_address: {
        line1: body.business_address_line1,
        line2: body.business_address_line2 || '',
        city: body.business_address_city,
        region: body.business_address_state,
        postal_code: body.business_address_postal_code,
        country: 'USA',
      },
      mcc: body.mcc || '1520',
      max_transaction_amount: normalizedMaxTransactionAmount * 100,
      annual_card_volume: normalizedAnnualCardVolume * 100,
      default_statement_descriptor: body.default_statement_descriptor || body.business_name.substring(0, 20),
    };

    // Add fields required for non-sole-prop business types (LLC, Corp, Partnership)
    if (isNonSoleProp) {
      entityPayload.doing_business_as = body.doing_business_as || body.business_name;
      entityPayload.business_phone = sanitizedBusinessPhone || sanitizedPhone;
      entityPayload.business_tax_id = sanitizedBusinessTaxId || sanitizedTaxId;
      entityPayload.url = body.url || 'https://myct1.com';
      entityPayload.principal_percentage_ownership = parseInt(body.principal_percentage_ownership || '100');
      if (body.incorporation_date) {
        entityPayload.incorporation_date = {
          year: parseInt(body.incorporation_date.split('-')[0]),
          month: parseInt(body.incorporation_date.split('-')[1]),
          day: parseInt(body.incorporation_date.split('-')[2]),
        };
      } else {
        entityPayload.incorporation_date = { year: 2020, month: 1, day: 1 };
      }
    }

    const identityPayload = {
      entity: entityPayload,
      tags: {
        contractor_id: body.contractor_id,
        platform: 'ct1',
      },
    };

    console.log('Creating Finix Identity...');
    const identityResponse = await fetch(`${finixBaseUrl}/identities`, {
      method: 'POST',
      headers: finixHeaders,
      body: JSON.stringify(identityPayload),
    });

    if (!identityResponse.ok) {
      const errText = await identityResponse.text();
      console.error('Finix identity creation failed:', errText);
      throw new Error(`Failed to create merchant identity: ${errText}`);
    }

    const identity = await identityResponse.json();
    console.log('Identity created:', identity.id);

    // Step 2: Add bank account (Payment Instrument for settlements)
    const bankPayload = {
      identity: identity.id,
      type: 'BANK_ACCOUNT',
      name: body.bank_account_name,
      account_number: body.bank_account_number,
      bank_code: body.bank_routing_number,
      account_type: body.bank_account_type || 'CHECKING',
      country: 'USA',
      currency: 'USD',
    };

    console.log('Adding bank account...');
    const bankResponse = await fetch(`${finixBaseUrl}/payment_instruments`, {
      method: 'POST',
      headers: finixHeaders,
      body: JSON.stringify(bankPayload),
    });

    if (!bankResponse.ok) {
      const errText = await bankResponse.text();
      console.error('Bank account creation failed:', errText);
      throw new Error(`Failed to add bank account: ${errText}`);
    }

    const bankInstrument = await bankResponse.json();
    console.log('Bank account added:', bankInstrument.id);

    // Step 3: Provision Merchant (triggers underwriting)
    const merchantPayload = {
      processor: finixEnv === 'live' ? 'LITLE_V1' : 'DUMMY_V1',
      tags: {
        contractor_id: body.contractor_id,
        platform: 'ct1',
      },
    };

    console.log('Provisioning merchant...');
    const merchantResponse = await fetch(`${finixBaseUrl}/identities/${identity.id}/merchants`, {
      method: 'POST',
      headers: finixHeaders,
      body: JSON.stringify(merchantPayload),
    });

    if (!merchantResponse.ok) {
      const errText = await merchantResponse.text();
      console.error('Merchant provisioning failed:', errText);
      // Identity was created but merchant failed - save identity for reference but NOT as merchant_id
      // Do NOT update finix_merchant_id here since it's not a valid merchant yet
      console.error('Merchant provisioning failed, identity created:', identity.id);
      throw new Error(`Merchant provisioning failed. Identity ${identity.id} was created but merchant underwriting did not pass. Please retry or contact support.`);
    }

    const merchant = await merchantResponse.json();
    console.log('Merchant provisioned:', merchant.id, 'state:', merchant.onboarding_state);

    // Step 4: Save MERCHANT ID (MU...) to contractor profile — NOT the identity ID
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        finix_merchant_id: merchant.id,
        preferred_payment_provider: 'finix',
      })
      .eq('id', body.contractor_id);

    if (updateError) {
      console.error('Failed to update profile:', updateError);
      throw new Error('Merchant created but failed to save to profile');
    }

    return new Response(
      JSON.stringify({
        success: true,
        identity_id: identity.id,
        merchant_id: merchant.id,
        onboarding_state: merchant.onboarding_state,
        bank_instrument_id: bankInstrument.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Finix provisioning error:', error);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
