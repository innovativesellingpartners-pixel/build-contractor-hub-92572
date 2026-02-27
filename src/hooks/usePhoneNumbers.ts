import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function usePhoneNumber(targetUserId?: string) {
  const { user } = useAuth();
  const userId = targetUserId || user?.id;

  return useQuery({
    queryKey: ['phone-number', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('phone_numbers')
        .select('*')
        .eq('contractor_id', userId)
        .eq('active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useProvisionPhoneNumber() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (targetUserId?: string) => {
      const { data, error } = await supabase.functions.invoke('provision-twilio-number', {
        body: targetUserId ? { targetUserId } : {},
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.message || data.error);
      return data;
    },
    onSuccess: (_data, targetUserId) => {
      const id = targetUserId || user?.id;
      queryClient.invalidateQueries({ queryKey: ['phone-number', id] });
      toast.success('Phone number provisioned successfully!');
    },
    onError: (error: any) => {
      console.error('Error provisioning phone number:', error);
      toast.error(error.message || 'Failed to provision phone number');
    },
  });
}

export function useDeletePhoneNumber() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ phoneNumberId, contractorId }: { phoneNumberId: string; contractorId: string }) => {
      const { data, error } = await supabase.functions.invoke('delete-twilio-number', {
        body: { phoneNumberId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return { ...data, contractorId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['phone-number', data.contractorId] });
      toast.success('Phone number deleted successfully');
    },
    onError: (error: any) => {
      console.error('Error deleting phone number:', error);
      toast.error(error.message || 'Failed to delete phone number');
    },
  });
}
