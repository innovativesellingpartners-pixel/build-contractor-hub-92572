import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowRightLeft, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  recordType: 'lead' | 'customer' | 'job' | 'estimate' | 'invoice';
  recordId: string;
}

export const RecordAssignmentHistory = ({ recordType, recordId }: Props) => {
  const { isAdmin } = useAdminAuth();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['recordAssignmentHistory', recordType, recordId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assignment_audit_log')
        .select('*')
        .eq('record_type', recordType)
        .eq('record_id', recordId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const { data: profileMap = {} } = useQuery({
    queryKey: ['auditProfileMapMini'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, company_name, contact_name');
      if (error) throw error;
      const map: Record<string, string> = {};
      (data || []).forEach(p => {
        map[p.id] = p.company_name || p.contact_name || p.id.slice(0, 8);
      });
      return map;
    },
    enabled: isAdmin,
  });

  if (!isAdmin) return null;

  const resolveName = (uid: string | null) => {
    if (!uid) return 'System';
    return profileMap[uid] || uid.slice(0, 8);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading assignment history...
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-muted-foreground">
        <ArrowRightLeft className="h-5 w-5 mx-auto mb-2 opacity-30" />
        No assignment changes recorded for this {recordType}.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
        <ArrowRightLeft className="h-4 w-4" />
        Assignment History
        <Badge variant="secondary" className="text-xs">{entries.length}</Badge>
      </h4>
      <div className="space-y-2">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 text-sm"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-muted-foreground">{resolveName(entry.assigned_from as string)}</span>
                <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="font-medium">{resolveName(entry.assigned_to as string)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                by {resolveName(entry.assigned_by as string)} · {format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
