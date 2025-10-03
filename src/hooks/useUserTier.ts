import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export interface Subscription {
  tier_id: string;
  billing_cycle: string;
  status: string;
}

export const useUserTier = () => {
  const { user } = useAuth();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['userTier', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Check if user has @myct1.com domain for full access
      if (user.email?.endsWith('@myct1.com')) {
        return { tier_id: 'full_access', billing_cycle: 'N/A', status: 'active' } as Subscription;
      }

      try {
        const { data, error } = await supabase
          .from('subscriptions' as any)
          .select('tier_id, billing_cycle, status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (error) {
          // Table might not exist yet - return null gracefully
          console.error('Error fetching user tier:', error);
          return null;
        }

        return (data as unknown as Subscription) || null;
      } catch (error) {
        console.error('Error in tier query:', error);
        return null;
      }
    },
    enabled: !!user?.id,
    retry: false, // Don't retry if table doesn't exist
  });

  const hasFullAccess = user?.email?.endsWith('@myct1.com') || false;
  const tierFeatures = getTierFeatures(subscription?.tier_id ?? null, hasFullAccess);

  return {
    subscription,
    tierFeatures,
    hasFullAccess,
    isLoading,
  };
};

function getTierFeatures(tierId: string | null, hasFullAccess: boolean) {
  if (hasFullAccess) {
    return {
      trainingHub: true,
      crm: true,
      monthlyCall: true,
      insurance: true,
      podcast: true,
      standards: true,
      myAccount: true,
      home: true,
      leads: true,
      aiAssistant: true,
      marketplace: true,
    };
  }

  if (tierId === 'launch') {
    return {
      trainingHub: true,
      crm: true,
      monthlyCall: true,
      insurance: true,
      podcast: true,
      standards: true,
      myAccount: true,
      home: true,
      leads: false,
      aiAssistant: false,
      marketplace: false,
    };
  }

  if (tierId === 'growth') {
    return {
      trainingHub: true,
      crm: true,
      monthlyCall: true,
      insurance: true,
      podcast: true,
      standards: true,
      myAccount: true,
      home: true,
      leads: true,
      aiAssistant: true,
      marketplace: false,
    };
  }

  // No subscription
  return {
    trainingHub: false,
    crm: false,
    monthlyCall: false,
    insurance: false,
    podcast: false,
    standards: false,
    myAccount: false,
    home: false,
    leads: false,
    aiAssistant: false,
    marketplace: false,
  };
}
