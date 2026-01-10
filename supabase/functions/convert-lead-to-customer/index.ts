import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { leadId } = await req.json();

    if (!leadId) {
      throw new Error('leadId is required');
    }

    console.log('Converting lead to customer', { leadId, contractorId: user.id });

    // Get the lead with all fields
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .eq('user_id', user.id)
      .single();

    if (leadError || !lead) {
      throw new Error('Lead not found');
    }

    if (lead.converted_to_customer && lead.customer_id) {
      // Get the existing customer to return
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', lead.customer_id)
        .single();

      console.log('Lead already converted', { customerId: lead.customer_id });
      return new Response(
        JSON.stringify({ 
          success: true, 
          customerId: lead.customer_id,
          customer: existingCustomer,
          alreadyConverted: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get lead source name if available
    let referralSource = null;
    if (lead.source_id) {
      const { data: source } = await supabase
        .from('lead_sources')
        .select('name')
        .eq('id', lead.source_id)
        .single();
      referralSource = source?.name;
    }

    // Create customer from lead with all available data
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        user_id: user.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        address: lead.address,
        city: lead.city,
        state: lead.state,
        zip_code: lead.zip_code,
        notes: lead.notes,
        customer_type: 'residential',
        lifetime_value: lead.value || 0,
        referral_source: referralSource,
      })
      .select()
      .single();

    if (customerError) {
      console.error('Error creating customer', customerError);
      throw customerError;
    }

    console.log('Customer created', { customerId: customer.id });

    // Update lead with customer_id and mark as converted
    const { error: updateLeadError } = await supabase
      .from('leads')
      .update({
        customer_id: customer.id,
        converted_to_customer: true,
        converted_at: new Date().toISOString(),
        status: 'won',
      })
      .eq('id', leadId)
      .eq('user_id', user.id);

    if (updateLeadError) {
      console.error('Error updating lead', updateLeadError);
      throw updateLeadError;
    }

    // Update any estimates that belong to this lead with customer info
    const { data: updatedEstimates, error: updateEstimatesError } = await supabase
      .from('estimates')
      .update({ 
        customer_id: customer.id,
        client_name: lead.name,
        client_email: lead.email,
        client_phone: lead.phone,
        client_address: [lead.address, lead.city, lead.state, lead.zip_code].filter(Boolean).join(', '),
      })
      .eq('lead_id', leadId)
      .eq('user_id', user.id)
      .select();

    if (updateEstimatesError) {
      console.error('Error updating estimates', updateEstimatesError);
      // Don't throw - this is not critical
    }

    console.log('Lead converted successfully', { 
      leadId, 
      customerId: customer.id,
      estimatesUpdated: updatedEstimates?.length || 0
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        customerId: customer.id,
        customer,
        estimatesUpdated: updatedEstimates?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in convert-lead-to-customer:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
