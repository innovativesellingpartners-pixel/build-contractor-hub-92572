import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

export const OTHER_SOURCE_ID = 'f0ea5b7b-6354-474d-bf5b-fa28ac62b68f';

export interface LeadSource {
  id: string;
  name: string;
}

const fetchLeadsQuery = async (userId: string): Promise<Lead[]> => {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .is('archived_at', null)
    .is('converted_to_job_id', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Lead[];
};

const fetchSourcesQuery = async (): Promise<LeadSource[]> => {
  const { data, error } = await supabase
    .from('lead_sources')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
};

export const useLeads = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const leadsQuery = useQuery({
    queryKey: ['leads', user?.id],
    queryFn: () => fetchLeadsQuery(user!.id),
    enabled: !!user?.id,
  });

  const sourcesQuery = useQuery({
    queryKey: ['lead-sources'],
    queryFn: fetchSourcesQuery,
  });

  const invalidateLeads = () => queryClient.invalidateQueries({ queryKey: ['leads'] });

  const addLeadMutation = useMutation({
    mutationFn: async (leadData: Omit<Lead, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('Not authenticated');
      const { data: leadNumber } = await supabase.rpc('generate_lead_number');
      const { data, error } = await supabase
        .from('leads')
        .insert([{ ...leadData, user_id: user.id, lead_number: leadNumber }])
        .select()
        .single();
      if (error) throw error;
      return data as Lead;
    },
    onSuccess: () => {
      invalidateLeads();
      toast.success('Lead added', { description: 'New lead has been added successfully' });
    },
    onError: (error: any) => {
      toast.error('Error adding lead', { description: error.message });
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Lead> }) => {
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Lead;
    },
    onSuccess: () => {
      invalidateLeads();
      toast.success('Lead updated', { description: 'Lead has been updated successfully' });
    },
    onError: (error: any) => {
      toast.error('Error updating lead', { description: error.message });
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateLeads();
      toast.success('Lead deleted', { description: 'Lead has been deleted successfully' });
    },
    onError: (error: any) => {
      toast.error('Error deleting lead', { description: error.message });
    },
  });

  const archiveLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('leads')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateLeads();
      toast.success('Lead archived', { description: 'Lead has been archived successfully' });
    },
    onError: (error: any) => {
      toast.error('Error archiving lead', { description: error.message });
    },
  });

  const duplicateLeadMutation = useMutation({
    mutationFn: async (leadToDuplicate: Lead) => {
      if (!user) throw new Error('Not authenticated');
      const { data: leadNumber } = await supabase.rpc('generate_lead_number');
      const duplicateData = {
        user_id: user.id,
        lead_number: leadNumber,
        name: `${leadToDuplicate.name} (Copy)`,
        email: leadToDuplicate.email,
        phone: leadToDuplicate.phone,
        company: leadToDuplicate.company,
        project_type: leadToDuplicate.project_type,
        value: leadToDuplicate.value,
        status: 'new' as const,
        source_id: leadToDuplicate.source_id,
        source_other: leadToDuplicate.source_other,
        address: leadToDuplicate.address,
        city: leadToDuplicate.city,
        state: leadToDuplicate.state,
        zip_code: leadToDuplicate.zip_code,
        notes: leadToDuplicate.notes,
      };
      const { data, error } = await supabase
        .from('leads')
        .insert([duplicateData])
        .select()
        .single();
      if (error) throw error;
      return data as Lead;
    },
    onSuccess: () => {
      invalidateLeads();
      toast.success('Lead duplicated', { description: 'Lead has been duplicated successfully' });
    },
    onError: (error: any) => {
      toast.error('Error duplicating lead', { description: error.message });
    },
  });

  const convertToCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke('convert-lead-to-customer', {
        body: { leadId: id },
      });
      if (error) throw error;
      return data.customer;
    },
    onSuccess: () => {
      invalidateLeads();
      toast.success('Lead converted', { description: 'Lead has been converted to customer successfully' });
    },
    onError: (error: any) => {
      toast.error('Error converting lead', { description: error.message });
    },
  });

  // Wrapper functions to preserve the existing API surface
  const addLead = (leadData: Omit<Lead, 'id' | 'user_id' | 'created_at' | 'updated_at'>) =>
    addLeadMutation.mutateAsync(leadData);

  const updateLead = (id: string, updates: Partial<Lead>) =>
    updateLeadMutation.mutateAsync({ id, updates });

  const deleteLead = (id: string) => deleteLeadMutation.mutateAsync(id);

  const archiveLead = (id: string) => archiveLeadMutation.mutateAsync(id);

  const duplicateLead = (leadToDuplicate: Lead) =>
    duplicateLeadMutation.mutateAsync(leadToDuplicate);

  const convertToCustomer = (id: string) =>
    convertToCustomerMutation.mutateAsync(id);

  const updateLeadStatus = (id: string, status: Lead['status']) =>
    updateLead(id, { status, last_contact_date: new Date().toISOString() });

  const refreshLeads = () => invalidateLeads();

  return {
    leads: leadsQuery.data ?? [],
    sources: sourcesQuery.data ?? [],
    loading: leadsQuery.isLoading,
    addLead,
    updateLead,
    deleteLead,
    updateLeadStatus,
    convertToCustomer,
    archiveLead,
    duplicateLead,
    refreshLeads,
  };
};
