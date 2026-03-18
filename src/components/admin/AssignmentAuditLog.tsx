import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, ArrowRightLeft, Filter, BarChart3, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const RECORD_TYPES = ['all', 'lead', 'customer', 'job', 'estimate', 'invoice'] as const;
const PAGE_SIZE = 25;

const recordTypeBadge: Record<string, { label: string; className: string }> = {
  lead: { label: 'Lead', className: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-300' },
  customer: { label: 'Customer', className: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-300' },
  job: { label: 'Job', className: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-300' },
  estimate: { label: 'Estimate', className: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-300' },
  invoice: { label: 'Invoice', className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300' },
};

interface AuditEntry {
  id: string;
  record_type: string;
  record_id: string;
  record_name: string | null;
  assigned_by: string | null;
  assigned_from: string | null;
  assigned_to: string;
  notes: string | null;
  created_at: string;
}

interface ProfileMap {
  [id: string]: { company_name: string | null; contact_name: string | null; contractor_number?: string | null };
}

export const AssignmentAuditLog = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(0);

  // Fetch audit log entries
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['assignmentAuditLog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assignment_audit_log')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as AuditEntry[];
    },
  });

  // Fetch all profiles for name resolution
  const { data: profileMap = {} } = useQuery({
    queryKey: ['auditProfileMap'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, company_name, contact_name');
      if (error) throw error;
      const map: ProfileMap = {};
      (data || []).forEach(p => { map[p.id] = p; });
      return map;
    },
  });

  // Also get contractors table for contractor_number
  const { data: contractorMap = {} } = useQuery({
    queryKey: ['auditContractorMap'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contractors')
        .select('id, business_name, contractor_number');
      if (error) throw error;
      const map: Record<string, { business_name: string; contractor_number: string | null }> = {};
      (data || []).forEach(c => { map[c.id] = c; });
      return map;
    },
  });

  const resolveUser = (uid: string | null) => {
    if (!uid) return 'System';
    const p = profileMap[uid];
    const c = contractorMap[uid];
    const name = p?.company_name || p?.contact_name || c?.business_name || uid.slice(0, 8);
    const num = c?.contractor_number;
    return num ? `${name} (${num})` : name;
  };

  const filtered = entries.filter(e => {
    if (typeFilter !== 'all' && e.record_type !== typeFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const byName = resolveUser(e.assigned_by).toLowerCase();
      const toName = resolveUser(e.assigned_to).toLowerCase();
      const fromName = resolveUser(e.assigned_from).toLowerCase();
      return (
        e.record_name?.toLowerCase().includes(q) ||
        byName.includes(q) ||
        toName.includes(q) ||
        fromName.includes(q) ||
        e.record_type.includes(q)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Stats
  const statsByContractor = entries.reduce<Record<string, Record<string, number>>>((acc, e) => {
    const key = e.assigned_to;
    if (!acc[key]) acc[key] = { lead: 0, customer: 0, job: 0, estimate: 0, invoice: 0, total: 0 };
    acc[key][e.record_type] = (acc[key][e.record_type] || 0) + 1;
    acc[key].total = (acc[key].total || 0) + 1;
    return acc;
  }, {});

  const leaderboard = Object.entries(statsByContractor)
    .map(([uid, stats]) => ({ uid, name: resolveUser(uid), lead: stats.lead || 0, job: stats.job || 0, estimate: stats.estimate || 0, invoice: stats.invoice || 0, customer: stats.customer || 0, total: stats.total || 0 }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ArrowRightLeft className="h-6 w-6 text-primary" />
          Assignment History
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track all lead, job, estimate, invoice, and customer assignments across the platform.
        </p>
      </div>

      <Tabs defaultValue="log">
        <TabsList>
          <TabsTrigger value="log" className="gap-1.5"><Filter className="h-4 w-4" /> Audit Log</TabsTrigger>
          <TabsTrigger value="stats" className="gap-1.5"><BarChart3 className="h-4 w-4" /> Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="log" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4 flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                  placeholder="Search by record, contractor, or user..."
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(0); }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECORD_TYPES.map(t => (
                    <SelectItem key={t} value={t}>
                      {t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1) + 's'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : paged.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ArrowRightLeft className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No assignment records found</p>
                  <p className="text-sm">Assignment changes will appear here automatically.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Record</TableHead>
                      <TableHead>Assigned By</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map((entry) => {
                      const badge = recordTypeBadge[entry.record_type];
                      return (
                        <TableRow key={entry.id}>
                          <TableCell className="whitespace-nowrap text-sm">
                            {format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}
                          </TableCell>
                          <TableCell>
                            {badge && (
                              <Badge variant="outline" className={cn('text-xs font-medium', badge.className)}>
                                {badge.label}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-medium text-sm max-w-[200px] truncate">
                            {entry.record_name || entry.record_id.slice(0, 8)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {resolveUser(entry.assigned_by)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {resolveUser(entry.assigned_from)}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {resolveUser(entry.assigned_to)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Assignments by Contractor
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {leaderboard.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No assignment data yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">#</TableHead>
                      <TableHead>Contractor</TableHead>
                      <TableHead className="text-center">Leads</TableHead>
                      <TableHead className="text-center">Jobs</TableHead>
                      <TableHead className="text-center">Estimates</TableHead>
                      <TableHead className="text-center">Invoices</TableHead>
                      <TableHead className="text-center">Customers</TableHead>
                      <TableHead className="text-center font-bold">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.map((row, i) => (
                      <TableRow key={row.uid}>
                        <TableCell className="font-bold text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell className="text-center">{row.lead || 0}</TableCell>
                        <TableCell className="text-center">{row.job || 0}</TableCell>
                        <TableCell className="text-center">{row.estimate || 0}</TableCell>
                        <TableCell className="text-center">{row.invoice || 0}</TableCell>
                        <TableCell className="text-center">{row.customer || 0}</TableCell>
                        <TableCell className="text-center font-bold">{row.total || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
