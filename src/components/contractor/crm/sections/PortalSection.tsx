import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink, Link2, MessageSquare, RefreshCw } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PortalToken {
  id: string;
  token: string;
  is_active: boolean;
  created_at: string;
  last_accessed_at: string | null;
  job_id: string;
  customer_id: string | null;
  label: string | null;
  jobs: {
    id: string;
    title: string;
    status: string;
  } | null;
  customers: {
    id: string;
    name: string;
  } | null;
}

interface UnreadCount {
  job_id: string;
  count: number;
}

export default function PortalSection() {
  const [tokens, setTokens] = useState<PortalToken[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  const fetchTokens = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('customer_portal_tokens')
        .select('*, jobs(id, title, status), customers(id, name)')
        .eq('contractor_id', user.id)
        .order('created_at', { ascending: false }) as { data: any[] | null; error: any };

      if (error) throw error;
      setTokens(data || []);

      // Fetch unread message counts
      const msgResult = await (supabase as any)
        .from('portal_messages')
        .select('job_id')
        .eq('contractor_id', user.id)
        .eq('sender_type', 'customer')
        .eq('is_read', false);
      const messages = msgResult.data;
      const msgError = msgResult.error;

      if (!msgError && messages) {
        const counts: Record<string, number> = {};
        messages.forEach((m: any) => {
          counts[m.job_id] = (counts[m.job_id] || 0) + 1;
        });
        setUnreadCounts(counts);
      }
    } catch (err) {
      console.error('Error fetching portal tokens:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, []);

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/portal/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Customer portal link copied to clipboard');
  };

  const openPortal = (token: string) => {
    window.open(`${window.location.origin}/portal/${token}`, '_blank');
  };

  const activeTokens = tokens.filter(t => t.is_active);
  const inactiveTokens = tokens.filter(t => !t.is_active);
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <h1 className="text-2xl font-bold">Customer Portal</h1>
        <div className="flex items-center justify-center py-12 text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 w-full sm:max-w-7xl sm:mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Customer Portal</h1>
          <p className="text-sm text-muted-foreground">
            Manage portal access links for your customers
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchTokens} className="gap-1.5">
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className={cn("grid gap-3", isMobile ? "grid-cols-2" : "grid-cols-3")}>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold tabular-nums">{activeTokens.length}</p>
            <p className="text-xs text-muted-foreground">Active Links</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold tabular-nums">{totalUnread}</p>
            <p className="text-xs text-muted-foreground">Unread Messages</p>
          </CardContent>
        </Card>
        {!isMobile && (
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold tabular-nums">{inactiveTokens.length}</p>
              <p className="text-xs text-muted-foreground">Revoked Links</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Active Customer Portals */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Active Customer Portals</h2>
        {activeTokens.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <Link2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No active customer portals yet.</p>
              <p className="text-xs mt-1">Generate customer portals from the job detail view.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {activeTokens.map((token) => (
              <Card key={token.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{token.jobs?.title || 'Unknown Job'}</p>
                        {unreadCounts[token.job_id] > 0 && (
                          <Badge variant="destructive" className="text-xs gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {unreadCounts[token.job_id]}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {token.customers?.name || 'No customer linked'}
                      </p>
                      {token.last_accessed_at && (
                        <p className="text-xs text-muted-foreground">
                          Last accessed: {new Date(token.last_accessed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => copyLink(token.token)} title="Copy link">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openPortal(token.token)} title="Open portal">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Revoked Links */}
      {inactiveTokens.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-muted-foreground">Revoked Links</h2>
          <div className="space-y-2 opacity-60">
            {inactiveTokens.map((token) => (
              <Card key={token.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{token.jobs?.title || 'Unknown Job'}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {token.customers?.name || 'No customer linked'}
                      </p>
                    </div>
                    <Badge variant="outline">Revoked</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
