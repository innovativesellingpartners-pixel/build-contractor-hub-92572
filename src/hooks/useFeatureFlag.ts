import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useFeatureFlag = (flagName: string) => {
  const { data: enabled = false, isLoading } = useQuery({
    queryKey: ['featureFlag', flagName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_feature_flags')
        .select('enabled')
        .eq('flag_name', flagName)
        .maybeSingle();

      if (error) {
        console.error('Error fetching feature flag:', error);
        return false;
      }

      return data?.enabled ?? false;
    },
    staleTime: 60_000,
  });

  return { enabled, isLoading };
};
