import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Opportunity {
  id: string;
  user_id: string;
  customer_id?: string;
  lead_id?: string;
  name: string;
  description?: string;
  value?: number;
  probability: number;
  stage: 'qualification' | 'discovery' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  expected_close_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useOpportunities = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchOpportunities = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOpportunities((data || []) as Opportunity[]);
    } catch (error: any) {
      toast({
        title: 'Error fetching opportunities',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, [user]);

  const addOpportunity = async (opportunityData: Omit<Opportunity, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('opportunities')
        .insert([{ ...opportunityData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      setOpportunities([data as Opportunity, ...opportunities]);
      toast({
        title: 'Opportunity added',
        description: 'New opportunity has been added successfully',
      });
      return data as Opportunity;
    } catch (error: any) {
      toast({
        title: 'Error adding opportunity',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateOpportunity = async (id: string, updates: Partial<Opportunity>) => {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setOpportunities(opportunities.map(opp => opp.id === id ? data as Opportunity : opp));
      toast({
        title: 'Opportunity updated',
        description: 'Opportunity has been updated successfully',
      });
      return data as Opportunity;
    } catch (error: any) {
      toast({
        title: 'Error updating opportunity',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteOpportunity = async (id: string) => {
    try {
      const { error } = await supabase
        .from('opportunities')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setOpportunities(opportunities.filter(opp => opp.id !== id));
      toast({
        title: 'Opportunity deleted',
        description: 'Opportunity has been deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error deleting opportunity',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    opportunities,
    loading,
    addOpportunity,
    updateOpportunity,
    deleteOpportunity,
    refreshOpportunities: fetchOpportunities,
  };
};
