import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { buildCorsHeaders } from '../_shared/cors.ts';
import { getStripeClient, getCurrentContractorId, validateStripeConfig } from '../_shared/stripe-plaid.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(req) });
  }

  try {
    validateStripeConfig();
    
    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader! } } }
    );

    const contractorId = await getCurrentContractorId(supabase, authHeader);

    // Check if contractor already has a Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, contact_name, company_name')
      .eq('id', contractorId)
      .single();

    if (profileError) {
      throw new Error(`Failed to fetch contractor profile: ${profileError.message}`);
    }

    // If customer ID exists, return it
    if (profile.stripe_customer_id) {
      console.log(`Contractor ${contractorId} already has Stripe customer: ${profile.stripe_customer_id}`);
      return new Response(
        JSON.stringify({ customerId: profile.stripe_customer_id }),
        { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Create new Stripe customer
    const stripe = getStripeClient();
    const customer = await stripe.customers.create({
      name: profile.company_name || profile.contact_name || 'CT1 Contractor',
      metadata: {
        contractor_id: contractorId,
        source: 'ct1_platform',
      },
    });

    console.log(`Created Stripe customer ${customer.id} for contractor ${contractorId}`);

    // Store customer ID in database
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ stripe_customer_id: customer.id })
      .eq('id', contractorId);

    if (updateError) {
      throw new Error(`Failed to save Stripe customer ID: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ customerId: customer.id }),
      { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in stripe-ensure-customer:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...buildCorsHeaders(req), 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
