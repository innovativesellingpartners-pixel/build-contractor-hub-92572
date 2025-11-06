import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Invoice {
  id?: string;
  invoice_number?: string;
  job_id: string;
  customer_id?: string;
  user_id?: string;
  issue_date: string;
  due_date?: string;
  amount_due: number;
  amount_paid: number;
  line_items?: any;
  status: 'draft' | 'sent' | 'partial' | 'paid' | 'overdue';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export function useInvoices(jobId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices', jobId],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('invoices')
        .select('*')
        .order('issue_date', { ascending: false });

      if (jobId) {
        query = query.eq('job_id', jobId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const createInvoice = useMutation({
    mutationFn: async (invoice: Invoice) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('invoices')
        .insert([{ ...invoice, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create invoice: ${error.message}`);
    },
  });

  const updateInvoice = useMutation({
    mutationFn: async ({ id, ...invoice }: Invoice & { id: string }) => {
      const { data, error } = await supabase
        .from('invoices')
        .update(invoice)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update invoice: ${error.message}`);
    },
  });

  const deleteInvoice = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete invoice: ${error.message}`);
    },
  });

  return {
    invoices,
    isLoading,
    createInvoice: createInvoice.mutate,
    updateInvoice: updateInvoice.mutate,
    deleteInvoice: deleteInvoice.mutate,
  };
}
