import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface EstimateLineItem {
  id?: string;
  category: string;
  item_description: string;
  quantity: number;
  unit_type: string;
  unit_cost: number;
  line_total: number;
  included: boolean;
}

export interface Estimate {
  id?: string;
  estimate_number?: string;
  user_id?: string;
  customer_id?: string;
  opportunity_id?: string;
  title: string;
  description?: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  total_amount: number;
  valid_until?: string;
  line_items?: EstimateLineItem[];
  trade_type?: string;
  project_description?: string;
  assumptions_and_exclusions?: string;
  client_name?: string;
  client_address?: string;
  client_email?: string;
  site_address?: string;
  cost_summary?: any;
  trade_specific?: any;
  attachments?: any;
  contractor_signature?: string;
  client_signature?: string;
  created_at?: string;
  updated_at?: string;
  sent_at?: string;
  viewed_at?: string;
  signed_at?: string;
  paid_at?: string;
  payment_amount?: number;
  payment_method?: string;
  public_token?: string;
}

export interface SendEstimateParams {
  estimateId: string;
  contractorName: string;
  contractorEmail: string;
}

export function useEstimates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: estimates, isLoading } = useQuery({
    queryKey: ['estimates', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('estimates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const createEstimate = useMutation({
    mutationFn: async (estimate: Estimate) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('estimates')
        .insert([{
          user_id: user.id,
          customer_id: estimate.customer_id,
          opportunity_id: estimate.opportunity_id,
          title: estimate.title,
          description: estimate.description,
          status: estimate.status || 'draft',
          total_amount: estimate.total_amount,
          valid_until: estimate.valid_until,
          line_items: estimate.line_items as any || [],
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      toast.success('Estimate created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create estimate: ${error.message}`);
    },
  });

  const updateEstimate = useMutation({
    mutationFn: async ({ id, ...estimate }: Estimate & { id: string }) => {
      const { data, error } = await supabase
        .from('estimates')
        .update({
          title: estimate.title,
          description: estimate.description,
          status: estimate.status,
          total_amount: estimate.total_amount,
          valid_until: estimate.valid_until,
          line_items: estimate.line_items as any || [],
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      toast.success('Estimate updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update estimate: ${error.message}`);
    },
  });

  const deleteEstimate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('estimates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      toast.success('Estimate deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete estimate: ${error.message}`);
    },
  });

  const sendEstimate = useMutation({
    mutationFn: async ({ estimateId, contractorName, contractorEmail }: SendEstimateParams) => {
      const { data, error } = await supabase.functions.invoke('send-estimate', {
        body: { estimateId, contractorName, contractorEmail },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      toast.success('Estimate sent to client successfully');
    },
    onError: (error) => {
      toast.error(`Failed to send estimate: ${error.message}`);
    },
  });

  return {
    estimates,
    isLoading,
    createEstimate: createEstimate.mutate,
    updateEstimate: updateEstimate.mutate,
    deleteEstimate: deleteEstimate.mutate,
    sendEstimate: sendEstimate.mutate,
    isSendingEstimate: sendEstimate.isPending,
  };
}
