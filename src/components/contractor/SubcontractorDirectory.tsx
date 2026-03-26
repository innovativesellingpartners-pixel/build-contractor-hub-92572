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
import {
  Search, Plus, Star, AlertTriangle, Phone, Mail, Edit, Trash2, Building2, FileText,
} from 'lucide-react';
import { useSubcontractors, Subcontractor } from '@/hooks/useSubcontractors';
import { format } from 'date-fns';

const TRADES = [
  'Electrical', 'Plumbing', 'HVAC', 'Roofing', 'Concrete', 'Framing',
  'Drywall', 'Painting', 'Flooring', 'Landscaping', 'Demolition',
  'Insulation', 'Masonry', 'Welding', 'Excavation', 'Other',
];

export default function SubcontractorDirectory() {
  const { subcontractors, isLoading, createSub, updateSub, deleteSub, expiringInsurance } = useSubcontractors();
  const [search, setSearch] = useState('');
  const [tradeFilter, setTradeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subcontractor | null>(null);

  // Form state
  const [form, setForm] = useState({
    company_name: '', contact_name: '', email: '', phone: '',
    trade: '', license_number: '', insurance_expiry: '',
    rating: 0, notes: '', status: 'active',
  });

  const resetForm = () => {
    setForm({
      company_name: '', contact_name: '', email: '', phone: '',
      trade: '', license_number: '', insurance_expiry: '',
      rating: 0, notes: '', status: 'active',
    });
    setEditingSub(null);
  };

  const openAdd = () => { resetForm(); setDialogOpen(true); };
  const openEdit = (sub: Subcontractor) => {
    setEditingSub(sub);
    setForm({
      company_name: sub.company_name,
      contact_name: sub.contact_name || '',
      email: sub.email || '',
      phone: sub.phone || '',
      trade: sub.trade || '',
      license_number: sub.license_number || '',
      insurance_expiry: sub.insurance_expiry || '',
      rating: sub.rating || 0,
      notes: sub.notes || '',
      status: sub.status || 'active',
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.company_name.trim()) return;
    const payload = {
      ...form,
      rating: Number(form.rating) || 0,
      insurance_expiry: form.insurance_expiry || null,
      documents: editingSub?.documents || [],
    } as any;

    if (editingSub) {
      updateSub({ id: editingSub.id, ...payload });
    } else {
      createSub(payload);
    }
    setDialogOpen(false);
    resetForm();
  };

  const filtered = useMemo(() => {
    return subcontractors.filter(s => {
      if (search) {
        const q = search.toLowerCase();
        if (!s.company_name.toLowerCase().includes(q) &&
            !(s.contact_name || '').toLowerCase().includes(q) &&
            !(s.trade || '').toLowerCase().includes(q)) return false;
      }
      if (tradeFilter !== 'all' && s.trade !== tradeFilter) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      return true;
    });
  }, [subcontractors, search, tradeFilter, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-500/10 text-green-600 border-green-600/20">Active</Badge>;
      case 'inactive': return <Badge variant="secondary">Inactive</Badge>;
      case 'blacklisted': return <Badge variant="destructive">Blacklisted</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderStars = (rating: number, interactive = false, onChange?: (r: number) => void) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-4 h-4 ${i <= rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground/30'} ${interactive ? 'cursor-pointer' : ''}`}
          onClick={() => interactive && onChange?.(i)}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Insurance Expiry Alerts */}
      {expiringInsurance.length > 0 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <p className="text-sm font-medium">
                {expiringInsurance.length} sub{expiringInsurance.length > 1 ? 's have' : ' has'} insurance expiring within 30 days
              </p>
            </div>
            <div className="mt-2 space-y-1">
              {expiringInsurance.map(s => (
                <p key={s.id} className="text-xs text-muted-foreground ml-6">
                  {s.company_name} — expires {s.insurance_expiry ? format(new Date(s.insurance_expiry), 'MMM d, yyyy') : 'N/A'}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search subs..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={tradeFilter} onValueChange={setTradeFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Trade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trades</SelectItem>
              {TRADES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="blacklisted">Blacklisted</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4 mr-1" /> Add Sub
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card><CardContent className="py-3 px-4">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{subcontractors.length}</p>
        </CardContent></Card>
        <Card><CardContent className="py-3 px-4">
          <p className="text-xs text-muted-foreground">Active</p>
          <p className="text-2xl font-bold text-green-600">{subcontractors.filter(s => s.status === 'active').length}</p>
        </CardContent></Card>
        <Card><CardContent className="py-3 px-4">
          <p className="text-xs text-muted-foreground">Avg Rating</p>
          <p className="text-2xl font-bold">
            {subcontractors.length > 0 ? (subcontractors.reduce((s, sub) => s + Number(sub.rating), 0) / subcontractors.length).toFixed(1) : '—'}
          </p>
        </CardContent></Card>
        <Card><CardContent className="py-3 px-4">
          <p className="text-xs text-muted-foreground">Expiring Insurance</p>
          <p className={`text-2xl font-bold ${expiringInsurance.length > 0 ? 'text-yellow-600' : ''}`}>{expiringInsurance.length}</p>
        </CardContent></Card>
      </div>

      {/* Subcontractors Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {subcontractors.length === 0 ? 'No subcontractors yet. Add your first one!' : 'No subs match your filters'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Trade</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Insurance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(sub => {
                    const insuranceExpired = sub.insurance_expiry && new Date(sub.insurance_expiry) < new Date();
                    return (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{sub.company_name}</p>
                            {sub.license_number && <p className="text-xs text-muted-foreground">Lic: {sub.license_number}</p>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            {sub.contact_name && <p className="text-sm">{sub.contact_name}</p>}
                            {sub.phone && (
                              <a href={`tel:${sub.phone}`} className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary">
                                <Phone className="w-3 h-3" /> {sub.phone}
                              </a>
                            )}
                            {sub.email && (
                              <a href={`mailto:${sub.email}`} className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary">
                                <Mail className="w-3 h-3" /> {sub.email}
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{sub.trade || '—'}</Badge></TableCell>
                        <TableCell>{renderStars(Number(sub.rating))}</TableCell>
                        <TableCell>
                          {sub.insurance_expiry ? (
                            <span className={`text-sm ${insuranceExpired ? 'text-red-600 font-medium' : ''}`}>
                              {format(new Date(sub.insurance_expiry), 'MMM d, yyyy')}
                              {insuranceExpired && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                            </span>
                          ) : <span className="text-xs text-muted-foreground">Not set</span>}
                        </TableCell>
                        <TableCell>{getStatusBadge(sub.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(sub)}>
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteSub(sub.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {editingSub ? 'Edit Subcontractor' : 'Add Subcontractor'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Company Name *</Label>
                <Input value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} />
              </div>
              <div>
                <Label>Contact Name</Label>
                <Input value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} />
              </div>
              <div>
                <Label>Trade</Label>
                <Select value={form.trade} onValueChange={v => setForm({ ...form, trade: v })}>
                  <SelectTrigger><SelectValue placeholder="Select trade" /></SelectTrigger>
                  <SelectContent>
                    {TRADES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <Label>License Number</Label>
                <Input value={form.license_number} onChange={e => setForm({ ...form, license_number: e.target.value })} />
              </div>
              <div>
                <Label>Insurance Expiry</Label>
                <Input type="date" value={form.insurance_expiry} onChange={e => setForm({ ...form, insurance_expiry: e.target.value })} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="blacklisted">Blacklisted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Rating</Label>
                <div className="pt-1">
                  {renderStars(form.rating, true, (r) => setForm({ ...form, rating: r }))}
                </div>
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.company_name.trim()}>
              {editingSub ? 'Update' : 'Add'} Subcontractor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
