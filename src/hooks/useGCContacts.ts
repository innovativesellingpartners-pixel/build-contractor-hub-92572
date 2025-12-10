import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface GCContact {
  id: string;
  user_id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export function useGCContacts() {
  const { user } = useAuth();
  const [gcContacts, setGCContacts] = useState<GCContact[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGCContacts = async () => {
    if (!user?.id) {
      setGCContacts([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('gc_contacts')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setGCContacts(data || []);
    } catch (error: any) {
      console.error('Error fetching GC contacts:', error);
      toast.error('Failed to load GC contacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGCContacts();
  }, [user?.id]);

  const addGCContact = async (gcData: Omit<GCContact, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user?.id) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('gc_contacts')
      .insert([{ ...gcData, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;
    
    setGCContacts(prev => [...prev, data]);
    return data;
  };

  const updateGCContact = async (id: string, updates: Partial<GCContact>) => {
    const { data, error } = await supabase
      .from('gc_contacts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    setGCContacts(prev => prev.map(gc => gc.id === id ? data : gc));
    return data;
  };

  const deleteGCContact = async (id: string) => {
    const { error } = await supabase
      .from('gc_contacts')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    setGCContacts(prev => prev.filter(gc => gc.id !== id));
  };

  return {
    gcContacts,
    loading,
    addGCContact,
    updateGCContact,
    deleteGCContact,
    refreshGCContacts: fetchGCContacts,
  };
}
