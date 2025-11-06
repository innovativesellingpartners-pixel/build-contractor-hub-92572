import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface DailyLog {
  id: string;
  job_id: string;
  user_id: string;
  log_date: string;
  weather?: string;
  crew_count?: number;
  hours_worked?: number;
  work_completed?: string;
  materials_used?: string;
  equipment_used?: string;
  notes?: string;
  created_at: string;
}

export const useDailyLogs = (jobId?: string) => {
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchLogs = async () => {
    if (!user || !jobId) return;

    try {
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('job_id', jobId)
        .order('log_date', { ascending: false });

      if (error) throw error;
      setLogs((data || []) as DailyLog[]);
    } catch (error: any) {
      toast({
        title: 'Error fetching logs',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [jobId, user]);

  const addLog = async (logData: Omit<DailyLog, 'id' | 'job_id' | 'user_id' | 'created_at'>) => {
    if (!user || !jobId) return;

    try {
      const { data, error } = await supabase
        .from('daily_logs')
        .insert([{
          ...logData,
          job_id: jobId,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      setLogs([data as DailyLog, ...logs]);
      toast({
        title: 'Log added',
        description: 'Daily log has been saved successfully',
      });
      return data as DailyLog;
    } catch (error: any) {
      toast({
        title: 'Error adding log',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateLog = async (id: string, updates: Partial<DailyLog>) => {
    try {
      const { data, error } = await supabase
        .from('daily_logs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setLogs(logs.map(log => log.id === id ? data as DailyLog : log));
      toast({
        title: 'Log updated',
        description: 'Daily log has been updated successfully',
      });
      return data as DailyLog;
    } catch (error: any) {
      toast({
        title: 'Error updating log',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteLog = async (id: string) => {
    try {
      const { error } = await supabase
        .from('daily_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setLogs(logs.filter(log => log.id !== id));
      toast({
        title: 'Log deleted',
        description: 'Daily log has been removed successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error deleting log',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    logs,
    loading,
    addLog,
    updateLog,
    deleteLog,
    refreshLogs: fetchLogs,
  };
};
