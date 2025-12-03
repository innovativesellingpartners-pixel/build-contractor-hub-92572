import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface PSFU {
  id: string;
  job_id: string;
  customer_id?: string;
  user_id: string;
  status: 'open' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  next_contact_date?: string;
  contact_method?: string;
  notes?: string;
  outcome?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export const usePSFU = (jobId?: string) => {
  const [psfus, setPsfus] = useState<PSFU[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPSFUs = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('post_sale_follow_ups')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (jobId) {
        query = query.eq('job_id', jobId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPsfus((data || []) as PSFU[]);
    } catch (error: any) {
      toast({
        title: 'Error fetching follow-ups',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPSFUs();
  }, [user, jobId]);

  const addPSFU = async (psfuData: Omit<PSFU, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('post_sale_follow_ups')
        .insert([{ ...psfuData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      setPsfus([data as PSFU, ...psfus]);
      toast({
        title: 'Follow-up created',
        description: 'Post-sale follow-up has been created successfully',
      });
      return data as PSFU;
    } catch (error: any) {
      toast({
        title: 'Error creating follow-up',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updatePSFU = async (id: string, updates: Partial<PSFU>) => {
    try {
      const { data, error } = await supabase
        .from('post_sale_follow_ups')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setPsfus(psfus.map(p => p.id === id ? data as PSFU : p));
      toast({
        title: 'Follow-up updated',
        description: 'Post-sale follow-up has been updated successfully',
      });
      return data as PSFU;
    } catch (error: any) {
      toast({
        title: 'Error updating follow-up',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deletePSFU = async (id: string) => {
    try {
      const { error } = await supabase
        .from('post_sale_follow_ups')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPsfus(psfus.filter(p => p.id !== id));
      toast({
        title: 'Follow-up deleted',
        description: 'Post-sale follow-up has been deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error deleting follow-up',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const completePSFU = async (id: string, outcome: string) => {
    return updatePSFU(id, { 
      status: 'completed', 
      outcome, 
      completed_at: new Date().toISOString() 
    });
  };

  return {
    psfus,
    loading,
    addPSFU,
    updatePSFU,
    deletePSFU,
    completePSFU,
    refreshPSFUs: fetchPSFUs,
  };
};
