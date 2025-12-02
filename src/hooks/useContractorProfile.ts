import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ContractorProfile {
  id: string;
  user_id: string;
  company_name: string | null;
  contact_name: string | null;
  phone: string | null;
  business_address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  logo_url: string | null;
  business_email: string | null;
  website_url: string | null;
  license_number: string | null;
  trade: string | null;
  default_sales_tax_rate: number | null;
  default_deposit_percent: number | null;
  default_warranty_years: number | null;
}

export function useContractorProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['contractor-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          company_name,
          contact_name,
          phone,
          business_address,
          city,
          state,
          zip_code,
          logo_url,
          business_email,
          website_url,
          license_number,
          trade,
          default_sales_tax_rate,
          default_deposit_percent,
          default_warranty_years
        `)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data as ContractorProfile;
    },
    enabled: !!user?.id,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<ContractorProfile>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractor-profile'] });
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update profile: ${error.message}`);
    },
  });

  // Helper to get formatted business address
  const getFormattedAddress = () => {
    if (!profile) return '';
    return [profile.business_address, profile.city, profile.state, profile.zip_code]
      .filter(Boolean)
      .join(', ');
  };

  // Helper to get business info for display
  const getBusinessInfo = () => {
    if (!profile) return null;
    return {
      businessName: profile.company_name || 'Your Company',
      logoUrl: profile.logo_url,
      address: getFormattedAddress(),
      phone: profile.phone,
      email: profile.business_email || user?.email,
      website: profile.website_url,
      licenseNumber: profile.license_number,
      contactName: profile.contact_name,
      trade: profile.trade,
    };
  };

  // Get default estimate settings
  const getEstimateDefaults = () => {
    return {
      salesTaxRate: profile?.default_sales_tax_rate || 6.0,
      depositPercent: profile?.default_deposit_percent || 30.0,
      warrantyYears: profile?.default_warranty_years || 2,
    };
  };

  return {
    profile,
    isLoading,
    updateProfile: updateProfile.mutate,
    updateProfileAsync: updateProfile.mutateAsync,
    getFormattedAddress,
    getBusinessInfo,
    getEstimateDefaults,
  };
}
