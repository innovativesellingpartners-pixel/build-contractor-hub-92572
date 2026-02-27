import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Users, Plus, Pencil, Trash2, UserPlus, ArrowLeft, Search,
  Phone, Mail, Building2, DollarSign, Shield, ChevronRight, UserCheck
} from 'lucide-react';

interface CrewsProps {
  onSectionChange?: (section: string) => void;
}

interface CrewMember {
  id: string;
  user_id: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  role: string;
  hourly_rate: number | null;
  skills_trades: string[] | null;
  notes: string | null;
  is_active: boolean;
  contact_info: any;
}

interface Crew {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  lead_crew_member_id: string | null;
  color: string | null;
  is_active: boolean;
}

interface CrewMembership {
  id: string;
  crew_id: string;
  crew_member_id: string;
}

// ===================== MEMBER FORM =====================
function MemberFormDialog({
  member,
  open,
  onOpenChange,
}: {
  member?: CrewMember | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    first_name: member?.first_name || '',
    last_name: member?.last_name || '',
    email: member?.email || '',
    phone: member?.phone || '',
    company: member?.company || '',
    role: member?.role || 'field_crew_member',
    hourly_rate: member?.hourly_rate?.toString() || '',
    skills_trades: member?.skills_trades?.join(', ') || '',
    notes: member?.notes || '',
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const fullName = [form.first_name.trim(), form.last_name.trim()].filter(Boolean).join(' ') || 'Unnamed';
      const role = form.role as 'field_crew_member' | 'office' | 'dispatcher' | 'customer';
      const payload = {
        user_id: user!.id,
        name: fullName,
        first_name: form.first_name.trim() || null,
        last_name: form.last_name.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        company: form.company.trim() || null,
        role,
        hourly_rate: form.hourly_rate ? parseFloat(form.hourly_rate) : null,
        skills_trades: form.skills_trades ? form.skills_trades.split(',').map(s => s.trim()).filter(Boolean) : null,
        notes: form.notes.trim() || null,
        contact_info: {
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
        },
      };

      if (member) {
        const { error } = await supabase.from('crew_members').update(payload).eq('id', member.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('crew_members').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-crew-members'] });
      toast.success(member ? 'Member updated' : 'Member added');
      onOpenChange(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{member ? 'Edit Crew Member' : 'Add Crew Member'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>First Name *</Label>
              <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            </div>
            <div>
              <Label>Last Name *</Label>
              <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Company</Label>
              <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="field_crew_member">Field Crew</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
                  <SelectItem value="dispatcher">Dispatcher</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Hourly Rate ($)</Label>
              <Input type="number" step="0.01" value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })} />
            </div>
            <div>
              <Label>Skills / Trades</Label>
              <Input value={form.skills_trades} onChange={(e) => setForm({ ...form, skills_trades: e.target.value })} placeholder="Comma separated" />
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button
            onClick={() => mutation.mutate()}
            disabled={(!form.first_name.trim() && !form.last_name.trim()) || mutation.isPending}
          >
            {mutation.isPending ? 'Saving...' : member ? 'Update' : 'Add Member'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===================== CREW FORM =====================
function CrewFormDialog({
  crew,
  members,
  memberships,
  open,
  onOpenChange,
}: {
  crew?: Crew | null;
  members: CrewMember[];
  memberships: CrewMembership[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: crew?.name || '',
    description: crew?.description || '',
    lead_crew_member_id: crew?.lead_crew_member_id || '',
    color: crew?.color || '',
  });

  const crewMemberIds = memberships
    .filter((m) => crew && m.crew_id === crew.id)
    .map((m) => m.crew_member_id);
  const [selectedMembers, setSelectedMembers] = useState<string[]>(crewMemberIds);

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const mutation = useMutation({
    mutationFn: async () => {
      let crewId = crew?.id;

      if (crew) {
        const { error } = await supabase.from('crews').update({
          name: form.name.trim(),
          description: form.description.trim() || null,
          lead_crew_member_id: form.lead_crew_member_id || null,
          color: form.color.trim() || null,
        }).eq('id', crew.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('crews').insert({
          user_id: user!.id,
          name: form.name.trim(),
          description: form.description.trim() || null,
          lead_crew_member_id: form.lead_crew_member_id || null,
          color: form.color.trim() || null,
        }).select('id').single();
        if (error) throw error;
        crewId = data.id;
      }

      // Sync memberships
      if (crewId) {
        // Remove old memberships
        await supabase.from('crew_memberships').delete().eq('crew_id', crewId);
        // Add new memberships
        if (selectedMembers.length > 0) {
          const inserts = selectedMembers.map((mid) => ({
            crew_id: crewId!,
            crew_member_id: mid,
          }));
          const { error } = await supabase.from('crew_memberships').insert(inserts);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-crews'] });
      queryClient.invalidateQueries({ queryKey: ['all-crew-memberships'] });
      toast.success(crew ? 'Crew updated' : 'Crew created');
      onOpenChange(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const activeMembers = members.filter((m) => m.is_active);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{crew ? 'Edit Crew' : 'Create Crew'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Crew Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Alpha Crew" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>
          <div>
            <Label>Lead Crew Member</Label>
            <Select value={form.lead_crew_member_id} onValueChange={(v) => setForm({ ...form, lead_crew_member_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select lead..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {activeMembers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Color Tag</Label>
            <Input type="color" value={form.color || '#3b82f6'} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-10 w-20" />
          </div>
          <div>
            <Label className="flex items-center gap-1.5 mb-2">
              <Users className="h-4 w-4" />
              Assign Crew Members ({selectedMembers.length})
            </Label>
            <div className="max-h-48 overflow-y-auto border rounded-md divide-y">
              {activeMembers.length > 0 ? activeMembers.map((m) => (
                <label key={m.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50">
                  <Checkbox
                    checked={selectedMembers.includes(m.id)}
                    onCheckedChange={() => toggleMember(m.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{m.name}</span>
                    {m.role && <span className="text-xs text-muted-foreground ml-2 capitalize">{m.role.replace('_', ' ')}</span>}
                  </div>
                </label>
              )) : (
                <p className="text-sm text-muted-foreground p-3 text-center">No crew members yet. Add members first.</p>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={() => mutation.mutate()} disabled={!form.name.trim() || mutation.isPending}>
            {mutation.isPending ? 'Saving...' : crew ? 'Update Crew' : 'Create Crew'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===================== MAIN SECTION =====================
export default function CrewsSection({ onSectionChange }: CrewsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'crews' | 'members'>('crews');
  const [search, setSearch] = useState('');
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [crewDialogOpen, setCrewDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<CrewMember | null>(null);
  const [editingCrew, setEditingCrew] = useState<Crew | null>(null);

  const { data: members = [] } = useQuery({
    queryKey: ['all-crew-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crew_members')
        .select('*')
        .order('name');
      if (error) throw error;
      return (data || []) as CrewMember[];
    },
    enabled: !!user?.id,
  });

  const { data: crews = [] } = useQuery({
    queryKey: ['all-crews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crews')
        .select('*')
        .order('name');
      if (error) throw error;
      return (data || []) as Crew[];
    },
    enabled: !!user?.id,
  });

  const { data: memberships = [] } = useQuery({
    queryKey: ['all-crew-memberships'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crew_memberships')
        .select('*');
      if (error) throw error;
      return (data || []) as CrewMembership[];
    },
    enabled: !!user?.id,
  });

  const deleteMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('crew_members').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-crew-members'] });
      queryClient.invalidateQueries({ queryKey: ['all-crew-memberships'] });
      toast.success('Member deleted');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteCrew = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('crews').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-crews'] });
      queryClient.invalidateQueries({ queryKey: ['all-crew-memberships'] });
      toast.success('Crew deleted');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email?.toLowerCase().includes(search.toLowerCase()) ||
    m.company?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredCrews = crews.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const getCrewMembers = (crewId: string) => {
    const memberIds = memberships.filter((m) => m.crew_id === crewId).map((m) => m.crew_member_id);
    return members.filter((m) => memberIds.includes(m.id));
  };

  const getLeadName = (leadId: string | null) => {
    if (!leadId) return null;
    return members.find((m) => m.id === leadId)?.name || null;
  };

  return (
    <div className="w-full h-full overflow-y-auto pb-20 bg-background">
      <div className="p-4 sm:p-6 space-y-6 sm:max-w-5xl sm:mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => onSectionChange?.('dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Crew Management</h1>
              <p className="text-sm text-muted-foreground">{crews.length} crews · {members.length} members</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <TabsList>
              <TabsTrigger value="crews" className="gap-1.5">
                <Shield className="h-4 w-4" />
                Crews
              </TabsTrigger>
              <TabsTrigger value="members" className="gap-1.5">
                <Users className="h-4 w-4" />
                Members
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-48"
                />
              </div>
              {tab === 'crews' ? (
                <Button size="sm" className="gap-1.5" onClick={() => { setEditingCrew(null); setCrewDialogOpen(true); }}>
                  <Plus className="h-4 w-4" />
                  New Crew
                </Button>
              ) : (
                <Button size="sm" className="gap-1.5" onClick={() => { setEditingMember(null); setMemberDialogOpen(true); }}>
                  <UserPlus className="h-4 w-4" />
                  Add Member
                </Button>
              )}
            </div>
          </div>

          {/* CREWS TAB */}
          <TabsContent value="crews" className="space-y-4 mt-4">
            {filteredCrews.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Shield className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">No crews yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">Create your first crew to organize your team</p>
                  <Button onClick={() => { setEditingCrew(null); setCrewDialogOpen(true); }} className="gap-1.5">
                    <Plus className="h-4 w-4" />
                    Create Crew
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredCrews.map((crew) => {
                const crewMembers = getCrewMembers(crew.id);
                const leadName = getLeadName(crew.lead_crew_member_id);
                return (
                  <Card key={crew.id} className="overflow-hidden">
                    <div
                      className="h-1.5"
                      style={{ backgroundColor: crew.color || 'hsl(var(--primary))' }}
                    />
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-base">{crew.name}</h3>
                            {!crew.is_active && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                          </div>
                          {crew.description && (
                            <p className="text-sm text-muted-foreground mt-0.5">{crew.description}</p>
                          )}
                          {leadName && (
                            <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                              <UserCheck className="h-3.5 w-3.5 text-primary" />
                              <span>Lead: <strong className="text-foreground">{leadName}</strong></span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => { setEditingCrew(crew); setCrewDialogOpen(true); }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => { if (confirm(`Delete crew "${crew.name}"?`)) deleteCrew.mutate(crew.id); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Crew members */}
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          {crewMembers.length} member{crewMembers.length !== 1 ? 's' : ''}
                        </p>
                        {crewMembers.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {crewMembers.map((m) => (
                              <Badge
                                key={m.id}
                                variant="outline"
                                className={cn(
                                  'text-xs py-1',
                                  m.id === crew.lead_crew_member_id && 'border-primary text-primary'
                                )}
                              >
                                {m.name}
                                {m.id === crew.lead_crew_member_id && ' ★'}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground/60">No members assigned</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* MEMBERS TAB */}
          <TabsContent value="members" className="space-y-3 mt-4">
            {filteredMembers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">No crew members yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">Add your first crew member to get started</p>
                  <Button onClick={() => { setEditingMember(null); setMemberDialogOpen(true); }} className="gap-1.5">
                    <UserPlus className="h-4 w-4" />
                    Add Member
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredMembers.map((m) => {
                const memberCrews = crews.filter((c) =>
                  memberships.some((ms) => ms.crew_id === c.id && ms.crew_member_id === m.id)
                );
                return (
                  <Card key={m.id} className={cn(!m.is_active && 'opacity-60')}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm">{m.name}</h3>
                            <Badge variant="secondary" className="text-[10px] capitalize">
                              {m.role?.replace('_', ' ')}
                            </Badge>
                            {!m.is_active && <Badge variant="outline" className="text-[10px]">Inactive</Badge>}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                            {m.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" /> {m.email}
                              </span>
                            )}
                            {m.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" /> {m.phone}
                              </span>
                            )}
                            {m.company && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" /> {m.company}
                              </span>
                            )}
                            {m.hourly_rate && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" /> ${m.hourly_rate}/hr
                              </span>
                            )}
                          </div>
                          {memberCrews.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {memberCrews.map((c) => (
                                <Badge key={c.id} variant="outline" className="text-[10px]" style={{ borderColor: c.color || undefined }}>
                                  {c.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {m.skills_trades && m.skills_trades.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {m.skills_trades.map((s, i) => (
                                <Badge key={i} className="text-[10px] bg-muted text-muted-foreground">{s}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => { setEditingMember(m); setMemberDialogOpen(true); }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => { if (confirm(`Delete "${m.name}"?`)) deleteMember.mutate(m.id); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <MemberFormDialog
        key={editingMember?.id || 'new-member'}
        member={editingMember}
        open={memberDialogOpen}
        onOpenChange={setMemberDialogOpen}
      />
      <CrewFormDialog
        key={editingCrew?.id || 'new-crew'}
        crew={editingCrew}
        members={members}
        memberships={memberships}
        open={crewDialogOpen}
        onOpenChange={setCrewDialogOpen}
      />
    </div>
  );
}
