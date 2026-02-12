import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface BudgetLineItem {
  id: string;
  job_id: string;
  user_id: string;
  estimate_line_item_index: number | null;
  description: string;
  item_code: string | null;
  category: string;
  budgeted_quantity: number;
  budgeted_unit_price: number;
  budgeted_amount: number;
  actual_amount: number;
  variance_amount: number;
  variance_percent: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useJobBudget(jobId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: budgetLines = [], isLoading, refetch } = useQuery({
    queryKey: ['job-budget-lines', jobId],
    queryFn: async () => {
      if (!jobId) return [];
      const { data, error } = await supabase
        .from('job_budget_line_items')
        .select('*')
        .eq('job_id', jobId)
        .order('estimate_line_item_index', { ascending: true });
      if (error) throw error;
      return (data || []) as BudgetLineItem[];
    },
    enabled: !!jobId && !!user?.id,
  });

  const totalBudgeted = budgetLines.reduce((s, l) => s + Number(l.budgeted_amount || 0), 0);
  const totalActual = budgetLines.reduce((s, l) => s + Number(l.actual_amount || 0), 0);
  const totalVariance = totalBudgeted - totalActual;
  const variancePercent = totalBudgeted > 0 ? (totalVariance / totalBudgeted) * 100 : 0;

  const addBudgetLine = useCallback(async (line: Omit<BudgetLineItem, 'id' | 'user_id' | 'variance_amount' | 'variance_percent' | 'created_at' | 'updated_at'>) => {
    if (!user?.id) return;
    const { error } = await supabase
      .from('job_budget_line_items')
      .insert({ ...line, user_id: user.id });
    if (error) { toast.error('Failed to add budget line'); throw error; }
    toast.success('Budget line added');
    refetch();
  }, [user?.id, refetch]);

  const updateBudgetLine = useCallback(async (id: string, updates: Partial<BudgetLineItem>) => {
    const { error } = await supabase
      .from('job_budget_line_items')
      .update(updates)
      .eq('id', id);
    if (error) { toast.error('Failed to update budget line'); throw error; }
    refetch();
  }, [refetch]);

  const deleteBudgetLine = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('job_budget_line_items')
      .delete()
      .eq('id', id);
    if (error) { toast.error('Failed to delete budget line'); throw error; }
    toast.success('Budget line removed');
    refetch();
  }, [refetch]);

  const initFromEstimate = useCallback(async (estimateId: string, jobId: string) => {
    if (!user?.id) return;
    const { data: est } = await supabase
      .from('estimates')
      .select('line_items')
      .eq('id', estimateId)
      .single();
    
    if (!est?.line_items || !Array.isArray(est.line_items)) return;

    const lines = (est.line_items as any[]).map((item, idx) => ({
      job_id: jobId,
      user_id: user.id,
      estimate_line_item_index: idx,
      description: item.description || item.name || `Line item ${idx + 1}`,
      item_code: item.item_code || null,
      category: item.category || 'General',
      budgeted_quantity: Number(item.quantity) || 1,
      budgeted_unit_price: Number(item.unit_price || item.unitPrice) || 0,
      budgeted_amount: Number(item.amount || item.total) || (Number(item.quantity || 1) * Number(item.unit_price || item.unitPrice || 0)),
      actual_amount: 0,
      notes: null,
    }));

    if (lines.length > 0) {
      const { error } = await supabase
        .from('job_budget_line_items')
        .insert(lines);
      if (error) { toast.error('Failed to initialize budget'); throw error; }
      toast.success(`Budget initialized with ${lines.length} line items from estimate`);
      refetch();
    }
  }, [user?.id, refetch]);

  return {
    budgetLines,
    isLoading,
    totalBudgeted,
    totalActual,
    totalVariance,
    variancePercent,
    addBudgetLine,
    updateBudgetLine,
    deleteBudgetLine,
    initFromEstimate,
    refetch,
  };
}
