import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserPlus, Shield, Mail, MoreVertical, Pencil, UserX, Pause, Phone, Briefcase, Play } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { format } from "date-fns";

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  manager: "Manager",
  sales_rep: "Sales Rep",
  project_manager: "Project Manager",
  field_tech: "Field Tech",
  office_staff: "Office Staff",
  viewer: "Viewer",
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  manager: "Full access except billing/subscription settings",
  sales_rep: "Access to leads, estimates, and customers only",
  project_manager: "Access to jobs, daily logs, crews, and schedules",
  field_tech: "Create daily logs and view assigned jobs only",
  office_staff: "Leads, estimates, customers, jobs, and daily logs",
  viewer: "Read-only access to dashboard and reports",
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-500/20 text-green-400 border-green-500/30",
  suspended: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  removed: "bg-red-500/20 text-red-400 border-red-500/30",
};

interface Props {
  onBack?: () => void;
}

export function TeamManagement({ onBack }: Props) {
  const { teamMembers, activeMembers, suspendedMembers, isLoading, createMember, updateMember, removeMember } = useTeamMembers();
  const [createOpen, setCreateOpen] = useState(false);
  const [editRoleMember, setEditRoleMember] = useState<any>(null);
  const [editRole, setEditRole] = useState("");

  // Create form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formJobTitle, setFormJobTitle] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState("viewer");
  const [formError, setFormError] = useState("");

  const resetForm = () => {
    setFormName(""); setFormEmail(""); setFormPhone("");
    setFormJobTitle(""); setFormPassword(""); setFormRole("viewer");
    setFormError("");
  };

  const handleCreate = () => {
    setFormError("");
    if (!formName.trim()) { setFormError("Name is required"); return; }
    if (!formEmail.trim() || !formEmail.includes("@")) { setFormError("Valid email is required"); return; }
    if (!formPassword || formPassword.length < 8) { setFormError("Password must be at least 8 characters"); return; }

    createMember.mutate(
      { email: formEmail.trim(), password: formPassword, name: formName.trim(), phone: formPhone.trim() || undefined, job_title: formJobTitle.trim() || undefined, role: formRole },
      {
        onSuccess: () => { setCreateOpen(false); resetForm(); },
        onError: (err: Error) => { setFormError(err.message); },
      }
    );
  };

  const handleEditRole = () => {
    if (!editRoleMember || !editRole) return;
    updateMember.mutate({ id: editRoleMember.id, role: editRole }, {
      onSuccess: () => { setEditRoleMember(null); setEditRole(""); },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Team Management
          </h2>
          <p className="text-sm text-muted-foreground">Create and manage your team members with role-based access</p>
        </div>
        <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><UserPlus className="h-4 w-4 mr-2" />Add Team Member</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
              <DialogDescription>Create a new team member account. They'll receive login credentials via email.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="John Doe" />
              </div>
              <div>
                <Label>Email *</Label>
                <Input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="john@example.com" type="email" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Phone</Label>
                  <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="(555) 123-4567" />
                </div>
                <div>
                  <Label>Job Title</Label>
                  <Input value={formJobTitle} onChange={(e) => setFormJobTitle(e.target.value)} placeholder="Foreman" />
                </div>
              </div>
              <div>
                <Label>Password *</Label>
                <Input value={formPassword} onChange={(e) => setFormPassword(e.target.value)} type="password" placeholder="Min 8 characters" />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={formRole} onValueChange={setFormRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).filter(([k]) => k !== 'owner').map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {ROLE_DESCRIPTIONS[formRole] && (
                  <p className="text-xs text-muted-foreground mt-1">{ROLE_DESCRIPTIONS[formRole]}</p>
                )}
              </div>
              {formError && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-md p-2">{formError}</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setCreateOpen(false); resetForm(); }}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createMember.isPending}>
                {createMember.isPending ? "Creating..." : "Create & Send Credentials"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{teamMembers.length}</div>
            <div className="text-xs text-muted-foreground">Total Members</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{activeMembers.length}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-400">{suspendedMembers.length}</div>
            <div className="text-xs text-muted-foreground">Suspended</div>
          </CardContent>
        </Card>
      </div>

      {/* Members Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading team...</div>
          ) : teamMembers.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No team members yet. Add your first team member!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Name</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Email</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Role</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Added</th>
                    <th className="text-right p-3 text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((member: any) => (
                    <tr key={member.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-primary">{member.name?.[0]?.toUpperCase()}</span>
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">{member.name}</div>
                            {member.job_title && <div className="text-[10px] text-muted-foreground">{member.job_title}</div>}
                            <div className="text-[10px] text-muted-foreground sm:hidden">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground hidden sm:table-cell">{member.email}</td>
                      <td className="p-3">
                        <Badge variant="secondary" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />{ROLE_LABELS[member.role] || member.role}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className={`text-xs ${STATUS_STYLES[member.status] || ""}`}>
                          {member.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground hidden md:table-cell">
                        {member.created_at ? format(new Date(member.created_at), "MMM d, yyyy") : "—"}
                      </td>
                      <td className="p-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setEditRoleMember(member); setEditRole(member.role); }}>
                              <Pencil className="h-4 w-4 mr-2" />Edit Role
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {member.status === 'active' && (
                              <DropdownMenuItem onClick={() => updateMember.mutate({ id: member.id, status: 'suspended' })}>
                                <Pause className="h-4 w-4 mr-2" />Suspend
                              </DropdownMenuItem>
                            )}
                            {member.status === 'suspended' && (
                              <DropdownMenuItem onClick={() => updateMember.mutate({ id: member.id, status: 'active' })}>
                                <Play className="h-4 w-4 mr-2" />Reactivate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => removeMember.mutate(member.id)} className="text-destructive">
                              <UserX className="h-4 w-4 mr-2" />Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      {editRoleMember && (
        <Dialog open={!!editRoleMember} onOpenChange={() => { setEditRoleMember(null); setEditRole(""); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Change Role — {editRoleMember.name}</DialogTitle>
              <DialogDescription>Select a new role for this team member.</DialogDescription>
            </DialogHeader>
            <Select value={editRole} onValueChange={setEditRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(ROLE_LABELS).filter(([k]) => k !== 'owner').map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {ROLE_DESCRIPTIONS[editRole] && (
              <p className="text-xs text-muted-foreground">{ROLE_DESCRIPTIONS[editRole]}</p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => { setEditRoleMember(null); setEditRole(""); }}>Cancel</Button>
              <Button onClick={handleEditRole} disabled={updateMember.isPending}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default TeamManagement;
