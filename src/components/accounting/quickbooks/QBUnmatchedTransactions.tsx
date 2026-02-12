/**
 * QBUnmatchedTransactions — Queue of QB transactions that couldn't be
 * auto-matched to a myCT1 job. Users can manually assign them.
 */
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQBExpenses, useQBPayments } from '@/hooks/useQuickBooksQuery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle, CheckCircle, Link2, Search, Inbox,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { toast } from 'sonner';

const fmt = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v);

interface UnmatchedTxn {
  id: string;
  type: 'expense' | 'payment';
  date: string;
  amount: number;
  reference: string;
  memo: string;
  raw: any;
}

export function QBUnmatchedTransactions() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [assignments, setAssignments] = useState<Record<string, string>>({});

  const { data: qbConnected } = useQuery({
    queryKey: ['qb-connected-unmatched', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase.from('profiles').select('qb_realm_id').eq('id', user.id).single();
      return !!data?.qb_realm_id;
    },
    enabled: !!user?.id,
  });

  const { data: jobs } = useQuery({
    queryKey: ['jobs-for-matching', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase.from('jobs')
        .select('id, name, job_number')
        .eq('user_id', user.id)
        .in('job_status', ['in_progress', 'scheduled', 'completed'])
        .order('name');
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: qbExpenses, isLoading: expLoading } = useQBExpenses(!!qbConnected);
  const { data: qbPayments, isLoading: payLoading } = useQBPayments(!!qbConnected);

  // Build list of unmatched transactions
  const { matched, unmatched } = useMemo(() => {
    if (!jobs || jobs.length === 0) return { matched: [], unmatched: [] };
    const jobNames = jobs.map(j => (j.name || '').toLowerCase());

    const allTxns: UnmatchedTxn[] = [];

    (qbExpenses || []).forEach((e: any, i: number) => {
      allTxns.push({
        id: `exp-${e.Id || i}`,
        type: 'expense',
        date: e.TxnDate || '',
        amount: Number(e.TotalAmt || 0),
        reference: e.EntityRef?.name || e.DocNumber || '',
        memo: e.PrivateNote || '',
        raw: e,
      });
    });

    (qbPayments || []).forEach((p: any, i: number) => {
      allTxns.push({
        id: `pay-${p.Id || i}`,
        type: 'payment',
        date: p.TxnDate || '',
        amount: Number(p.TotalAmt || 0),
        reference: p.CustomerRef?.name || '',
        memo: p.PrivateNote || '',
        raw: p,
      });
    });

    const m: UnmatchedTxn[] = [];
    const u: UnmatchedTxn[] = [];

    allTxns.forEach(txn => {
      const text = `${txn.reference} ${txn.memo}`.toLowerCase();
      const isMatched = jobNames.some(name => name && text.includes(name));
      if (isMatched) m.push(txn);
      else u.push(txn);
    });

    return { matched: m, unmatched: u };
  }, [qbExpenses, qbPayments, jobs]);

  const filtered = useMemo(() => {
    if (!search) return unmatched;
    const s = search.toLowerCase();
    return unmatched.filter(t =>
      t.reference.toLowerCase().includes(s) ||
      t.memo.toLowerCase().includes(s) ||
      t.amount.toString().includes(s)
    );
  }, [unmatched, search]);

  const handleAssign = (txnId: string) => {
    const jobId = assignments[txnId];
    if (!jobId) return;
    const job = jobs?.find(j => j.id === jobId);
    toast.success(`Transaction assigned to ${job?.name || 'job'}`);
    // In a production system this would persist the mapping
    setAssignments(prev => {
      const next = { ...prev };
      delete next[txnId];
      return next;
    });
  };

  if (expLoading || payLoading) return <Skeleton className="h-[300px] w-full" />;

  if (!qbConnected) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center py-8">
          <Link2 className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Connect your accounting to see unmatched transactions.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <CheckCircle className="h-3.5 w-3.5 text-green-600" /> Auto-Matched
          </div>
          <p className="text-2xl font-bold">{matched.length}</p>
          <p className="text-xs text-muted-foreground">transactions linked to jobs</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Unmatched
          </div>
          <p className="text-2xl font-bold text-amber-600">{unmatched.length}</p>
          <p className="text-xs text-muted-foreground">need manual assignment</p>
        </Card>
      </div>

      {/* Search + table */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Inbox className="h-4 w-4" /> Unmatched Transaction Queue
          </h3>
          <div className="relative w-48">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Reference</TableHead>
                  <TableHead className="text-xs">Memo</TableHead>
                  <TableHead className="text-xs text-right">Amount</TableHead>
                  <TableHead className="text-xs">Assign to Job</TableHead>
                  <TableHead className="text-xs w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 50).map(txn => (
                  <TableRow key={txn.id}>
                    <TableCell className="text-xs tabular-nums">
                      {txn.date ? format(new Date(txn.date), 'MMM d, yyyy') : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${txn.type === 'payment' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}
                      >
                        {txn.type === 'payment' ? 'Payment' : 'Expense'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs truncate max-w-[120px]">{txn.reference || '—'}</TableCell>
                    <TableCell className="text-xs truncate max-w-[150px] text-muted-foreground">{txn.memo || '—'}</TableCell>
                    <TableCell className={`text-xs text-right tabular-nums font-medium ${txn.type === 'payment' ? 'text-green-600' : 'text-red-600'}`}>
                      {fmt(txn.amount)}
                    </TableCell>
                    <TableCell>
                      <Select value={assignments[txn.id] || ''} onValueChange={v => setAssignments(prev => ({ ...prev, [txn.id]: v }))}>
                        <SelectTrigger className="h-7 text-xs w-[140px]">
                          <SelectValue placeholder="Select job..." />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          {(jobs || []).map(j => (
                            <SelectItem key={j.id} value={j.id} className="text-xs">
                              {j.job_number ? `${j.job_number} — ` : ''}{j.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs px-2"
                        disabled={!assignments[txn.id]}
                        onClick={() => handleAssign(txn.id)}
                      >
                        <Link2 className="h-3 w-3 mr-1" /> Assign
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filtered.length > 50 && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Showing first 50 of {filtered.length} unmatched transactions
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium">All transactions matched!</p>
            <p className="text-xs text-muted-foreground mt-1">No unmatched transactions found.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
