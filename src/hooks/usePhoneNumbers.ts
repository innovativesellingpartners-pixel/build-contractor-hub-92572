import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function usePhoneNumber() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['phone-number', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('phone_numbers')
        .select('*')
        .eq('contractor_id', user.id)
        .eq('active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

export function useProvisionPhoneNumber() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('provision-twilio-number', {
        method: 'POST',
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phone-number', user?.id] });
      toast.success('Phone number provisioned successfully!');
    },
    onError: (error: any) => {
      console.error('Error provisioning phone number:', error);
      toast.error(error.message || 'Failed to provision phone number');
    },
  });
}
