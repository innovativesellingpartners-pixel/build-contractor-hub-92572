import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, startOfWeek } from "date-fns";

export interface CrewAssignment {
  id: string;
  crew_id: string | null;
  crew_member_id: string;
  job_id: string;
  user_id: string | null;
  assigned_date: string;
  start_time: string | null;
  end_time: string | null;
  notes: string | null;
  status: string;
  jobs?: { id: string; project_name: string | null; job_number: string | null } | null;
  crews?: { id: string; name: string; color: string | null } | null;
}

export function useCrewAssignments(weekStart?: Date) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const start = weekStart ?? startOfWeek(new Date(), { weekStartsOn: 1 });
  const end = addDays(start, 6);
  const startStr = format(start, "yyyy-MM-dd");
  const endStr = format(end, "yyyy-MM-dd");

  const assignmentsQuery = useQuery({
    queryKey: ["crew_assignments", startStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crew_assignments")
        .select("*, jobs(id, project_name, job_number), crews(id, name, color)")
        .gte("assigned_date", startStr)
        .lte("assigned_date", endStr)
        .order("assigned_date");
      if (error) throw error;
      return (data ?? []) as CrewAssignment[];
    },
    enabled: !!user,
  });

  const createAssignment = useMutation({
    mutationFn: async (assignment: Partial<CrewAssignment>) => {
      const { data, error } = await supabase
        .from("crew_assignments")
        .insert({
          crew_id: assignment.crew_id,
          crew_member_id: assignment.crew_member_id ?? assignment.crew_id ?? "",
          job_id: assignment.job_id!,
          assigned_date: assignment.assigned_date!,
          start_time: assignment.start_time ?? null,
          end_time: assignment.end_time ?? null,
          notes: assignment.notes ?? null,
          status: assignment.status ?? "scheduled",
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crew_assignments"] });
      toast({ title: "Assignment created" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateAssignment = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CrewAssignment> & { id: string }) => {
      const { error } = await supabase.from("crew_assignments").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crew_assignments"] });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteAssignment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crew_assignments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crew_assignments"] });
      toast({ title: "Assignment removed" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return {
    assignments: assignmentsQuery.data ?? [],
    isLoading: assignmentsQuery.isLoading,
    createAssignment,
    updateAssignment,
    deleteAssignment,
  };
}
