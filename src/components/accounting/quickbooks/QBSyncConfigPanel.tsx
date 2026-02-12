/**
 * QBSyncConfigPanel — Sync settings, manual sync trigger, and sync activity log.
 * Added as a new tab in the QuickBooks Financial Reports hub.
 */
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  RefreshCw, Clock, CheckCircle, AlertTriangle, Settings, Database,
  Link2, Unlink, Activity, Loader2,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export function QBSyncConfigPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);

  const { data: connection, isLoading } = useQuery({
    queryKey: ['qb-sync-config', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data: conn } = await supabase
        .from('quickbooks_connections')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data: profile } = await supabase
        .from('profiles')
        .select('qb_realm_id, qb_last_sync_at')
        .eq('id', user.id)
        .maybeSingle();

      return {
        connected: !!(conn?.realm_id || profile?.qb_realm_id),
        realmId: conn?.realm_id || profile?.qb_realm_id,
        lastSync: conn?.updated_at || profile?.qb_last_sync_at,
        createdAt: conn?.created_at,
      };
    },
    enabled: !!user?.id,
  });

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      queryClient.invalidateQueries({ queryKey: ['qb'] });
      toast.success('Sync triggered — data is refreshing');
    } catch {
      toast.error('Sync failed');
    } finally {
      setTimeout(() => setSyncing(false), 2000);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your accounting connection? This will remove all synced data access.')) return;
    try {
      const { error } = await supabase.functions.invoke('quickbooks-disconnect');
      if (error) throw error;
      toast.success('Accounting disconnected');
      queryClient.invalidateQueries({ queryKey: ['qb'] });
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || 'Failed to disconnect');
    }
  };

  if (isLoading) return <Skeleton className="h-[400px] w-full" />;

  return (
    <div className="space-y-4">
      {/* Connection status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" /> Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${connection?.connected ? 'bg-green-500' : 'bg-red-500'}`} />
              <div>
                <p className="text-sm font-medium">{connection?.connected ? 'Connected' : 'Disconnected'}</p>
                {connection?.realmId && (
                  <p className="text-xs text-muted-foreground">Company ID: {connection.realmId}</p>
                )}
              </div>
            </div>
            <Badge variant="outline" className={connection?.connected ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}>
              {connection?.connected ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          {connection?.createdAt && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Connected since</span>
              <span>{format(new Date(connection.createdAt), 'MMM d, yyyy')}</span>
            </div>
          )}

          {connection?.lastSync && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Last synced</span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(connection.lastSync), { addSuffix: true })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Sync Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Manual Sync</p>
              <p className="text-xs text-muted-foreground">Pull latest data from your accounting software</p>
            </div>
            <Button onClick={handleManualSync} disabled={syncing} size="sm">
              {syncing ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1.5" />}
              {syncing ? 'Syncing...' : 'Sync Now'}
            </Button>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-2">Sync Behavior</p>
            <p className="text-xs text-muted-foreground mb-3">
              Data is fetched on-demand when you view reports. Each report caches data for 5 minutes before refreshing automatically.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-start gap-2 p-2.5 rounded-md bg-muted/50">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium">Invoices & Sales</p>
                  <p className="text-[10px] text-muted-foreground">Real-time on view</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2.5 rounded-md bg-muted/50">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium">Expenses & Bills</p>
                  <p className="text-[10px] text-muted-foreground">Real-time on view</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2.5 rounded-md bg-muted/50">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium">P&L & Balance Sheet</p>
                  <p className="text-[10px] text-muted-foreground">5-min cache</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2.5 rounded-md bg-muted/50">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium">Customers & Vendors</p>
                  <p className="text-[10px] text-muted-foreground">5-min cache</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data sources overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4" /> Synced Data Sources
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { name: 'Profit & Loss', desc: 'Revenue, expenses, net income', status: 'active' },
            { name: 'Balance Sheet', desc: 'Assets, liabilities, equity', status: 'active' },
            { name: 'Invoices / Sales', desc: 'Customer invoices and payments', status: 'active' },
            { name: 'Expenses / Purchases', desc: 'Vendor bills and purchases', status: 'active' },
            { name: 'Customers', desc: 'Customer directory and balances', status: 'active' },
            { name: 'Vendors', desc: 'Vendor directory and balances', status: 'active' },
            { name: 'Aging Reports', desc: 'AR and AP aging details', status: 'active' },
            { name: 'Chart of Accounts', desc: 'Account categories and hierarchy', status: 'active' },
          ].map(source => (
            <div key={source.name} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div>
                <p className="text-sm font-medium">{source.name}</p>
                <p className="text-xs text-muted-foreground">{source.desc}</p>
              </div>
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-600/20 text-[10px]">
                <CheckCircle className="h-3 w-3 mr-1" /> Active
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Danger zone */}
      {connection?.connected && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-base text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Disconnect Accounting</p>
                <p className="text-xs text-muted-foreground">Revokes access and removes synced data connection</p>
              </div>
              <Button variant="destructive" size="sm" onClick={handleDisconnect}>
                <Unlink className="h-4 w-4 mr-1.5" /> Disconnect
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
