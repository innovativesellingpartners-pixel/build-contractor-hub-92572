import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Expense {
  id: string;
  contractor_id: string;
  job_id?: string;
  category: string;
  date: string;
  amount: number;
  description?: string;
  receipt_url?: string;
  notes?: string;
  plaid_transaction_id?: string;
  created_at: string;
  updated_at: string;
}

export function useExpenses(jobId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses', jobId],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('expenses')
        .select('*')
        .eq('contractor_id', user.id)
        .order('date', { ascending: false });

      if (jobId) {
        query = query.eq('job_id', jobId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const createExpense = useMutation({
    mutationFn: async (expense: Omit<Expense, 'id' | 'contractor_id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('expenses')
        .insert([{ ...expense, contractor_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Expense added successfully');
    },
    onError: (error) => {
      toast.error(`Failed to add expense: ${error.message}`);
    },
  });

  const updateExpense = useMutation({
    mutationFn: async ({ id, ...expense }: Partial<Expense> & { id: string }) => {
      const { data, error } = await supabase
        .from('expenses')
        .update(expense)
        .eq('id', id)
        .eq('contractor_id', user?.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Expense updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update expense: ${error.message}`);
    },
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('contractor_id', user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Expense deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete expense: ${error.message}`);
    },
  });

  return {
    expenses,
    isLoading,
    createExpense: createExpense.mutate,
    updateExpense: updateExpense.mutate,
    deleteExpense: deleteExpense.mutate,
  };
}