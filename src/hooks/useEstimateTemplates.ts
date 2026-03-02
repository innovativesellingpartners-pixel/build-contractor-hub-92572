import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from 'sonner';
import { EstimateLineItem } from './useEstimates';

export const TRADES = [
  "General Contracting",
  "Roofing - Residential",
  "Roofing - Commercial",
  "Plumbing - Residential",
  "Plumbing - Commercial",
  "HVAC",
  "Electrical",
  "Framing and Structure",
  "Drywall and Insulation",
  "Painting",
  "Flooring",
  "Concrete and Foundations",
  "Excavation and Sitework",
  "Masonry and Brick",
  "Siding and Exterior Cladding",
  "Windows and Doors",
  "Finish Carpentry and Trim",
  "Cabinetry and Millwork",
  "Decks and Outdoor Structures",
  "Landscaping and Irrigation",
  "Fencing",
  "Fire Protection / Sprinklers",
  "Low Voltage / Data",
  "Demolition",
  "Environmental / Remediation"
] as const;

export type Trade = typeof TRADES[number];

export interface EstimateTemplate {
  id: string;
  user_id: string;
  name: string;
  trade: Trade;
  description?: string;
  tags?: string[];
  scope_summary?: string;
  visibility: 'private' | 'account';
  line_items: EstimateLineItem[];
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateInput {
  name: string;
  trade: Trade;
  description?: string;
  tags?: string[];
  scope_summary?: string;
  visibility: 'private' | 'account';
  line_items: EstimateLineItem[];
}

export function useEstimateTemplates() {
  const { user } = useAuth();
  const { isSuperAdmin } = useAdminAuth();
  const queryClient = useQueryClient();

  // Fetch all templates (user's own + account-wide; super admins see all)
  const { data: templates, isLoading } = useQuery({
    queryKey: ['estimate-templates', user?.id, isSuperAdmin],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      // Super admins see all templates via RLS policy; regular users see own + account
      const { data, error } = await supabase
        .from('estimate_templates')
        .select('*')
        .order('created_at', { ascending: false })
        .order('name', { ascending: true });

      if (error) throw error;
      
      // Map the data to our interface, casting line_items properly
      return (data || []).map(item => ({
        ...item,
        trade: item.trade as Trade,
        visibility: item.visibility as 'private' | 'account',
        line_items: (item.line_items || []) as unknown as EstimateLineItem[],
      })) as EstimateTemplate[];
    },
    enabled: !!user,
  });

  // Create template
  const createTemplate = useMutation({
    mutationFn: async (input: CreateTemplateInput) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('estimate_templates')
        .insert([{
          user_id: user.id,
          name: input.name,
          trade: input.trade,
          description: input.description,
          tags: input.tags || [],
          scope_summary: input.scope_summary,
          visibility: input.visibility,
          line_items: JSON.parse(JSON.stringify(input.line_items)),
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimate-templates'] });
      toast.success('Template saved successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to save template: ' + error.message);
    },
  });

  // Update template
  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateTemplateInput> & { id: string }) => {
      // Convert line_items to JSON-safe format if present
      const updateData: Record<string, unknown> = { ...input };
      if (input.line_items) {
        updateData.line_items = JSON.parse(JSON.stringify(input.line_items));
      }
      
      const { data, error } = await supabase
        .from('estimate_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimate-templates'] });
      toast.success('Template updated');
    },
    onError: (error: any) => {
      toast.error('Failed to update template: ' + error.message);
    },
  });

  // Delete template
  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('estimate_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimate-templates'] });
      toast.success('Template deleted');
    },
    onError: (error: any) => {
      toast.error('Failed to delete template: ' + error.message);
    },
  });

  // Filter templates by trade and search
  const filterTemplates = (
    trade?: Trade,
    searchQuery?: string,
    visibility?: 'private' | 'account' | 'all'
  ) => {
    if (!templates) return [];
    
    return templates.filter(template => {
      // Trade filter
      if (trade && template.trade !== trade) return false;
      
      // Visibility filter
      if (visibility && visibility !== 'all') {
        if (visibility === 'private' && template.user_id !== user?.id) return false;
        if (visibility === 'account' && template.visibility !== 'account') return false;
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = template.name.toLowerCase().includes(query);
        const matchesDescription = template.description?.toLowerCase().includes(query);
        const matchesTags = template.tags?.some(tag => tag.toLowerCase().includes(query));
        const matchesTrade = template.trade.toLowerCase().includes(query);
        
        if (!matchesName && !matchesDescription && !matchesTags && !matchesTrade) {
          return false;
        }
      }
      
      return true;
    });
  };

  return {
    templates,
    isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    filterTemplates,
  };
}
