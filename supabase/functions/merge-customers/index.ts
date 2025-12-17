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

    const { keepCustomerId, mergeCustomerId } = await req.json();

    if (!keepCustomerId || !mergeCustomerId) {
      throw new Error('Both keepCustomerId and mergeCustomerId are required');
    }

    if (keepCustomerId === mergeCustomerId) {
      throw new Error('Cannot merge a customer with itself');
    }

    console.log('Merging customers', { keepCustomerId, mergeCustomerId, contractorId: user.id });

    // Verify both customers belong to this contractor
    const { data: keepCustomer, error: keepError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', keepCustomerId)
      .eq('user_id', user.id)
      .single();

    if (keepError || !keepCustomer) {
      throw new Error('Target customer not found');
    }

    const { data: mergeCustomer, error: mergeError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', mergeCustomerId)
      .eq('user_id', user.id)
      .single();

    if (mergeError || !mergeCustomer) {
      throw new Error('Customer to merge not found');
    }

    // Step 1: Transfer all jobs from merge customer to keep customer
    const { error: jobsError } = await supabase
      .from('jobs')
      .update({ customer_id: keepCustomerId })
      .eq('customer_id', mergeCustomerId)
      .eq('user_id', user.id);

    if (jobsError) {
      console.error('Error transferring jobs', jobsError);
      throw jobsError;
    }

    // Step 2: Transfer all estimates from merge customer to keep customer
    const { error: estimatesError } = await supabase
      .from('estimates')
      .update({ customer_id: keepCustomerId })
      .eq('customer_id', mergeCustomerId)
      .eq('user_id', user.id);

    if (estimatesError) {
      console.error('Error transferring estimates', estimatesError);
      throw estimatesError;
    }

    // Step 3: Transfer all payments from merge customer to keep customer
    const { error: paymentsError } = await supabase
      .from('payments')
      .update({ customer_id: keepCustomerId })
      .eq('customer_id', mergeCustomerId)
      .eq('contractor_id', user.id);

    if (paymentsError) {
      console.error('Error transferring payments', paymentsError);
      // Don't throw - payments table may not have customer_id
    }

    // Step 4: Update leads that point to the merge customer
    const { error: leadsError } = await supabase
      .from('leads')
      .update({ customer_id: keepCustomerId })
      .eq('customer_id', mergeCustomerId)
      .eq('user_id', user.id);

    if (leadsError) {
      console.error('Error updating leads', leadsError);
      // Don't throw - not critical
    }

    // Step 5: Combine lifetime values
    const combinedLifetimeValue = (keepCustomer.lifetime_value || 0) + (mergeCustomer.lifetime_value || 0);

    // Step 6: Merge notes if both have notes
    let mergedNotes = keepCustomer.notes || '';
    if (mergeCustomer.notes) {
      mergedNotes = mergedNotes 
        ? `${mergedNotes}\n\n--- Merged from ${mergeCustomer.name} ---\n${mergeCustomer.notes}`
        : mergeCustomer.notes;
    }

    // Step 7: Update the keep customer with merged data
    const { error: updateError } = await supabase
      .from('customers')
      .update({
        lifetime_value: combinedLifetimeValue,
        notes: mergedNotes || null,
        // Keep existing contact info, but fill in any missing fields
        email: keepCustomer.email || mergeCustomer.email,
        phone: keepCustomer.phone || mergeCustomer.phone,
        address: keepCustomer.address || mergeCustomer.address,
        city: keepCustomer.city || mergeCustomer.city,
        state: keepCustomer.state || mergeCustomer.state,
        zip_code: keepCustomer.zip_code || mergeCustomer.zip_code,
      })
      .eq('id', keepCustomerId)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating customer', updateError);
      throw updateError;
    }

    // Step 8: Delete the merged customer
    const { error: deleteError } = await supabase
      .from('customers')
      .delete()
      .eq('id', mergeCustomerId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting merged customer', deleteError);
      throw deleteError;
    }

    console.log('Customers merged successfully', { keepCustomerId, mergeCustomerId });

    return new Response(
      JSON.stringify({ 
        success: true, 
        customerId: keepCustomerId,
        mergedCustomerName: mergeCustomer.name
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in merge-customers:', error);
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
