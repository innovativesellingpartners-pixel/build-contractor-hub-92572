/**
 * QBSyncLog — Audit trail of QB sync activity showing what was fetched and when.
 */
import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Activity, CheckCircle, XCircle, Clock, RefreshCw, Loader2,
  FileText, Receipt, Users, Store, BarChart3, CreditCard,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface SyncLogEntry {
  id: string;
  source: string;
  icon: any;
  status: 'success' | 'error' | 'pending';
  recordCount: number | null;
  syncedAt: Date;
  duration?: number;
  error?: string;
}

const DATA_SOURCES = [
  { key: 'pnl', label: 'Profit & Loss', icon: BarChart3 },
  { key: 'balance-sheet', label: 'Balance Sheet', icon: FileText },
  { key: 'customers', label: 'Customers', icon: Users },
  { key: 'vendors', label: 'Vendors', icon: Store },
  { key: 'payments', label: 'Payments', icon: CreditCard },
  { key: 'expenses', label: 'Expenses', icon: Receipt },
  { key: 'bills', label: 'Bills', icon: FileText },
  { key: 'accounts', label: 'Chart of Accounts', icon: FileText },
];

export function QBSyncLog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);

  // Build a log from query cache metadata + profile last_sync
  const { data: syncData, isLoading } = useQuery({
    queryKey: ['qb-sync-log', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('qb_realm_id, qb_last_sync_at')
        .eq('id', user.id)
        .maybeSingle();

      const { data: conn } = await supabase
        .from('quickbooks_connections')
        .select('realm_id, created_at, updated_at')
        .eq('user_id', user.id)
        .maybeSingle();

      return {
        connected: !!(profile?.qb_realm_id || conn?.realm_id),
        lastSync: profile?.qb_last_sync_at || conn?.updated_at,
        connectedSince: conn?.created_at,
      };
    },
    enabled: !!user?.id,
  });

  // Build log entries from cached query data
  const logEntries = useMemo<SyncLogEntry[]>(() => {
    if (!syncData?.connected) return [];

    const now = new Date();
    const lastSync = syncData.lastSync ? new Date(syncData.lastSync) : null;

    return DATA_SOURCES.map((source, i) => {
      // Check if we have cached data for this source
      const queryState = queryClient.getQueryState(['qb', source.key, user?.id]);
      const hasData = queryState?.status === 'success';
      const hasError = queryState?.status === 'error';
      const fetchedAt = queryState?.dataUpdatedAt ? new Date(queryState.dataUpdatedAt) : lastSync;

      // Estimate record count from cached data
      let recordCount: number | null = null;
      if (hasData && queryState?.data) {
        const d = queryState.data as any;
        if (Array.isArray(d)) recordCount = d.length;
        else if (d?.rows) recordCount = d.rows.length;
      }

      return {
        id: source.key,
        source: source.label,
        icon: source.icon,
        status: hasError ? 'error' as const : hasData ? 'success' as const : 'pending' as const,
        recordCount,
        syncedAt: fetchedAt || now,
        error: hasError ? 'Failed to fetch data' : undefined,
      };
    });
  }, [syncData, queryClient, user?.id]);

  const handleFullSync = async () => {
    setSyncing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['qb'] });
      toast.success('Full sync triggered — all data sources refreshing');
    } catch {
      toast.error('Sync failed');
    } finally {
      setTimeout(() => setSyncing(false), 3000);
    }
  };

  if (isLoading) return <Skeleton className="h-[300px] w-full" />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-primary" />
            <div>
              <h3 className="text-sm font-semibold">Sync Activity Log</h3>
              <p className="text-xs text-muted-foreground">
                {syncData?.lastSync
                  ? `Last synced ${formatDistanceToNow(new Date(syncData.lastSync), { addSuffix: true })}`
                  : 'No sync activity yet'}
              </p>
            </div>
          </div>
          <Button size="sm" onClick={handleFullSync} disabled={syncing}>
            {syncing ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1.5" />}
            {syncing ? 'Syncing...' : 'Full Sync'}
          </Button>
        </div>
      </Card>

      {/* Sync log table */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Data Source Status</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Data Source</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs text-right">Records</TableHead>
                <TableHead className="text-xs">Last Fetched</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logEntries.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell className="text-xs font-medium">
                    <div className="flex items-center gap-2">
                      <entry.icon className="h-3.5 w-3.5 text-muted-foreground" />
                      {entry.source}
                    </div>
                  </TableCell>
                  <TableCell>
                    {entry.status === 'success' && (
                      <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-600 border-green-600/20">
                        <CheckCircle className="h-3 w-3 mr-1" /> Synced
                      </Badge>
                    )}
                    {entry.status === 'error' && (
                      <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-600 border-red-600/20">
                        <XCircle className="h-3 w-3 mr-1" /> Error
                      </Badge>
                    )}
                    {entry.status === 'pending' && (
                      <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" /> Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-right tabular-nums">
                    {entry.recordCount !== null ? entry.recordCount : '—'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {entry.syncedAt ? formatDistanceToNow(entry.syncedAt, { addSuffix: true }) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Connection info */}
      {syncData?.connectedSince && (
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">
            Connected since {format(new Date(syncData.connectedSince), 'MMMM d, yyyy')}
          </p>
        </Card>
      )}
    </div>
  );
}
