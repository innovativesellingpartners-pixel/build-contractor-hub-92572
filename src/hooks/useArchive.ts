import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type ArchiveEntityType = 'customers' | 'leads' | 'jobs' | 'estimates';

interface ArchivedItem {
  id: string;
  name: string;
  archived_at: string;
  entity_type: ArchiveEntityType;
  [key: string]: any;
}

export function useArchive() {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const archiveItem = async (entityType: ArchiveEntityType, id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from(entityType)
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Archived',
        description: `Item has been archived successfully`,
      });

      return true;
    } catch (error: any) {
      toast({
        title: 'Error archiving',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const unarchiveItem = async (entityType: ArchiveEntityType, id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from(entityType)
        .update({ archived_at: null })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Restored',
        description: `Item has been restored from archive`,
      });

      return true;
    } catch (error: any) {
      toast({
        title: 'Error restoring',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const fetchArchivedItems = async (entityType: ArchiveEntityType): Promise<ArchivedItem[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(entityType)
        .select('*')
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => ({
        ...item,
        entity_type: entityType,
        name: getItemName(item, entityType),
      }));
    } catch (error: any) {
      console.error('Error fetching archived items:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchAllArchivedItems = async (): Promise<ArchivedItem[]> => {
    setLoading(true);
    try {
      const [customers, leads, jobs, estimates] = await Promise.all([
        fetchArchivedItems('customers'),
        fetchArchivedItems('leads'),
        fetchArchivedItems('jobs'),
        fetchArchivedItems('estimates'),
      ]);

      const allItems = [...customers, ...leads, ...jobs, ...estimates];
      // Sort by archived_at descending
      return allItems.sort((a, b) => 
        new Date(b.archived_at).getTime() - new Date(a.archived_at).getTime()
      );
    } catch (error: any) {
      console.error('Error fetching all archived items:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const permanentlyDelete = async (entityType: ArchiveEntityType, id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from(entityType)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Deleted',
        description: `Item has been permanently deleted`,
      });

      return true;
    } catch (error: any) {
      toast({
        title: 'Error deleting',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    loading,
    archiveItem,
    unarchiveItem,
    fetchArchivedItems,
    fetchAllArchivedItems,
    permanentlyDelete,
  };
}

function getItemName(item: any, entityType: ArchiveEntityType): string {
  switch (entityType) {
    case 'customers':
      return item.name || 'Unknown Customer';
    case 'leads':
      return item.name || 'Unknown Lead';
    case 'jobs':
      return item.name || item.job_number || 'Unknown Job';
    case 'estimates':
      return item.title || item.client_name || 'Unknown Estimate';
    default:
      return 'Unknown';
  }
}
