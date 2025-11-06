import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface JobCost {
  id: string;
  job_id: string;
  user_id: string;
  category: string;
  description?: string;
  amount: number;
  cost_date: string;
  created_at: string;
}

export const useJobCosts = (jobId?: string) => {
  const [costs, setCosts] = useState<JobCost[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCosts = async () => {
    if (!user || !jobId) return;

    try {
      const { data, error } = await supabase
        .from('job_costs')
        .select('*')
        .eq('job_id', jobId)
        .order('cost_date', { ascending: false });

      if (error) throw error;
      setCosts((data || []) as JobCost[]);
    } catch (error: any) {
      toast({
        title: 'Error fetching costs',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCosts();
  }, [jobId, user]);

  const addCost = async (costData: Omit<JobCost, 'id' | 'job_id' | 'user_id' | 'created_at'>) => {
    if (!user || !jobId) return;

    try {
      const { data, error } = await supabase
        .from('job_costs')
        .insert([{
          ...costData,
          job_id: jobId,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      setCosts([data as JobCost, ...costs]);
      toast({
        title: 'Cost added',
        description: 'Job cost has been recorded successfully',
      });
      return data as JobCost;
    } catch (error: any) {
      toast({
        title: 'Error adding cost',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateCost = async (id: string, updates: Partial<JobCost>) => {
    try {
      const { data, error } = await supabase
        .from('job_costs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setCosts(costs.map(cost => cost.id === id ? data as JobCost : cost));
      toast({
        title: 'Cost updated',
        description: 'Job cost has been updated successfully',
      });
      return data as JobCost;
    } catch (error: any) {
      toast({
        title: 'Error updating cost',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteCost = async (id: string) => {
    try {
      const { error } = await supabase
        .from('job_costs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCosts(costs.filter(cost => cost.id !== id));
      toast({
        title: 'Cost deleted',
        description: 'Job cost has been removed successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error deleting cost',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const totalCosts = costs.reduce((sum, cost) => sum + Number(cost.amount), 0);

  return {
    costs,
    loading,
    totalCosts,
    addCost,
    updateCost,
    deleteCost,
    refreshCosts: fetchCosts,
  };
};
