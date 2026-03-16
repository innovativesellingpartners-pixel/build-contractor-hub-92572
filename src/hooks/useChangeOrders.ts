import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export interface ChangeOrderLineItem {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
}

export interface ChangeOrder {
  id?: string;
  job_id: string;
  estimate_id?: string;
  user_id?: string;
  description: string;
  reason?: string;
  scope_of_work?: string;
  terms_and_conditions?: string;
  additional_cost: number;
  line_items?: ChangeOrderLineItem[];
  subtotal?: number;
  tax_rate?: number;
  tax_amount?: number;
  total_amount?: number;
  status: 'draft' | 'sent' | 'viewed' | 'signed' | 'approved' | 'rejected' | 'requested';
  requested_by?: string;
  approved_by?: string;
  date_requested?: string;
  date_approved?: string;
  notes?: string;
  public_token?: string;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  client_signature?: string;
  client_printed_name?: string;
  sent_at?: string;
  viewed_at?: string;
  signed_at?: string;
  pdf_url?: string;
  change_order_number?: string;
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
      // Map database response to ChangeOrder type
      return (data || []).map((item: any) => ({
        ...item,
        line_items: Array.isArray(item.line_items) ? item.line_items : [],
      })) as ChangeOrder[];
    },
    enabled: !!user?.id,
  });

  const createChangeOrder = useMutation({
    mutationFn: async (changeOrder: ChangeOrder) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Calculate totals
      const subtotal = changeOrder.line_items?.reduce((sum, item) => sum + item.total, 0) || changeOrder.additional_cost;
      const taxAmount = subtotal * ((changeOrder.tax_rate || 0) / 100);
      const totalAmount = subtotal + taxAmount;

      const insertData = {
        job_id: changeOrder.job_id,
        estimate_id: changeOrder.estimate_id,
        description: changeOrder.description,
        reason: changeOrder.reason,
        scope_of_work: changeOrder.scope_of_work,
        terms_and_conditions: changeOrder.terms_and_conditions,
        notes: changeOrder.notes,
        client_name: changeOrder.client_name,
        client_email: changeOrder.client_email,
        client_phone: changeOrder.client_phone,
        client_address: changeOrder.client_address,
        tax_rate: changeOrder.tax_rate,
        status: (changeOrder.status === 'draft' || changeOrder.status === 'sent' || changeOrder.status === 'viewed' || changeOrder.status === 'signed' 
          ? 'requested' : changeOrder.status) as 'requested' | 'approved' | 'rejected',
        user_id: user.id,
        requested_by: user.id,
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        additional_cost: totalAmount,
        line_items: (changeOrder.line_items || []) as unknown as Json,
        public_token: crypto.randomUUID(),
      };

      const { data, error } = await supabase
        .from('change_orders')
        .insert([insertData])
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
      // Recalculate totals
      const subtotal = changeOrder.line_items?.reduce((sum, item) => sum + item.total, 0) || changeOrder.additional_cost;
      const taxAmount = subtotal * ((changeOrder.tax_rate || 0) / 100);
      const totalAmount = subtotal + taxAmount;

      const updateData: any = { 
        ...changeOrder,
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        additional_cost: totalAmount,
      };
      
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

  const sendChangeOrder = useMutation({
    mutationFn: async ({ changeOrderId, contractorName, contractorEmail }: { 
      changeOrderId: string; 
      contractorName: string; 
      contractorEmail: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('send-change-order', {
        body: { changeOrderId, contractorName, contractorEmail }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to send change order');
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['change_orders'] });
      toast.success('Change order sent successfully');
    },
    onError: (error) => {
      toast.error(`Failed to send change order: ${error.message}`);
    },
  });

  return {
    changeOrders,
    isLoading,
    createChangeOrder: createChangeOrder.mutate,
    updateChangeOrder: updateChangeOrder.mutate,
    deleteChangeOrder: deleteChangeOrder.mutate,
    sendChangeOrder: sendChangeOrder.mutate,
    isSending: sendChangeOrder.isPending,
  };
}
