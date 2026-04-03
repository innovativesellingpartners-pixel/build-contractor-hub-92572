import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DEMO_USER_ID } from '@/contexts/DemoContext';

export const useDemoData = (table: 'leads' | 'customers' | 'estimates' | 'jobs' | 'invoices' | 'payments' | 'expenses') => {
  return useQuery({
    queryKey: ['demo', table],
    queryFn: async (): Promise<any[]> => {
      const { data, error } = await (supabase
        .from(table)
        .select('*') as any)
        .eq('user_id', DEMO_USER_ID)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};

export const useDemoStats = () => {
  return useQuery({
    queryKey: ['demo', 'stats'],
    queryFn: async () => {
      const [leads, customers, estimates, jobs, invoices] = await Promise.all([
        supabase.from('leads').select('id, stage').eq('user_id', DEMO_USER_ID),
        supabase.from('customers').select('id').eq('user_id', DEMO_USER_ID),
        supabase.from('estimates').select('id, status, total').eq('user_id', DEMO_USER_ID),
        supabase.from('jobs').select('id, job_status, contract_value').eq('user_id', DEMO_USER_ID),
        supabase.from('invoices').select('id, status, total, amount_paid').eq('user_id', DEMO_USER_ID),
      ]);

      return {
        leads: { data: leads.data || [], count: (leads.data || []).length },
        customers: { data: customers.data || [], count: (customers.data || []).length },
        estimates: { data: estimates.data || [], count: (estimates.data || []).length },
        jobs: { data: jobs.data || [], count: (jobs.data || []).length },
        invoices: { data: invoices.data || [], count: (invoices.data || []).length },
      };
    },
  });
};
