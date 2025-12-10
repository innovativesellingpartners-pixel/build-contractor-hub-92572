import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Trade {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssumptionTemplate {
  id: string;
  trade_id: string;
  title: string;
  body: string;
  category: string;
  priority: number;
  default_selected: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  trade?: Trade;
}

export interface ExclusionTemplate {
  id: string;
  trade_id: string;
  title: string;
  body: string;
  category: string;
  priority: number;
  default_selected: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  trade?: Trade;
}

export interface EstimateAssumption {
  id: string;
  estimate_id: string;
  template_id: string | null;
  text: string;
  category: string | null;
  priority: number | null;
  is_custom: boolean;
  created_at: string;
}

export interface EstimateExclusion {
  id: string;
  estimate_id: string;
  template_id: string | null;
  text: string;
  category: string | null;
  priority: number | null;
  is_custom: boolean;
  created_at: string;
}

export function useTrades() {
  const queryClient = useQueryClient();

  const { data: trades, isLoading } = useQuery({
    queryKey: ['trades'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Trade[];
    },
  });

  const createTrade = useMutation({
    mutationFn: async (trade: { name: string; code?: string; description?: string; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('trades')
        .insert([trade])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      toast.success('Trade created');
    },
    onError: (error: any) => {
      toast.error('Failed to create trade: ' + error.message);
    },
  });

  const updateTrade = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Trade> & { id: string }) => {
      const { data, error } = await supabase
        .from('trades')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      toast.success('Trade updated');
    },
    onError: (error: any) => {
      toast.error('Failed to update trade: ' + error.message);
    },
  });

  const deleteTrade = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('trades')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      toast.success('Trade deleted');
    },
    onError: (error: any) => {
      toast.error('Failed to delete trade: ' + error.message);
    },
  });

  return {
    trades: trades || [],
    isLoading,
    createTrade,
    updateTrade,
    deleteTrade,
  };
}

export function useAssumptionTemplates(tradeId?: string) {
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['assumption-templates', tradeId],
    queryFn: async () => {
      let query = supabase
        .from('assumption_templates')
        .select('*, trade:trades(*)')
        .order('priority');

      if (tradeId) {
        query = query.eq('trade_id', tradeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AssumptionTemplate[];
    },
  });

  const createTemplate = useMutation({
    mutationFn: async (template: { trade_id: string; title: string; body: string; category?: string; priority?: number; default_selected?: boolean; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('assumption_templates')
        .insert([template])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assumption-templates'] });
      toast.success('Assumption template created');
    },
    onError: (error: any) => {
      toast.error('Failed to create template: ' + error.message);
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AssumptionTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from('assumption_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assumption-templates'] });
      toast.success('Template updated');
    },
    onError: (error: any) => {
      toast.error('Failed to update template: ' + error.message);
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('assumption_templates')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assumption-templates'] });
      toast.success('Template archived');
    },
    onError: (error: any) => {
      toast.error('Failed to archive template: ' + error.message);
    },
  });

  return {
    templates: templates || [],
    isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}

export function useExclusionTemplates(tradeId?: string) {
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['exclusion-templates', tradeId],
    queryFn: async () => {
      let query = supabase
        .from('exclusion_templates')
        .select('*, trade:trades(*)')
        .order('priority');

      if (tradeId) {
        query = query.eq('trade_id', tradeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ExclusionTemplate[];
    },
  });

  const createTemplate = useMutation({
    mutationFn: async (template: { trade_id: string; title: string; body: string; category?: string; priority?: number; default_selected?: boolean; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('exclusion_templates')
        .insert([template])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exclusion-templates'] });
      toast.success('Exclusion template created');
    },
    onError: (error: any) => {
      toast.error('Failed to create template: ' + error.message);
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ExclusionTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from('exclusion_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exclusion-templates'] });
      toast.success('Template updated');
    },
    onError: (error: any) => {
      toast.error('Failed to update template: ' + error.message);
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('exclusion_templates')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exclusion-templates'] });
      toast.success('Template archived');
    },
    onError: (error: any) => {
      toast.error('Failed to archive template: ' + error.message);
    },
  });

  return {
    templates: templates || [],
    isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}

export function useEstimateAssumptionsExclusions(estimateId?: string) {
  const queryClient = useQueryClient();

  const { data: assumptions, isLoading: loadingAssumptions } = useQuery({
    queryKey: ['estimate-assumptions', estimateId],
    queryFn: async () => {
      if (!estimateId) return [];
      const { data, error } = await supabase
        .from('estimate_assumptions')
        .select('*')
        .eq('estimate_id', estimateId)
        .order('priority');

      if (error) throw error;
      return data as EstimateAssumption[];
    },
    enabled: !!estimateId,
  });

  const { data: exclusions, isLoading: loadingExclusions } = useQuery({
    queryKey: ['estimate-exclusions', estimateId],
    queryFn: async () => {
      if (!estimateId) return [];
      const { data, error } = await supabase
        .from('estimate_exclusions')
        .select('*')
        .eq('estimate_id', estimateId)
        .order('priority');

      if (error) throw error;
      return data as EstimateExclusion[];
    },
    enabled: !!estimateId,
  });

  const { data: estimateTrades } = useQuery({
    queryKey: ['estimate-trades', estimateId],
    queryFn: async () => {
      if (!estimateId) return [];
      const { data, error } = await supabase
        .from('estimate_trades')
        .select('*, trade:trades(*)')
        .eq('estimate_id', estimateId);

      if (error) throw error;
      return data;
    },
    enabled: !!estimateId,
  });

  const saveAssumptions = useMutation({
    mutationFn: async (items: { template_id?: string | null; text: string; category?: string; priority?: number; is_custom?: boolean }[]) => {
      if (!estimateId) throw new Error('Estimate ID required');

      // Delete existing assumptions
      await supabase
        .from('estimate_assumptions')
        .delete()
        .eq('estimate_id', estimateId);

      // Insert new ones
      if (items.length > 0) {
        const { error } = await supabase
          .from('estimate_assumptions')
          .insert(items.map(item => ({ ...item, estimate_id: estimateId })));

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimate-assumptions', estimateId] });
    },
  });

  const saveExclusions = useMutation({
    mutationFn: async (items: { template_id?: string | null; text: string; category?: string; priority?: number; is_custom?: boolean }[]) => {
      if (!estimateId) throw new Error('Estimate ID required');

      // Delete existing exclusions
      await supabase
        .from('estimate_exclusions')
        .delete()
        .eq('estimate_id', estimateId);

      // Insert new ones
      if (items.length > 0) {
        const { error } = await supabase
          .from('estimate_exclusions')
          .insert(items.map(item => ({ ...item, estimate_id: estimateId })));

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimate-exclusions', estimateId] });
    },
  });

  const updateEstimateTrades = useMutation({
    mutationFn: async (tradeIds: string[]) => {
      if (!estimateId) throw new Error('Estimate ID required');

      // Delete existing
      await supabase
        .from('estimate_trades')
        .delete()
        .eq('estimate_id', estimateId);

      // Insert new
      if (tradeIds.length > 0) {
        const { error } = await supabase
          .from('estimate_trades')
          .insert(tradeIds.map(trade_id => ({ estimate_id: estimateId, trade_id })));

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimate-trades', estimateId] });
    },
  });

  return {
    assumptions: assumptions || [],
    exclusions: exclusions || [],
    estimateTrades: estimateTrades || [],
    isLoading: loadingAssumptions || loadingExclusions,
    saveAssumptions,
    saveExclusions,
    updateEstimateTrades,
  };
}
