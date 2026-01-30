import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ContractorWarranty {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  warranty_text: string;
  duration_years: number;
  duration_months: number;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateWarrantyInput {
  name: string;
  description?: string;
  warranty_text: string;
  duration_years?: number;
  duration_months?: number;
  is_default?: boolean;
}

export function useWarranties() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: warranties, isLoading } = useQuery({
    queryKey: ['warranties', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('contractor_warranties')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('name', { ascending: true });

      if (error) throw error;
      return data as ContractorWarranty[];
    },
    enabled: !!user?.id,
  });

  const createWarranty = useMutation({
    mutationFn: async (input: CreateWarrantyInput) => {
      if (!user?.id) throw new Error('Not authenticated');

      // If this is the default, unset other defaults first
      if (input.is_default) {
        await supabase
          .from('contractor_warranties')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const { data, error } = await supabase
        .from('contractor_warranties')
        .insert([{
          user_id: user.id,
          name: input.name,
          description: input.description || null,
          warranty_text: input.warranty_text,
          duration_years: input.duration_years || 1,
          duration_months: input.duration_months || 0,
          is_default: input.is_default || false,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warranties'] });
      toast.success('Warranty template created');
    },
    onError: (error) => {
      toast.error(`Failed to create warranty: ${error.message}`);
    },
  });

  const updateWarranty = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ContractorWarranty> & { id: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // If setting as default, unset other defaults first
      if (updates.is_default) {
        await supabase
          .from('contractor_warranties')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .neq('id', id);
      }

      const { data, error } = await supabase
        .from('contractor_warranties')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warranties'] });
      toast.success('Warranty template updated');
    },
    onError: (error) => {
      toast.error(`Failed to update warranty: ${error.message}`);
    },
  });

  const deleteWarranty = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('contractor_warranties')
        .update({ is_active: false })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warranties'] });
      toast.success('Warranty template deleted');
    },
    onError: (error) => {
      toast.error(`Failed to delete warranty: ${error.message}`);
    },
  });

  const getDefaultWarranty = () => {
    return warranties?.find(w => w.is_default) || null;
  };

  return {
    warranties,
    isLoading,
    createWarranty: createWarranty.mutate,
    createWarrantyAsync: createWarranty.mutateAsync,
    updateWarranty: updateWarranty.mutate,
    updateWarrantyAsync: updateWarranty.mutateAsync,
    deleteWarranty: deleteWarranty.mutate,
    getDefaultWarranty,
    isCreating: createWarranty.isPending,
    isUpdating: updateWarranty.isPending,
  };
}
