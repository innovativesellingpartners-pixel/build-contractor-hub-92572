import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Payment {
  id: string;
  contractor_id: string;
  customer_id?: string;
  job_id?: string;
  estimate_id?: string;
  stripe_payment_intent_id?: string;
  amount: number;
  fee_amount: number;
  net_amount: number;
  status: 'pending' | 'succeeded' | 'failed';
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export function usePayments(jobId?: string, customerId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments', jobId, customerId],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('payments')
        .select('*')
        .eq('contractor_id', user.id)
        .order('paid_at', { ascending: false });

      if (jobId) {
        query = query.eq('job_id', jobId);
      }

      if (customerId) {
        query = query.eq('customer_id', customerId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const createPayment = useMutation({
    mutationFn: async (payment: Omit<Payment, 'id' | 'contractor_id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('payments')
        .insert([{ ...payment, contractor_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Payment recorded successfully');
    },
    onError: (error) => {
      toast.error(`Failed to record payment: ${error.message}`);
    },
  });

  const updatePayment = useMutation({
    mutationFn: async ({ id, ...payment }: Partial<Payment> & { id: string }) => {
      const { data, error } = await supabase
        .from('payments')
        .update(payment)
        .eq('id', id)
        .eq('contractor_id', user?.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Payment updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update payment: ${error.message}`);
    },
  });

  return {
    payments,
    isLoading,
    createPayment: createPayment.mutate,
    updatePayment: updatePayment.mutate,
  };
}