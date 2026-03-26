import { createClient } from 'npm:@supabase/supabase-js@2.58.0';
import { buildCorsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const headers = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
    }

    // Get contractor_id for the user
    const { data: cuRow } = await supabase
      .from('contractor_users')
      .select('contractor_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (!cuRow) {
      return new Response(JSON.stringify({ error: 'No contractor found' }), { status: 400, headers });
    }

    // Get all team user_ids for this contractor
    const { data: teamUsers } = await supabase
      .from('contractor_users')
      .select('user_id')
      .eq('contractor_id', cuRow.contractor_id);
    
    const teamUserIds = (teamUsers || []).map((u: any) => u.user_id);

    // Get all active jobs for this contractor
    const { data: jobs } = await supabase
      .from('jobs')
      .select('id, name, job_number, budget_amount, contract_value, user_id')
      .in('user_id', teamUserIds)
      .in('job_status', ['in_progress', 'scheduled']);

    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ alerts_generated: 0 }), { headers: { ...headers, 'Content-Type': 'application/json' } });
    }

    const alerts: any[] = [];

    for (const job of jobs) {
      const estimatedBudget = Number(job.budget_amount || job.contract_value || 0);
      if (estimatedBudget <= 0) continue;

      // Get actual expenses
      const { data: expenses } = await supabase
        .from('expenses')
        .select('amount, category')
        .eq('job_id', job.id);

      const { data: jobCosts } = await supabase
        .from('job_costs')
        .select('amount, category')
        .eq('job_id', job.id);

      const totalActual = 
        (expenses || []).reduce((s: number, e: any) => s + Number(e.amount || 0), 0) +
        (jobCosts || []).reduce((s: number, c: any) => s + Number(c.amount || 0), 0);

      const marginPercent = ((estimatedBudget - totalActual) / estimatedBudget) * 100;

      // Check for existing unread alerts to avoid duplicates
      const { data: existingAlerts } = await supabase
        .from('job_cost_alerts')
        .select('alert_type')
        .eq('job_id', job.id)
        .eq('is_read', false);

      const existingTypes = new Set((existingAlerts || []).map((a: any) => a.alert_type));

      // Critical: margin below 10%
      if (marginPercent < 10 && !existingTypes.has('over_budget')) {
        alerts.push({
          user_id: job.user_id,
          job_id: job.id,
          alert_type: 'over_budget',
          threshold_percent: 10,
          current_percent: Math.round(marginPercent * 100) / 100,
          message: `🚨 Critical: ${job.name || job.job_number} margin is ${marginPercent.toFixed(1)}% (below 10%). Spent $${totalActual.toLocaleString()} of $${estimatedBudget.toLocaleString()} budget.`,
        });
      }
      // Warning: margin below 20%
      else if (marginPercent < 20 && marginPercent >= 10 && !existingTypes.has('margin_warning')) {
        alerts.push({
          user_id: job.user_id,
          job_id: job.id,
          alert_type: 'margin_warning',
          threshold_percent: 20,
          current_percent: Math.round(marginPercent * 100) / 100,
          message: `⚠️ Warning: ${job.name || job.job_number} margin is ${marginPercent.toFixed(1)}% (below 20%). Spent $${totalActual.toLocaleString()} of $${estimatedBudget.toLocaleString()} budget.`,
        });
      }

      // Check budget line items for 15%+ overruns
      const { data: budgetLines } = await supabase
        .from('job_budget_line_items')
        .select('description, category, budgeted_amount, actual_amount')
        .eq('job_id', job.id);

      for (const line of (budgetLines || [])) {
        const budgeted = Number(line.budgeted_amount || 0);
        const actual = Number(line.actual_amount || 0);
        if (budgeted <= 0) continue;
        const overrunPercent = ((actual - budgeted) / budgeted) * 100;
        if (overrunPercent >= 15) {
          const alertKey = `${line.category?.toLowerCase()}_overrun`;
          if (!existingTypes.has(alertKey) && !existingTypes.has('material_overrun') && !existingTypes.has('labor_overrun')) {
            const type = line.category?.toLowerCase().includes('labor') ? 'labor_overrun' : 'material_overrun';
            alerts.push({
              user_id: job.user_id,
              job_id: job.id,
              alert_type: type,
              threshold_percent: 15,
              current_percent: Math.round(overrunPercent * 100) / 100,
              message: `📊 ${line.description || line.category} is ${overrunPercent.toFixed(1)}% over budget on ${job.name || job.job_number}. Actual: $${actual.toLocaleString()} vs Budget: $${budgeted.toLocaleString()}.`,
            });
          }
        }
      }
    }

    // Insert alerts
    if (alerts.length > 0) {
      await supabase.from('job_cost_alerts').insert(alerts);
    }

    return new Response(
      JSON.stringify({ alerts_generated: alerts.length, alerts }),
      { headers: { ...headers, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error checking job margins:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } }
    );
  }
});
