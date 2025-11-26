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

    const { estimateId } = await req.json();

    if (!estimateId) {
      throw new Error('estimateId is required');
    }

    console.log('Converting estimate to job', { estimateId, contractorId: user.id });

    // Get the estimate
    const { data: estimate, error: estimateError } = await supabase
      .from('estimates')
      .select('*')
      .eq('id', estimateId)
      .eq('user_id', user.id) // Security: scope by contractor
      .single();

    if (estimateError || !estimate) {
      throw new Error('Estimate not found');
    }

    // Check if estimate already has a job
    if (estimate.job_id) {
      console.log('Estimate already has job', { jobId: estimate.job_id });
      return new Response(
        JSON.stringify({ 
          success: true, 
          jobId: estimate.job_id,
          alreadyConverted: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!estimate.customer_id) {
      throw new Error('Estimate must have a customer before creating a job');
    }

    // Generate job number
    const { data: jobNumber } = await supabase.rpc('generate_job_number');

    // Create job from estimate
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        user_id: user.id, // Security: set contractor ID
        customer_id: estimate.customer_id,
        original_estimate_id: estimate.id,
        job_number: jobNumber,
        name: estimate.title || estimate.project_name || 'New Job',
        description: estimate.description || estimate.project_description,
        address: estimate.project_address || estimate.site_address,
        trade_type: estimate.trade_type,
        status: 'scheduled',
        job_status: 'scheduled',
        contract_value: estimate.grand_total || estimate.total_amount || 0,
        change_orders_total: 0,
        total_contract_value: estimate.grand_total || estimate.total_amount || 0,
        payments_collected: 0,
        expenses_total: 0,
        profit: 0,
        budget_amount: estimate.grand_total || estimate.total_amount || 0,
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating job', jobError);
      throw jobError;
    }

    console.log('Job created', { jobId: job.id, jobNumber: job.job_number });

    // Update estimate with job_id and mark as sold
    const { error: updateEstimateError } = await supabase
      .from('estimates')
      .update({
        job_id: job.id,
        status: 'sold',
      })
      .eq('id', estimateId)
      .eq('user_id', user.id); // Security: scope by contractor

    if (updateEstimateError) {
      console.error('Error updating estimate', updateEstimateError);
      throw updateEstimateError;
    }

    // If there's an opportunity_id, update it too
    if (estimate.opportunity_id) {
      await supabase
        .from('opportunities')
        .update({
          stage: 'close',
          closed_at: new Date().toISOString(),
        })
        .eq('id', estimate.opportunity_id)
        .eq('user_id', user.id); // Security: scope by contractor
    }

    console.log('Estimate converted to job successfully', { estimateId, jobId: job.id });

    return new Response(
      JSON.stringify({ 
        success: true, 
        jobId: job.id,
        job 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in convert-estimate-to-job:', error);
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