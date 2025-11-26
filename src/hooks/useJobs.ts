import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Job {
  id: string;
  user_id: string;
  customer_id?: string;
  opportunity_id?: string;
  job_number?: string;
  name: string;
  description?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  start_date?: string;
  end_date?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  total_cost: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  original_estimate_id?: string;
  contract_value?: number;
  change_orders_total?: number;
  total_contract_value?: number;
  payments_collected?: number;
  expenses_total?: number;
  profit?: number;
}

export const useJobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchJobs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs((data || []) as Job[]);
    } catch (error: any) {
      toast({
        title: 'Error fetching jobs',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [user]);

  const addJob = async (jobData: Omit<Job, 'id' | 'user_id' | 'job_number' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      // Generate job number
      const { data: jobNumber } = await supabase.rpc('generate_job_number');
      
      const { data, error } = await supabase
        .from('jobs')
        .insert([{ ...jobData, user_id: user.id, job_number: jobNumber }])
        .select()
        .single();

      if (error) throw error;

      setJobs([data as Job, ...jobs]);
      toast({
        title: 'Job added',
        description: 'New job has been added successfully',
      });
      return data as Job;
    } catch (error: any) {
      toast({
        title: 'Error adding job',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateJob = async (id: string, updates: Partial<Job>) => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setJobs(jobs.map(job => job.id === id ? data as Job : job));
      toast({
        title: 'Job updated',
        description: 'Job has been updated successfully',
      });
      return data as Job;
    } catch (error: any) {
      toast({
        title: 'Error updating job',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteJob = async (id: string) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setJobs(jobs.filter(job => job.id !== id));
      toast({
        title: 'Job deleted',
        description: 'Job has been deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error deleting job',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    jobs,
    loading,
    addJob,
    updateJob,
    deleteJob,
    refreshJobs: fetchJobs,
  };
};
