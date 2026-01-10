import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface EstimateLineItem {
  id?: string;
  itemNumber?: string;
  category?: string;
  item_description?: string;
  description?: string;
  quantity: number;
  unit?: string;
  unit_type?: string;
  unitPrice?: number;
  unit_cost?: number;
  totalPrice?: number;
  line_total?: number;
  included: boolean;
}

export interface Estimate {
  id?: string;
  estimate_number?: string;
  user_id?: string;
  customer_id?: string;
  opportunity_id?: string;
  lead_id?: string;
  job_id?: string;
  title: string;
  description?: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'pending' | 'sold' | 'lost' | 'cancelled';
  total_amount: number;
  valid_until?: string;
  line_items?: EstimateLineItem[];
  
  // Header fields
  date_issued?: string;
  prepared_by?: string;
  project_name?: string;
  project_address?: string;
  referred_by?: string;
  
  // Client details
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  client_address?: string;
  site_address?: string;
  
  // Scope of work
  scope_objective?: string;
  scope_key_deliverables?: string[];
  scope_exclusions?: string[];
  scope_timeline?: string;
  
  // Financial summary
  subtotal?: number;
  tax_rate?: number;
  tax_amount?: number;
  permit_fee?: number;
  grand_total?: number;
  required_deposit?: number;
  balance_due?: number;
  
  // Terms and conditions
  terms_validity?: string;
  terms_payment_schedule?: string;
  terms_change_orders?: string;
  terms_insurance?: string;
  terms_warranty_years?: number;
  
  // Signatures
  contractor_signature?: string;
  contractor_printed_name?: string;
  contractor_acceptance_date?: string;
  client_signature?: string;
  client_printed_name?: string;
  client_acceptance_date?: string;
  
  // Legacy/compatibility
  trade_type?: string;
  project_description?: string;
  assumptions_and_exclusions?: string;
  cost_summary?: any;
  trade_specific?: any;
  attachments?: any;
  
  // System fields
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

      // Generate the next estimate number
      const { data: maxEstimate } = await supabase
        .from('estimates')
        .select('estimate_number')
        .eq('user_id', user.id)
        .not('estimate_number', 'is', null)
        .order('estimate_number', { ascending: false })
        .limit(1)
        .single();

      let nextNumber = 99; // Starting number (will be 0000099)
      if (maxEstimate?.estimate_number) {
        const currentNumber = parseInt(maxEstimate.estimate_number, 10);
        if (!isNaN(currentNumber)) {
          nextNumber = currentNumber + 1;
        }
      }
      const estimateNumber = String(nextNumber).padStart(7, '0');

      const { data, error } = await supabase
        .from('estimates')
        .insert([{
          user_id: user.id,
          estimate_number: estimateNumber,
          customer_id: estimate.customer_id,
          opportunity_id: estimate.opportunity_id,
          lead_id: estimate.lead_id,
          job_id: estimate.job_id,
          title: estimate.title,
          description: estimate.description,
          status: estimate.status || 'draft',
          total_amount: estimate.total_amount,
          valid_until: estimate.valid_until,
          line_items: estimate.line_items as any || [],
          
          // Header fields
          date_issued: estimate.date_issued,
          prepared_by: estimate.prepared_by,
          project_name: estimate.project_name,
          project_address: estimate.project_address,
          referred_by: estimate.referred_by,
          
          // Client details
          client_name: estimate.client_name,
          client_phone: estimate.client_phone,
          client_email: estimate.client_email,
          client_address: estimate.client_address,
          site_address: estimate.site_address,
          
          // Scope of work
          scope_objective: estimate.scope_objective,
          scope_key_deliverables: estimate.scope_key_deliverables as any,
          scope_exclusions: estimate.scope_exclusions as any,
          scope_timeline: estimate.scope_timeline,
          
          // Financial summary
          subtotal: estimate.subtotal,
          tax_rate: estimate.tax_rate,
          tax_amount: estimate.tax_amount,
          permit_fee: estimate.permit_fee,
          grand_total: estimate.grand_total,
          required_deposit: estimate.required_deposit,
          balance_due: estimate.balance_due,
          
          // Terms
          terms_validity: estimate.terms_validity,
          terms_payment_schedule: estimate.terms_payment_schedule,
          terms_change_orders: estimate.terms_change_orders,
          terms_insurance: estimate.terms_insurance,
          terms_warranty_years: estimate.terms_warranty_years,
          
          // Signatures
          contractor_signature: estimate.contractor_signature,
          contractor_printed_name: estimate.contractor_printed_name,
          contractor_acceptance_date: estimate.contractor_acceptance_date,
          client_signature: estimate.client_signature,
          client_printed_name: estimate.client_printed_name,
          client_acceptance_date: estimate.client_acceptance_date,
          
          // Legacy fields
          trade_type: estimate.trade_type,
          project_description: estimate.project_description,
          assumptions_and_exclusions: estimate.assumptions_and_exclusions,
          cost_summary: estimate.cost_summary as any,
          trade_specific: estimate.trade_specific as any,
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
          lead_id: estimate.lead_id,
          job_id: estimate.job_id,
          title: estimate.title,
          description: estimate.description,
          status: estimate.status,
          total_amount: estimate.total_amount,
          valid_until: estimate.valid_until,
          line_items: estimate.line_items as any || [],
          
          // Header fields
          date_issued: estimate.date_issued,
          prepared_by: estimate.prepared_by,
          project_name: estimate.project_name,
          project_address: estimate.project_address,
          referred_by: estimate.referred_by,
          
          // Client details
          client_name: estimate.client_name,
          client_phone: estimate.client_phone,
          client_email: estimate.client_email,
          client_address: estimate.client_address,
          site_address: estimate.site_address,
          
          // Scope of work
          scope_objective: estimate.scope_objective,
          scope_key_deliverables: estimate.scope_key_deliverables as any,
          scope_exclusions: estimate.scope_exclusions as any,
          scope_timeline: estimate.scope_timeline,
          
          // Financial summary
          subtotal: estimate.subtotal,
          tax_rate: estimate.tax_rate,
          tax_amount: estimate.tax_amount,
          permit_fee: estimate.permit_fee,
          grand_total: estimate.grand_total,
          required_deposit: estimate.required_deposit,
          balance_due: estimate.balance_due,
          
          // Terms
          terms_validity: estimate.terms_validity,
          terms_payment_schedule: estimate.terms_payment_schedule,
          terms_change_orders: estimate.terms_change_orders,
          terms_insurance: estimate.terms_insurance,
          terms_warranty_years: estimate.terms_warranty_years,
          
          // Signatures
          contractor_signature: estimate.contractor_signature,
          contractor_printed_name: estimate.contractor_printed_name,
          contractor_acceptance_date: estimate.contractor_acceptance_date,
          client_signature: estimate.client_signature,
          client_printed_name: estimate.client_printed_name,
          client_acceptance_date: estimate.client_acceptance_date,
          
          // Legacy fields
          trade_type: estimate.trade_type,
          project_description: estimate.project_description,
          assumptions_and_exclusions: estimate.assumptions_and_exclusions,
          cost_summary: estimate.cost_summary as any,
          trade_specific: estimate.trade_specific as any,
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

      // Check for edge function error or error in response body
      if (error) {
        // Try to extract the actual error message from the response
        const errorMessage = data?.error || error.message || 'Failed to send estimate';
        throw new Error(errorMessage);
      }
      
      // Also check if the response indicates failure
      if (data && data.success === false) {
        throw new Error(data.error || 'Failed to send estimate');
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      toast.success('Estimate sent to client successfully');
    },
    onError: (error: any) => {
      let details = error?.message || error?.context?.error || 'Unknown error';
      
      // Check for domain verification error
      if (details.includes('domain is not verified') || details.includes('verify your domain')) {
        details = 'Domain not verified. Please verify your sending domain at resend.com/domains';
      }
      
      toast.error(`Failed to send estimate: ${details}`, {
        duration: 6000,
      });
    },
  });

  const duplicateEstimate = useMutation({
    mutationFn: async (estimateId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Get the estimate to duplicate
      const { data: original, error: fetchError } = await supabase
        .from('estimates')
        .select('*')
        .eq('id', estimateId)
        .single();

      if (fetchError) throw fetchError;
      if (!original) throw new Error('Estimate not found');

      // Create duplicate with reset status and dates
      const { data, error } = await supabase
        .from('estimates')
        .insert([{
          user_id: user.id,
          customer_id: original.customer_id,
          lead_id: original.lead_id,
          title: `${original.title} (Copy)`,
          description: original.description,
          status: 'draft',
          total_amount: original.total_amount,
          valid_until: original.valid_until,
          line_items: original.line_items,
          date_issued: new Date().toISOString(),
          prepared_by: original.prepared_by,
          project_name: original.project_name,
          project_address: original.project_address,
          referred_by: original.referred_by,
          client_name: original.client_name,
          client_phone: original.client_phone,
          client_email: original.client_email,
          client_address: original.client_address,
          site_address: original.site_address,
          scope_objective: original.scope_objective,
          scope_key_deliverables: original.scope_key_deliverables,
          scope_exclusions: original.scope_exclusions,
          scope_timeline: original.scope_timeline,
          subtotal: original.subtotal,
          tax_rate: original.tax_rate,
          tax_amount: original.tax_amount,
          permit_fee: original.permit_fee,
          grand_total: original.grand_total,
          required_deposit: original.required_deposit,
          balance_due: original.balance_due,
          terms_validity: original.terms_validity,
          terms_payment_schedule: original.terms_payment_schedule,
          terms_change_orders: original.terms_change_orders,
          terms_insurance: original.terms_insurance,
          terms_warranty_years: original.terms_warranty_years,
          trade_type: original.trade_type,
          project_description: original.project_description,
          assumptions_and_exclusions: original.assumptions_and_exclusions,
          cost_summary: original.cost_summary,
          trade_specific: original.trade_specific,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      toast.success('Estimate duplicated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to duplicate estimate: ${error.message}`);
    },
  });

  return {
    estimates,
    isLoading,
    createEstimate: createEstimate.mutate,
    createEstimateAsync: createEstimate.mutateAsync,
    updateEstimate: updateEstimate.mutate,
    updateEstimateAsync: updateEstimate.mutateAsync,
    deleteEstimate: deleteEstimate.mutate,
    sendEstimate: sendEstimate.mutate,
    sendEstimateAsync: sendEstimate.mutateAsync,
    isSendingEstimate: sendEstimate.isPending,
    duplicateEstimate: duplicateEstimate.mutate,
    duplicateEstimateAsync: duplicateEstimate.mutateAsync,
    isDuplicatingEstimate: duplicateEstimate.isPending,
  };
}
