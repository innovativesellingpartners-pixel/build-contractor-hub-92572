import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to parse city, state, zip from an address string
function parseAddressComponents(address: string | null): { city?: string; state?: string; zipCode?: string } {
  if (!address) return {};
  
  // Try to parse "City, State ZIP" format at the end of address
  const match = address.match(/,?\s*([^,]+),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)?$/i);
  if (match) {
    return {
      city: match[1]?.trim(),
      state: match[2]?.toUpperCase(),
      zipCode: match[3]?.trim(),
    };
  }
  
  return {};
}

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

    // Get the estimate with all fields including linked lead
    const { data: estimate, error: estimateError } = await supabase
      .from('estimates')
      .select('*, leads(*, lead_sources(id, name))')
      .eq('id', estimateId)
      .eq('user_id', user.id)
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

    // Get referral info from estimate or linked lead
    let referralSource = estimate.referred_by || null;
    let referralSourceOther = null;
    
    // If estimate has linked lead, get referral from there
    const linkedLead = estimate.leads;
    if (linkedLead && typeof linkedLead === 'object') {
      const leadData = linkedLead as any;
      if (!referralSource && leadData.lead_sources && typeof leadData.lead_sources === 'object') {
        referralSource = leadData.lead_sources.name || null;
      }
      if (leadData.source_other) {
        referralSourceOther = leadData.source_other;
      }
    }

    console.log('Estimate data being transferred:', {
      title: estimate.title,
      project_name: estimate.project_name,
      client_name: estimate.client_name,
      client_email: estimate.client_email,
      client_phone: estimate.client_phone,
      client_address: estimate.client_address,
      site_address: estimate.site_address,
      trade_type: estimate.trade_type,
      grand_total: estimate.grand_total,
      total_amount: estimate.total_amount,
      referred_by: estimate.referred_by,
      referralSource,
      referralSourceOther,
    });

    // Determine customer - create if needed
    let customerId = estimate.customer_id;
    
    if (!customerId && estimate.client_name) {
      // Create customer from estimate client info
      const addressComponents = parseAddressComponents(estimate.client_address || estimate.site_address);
      
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          user_id: user.id,
          name: estimate.client_name,
          email: estimate.client_email,
          phone: estimate.client_phone,
          address: estimate.client_address || estimate.site_address,
          city: addressComponents.city,
          state: addressComponents.state,
          zip_code: addressComponents.zipCode,
          lifetime_value: estimate.grand_total || estimate.total_amount || 0,
          referral_source: referralSource,
          referral_source_other: referralSourceOther,
          notes: `Created from Estimate #${estimate.estimate_number || estimate.id}`,
        })
        .select()
        .single();

      if (customerError) {
        console.error('Error creating customer from estimate', customerError);
        throw new Error('Failed to create customer. Please add a customer to the estimate first.');
      }

      customerId = newCustomer.id;
      console.log('Customer created from estimate', { customerId });

      // Update estimate with customer_id
      await supabase
        .from('estimates')
        .update({ customer_id: customerId })
        .eq('id', estimateId)
        .eq('user_id', user.id);
    }

    if (!customerId) {
      throw new Error('Estimate must have a customer or client info before creating a job');
    }

    // Parse address components from project/site address
    const projectAddress = estimate.project_address || estimate.site_address || estimate.client_address;
    const addressComponents = parseAddressComponents(projectAddress);

    // Build comprehensive job description from estimate
    let jobDescription = estimate.description || estimate.project_description || '';
    
    if (estimate.scope_objective) {
      jobDescription += `\n\nObjective: ${estimate.scope_objective}`;
    }
    
    if (estimate.scope_timeline) {
      jobDescription += `\n\nTimeline: ${estimate.scope_timeline}`;
    }

    // Build notes from additional estimate info
    let jobNotes = '';
    if (estimate.assumptions_and_exclusions) {
      jobNotes += `Assumptions & Exclusions:\n${estimate.assumptions_and_exclusions}\n\n`;
    }
    
    // Add referral info to notes
    const referralInfo = referralSourceOther || referralSource || estimate.referred_by;
    if (referralInfo) {
      jobNotes += `Referred by: ${referralInfo}\n`;
    }
    
    if (estimate.prepared_by) {
      jobNotes += `Prepared by: ${estimate.prepared_by}\n`;
    }

    // Calculate contract value
    const contractValue = estimate.grand_total || estimate.total_amount || 0;
    const depositAmount = estimate.required_deposit || 0;

    // Create job from estimate with ALL relevant data
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        user_id: user.id,
        customer_id: customerId,
        lead_id: estimate.lead_id,
        original_estimate_id: estimate.id,
        opportunity_id: estimate.opportunity_id,
        name: estimate.title || estimate.project_name || 'New Job',
        description: jobDescription.trim() || null,
        address: projectAddress,
        city: addressComponents.city || null,
        state: addressComponents.state || null,
        zip_code: addressComponents.zipCode || null,
        trade_type: estimate.trade_type,
        status: 'scheduled',
        job_status: 'scheduled',
        notes: jobNotes.trim() || null,
        contract_value: contractValue,
        change_orders_total: 0,
        total_contract_value: contractValue,
        payments_collected: depositAmount,
        expenses_total: 0,
        profit: 0,
        budget_amount: contractValue,
        converted_at: new Date().toISOString(),
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
      .eq('user_id', user.id);

    if (updateEstimateError) {
      console.error('Error updating estimate', updateEstimateError);
      throw updateEstimateError;
    }

    // Update customer with job reference, estimate reference, and lifetime value
    const { data: customer } = await supabase
      .from('customers')
      .select('lifetime_value, referral_source')
      .eq('id', customerId)
      .single();

    const customerUpdate: any = {
      job_id: job.id,
      estimate_id: estimate.id,
      lifetime_value: (customer?.lifetime_value || 0) + contractValue,
    };
    
    // Update referral source if not already set
    if (!customer?.referral_source && referralSource) {
      customerUpdate.referral_source = referralSource;
      customerUpdate.referral_source_other = referralSourceOther;
    }

    await supabase
      .from('customers')
      .update(customerUpdate)
      .eq('id', customerId)
      .eq('user_id', user.id);

    // If there's a lead_id, update the lead as well
    if (estimate.lead_id) {
      await supabase
        .from('leads')
        .update({
          customer_id: customerId,
          converted_to_customer: true,
          converted_to_job_id: job.id,
          converted_at: new Date().toISOString(),
          status: 'won',
        })
        .eq('id', estimate.lead_id)
        .eq('user_id', user.id);
    }

    // If there's an opportunity_id, update it too
    if (estimate.opportunity_id) {
      await supabase
        .from('opportunities')
        .update({
          stage: 'close',
          closed_at: new Date().toISOString(),
          job_id: job.id,
        })
        .eq('id', estimate.opportunity_id)
        .eq('user_id', user.id);
    }

    // Auto-populate budget line items from estimate line items
    if (estimate.line_items && Array.isArray(estimate.line_items) && estimate.line_items.length > 0) {
      const budgetLines = (estimate.line_items as any[]).map((item: any, idx: number) => ({
        job_id: job.id,
        user_id: user.id,
        estimate_line_item_index: idx,
        description: item.description || item.name || `Line item ${idx + 1}`,
        item_code: item.item_code || item.itemCode || null,
        category: item.category || item.type || 'General',
        budgeted_quantity: Number(item.quantity) || 1,
        budgeted_unit_price: Number(item.unit_price || item.unitPrice) || 0,
        budgeted_amount: Number(item.amount || item.total) || (Number(item.quantity || 1) * Number(item.unit_price || item.unitPrice || 0)),
        actual_amount: 0,
        notes: item.unit ? `Unit: ${item.unit}` : null,
      }));

      const { error: budgetError } = await supabase
        .from('job_budget_line_items')
        .insert(budgetLines);

      if (budgetError) {
        console.error('Error creating budget line items (non-fatal)', budgetError);
      } else {
        console.log(`Created ${budgetLines.length} budget line items from estimate`);
      }
    }

    console.log('Estimate converted to job successfully', { 
      estimateId, 
      jobId: job.id,
      customerId,
      leadId: estimate.lead_id,
      opportunityId: estimate.opportunity_id 
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        jobId: job.id,
        customerId,
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
