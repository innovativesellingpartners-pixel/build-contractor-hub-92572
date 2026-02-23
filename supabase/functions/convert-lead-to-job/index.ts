import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Extract the JWT token from the Authorization header
    const token = authHeader.replace('Bearer ', '');
    
    // Create admin client first to validate the token
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    
    // Validate user by getting user from JWT token
    const { data: { user }, error: authError } = await adminClient.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Unauthorized');
    }

    console.log('Authenticated user:', user.id);

    const { leadId, jobName } = await req.json();

    if (!leadId) {
      throw new Error('leadId is required');
    }

    // Check if the authenticated user is a super_admin
    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .maybeSingle();

    const isSuperAdmin = !!roleData;

    console.log('Converting lead to job', { leadId, contractorId: user.id, isSuperAdmin });

    // Get the lead - super_admins can access any lead, regular users only their own
    let leadQuery = adminClient
      .from('leads')
      .select('*, lead_sources(id, name)')
      .eq('id', leadId);

    if (!isSuperAdmin) {
      leadQuery = leadQuery.eq('user_id', user.id);
    }

    const { data: lead, error: leadError } = await leadQuery.single();

    if (leadError || !lead) {
      console.error('Lead fetch error:', leadError);
      throw new Error('Lead not found or access denied');
    }

    // Check if already converted
    if (lead.converted_to_job_id) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          jobId: lead.converted_to_job_id,
          customerId: lead.customer_id,
          alreadyConverted: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get referral source name from the lead_sources join or source_other
    let referralSource = null;
    let referralSourceOther = null;
    
    if (lead.lead_sources && typeof lead.lead_sources === 'object') {
      referralSource = (lead.lead_sources as any).name || null;
    }
    
    if (referralSource === 'Other' && lead.source_other) {
      referralSourceOther = lead.source_other;
    } else if (lead.source_other && !referralSource) {
      referralSourceOther = lead.source_other;
    }

    console.log('Lead data being transferred:', {
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      address: lead.address,
      city: lead.city,
      state: lead.state,
      zip_code: lead.zip_code,
      project_type: lead.project_type,
      referralSource,
      referralSourceOther,
      value: lead.value,
      notes: lead.notes,
    });

    // Use the lead's user_id as the owner (important for super_admin converting other users' leads)
    const ownerId = lead.user_id;

    // Step 1: Create Customer from Lead (if not already exists)
    let customerId = lead.customer_id;
    let customer;

    if (!customerId) {
      const { data: newCustomer, error: customerError } = await adminClient
        .from('customers')
        .insert({
          user_id: ownerId,
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
          referral_source_other: referralSourceOther,
        })
        .select()
        .single();

      if (customerError) {
        console.error('Error creating customer', customerError);
        throw customerError;
      }

      customer = newCustomer;
      customerId = newCustomer.id;
      console.log('Customer created', { customerId });
    } else {
      // Get existing customer and update with any missing info
      const { data: existingCustomer } = await adminClient
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();
      customer = existingCustomer;
      
      // Update customer with referral info if not already set
      if (existingCustomer && !existingCustomer.referral_source && referralSource) {
        await adminClient
          .from('customers')
          .update({
            referral_source: referralSource,
            referral_source_other: referralSourceOther,
          })
          .eq('id', customerId);
      }
    }

    // Build job notes with referral info
    let jobNotes = lead.notes || '';
    if (referralSourceOther || referralSource) {
      const referralInfo = referralSourceOther || referralSource;
      if (!jobNotes.includes('Referral:') && !jobNotes.includes('Referred by:')) {
        jobNotes = jobNotes ? `${jobNotes}\n\nReferred by: ${referralInfo}` : `Referred by: ${referralInfo}`;
      }
    }

    // Step 2: Create Job with ALL lead data
    const { data: newJob, error: jobError } = await adminClient
      .from('jobs')
      .insert({
        user_id: ownerId,
        customer_id: customerId,
        lead_id: leadId,
        name: jobName || lead.project_type || `Job for ${lead.name}`,
        description: lead.notes || null,
        address: lead.address || null,
        city: lead.city || null,
        state: lead.state || null,
        zip_code: lead.zip_code || null,
        status: 'scheduled',
        job_status: 'scheduled',
        notes: jobNotes.trim() || null,
        contract_value: lead.value || 0,
        total_contract_value: lead.value || 0,
        budget_amount: lead.value || 0,
        trade_type: lead.project_type || null,
        change_orders_total: 0,
        payments_collected: 0,
        expenses_total: 0,
        profit: 0,
        converted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating job', jobError);
      throw jobError;
    }

    console.log('Job created', { jobId: newJob.id, jobNumber: newJob.job_number });

    // Step 3: Update customer with job reference and lifetime value
    const { error: updateCustomerError } = await adminClient
      .from('customers')
      .update({
        job_id: newJob.id,
        lifetime_value: (customer?.lifetime_value || 0) + (lead.value || 0),
      })
      .eq('id', customerId);

    if (updateCustomerError) {
      console.error('Error updating customer', updateCustomerError);
    }

    // Step 4: Update lead - mark as converted with links to both customer and job
    const { error: updateLeadError } = await adminClient
      .from('leads')
      .update({
        customer_id: customerId,
        converted_to_customer: true,
        converted_to_job_id: newJob.id,
        converted_at: new Date().toISOString(),
        status: 'won',
      })
      .eq('id', leadId);

    if (updateLeadError) {
      console.error('Error updating lead', updateLeadError);
      throw updateLeadError;
    }

    // Build full client address for estimates
    const clientAddressParts = [lead.address, lead.city, lead.state, lead.zip_code].filter(Boolean);
    const clientAddress = clientAddressParts.length > 0 ? clientAddressParts.join(', ') : null;

    // Step 5: Update any existing estimates for this lead to link to customer and job
    const { data: updatedEstimates, error: updateEstimatesError } = await adminClient
      .from('estimates')
      .update({ 
        customer_id: customerId,
        job_id: newJob.id,
        status: 'sold',
        // Transfer ALL client info from lead
        client_name: lead.name,
        client_email: lead.email,
        client_phone: lead.phone,
        client_address: clientAddress,
        site_address: clientAddress,
        referred_by: referralSourceOther || referralSource,
        trade_type: lead.project_type,
      })
      .eq('lead_id', leadId)
      .select();

    if (updateEstimatesError) {
      console.error('Error updating estimates', updateEstimatesError);
    }

    // Step 6: If there are estimates, update job with estimate data (use the first/most recent)
    if (updatedEstimates && updatedEstimates.length > 0) {
      const primaryEstimate = updatedEstimates[0];
      const { error: updateJobError } = await adminClient
        .from('jobs')
        .update({
          original_estimate_id: primaryEstimate.id,
          contract_value: primaryEstimate.grand_total || primaryEstimate.total_amount || newJob.contract_value,
          total_contract_value: primaryEstimate.grand_total || primaryEstimate.total_amount || newJob.total_contract_value,
          budget_amount: primaryEstimate.grand_total || primaryEstimate.total_amount || newJob.budget_amount,
          trade_type: primaryEstimate.trade_type || newJob.trade_type,
          description: primaryEstimate.project_description || primaryEstimate.description || newJob.description,
        })
        .eq('id', newJob.id);

      if (updateJobError) {
        console.error('Error updating job with estimate data', updateJobError);
      }
    }

    console.log('Lead converted successfully', { 
      leadId, 
      customerId, 
      jobId: newJob.id,
      estimatesLinked: updatedEstimates?.length || 0
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        customerId,
        jobId: newJob.id,
        job: newJob,
        customer,
        estimatesLinked: updatedEstimates?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in convert-lead-to-job:', error);
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
