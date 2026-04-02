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

  const { data: tierData, isLoading } = useQuery({
    queryKey: ['userTierData', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Check if user has @myct1.com domain for full access
      if (user.email?.endsWith('@myct1.com')) {
        return {
          tier_id: 'full_access',
          billing_cycle: 'N/A',
          subscription_status: 'active',
          role: null as string | null,
          training_access: true,
        };
      }

      try {
        const { data, error } = await supabase.rpc('get_user_tier_data', {
          p_user_id: user.id,
        });

        if (error) {
          console.error('Error fetching user tier data:', error);
          return null;
        }

        const row = Array.isArray(data) ? data[0] : data;
        return row ?? null;
      } catch (error) {
        console.error('Error in tier data query:', error);
        return null;
      }
    },
    enabled: !!user?.id,
    retry: false,
  });

  // Map RPC result to the same local variables used before
  const subscription: Subscription | null = tierData?.tier_id
    ? {
        tier_id: tierData.tier_id,
        billing_cycle: tierData.billing_cycle ?? 'N/A',
        status: tierData.subscription_status ?? 'active',
      }
    : null;

  const userRole = tierData?.role ?? null;
  const trainingAccess = tierData?.training_access ?? true;

  // Check if user has full access via email domain OR super_admin role
  const hasFullAccess = user?.email?.endsWith('@myct1.com') || userRole === 'super_admin';
  const tierFeatures = getTierFeatures(subscription?.tier_id ?? null, hasFullAccess, trainingAccess);

  return {
    subscription,
    tierFeatures,
    hasFullAccess,
    isLoading,
    userRole,
  };
};

function getTierFeatures(tierId: string | null, hasFullAccess: boolean, trainingAccess: boolean = true) {
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

  if (tierId === 'bot_user') {
    return {
      trainingHub: trainingAccess,
      crm: true,
      monthlyCall: true,
      insurance: false,
      podcast: false,
      standards: false,
      myAccount: true,
      home: true,
      leads: false,
      aiAssistant: true,
      marketplace: true,
    };
  }

  if (tierId === 'trial') {
    return {
      trainingHub: trainingAccess,
      crm: true,
      monthlyCall: false,
      insurance: false,
      podcast: false,
      standards: false,
      myAccount: true,
      home: true,
      leads: false,
      aiAssistant: false,
      marketplace: true,
    };
  }

  if (tierId === 'launch') {
    return {
      trainingHub: trainingAccess,
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

  if (tierId === 'free') {
    return {
      trainingHub: trainingAccess,
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

  if (tierId === 'growth' || tierId === 'accel') {
    return {
      trainingHub: trainingAccess,
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

  return {
    trainingHub: trainingAccess,
    crm: false,
    monthlyCall: false,
    insurance: false,
    podcast: false,
    standards: false,
    myAccount: true,
    home: true,
    leads: false,
    aiAssistant: false,
    marketplace: false,
  };
}
