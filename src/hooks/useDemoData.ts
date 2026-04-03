import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DEMO_USER_ID } from '@/contexts/DemoContext';

export const useDemoData = <T>(table: string, options?: { 
  orderBy?: string;
  ascending?: boolean;
  additionalFilters?: Record<string, any>;
}) => {
  return useQuery({
    queryKey: ['demo', table, options?.additionalFilters],
    queryFn: async () => {
      let query = supabase
        .from(table)
        .select('*')
        .eq('user_id', DEMO_USER_ID)
        .order(options?.orderBy || 'created_at', { ascending: options?.ascending ?? false });

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as T[];
    },
  });
};

export const useDemoStats = () => {
  return useQuery({
    queryKey: ['demo', 'stats'],
    queryFn: async () => {
      const [leads, customers, estimates, jobs, invoices] = await Promise.all([
        supabase.from('leads').select('id, stage', { count: 'exact' }).eq('user_id', DEMO_USER_ID),
        supabase.from('customers').select('id', { count: 'exact' }).eq('user_id', DEMO_USER_ID),
        supabase.from('estimates').select('id, status, total', { count: 'exact' }).eq('user_id', DEMO_USER_ID),
        supabase.from('jobs').select('id, job_status, contract_value', { count: 'exact' }).eq('user_id', DEMO_USER_ID),
        supabase.from('invoices').select('id, status, total, amount_paid', { count: 'exact' }).eq('user_id', DEMO_USER_ID),
      ]);

      return {
        leads: { data: leads.data || [], count: leads.count || 0 },
        customers: { data: customers.data || [], count: customers.count || 0 },
        estimates: { data: estimates.data || [], count: estimates.count || 0 },
        jobs: { data: jobs.data || [], count: jobs.count || 0 },
        invoices: { data: invoices.data || [], count: invoices.count || 0 },
      };
    },
  });
};
