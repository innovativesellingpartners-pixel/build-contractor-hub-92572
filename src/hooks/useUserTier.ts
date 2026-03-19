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

  // Fetch both subscription and role data
  const { data: subscription, isLoading: isSubscriptionLoading } = useQuery({
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

  // Fetch user role
  const { data: userRole, isLoading: isRoleLoading } = useQuery({
    queryKey: ['userRole', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }

      return data?.role || null;
    },
    enabled: !!user?.id,
  });

  // Fetch training access from profile
  const { data: trainingAccess } = useQuery({
    queryKey: ['trainingAccess', user?.id],
    queryFn: async () => {
      if (!user?.id) return true;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('training_access')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching training access:', error);
        return true; // Default to true
      }

      return (data as any)?.training_access ?? true;
    },
    enabled: !!user?.id,
  });

  // Check if user has full access via email domain OR super_admin role
  const hasFullAccess = user?.email?.endsWith('@myct1.com') || userRole === 'super_admin';
  const tierFeatures = getTierFeatures(subscription?.tier_id ?? null, hasFullAccess, trainingAccess ?? true);

  return {
    subscription,
    tierFeatures,
    hasFullAccess,
    isLoading: isSubscriptionLoading || isRoleLoading,
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

  // Bot user tier - Training, CRM, Marketplace, and Monthly Call
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

  // Trial tier - limited access to Training, CRM, and Marketplace
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

  // Free tier - full platform access (no billing, no admin)
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

  // No subscription - still give training and basic access
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
