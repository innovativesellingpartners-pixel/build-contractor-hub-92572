import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface CrewMember {
  name: string;
  phone: string;
  role: string;
  hourly_rate: number;
}

export interface Crew {
  id: string;
  name: string;
  foreman_name: string | null;
  foreman_phone: string | null;
  members: CrewMember[];
  status: string;
  color: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export function useCrews() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const crewsQuery = useQuery({
    queryKey: ["crews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crews")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((c: any) => ({
        ...c,
        members: Array.isArray(c.members) ? c.members : [],
      })) as Crew[];
    },
    enabled: !!user,
  });

  const createCrew = useMutation({
    mutationFn: async (crew: Partial<Crew>) => {
      const { data, error } = await supabase
        .from("crews")
        .insert({
          name: crew.name!,
          foreman_name: crew.foreman_name ?? null,
          foreman_phone: crew.foreman_phone ?? null,
          members: crew.members ?? [],
          status: crew.status ?? "active",
          color: crew.color ?? null,
          description: crew.description ?? null,
          user_id: user!.id,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crews"] });
      toast({ title: "Crew created" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateCrew = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Crew> & { id: string }) => {
      const { error } = await supabase.from("crews").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crews"] });
      toast({ title: "Crew updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteCrew = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crews"] });
      toast({ title: "Crew deleted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return {
    crews: crewsQuery.data ?? [],
    isLoading: crewsQuery.isLoading,
    createCrew,
    updateCrew,
    deleteCrew,
  };
}
