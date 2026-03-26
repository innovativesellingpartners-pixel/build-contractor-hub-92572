import { useState, useCallback, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCrews, Crew, CrewMember } from "@/hooks/useCrews";
import { useCrewAssignments } from "@/hooks/useCrewAssignments";
import { Plus, Pencil, Trash2, Users, Calendar, Eye, Phone, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  on_job: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  off: "bg-muted text-muted-foreground border-border",
  scheduled: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  in_progress: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
};

export function CrewManagement() {
  const { crews, isLoading, createCrew, updateCrew, deleteCrew } = useCrews();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const { assignments } = useCrewAssignments(weekStart);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCrew, setEditingCrew] = useState<Crew | null>(null);
  const [form, setForm] = useState({ name: "", foreman_name: "", foreman_phone: "", status: "active" });
  const [members, setMembers] = useState<CrewMember[]>([]);

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const openCreate = useCallback(() => {
    setEditingCrew(null);
    setForm({ name: "", foreman_name: "", foreman_phone: "", status: "active" });
    setMembers([]);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((crew: Crew) => {
    setEditingCrew(crew);
    setForm({ name: crew.name, foreman_name: crew.foreman_name ?? "", foreman_phone: crew.foreman_phone ?? "", status: crew.status });
    setMembers(crew.members ?? []);
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    const payload = { name: form.name, foreman_name: form.foreman_name || null, foreman_phone: form.foreman_phone || null, status: form.status, members } as any;
    if (editingCrew) {
      updateCrew.mutate({ id: editingCrew.id, ...payload });
    } else {
      createCrew.mutate(payload);
    }
    setDialogOpen(false);
  }, [form, members, editingCrew, createCrew, updateCrew]);

  const addMember = useCallback(() => setMembers((m) => [...m, { name: "", phone: "", role: "", hourly_rate: 0 }]), []);
  const removeMember = useCallback((idx: number) => setMembers((m) => m.filter((_, i) => i !== idx)), []);
  const updateMember = useCallback((idx: number, field: keyof CrewMember, value: string | number) => {
    setMembers((m) => m.map((member, i) => (i === idx ? { ...member, [field]: value } : member)));
  }, []);

  const prevWeek = useCallback(() => setWeekStart((w) => addDays(w, -7)), []);
  const nextWeek = useCallback(() => setWeekStart((w) => addDays(w, 7)), []);

  return (
    <div className="p-3 md:p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Crew Management</h2>
          <p className="text-sm text-muted-foreground">Manage your field crews, schedules, and availability</p>
        </div>
      </div>

      <Tabs defaultValue="crews" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="crews"><Users className="h-4 w-4 mr-1.5" />My Crews</TabsTrigger>
          <TabsTrigger value="schedule"><Calendar className="h-4 w-4 mr-1.5" />Schedule</TabsTrigger>
          <TabsTrigger value="availability"><Eye className="h-4 w-4 mr-1.5" />Availability</TabsTrigger>
        </TabsList>

        {/* ───── TAB 1: MY CREWS ───── */}
        <TabsContent value="crews" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={openCreate} size="sm"><Plus className="h-4 w-4 mr-1" />Add Crew</Button>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading crews…</div>
          ) : crews.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground font-medium">No crews yet</p>
                <p className="text-sm text-muted-foreground/70 mb-4">Create your first crew to start managing your field teams</p>
                <Button onClick={openCreate} size="sm"><Plus className="h-4 w-4 mr-1" />Create Crew</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {crews.map((crew) => (
                <Card key={crew.id} className="group hover:border-primary/30 transition-colors">
                  <CardHeader className="pb-2 flex flex-row items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{crew.name}</CardTitle>
                      {crew.foreman_name && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" /> Foreman: {crew.foreman_name}
                          {crew.foreman_phone && (
                            <span className="ml-1 flex items-center gap-0.5"><Phone className="h-3 w-3" />{crew.foreman_phone}</span>
                          )}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className={STATUS_COLORS[crew.status] ?? ""}>{crew.status}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{crew.members.length} member{crew.members.length !== 1 ? "s" : ""}</p>
                    {crew.members.length > 0 && (
                      <div className="space-y-1">
                        {crew.members.slice(0, 3).map((m, i) => (
                          <div key={i} className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 rounded px-2 py-1">
                            <span>{m.name}{m.role ? ` · ${m.role}` : ""}</span>
                            {m.hourly_rate > 0 && <span>${m.hourly_rate}/hr</span>}
                          </div>
                        ))}
                        {crew.members.length > 3 && <p className="text-xs text-muted-foreground/60">+{crew.members.length - 3} more</p>}
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(crew)}><Pencil className="h-3.5 w-3.5 mr-1" />Edit</Button>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteCrew.mutate(crew.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ───── TAB 2: SCHEDULE ───── */}
        <TabsContent value="schedule" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" size="sm" onClick={prevWeek}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="font-medium text-sm">{format(weekStart, "MMM d")} – {format(addDays(weekStart, 6), "MMM d, yyyy")}</span>
            <Button variant="outline" size="sm" onClick={nextWeek}><ChevronRight className="h-4 w-4" /></Button>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Header row */}
              <div className="grid grid-cols-[140px_repeat(7,1fr)] gap-px bg-border rounded-t-lg overflow-hidden">
                <div className="bg-muted/50 p-2 text-xs font-semibold text-muted-foreground">Crew</div>
                {weekDays.map((day) => (
                  <div key={day.toISOString()} className={`bg-muted/50 p-2 text-xs font-semibold text-center ${isSameDay(day, new Date()) ? "text-primary" : "text-muted-foreground"}`}>
                    {format(day, "EEE d")}
                  </div>
                ))}
              </div>

              {/* Crew rows */}
              {crews.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">Create crews first to view the schedule</div>
              ) : (
                crews.map((crew) => (
                  <div key={crew.id} className="grid grid-cols-[140px_repeat(7,1fr)] gap-px bg-border">
                    <div className="bg-card p-2 text-sm font-medium truncate">{crew.name}</div>
                    {weekDays.map((day) => {
                      const dayAssignments = assignments.filter(
                        (a) => a.crew_id === crew.id && isSameDay(new Date(a.assigned_date), day)
                      );
                      return (
                        <div key={day.toISOString()} className="bg-card p-1.5 min-h-[56px]">
                          {dayAssignments.map((a) => (
                            <div key={a.id} className="text-xs bg-primary/10 text-primary rounded px-1.5 py-0.5 mb-0.5 truncate">
                              {a.jobs?.name || a.jobs?.job_number || "Job"}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        {/* ───── TAB 3: AVAILABILITY ───── */}
        <TabsContent value="availability" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" size="sm" onClick={prevWeek}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="font-medium text-sm">{format(weekStart, "MMM d")} – {format(addDays(weekStart, 6), "MMM d, yyyy")}</span>
            <Button variant="outline" size="sm" onClick={nextWeek}><ChevronRight className="h-4 w-4" /></Button>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              <div className="grid grid-cols-[140px_repeat(7,1fr)] gap-px bg-border rounded-t-lg overflow-hidden">
                <div className="bg-muted/50 p-2 text-xs font-semibold text-muted-foreground">Crew</div>
                {weekDays.map((day) => (
                  <div key={day.toISOString()} className={`bg-muted/50 p-2 text-xs font-semibold text-center ${isSameDay(day, new Date()) ? "text-primary" : "text-muted-foreground"}`}>
                    {format(day, "EEE d")}
                  </div>
                ))}
              </div>

              {crews.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No crews to display</div>
              ) : (
                crews.map((crew) => (
                  <div key={crew.id} className="grid grid-cols-[140px_repeat(7,1fr)] gap-px bg-border">
                    <div className="bg-card p-2 text-sm font-medium truncate">{crew.name}</div>
                    {weekDays.map((day) => {
                      const hasAssignment = assignments.some(
                        (a) => a.crew_id === crew.id && isSameDay(new Date(a.assigned_date), day)
                      );
                      return (
                        <div key={day.toISOString()} className={`p-2 text-center text-xs font-medium ${hasAssignment ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                          {hasAssignment ? "Booked" : "Available"}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ───── CREATE / EDIT DIALOG ───── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCrew ? "Edit Crew" : "Create Crew"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Crew Name *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Install Team A" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Foreman Name</Label>
                <Input value={form.foreman_name} onChange={(e) => setForm((f) => ({ ...f, foreman_name: e.target.value }))} />
              </div>
              <div>
                <Label>Foreman Phone</Label>
                <Input value={form.foreman_phone} onChange={(e) => setForm((f) => ({ ...f, foreman_phone: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_job">On Job</SelectItem>
                  <SelectItem value="off">Off</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Members */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Members</Label>
                <Button size="sm" variant="outline" onClick={addMember}><Plus className="h-3.5 w-3.5 mr-1" />Add</Button>
              </div>
              {members.map((m, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_1fr_80px_32px] gap-2 mb-2 items-end">
                  <div>
                    {i === 0 && <Label className="text-xs">Name</Label>}
                    <Input value={m.name} onChange={(e) => updateMember(i, "name", e.target.value)} placeholder="Name" className="h-8 text-sm" />
                  </div>
                  <div>
                    {i === 0 && <Label className="text-xs">Phone</Label>}
                    <Input value={m.phone} onChange={(e) => updateMember(i, "phone", e.target.value)} placeholder="Phone" className="h-8 text-sm" />
                  </div>
                  <div>
                    {i === 0 && <Label className="text-xs">Role</Label>}
                    <Input value={m.role} onChange={(e) => updateMember(i, "role", e.target.value)} placeholder="Role" className="h-8 text-sm" />
                  </div>
                  <div>
                    {i === 0 && <Label className="text-xs">$/hr</Label>}
                    <Input type="number" value={m.hourly_rate || ""} onChange={(e) => updateMember(i, "hourly_rate", parseFloat(e.target.value) || 0)} className="h-8 text-sm" />
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeMember(i)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name.trim()}>{editingCrew ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
