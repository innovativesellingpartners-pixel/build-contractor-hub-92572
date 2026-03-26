import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface JobCostAlert {
  id: string;
  user_id: string;
  job_id: string;
  alert_type: string;
  threshold_percent: number | null;
  current_percent: number | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function useJobCostAlerts(jobId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['job-cost-alerts', jobId],
    queryFn: async () => {
      let query = supabase
        .from('job_cost_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (jobId) {
        query = query.eq('job_id', jobId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as JobCostAlert[];
    },
    enabled: !!user?.id,
  });

  const unreadCount = alerts.filter(a => !a.is_read).length;

  const markAsRead = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('job_cost_alerts')
        .update({ is_read: true })
        .eq('id', alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-cost-alerts'] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const ids = alerts.filter(a => !a.is_read).map(a => a.id);
      if (ids.length === 0) return;
      const { error } = await supabase
        .from('job_cost_alerts')
        .update({ is_read: true })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-cost-alerts'] });
    },
  });

  const checkMargins = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('check-job-margins');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-cost-alerts'] });
    },
  });

  return {
    alerts,
    isLoading,
    unreadCount,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
    checkMargins: checkMargins.mutate,
    isChecking: checkMargins.isPending,
  };
}
