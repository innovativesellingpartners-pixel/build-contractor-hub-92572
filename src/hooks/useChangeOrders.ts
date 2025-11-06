import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ChangeOrder {
  id?: string;
  job_id: string;
  user_id?: string;
  description: string;
  reason?: string;
  additional_cost: number;
  status: 'requested' | 'approved' | 'rejected';
  requested_by?: string;
  approved_by?: string;
  date_requested?: string;
  date_approved?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export function useChangeOrders(jobId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: changeOrders, isLoading } = useQuery({
    queryKey: ['change_orders', jobId],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('change_orders')
        .select('*')
        .order('date_requested', { ascending: false });

      if (jobId) {
        query = query.eq('job_id', jobId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const createChangeOrder = useMutation({
    mutationFn: async (changeOrder: ChangeOrder) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('change_orders')
        .insert([{
          ...changeOrder,
          user_id: user.id,
          requested_by: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['change_orders'] });
      toast.success('Change order created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create change order: ${error.message}`);
    },
  });

  const updateChangeOrder = useMutation({
    mutationFn: async ({ id, ...changeOrder }: ChangeOrder & { id: string }) => {
      const updateData: any = { ...changeOrder };
      
      // If approving, set approved_by and date_approved
      if (changeOrder.status === 'approved') {
        updateData.approved_by = user?.id;
        updateData.date_approved = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('change_orders')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['change_orders'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Change order updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update change order: ${error.message}`);
    },
  });

  const deleteChangeOrder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('change_orders')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['change_orders'] });
      toast.success('Change order deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete change order: ${error.message}`);
    },
  });

  return {
    changeOrders,
    isLoading,
    createChangeOrder: createChangeOrder.mutate,
    updateChangeOrder: updateChangeOrder.mutate,
    deleteChangeOrder: deleteChangeOrder.mutate,
  };
}
