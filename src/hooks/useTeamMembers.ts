import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export function useTeamMembers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: teamMembers = [], isLoading } = useQuery({
    queryKey: ['team-members', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const createMember = useMutation({
    mutationFn: async (params: { email: string; password: string; name: string; phone?: string; job_title?: string; role: string }) => {
      const { data, error } = await supabase.functions.invoke('create-team-member', {
        body: params,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast({ title: "Team member created", description: "They can now log in with their credentials." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMember = useMutation({
    mutationFn: async (params: { id: string; role?: string; status?: string; permissions?: Record<string, boolean> }) => {
      const { id, ...updates } = params;
      const { error } = await supabase
        .from('team_members')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast({ title: "Updated", description: "Team member updated." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const removeMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('team_members')
        .update({ status: 'removed' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast({ title: "Removed", description: "Team member has been removed." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const activeMembers = teamMembers.filter((m: any) => m.status === 'active');
  const suspendedMembers = teamMembers.filter((m: any) => m.status === 'suspended');
  const visibleMembers = teamMembers.filter((m: any) => m.status !== 'removed');

  return {
    teamMembers: visibleMembers,
    activeMembers,
    suspendedMembers,
    isLoading,
    createMember,
    updateMember,
    removeMember,
  };
}
