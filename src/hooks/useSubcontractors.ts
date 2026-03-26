import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Subcontractor {
  id: string;
  user_id: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  trade: string | null;
  license_number: string | null;
  insurance_expiry: string | null;
  rating: number;
  notes: string | null;
  status: string;
  documents: any[];
  created_at: string;
  updated_at: string;
}

export interface SubAssignment {
  id: string;
  user_id: string;
  subcontractor_id: string;
  job_id: string;
  scope_of_work: string | null;
  agreed_amount: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  subcontractors?: Subcontractor;
  jobs?: { id: string; name: string; job_number: string };
}

export function useSubcontractors() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: subcontractors = [], isLoading } = useQuery({
    queryKey: ['subcontractors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subcontractors')
        .select('*')
        .order('company_name');
      if (error) throw error;
      return (data || []) as Subcontractor[];
    },
    enabled: !!user?.id,
  });

  const createSub = useMutation({
    mutationFn: async (sub: Omit<Subcontractor, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('subcontractors')
        .insert({ ...sub, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcontractors'] });
      toast.success('Subcontractor added');
    },
    onError: (e) => toast.error(`Failed to add sub: ${e.message}`),
  });

  const updateSub = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Subcontractor> & { id: string }) => {
      const { data, error } = await supabase
        .from('subcontractors')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcontractors'] });
      toast.success('Subcontractor updated');
    },
    onError: (e) => toast.error(`Failed to update: ${e.message}`),
  });

  const deleteSub = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('subcontractors').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcontractors'] });
      toast.success('Subcontractor removed');
    },
    onError: (e) => toast.error(`Failed to delete: ${e.message}`),
  });

  return {
    subcontractors,
    isLoading,
    createSub: createSub.mutate,
    updateSub: updateSub.mutate,
    deleteSub: deleteSub.mutate,
    expiringInsurance: subcontractors.filter(s => {
      if (!s.insurance_expiry) return false;
      const expiry = new Date(s.insurance_expiry);
      const thirtyDaysOut = new Date();
      thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);
      return expiry <= thirtyDaysOut && s.status === 'active';
    }),
  };
}

export function useSubAssignments(jobId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['sub-assignments', jobId],
    queryFn: async () => {
      let query = supabase
        .from('sub_assignments')
        .select('*, subcontractors(*), jobs(id, name, job_number)')
        .order('created_at', { ascending: false });
      if (jobId) query = query.eq('job_id', jobId);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as SubAssignment[];
    },
    enabled: !!user?.id,
  });

  const createAssignment = useMutation({
    mutationFn: async (assignment: Omit<SubAssignment, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'subcontractors' | 'jobs'>) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('sub_assignments')
        .insert({ ...assignment, user_id: user.id })
        .select('*, subcontractors(*), jobs(id, name, job_number)')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-assignments'] });
      toast.success('Sub assigned to job');
    },
    onError: (e) => toast.error(`Failed to assign: ${e.message}`),
  });

  const updateAssignment = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SubAssignment> & { id: string }) => {
      const { subcontractors, jobs, ...cleanUpdates } = updates as any;
      const { data, error } = await supabase
        .from('sub_assignments')
        .update(cleanUpdates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-assignments'] });
      toast.success('Assignment updated');
    },
    onError: (e) => toast.error(`Failed to update: ${e.message}`),
  });

  const deleteAssignment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sub_assignments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sub-assignments'] });
      toast.success('Assignment removed');
    },
    onError: (e) => toast.error(`Failed to delete: ${e.message}`),
  });

  const totalSubCosts = assignments
    .filter(a => ['accepted', 'in_progress', 'completed', 'paid'].includes(a.status))
    .reduce((s, a) => s + Number(a.agreed_amount || 0), 0);

  return {
    assignments,
    isLoading,
    totalSubCosts,
    createAssignment: createAssignment.mutate,
    updateAssignment: updateAssignment.mutate,
    deleteAssignment: deleteAssignment.mutate,
  };
}
