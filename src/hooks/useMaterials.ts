import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Material {
  id?: string;
  job_id: string;
  user_id?: string;
  description: string;
  quantity_ordered: number;
  quantity_used: number;
  unit_type?: string;
  cost_per_unit: number;
  total_cost?: number;
  supplier_name?: string;
  date_ordered?: string;
  date_used?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export function useMaterials(jobId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: materials, isLoading } = useQuery({
    queryKey: ['materials', jobId],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('materials')
        .select('*')
        .order('created_at', { ascending: false });

      if (jobId) {
        query = query.eq('job_id', jobId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const createMaterial = useMutation({
    mutationFn: async (material: Material) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('materials')
        .insert([{ ...material, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Material added successfully');
    },
    onError: (error) => {
      toast.error(`Failed to add material: ${error.message}`);
    },
  });

  const updateMaterial = useMutation({
    mutationFn: async ({ id, ...material }: Material & { id: string }) => {
      const { data, error } = await supabase
        .from('materials')
        .update(material)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Material updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update material: ${error.message}`);
    },
  });

  const deleteMaterial = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Material deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete material: ${error.message}`);
    },
  });

  return {
    materials,
    isLoading,
    createMaterial: createMaterial.mutate,
    updateMaterial: updateMaterial.mutate,
    deleteMaterial: deleteMaterial.mutate,
  };
}
