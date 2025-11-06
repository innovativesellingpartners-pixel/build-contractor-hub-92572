import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CrewMember {
  id?: string;
  user_id: string;
  name: string;
  role: 'office' | 'dispatcher' | 'field_crew_member' | 'customer';
  contact_info?: any;
  skills_trades?: string[];
  created_at?: string;
  updated_at?: string;
}

export function useCrewMembers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: crewMembers, isLoading } = useQuery({
    queryKey: ['crew_members'],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('crew_members')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const createCrewMember = useMutation({
    mutationFn: async (crewMember: CrewMember) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('crew_members')
        .insert([crewMember])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crew_members'] });
      toast.success('Crew member added successfully');
    },
    onError: (error) => {
      toast.error(`Failed to add crew member: ${error.message}`);
    },
  });

  const updateCrewMember = useMutation({
    mutationFn: async ({ id, ...crewMember }: CrewMember & { id: string }) => {
      const { data, error } = await supabase
        .from('crew_members')
        .update(crewMember)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crew_members'] });
      toast.success('Crew member updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update crew member: ${error.message}`);
    },
  });

  const deleteCrewMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('crew_members')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crew_members'] });
      toast.success('Crew member removed successfully');
    },
    onError: (error) => {
      toast.error(`Failed to remove crew member: ${error.message}`);
    },
  });

  return {
    crewMembers,
    isLoading,
    createCrewMember: createCrewMember.mutate,
    updateCrewMember: updateCrewMember.mutate,
    deleteCrewMember: deleteCrewMember.mutate,
  };
}
