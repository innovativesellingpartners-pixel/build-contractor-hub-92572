import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus, DollarSign, Briefcase, CheckCircle, Clock, Send } from 'lucide-react';
import { useSubAssignments, SubAssignment } from '@/hooks/useSubcontractors';
import { useSubcontractors } from '@/hooks/useSubcontractors';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface SubAssignmentsProps {
  jobId?: string;
}

const STATUS_OPTIONS = [
  { value: 'invited', label: 'Invited', color: 'bg-blue-500/10 text-blue-600 border-blue-600/20' },
  { value: 'accepted', label: 'Accepted', color: 'bg-green-500/10 text-green-600 border-green-600/20' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-600/20' },
  { value: 'completed', label: 'Completed', color: 'bg-purple-500/10 text-purple-600 border-purple-600/20' },
  { value: 'paid', label: 'Paid', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-600/20' },
];

export default function SubAssignments({ jobId }: SubAssignmentsProps) {
  const { assignments, isLoading, totalSubCosts, createAssignment, updateAssignment, deleteAssignment } = useSubAssignments(jobId);
  const { subcontractors } = useSubcontractors();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [compareMode, setCompareMode] = useState(false);

  // Jobs list for assignment dialog
  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs-for-sub-assign'],
    queryFn: async () => {
      const { data } = await supabase
        .from('jobs')
        .select('id, name, job_number')
        .in('job_status', ['in_progress', 'scheduled'])
        .order('name');
      return data || [];
    },
    enabled: !jobId,
  });

  const [form, setForm] = useState({
    subcontractor_id: '', job_id: jobId || '',
    scope_of_work: '', agreed_amount: '',
    start_date: '', end_date: '', notes: '',
  });

  const resetForm = () => setForm({
    subcontractor_id: '', job_id: jobId || '',
    scope_of_work: '', agreed_amount: '',
    start_date: '', end_date: '', notes: '',
  });

  const handleCreate = async () => {
    if (!form.subcontractor_id || (!form.job_id && !jobId)) return;
    
    createAssignment({
      subcontractor_id: form.subcontractor_id,
      job_id: form.job_id || jobId!,
      scope_of_work: form.scope_of_work || null,
      agreed_amount: Number(form.agreed_amount) || 0,
      status: 'invited',
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      notes: form.notes || null,
    });

    // Send email notification
    const sub = subcontractors.find(s => s.id === form.subcontractor_id);
    if (sub?.email) {
      try {
        await supabase.functions.invoke('send-sub-assignment-notification', {
          body: {
            subEmail: sub.email,
            subName: sub.contact_name || sub.company_name,
            jobName: jobs.find(j => j.id === (form.job_id || jobId))?.name || 'Job',
            scopeOfWork: form.scope_of_work,
            agreedAmount: Number(form.agreed_amount) || 0,
            startDate: form.start_date,
          },
        });
      } catch (e) {
        console.error('Failed to send notification:', e);
      }
    }

    setDialogOpen(false);
    resetForm();
  };

  const handleStatusChange = (id: string, status: string) => {
    updateAssignment({ id, status });
  };

  const getStatusBadge = (status: string) => {
    const opt = STATUS_OPTIONS.find(s => s.value === status);
    return <Badge className={opt?.color || ''} variant="outline">{opt?.label || status}</Badge>;
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(v);

  // Group by job for bid comparison
  const assignmentsByJob = useMemo(() => {
    const map = new Map<string, SubAssignment[]>();
    assignments.forEach(a => {
      const key = a.job_id;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    });
    return map;
  }, [assignments]);

  // Jobs with multiple bids
  const comparableJobs = useMemo(() => {
    return Array.from(assignmentsByJob.entries()).filter(([, assigns]) => assigns.length > 1);
  }, [assignmentsByJob]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Sub Assignments</h3>
          <p className="text-sm text-muted-foreground">
            {assignments.length} assignment{assignments.length !== 1 ? 's' : ''} · Total: {formatCurrency(totalSubCosts)}
          </p>
        </div>
        <div className="flex gap-2">
          {comparableJobs.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setCompareMode(!compareMode)}>
              {compareMode ? 'List View' : 'Compare Bids'}
            </Button>
          )}
          <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Assign Sub
          </Button>
        </div>
      </div>

      {/* Bid Comparison Mode */}
      {compareMode && comparableJobs.length > 0 && (
        <div className="space-y-4">
          {comparableJobs.map(([jId, assigns]) => (
            <Card key={jId}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  {assigns[0]?.jobs?.name || 'Job'} — Bid Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subcontractor</TableHead>
                      <TableHead>Scope</TableHead>
                      <TableHead className="text-right">Bid Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assigns.sort((a, b) => Number(a.agreed_amount) - Number(b.agreed_amount)).map(a => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{(a.subcontractors as any)?.company_name || '—'}</TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{a.scope_of_work || '—'}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(Number(a.agreed_amount))}</TableCell>
                        <TableCell>{getStatusBadge(a.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* List View */}
      {!compareMode && (
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : assignments.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No sub assignments yet. Assign a subcontractor to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subcontractor</TableHead>
                      {!jobId && <TableHead>Job</TableHead>}
                      <TableHead>Scope</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[140px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map(a => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{(a.subcontractors as any)?.company_name || '—'}</TableCell>
                        {!jobId && <TableCell className="text-sm">{(a.jobs as any)?.name || '—'}</TableCell>}
                        <TableCell className="text-sm max-w-[200px] truncate">{a.scope_of_work || '—'}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(Number(a.agreed_amount))}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {a.start_date && format(new Date(a.start_date), 'MMM d')}
                          {a.start_date && a.end_date && ' — '}
                          {a.end_date && format(new Date(a.end_date), 'MMM d')}
                        </TableCell>
                        <TableCell>{getStatusBadge(a.status)}</TableCell>
                        <TableCell>
                          <Select value={a.status} onValueChange={v => handleStatusChange(a.id, v)}>
                            <SelectTrigger className="h-7 text-xs w-[110px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map(o => (
                                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Assignment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Subcontractor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Subcontractor *</Label>
              <Select value={form.subcontractor_id} onValueChange={v => setForm({ ...form, subcontractor_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select sub" /></SelectTrigger>
                <SelectContent>
                  {subcontractors.filter(s => s.status === 'active').map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.company_name} {s.trade ? `(${s.trade})` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!jobId && (
              <div>
                <Label>Job *</Label>
                <Select value={form.job_id} onValueChange={v => setForm({ ...form, job_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select job" /></SelectTrigger>
                  <SelectContent>
                    {jobs.map((j: any) => (
                      <SelectItem key={j.id} value={j.id}>{j.name || j.job_number}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Scope of Work</Label>
              <Textarea value={form.scope_of_work} onChange={e => setForm({ ...form, scope_of_work: e.target.value })} rows={3} />
            </div>
            <div>
              <Label>Agreed Amount ($)</Label>
              <Input type="number" value={form.agreed_amount} onChange={e => setForm({ ...form, agreed_amount: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.subcontractor_id || (!form.job_id && !jobId)}>
              <Send className="w-4 h-4 mr-1" /> Assign & Notify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
