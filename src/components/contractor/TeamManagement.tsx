import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserPlus, Shield, Mail, MoreVertical, Pencil, UserX, Pause } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { ROLE_PERMISSIONS, type TeamRole } from "@/hooks/useTeamPermissions";

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  manager: "Manager",
  sales_rep: "Sales Rep",
  project_manager: "Project Manager",
  field_tech: "Field Tech",
  viewer: "Viewer",
};

const STATUS_COLORS: Record<string, string> = {
  invited: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  active: "bg-green-500/20 text-green-400 border-green-500/30",
  suspended: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  removed: "bg-red-500/20 text-red-400 border-red-500/30",
};

const PERMISSION_LABELS: Record<string, string> = {
  leads: "Leads",
  estimates: "Estimates",
  customers: "Customers",
  jobs: "Jobs",
  daily_logs: "Daily Logs",
  crews: "Crews",
  schedules: "Schedules",
  financials: "Financials",
  billing: "Billing",
  reports: "Reports",
  team_management: "Team Management",
  settings: "Settings",
};

interface Props {
  onBack?: () => void;
}

export function TeamManagement({ onBack }: Props) {
  const { teamMembers, pendingInvites, isLoading, inviteMember, updateMember, removeMember } = useTeamMembers();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editMember, setEditMember] = useState<any>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    inviteMember.mutate(
      { email: inviteEmail.trim(), name: inviteName.trim(), role: inviteRole },
      {
        onSuccess: () => {
          setInviteOpen(false);
          setInviteEmail("");
          setInviteName("");
          setInviteRole("viewer");
        },
      }
    );
  };

  const handlePermissionToggle = (memberId: string, perm: string, currentPerms: Record<string, boolean>, currentRole: string) => {
    const roleDefaults = ROLE_PERMISSIONS[currentRole as TeamRole] || {};
    const newPerms = { ...currentPerms, [perm]: !(currentPerms[perm] ?? (roleDefaults as any)[perm]) };
    updateMember.mutate({ id: memberId, permissions: newPerms });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Team Management
          </h2>
          <p className="text-sm text-muted-foreground">Invite and manage your team members with role-based access</p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button><UserPlus className="h-4 w-4 mr-2" />Invite Team Member</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>Send an invitation email to add someone to your team.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Email *</Label>
                <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="team@example.com" type="email" />
              </div>
              <div>
                <Label>Name</Label>
                <Input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="John Doe" />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).filter(([k]) => k !== 'owner').map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {inviteRole === 'manager' && "Full access except billing/subscription settings."}
                  {inviteRole === 'sales_rep' && "Access to leads, estimates, and customers only."}
                  {inviteRole === 'project_manager' && "Access to jobs, daily logs, crews, and schedules."}
                  {inviteRole === 'field_tech' && "Create daily logs and view assigned jobs only."}
                  {inviteRole === 'viewer' && "Read-only access to dashboard and reports."}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
              <Button onClick={handleInvite} disabled={!inviteEmail.trim() || inviteMember.isPending}>
                {inviteMember.isPending ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{teamMembers.length}</div>
            <div className="text-xs text-muted-foreground">Total Members</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{teamMembers.filter((m: any) => m.status === 'active').length}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{pendingInvites.length}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{teamMembers.filter((m: any) => m.status === 'suspended').length}</div>
            <div className="text-xs text-muted-foreground">Suspended</div>
          </CardContent>
        </Card>
      </div>

      {/* Members List */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Members</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingInvites.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-3 mt-4">
          {isLoading ? (
            <div className="text-center text-muted-foreground py-8">Loading team...</div>
          ) : teamMembers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No team members yet. Invite your first team member!</p>
              </CardContent>
            </Card>
          ) : (
            teamMembers.map((member: any) => (
              <MemberCard
                key={member.id}
                member={member}
                onEdit={() => setEditMember(member)}
                onSuspend={() => updateMember.mutate({ id: member.id, status: member.status === 'suspended' ? 'active' : 'suspended' })}
                onRemove={() => removeMember.mutate(member.id)}
                onRoleChange={(role) => updateMember.mutate({ id: member.id, role })}
                onPermissionToggle={(perm) => handlePermissionToggle(member.id, perm, member.permissions || {}, member.role)}
              />
            ))
          )}
        </TabsContent>
        <TabsContent value="pending" className="space-y-3 mt-4">
          {pendingInvites.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No pending invitations.</CardContent></Card>
          ) : (
            pendingInvites.map((member: any) => (
              <MemberCard
                key={member.id}
                member={member}
                onEdit={() => setEditMember(member)}
                onSuspend={() => {}}
                onRemove={() => removeMember.mutate(member.id)}
                onRoleChange={(role) => updateMember.mutate({ id: member.id, role })}
                onPermissionToggle={(perm) => handlePermissionToggle(member.id, perm, member.permissions || {}, member.role)}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Permissions Dialog */}
      {editMember && (
        <Dialog open={!!editMember} onOpenChange={() => setEditMember(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Permissions — {editMember.name || editMember.email}</DialogTitle>
              <DialogDescription>Toggle individual permissions to override the role defaults.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 max-h-[400px] overflow-auto">
              {Object.entries(PERMISSION_LABELS).map(([key, label]) => {
                const roleDefault = (ROLE_PERMISSIONS[editMember.role as TeamRole] as any)?.[key] ?? false;
                const override = editMember.permissions?.[key];
                const current = override !== undefined ? override : roleDefault;
                return (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">{label}</span>
                      {override !== undefined && override !== roleDefault && (
                        <Badge variant="outline" className="ml-2 text-[10px]">Override</Badge>
                      )}
                    </div>
                    <Switch
                      checked={current}
                      onCheckedChange={() => {
                        handlePermissionToggle(editMember.id, key, editMember.permissions || {}, editMember.role);
                        setEditMember({ ...editMember, permissions: { ...editMember.permissions, [key]: !current } });
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function MemberCard({ member, onEdit, onSuspend, onRemove, onRoleChange, onPermissionToggle }: any) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary">{(member.name || member.email)?.[0]?.toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <div className="font-medium truncate">{member.name || "—"}</div>
              <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                <Mail className="h-3 w-3" />{member.email}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="outline" className={STATUS_COLORS[member.status] || ""}>{member.status}</Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />{ROLE_LABELS[member.role] || member.role}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}><Pencil className="h-4 w-4 mr-2" />Edit Permissions</DropdownMenuItem>
                {member.status !== 'invited' && (
                  <DropdownMenuItem onClick={onSuspend}>
                    <Pause className="h-4 w-4 mr-2" />{member.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={onRemove} className="text-destructive"><UserX className="h-4 w-4 mr-2" />Remove</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default TeamManagement;
