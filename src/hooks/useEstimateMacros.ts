import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface LineItemMacro {
  id: string;
  item_code_template: string | null;
  description_template: string;
  default_quantity: number;
  default_unit: string;
  default_unit_price: number;
  order_index: number;
}

export interface MacroGroup {
  id: string;
  contractor_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  line_items?: LineItemMacro[];
}

export interface TextMacro {
  id: string;
  contractor_id: string;
  name: string;
  category: string;
  body_text: string;
  is_active: boolean;
  created_at: string;
}

export const useEstimateMacros = () => {
  const { user } = useAuth();
  const [macroGroups, setMacroGroups] = useState<MacroGroup[]>([]);
  const [textMacros, setTextMacros] = useState<TextMacro[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMacroGroups = async () => {
    if (!user) return;
    
    try {
      const { data: groups, error: groupsError } = await supabase
        .from('estimate_line_item_macro_groups' as any)
        .select('*')
        .eq('contractor_id', user.id)
        .eq('is_active', true)
        .order('name');

      if (groupsError) throw groupsError;

      // Fetch line items for each group
      const groupsWithItems = await Promise.all(
        (groups || []).map(async (group: any) => {
          const { data: items } = await supabase
            .from('estimate_line_item_macros' as any)
            .select('*')
            .eq('macro_group_id', group.id)
            .order('order_index');
          
          return { ...group, line_items: items || [] };
        })
      );

      setMacroGroups(groupsWithItems as MacroGroup[]);
    } catch (error) {
      console.error('Error fetching macro groups:', error);
    }
  };

  const fetchTextMacros = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('estimate_text_macros' as any)
        .select('*')
        .eq('contractor_id', user.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setTextMacros((data || []) as unknown as TextMacro[]);
    } catch (error) {
      console.error('Error fetching text macros:', error);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      await Promise.all([fetchMacroGroups(), fetchTextMacros()]);
      setLoading(false);
    };
    fetchAll();
  }, [user]);

  const createMacroGroup = async (name: string, description?: string) => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('estimate_line_item_macro_groups' as any)
        .insert({
          contractor_id: user.id,
          name,
          description,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      toast.success('Macro group created');
      await fetchMacroGroups();
      return data;
    } catch (error: any) {
      toast.error('Failed to create macro group');
      return null;
    }
  };

  const addLineItemToGroup = async (
    macroGroupId: string,
    item: Omit<LineItemMacro, 'id' | 'order_index'>
  ) => {
    try {
      const { error } = await supabase
        .from('estimate_line_item_macros' as any)
        .insert({
          macro_group_id: macroGroupId,
          item_code_template: item.item_code_template,
          description_template: item.description_template,
          default_quantity: item.default_quantity,
          default_unit: item.default_unit,
          default_unit_price: item.default_unit_price
        });

      if (error) throw error;
      await fetchMacroGroups();
    } catch (error) {
      toast.error('Failed to add line item to macro');
    }
  };

  const createTextMacro = async (
    name: string,
    category: string,
    bodyText: string
  ) => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('estimate_text_macros' as any)
        .insert({
          contractor_id: user.id,
          name,
          category,
          body_text: bodyText,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      toast.success('Text macro created');
      await fetchTextMacros();
      return data;
    } catch (error: any) {
      toast.error('Failed to create text macro');
      return null;
    }
  };

  const deleteMacroGroup = async (id: string) => {
    try {
      const { error } = await supabase
        .from('estimate_line_item_macro_groups' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Macro group deleted');
      await fetchMacroGroups();
    } catch (error) {
      toast.error('Failed to delete macro group');
    }
  };

  const deleteTextMacro = async (id: string) => {
    try {
      const { error } = await supabase
        .from('estimate_text_macros' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Text macro deleted');
      await fetchTextMacros();
    } catch (error) {
      toast.error('Failed to delete text macro');
    }
  };

  const getTextMacrosByCategory = (category: string) => {
    return textMacros.filter(m => m.category === category);
  };

  return {
    macroGroups,
    textMacros,
    loading,
    createMacroGroup,
    addLineItemToGroup,
    createTextMacro,
    deleteMacroGroup,
    deleteTextMacro,
    getTextMacrosByCategory,
    refreshMacros: () => Promise.all([fetchMacroGroups(), fetchTextMacros()])
  };
};
