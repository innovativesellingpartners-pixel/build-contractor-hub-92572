import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type OpportunityStage = 'qualification' | 'lwe_discovery' | 'demo' | 'proposal' | 'negotiation' | 'close' | 'psfu';
export type LeadSource = 'referral' | 'website' | 'ad' | 'repeat_customer' | 'other';

export interface Opportunity {
  id: string;
  user_id: string;
  customer_id?: string;
  lead_id?: string;
  
  // Customer info
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  job_address?: string;
  
  // Opportunity details
  title: string;
  trade_type: string;
  need_description?: string;
  competing_options_description?: string;
  notes?: string;
  
  // Sales stage tracking
  stage: OpportunityStage;
  stage_entered_at: string;
  previous_stage?: OpportunityStage;
  
  // Financial info
  estimated_value?: number;
  probability_percent: number;
  probability_override: boolean;
  
  // Timeline
  estimated_close_date?: string;
  job_start_target_date?: string;
  
  // Qualification fields
  decision_maker_name?: string;
  budget_confirmed: boolean;
  lead_source: LeadSource;
  
  // Action tracking
  next_action_description?: string;
  next_action_date?: string;
  last_activity_at: string;
  
  // Documents
  proposal_document_url?: string;
  contract_document_url?: string;
  
  // Assignment
  assigned_user_id?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface StageHistory {
  id: string;
  opportunity_id: string;
  from_stage?: OpportunityStage;
  to_stage: OpportunityStage;
  changed_by_user_id: string;
  changed_at: string;
  note?: string;
  reason?: string;
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
      setOpportunities(data || []);
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

  const addOpportunity = async (opportunityData: Partial<Opportunity>) => {
    if (!user) return;

    try {
      const dataToInsert: any = { 
        ...opportunityData, 
        user_id: user.id,
        assigned_user_id: opportunityData.assigned_user_id || user.id
      };
      
      const { data, error } = await supabase
        .from('opportunities')
        .insert([dataToInsert])
        .select()
        .single();

      if (error) throw error;

      setOpportunities([data, ...opportunities]);
      toast({
        title: 'Opportunity added',
        description: 'New opportunity has been added successfully',
      });
      return data;
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

      setOpportunities(opportunities.map(opp => opp.id === id ? data : opp));
      toast({
        title: 'Opportunity updated',
        description: 'Opportunity has been updated successfully',
      });
      return data;
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

  const fetchStageHistory = async (opportunityId: string) => {
    try {
      const { data, error } = await supabase
        .from('stage_history')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .order('changed_at', { ascending: false });

      if (error) throw error;
      return data as StageHistory[];
    } catch (error: any) {
      toast({
        title: 'Error fetching stage history',
        description: error.message,
        variant: 'destructive',
      });
      return [];
    }
  };

  return {
    opportunities,
    loading,
    addOpportunity,
    updateOpportunity,
    deleteOpportunity,
    fetchStageHistory,
    refreshOpportunities: fetchOpportunities,
  };
};
