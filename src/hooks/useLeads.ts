import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Lead {
  id: string;
  user_id: string;
  lead_number?: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  project_type?: string;
  value?: number;
  status: 'new' | 'contacted' | 'qualified' | 'quoted' | 'job' | 'converted';
  source_id?: string;
  source_other?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  last_contact_date?: string;
  customer_id?: string;
  converted_to_customer?: boolean;
  converted_to_job_id?: string;
  converted_at?: string;
}

// The ID of the "Other" lead source option
export const OTHER_SOURCE_ID = 'f0ea5b7b-6354-474d-bf5b-fa28ac62b68f';

export interface LeadSource {
  id: string;
  name: string;
}

export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchLeads = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .is('archived_at', null)
        .is('converted_to_job_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads((data || []) as Lead[]);
    } catch (error: any) {
      toast({
        title: 'Error fetching leads',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const archiveLead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setLeads(leads.filter(lead => lead.id !== id));
      toast({
        title: 'Lead archived',
        description: 'Lead has been archived successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error archiving lead',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const fetchSources = async () => {
    try {
      const { data, error } = await supabase
        .from('lead_sources')
        .select('*')
        .order('name');

      if (error) throw error;
      setSources(data || []);
    } catch (error: any) {
      console.error('Error fetching sources:', error);
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchSources();
  }, [user]);

  const addLead = async (leadData: Omit<Lead, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      // Generate lead number
      const { data: leadNumber } = await supabase.rpc('generate_lead_number');
      
      const { data, error } = await supabase
        .from('leads')
        .insert([{ ...leadData, user_id: user.id, lead_number: leadNumber }])
        .select()
        .single();

      if (error) throw error;

      setLeads([data as Lead, ...leads]);
      toast({
        title: 'Lead added',
        description: 'New lead has been added successfully',
      });
      return data as Lead;
    } catch (error: any) {
      toast({
        title: 'Error adding lead',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setLeads(leads.map(lead => lead.id === id ? data as Lead : lead));
      toast({
        title: 'Lead updated',
        description: 'Lead has been updated successfully',
      });
      return data as Lead;
    } catch (error: any) {
      toast({
        title: 'Error updating lead',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteLead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setLeads(leads.filter(lead => lead.id !== id));
      toast({
        title: 'Lead deleted',
        description: 'Lead has been deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error deleting lead',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateLeadStatus = async (id: string, status: Lead['status']) => {
    return updateLead(id, { status, last_contact_date: new Date().toISOString() });
  };

  const convertToCustomer = async (id: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('convert-lead-to-customer', {
        body: { leadId: id },
      });

      if (error) throw error;

      toast({
        title: 'Lead converted',
        description: 'Lead has been converted to customer successfully',
      });

      fetchLeads();
      return data.customer;
    } catch (error: any) {
      toast({
        title: 'Error converting lead',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    leads,
    sources,
    loading,
    addLead,
    updateLead,
    deleteLead,
    updateLeadStatus,
    convertToCustomer,
    archiveLead,
    refreshLeads: fetchLeads,
  };
};