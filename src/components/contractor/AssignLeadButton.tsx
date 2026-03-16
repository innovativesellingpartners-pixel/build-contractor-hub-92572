import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from 'sonner';

interface AssignLeadButtonProps {
  leadId: string;
  currentUserId?: string;
  /** Render as icon-only button (for list rows) */
  iconOnly?: boolean;
  /** Called after successful assignment */
  onAssigned?: () => void;
  className?: string;
}

export function AssignLeadButton({ leadId, currentUserId, iconOnly = false, onAssigned, className }: AssignLeadButtonProps) {
  const { isAdmin } = useAdminAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedContractorId, setSelectedContractorId] = useState(currentUserId || '');
  const [saving, setSaving] = useState(false);

  // Fetch ALL platform users (profiles) so every user can be assigned
  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users-for-assignment'],
    queryFn: async () => {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, contact_name, company_name')
        .order('contact_name');
      if (profilesError) throw profilesError;

      // Get all user roles to identify admins
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['admin', 'super_admin']);

      // Get contractor business names
      const { data: contractors } = await supabase
        .from('contractors')
        .select('id, business_name, contractor_number');

      const roleMap = new Map((roles || []).map(r => [r.user_id, r.role]));
      const contractorMap = new Map((contractors || []).map(c => [c.id, c]));

      return (profiles || []).map(p => {
        const role = roleMap.get(p.id);
        const contractor = contractorMap.get(p.id);
        const isAdminUser = role === 'admin' || role === 'super_admin';
        const displayName = p.contact_name || contractor?.business_name || p.company_name || 'Unknown User';
        return {
          id: p.id,
          displayName,
          businessName: contractor?.business_name || null,
          contractorNumber: contractor?.contractor_number || null,
          role: role || 'user',
          isAdmin: isAdminUser,
        };
      });
    },
    enabled: isAdmin && open,
  });

  // Check if the current assignee is an admin (not found in contractors)
  const { data: assigneeRole } = useQuery({
    queryKey: ['assignee-role', currentUserId],
    queryFn: async () => {
      if (!currentUserId) return null;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUserId)
        .maybeSingle();
      return data?.role || null;
    },
    enabled: !!currentUserId,
  });

  // Get the admin's profile name if assignee is admin
  const { data: assigneeProfile } = useQuery({
    queryKey: ['assignee-profile', currentUserId],
    queryFn: async () => {
      if (!currentUserId) return null;
      const { data } = await supabase
        .from('profiles')
        .select('contact_name, company_name')
        .eq('id', currentUserId)
        .maybeSingle();
      return data;
    },
    enabled: !!currentUserId,
  });

  // Build combined options: contractors + admin users (deduped)
  const contractorIds = new Set(contractors.map(c => c.id));
  const contractorOptions = contractors.map((c) => ({
    value: c.id,
    label: c.business_name,
    description: c.contractor_number || undefined,
  }));
  const adminOptions = adminProfiles
    .filter(a => !contractorIds.has(a.user_id)) // exclude admins who are also contractors
    .map(a => ({
      value: a.user_id,
      label: `${a.name} (Admin)`,
      description: a.role === 'super_admin' ? 'Super Admin' : 'Admin',
    }));
  const allOptions = [...contractorOptions, ...adminOptions];

  const currentContractor = contractors.find(c => c.id === currentUserId);
  const isAssigneeAdmin = !currentContractor && (assigneeRole === 'admin' || assigneeRole === 'super_admin');
  
  const assigneeDisplayName = currentContractor 
    ? currentContractor.business_name 
    : isAssigneeAdmin 
      ? (assigneeProfile?.contact_name || assigneeProfile?.company_name || 'Admin')
      : null;

  if (!isAdmin) return null;

  const handleAssign = async () => {
    if (!selectedContractorId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({ user_id: selectedContractorId })
        .eq('id', leadId);
      if (error) throw error;

      const name = allOptions.find(o => o.value === selectedContractorId)?.label;
      toast.success(`Lead assigned to ${name}`);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['adminLeads'] });
      setOpen(false);
      onAssigned?.();
    } catch {
      toast.error('Failed to assign lead');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {iconOnly ? (
        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 ${className || ''}`}
          title="Assign to Contractor"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedContractorId(currentUserId || '');
            setOpen(true);
          }}
        >
          <UserPlus className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className={`gap-2 ${className || ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedContractorId(currentUserId || '');
            setOpen(true);
          }}
        >
          <UserPlus className="h-4 w-4" />
          {assigneeDisplayName ? `Assigned: ${assigneeDisplayName}${isAssigneeAdmin ? ' (Admin)' : ''}` : 'Assign'}
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Assign Lead to Contractor</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            {assigneeDisplayName && (
              <p className="text-sm text-muted-foreground">
                Currently assigned to: <span className="font-medium text-foreground">{assigneeDisplayName}</span>
                {isAssigneeAdmin && <Badge variant="secondary" className="ml-2 text-xs">Admin</Badge>}
                {currentContractor?.contractor_number && ` (${currentContractor.contractor_number})`}
              </p>
            )}
            <SearchableSelect
              options={allOptions}
              value={selectedContractorId}
              onValueChange={setSelectedContractorId}
              placeholder="Search for a user or contractor..."
              searchPlaceholder="Type name or number..."
              emptyMessage="No users found."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!selectedContractorId || saving}
              onClick={handleAssign}
            >
              {saving ? 'Assigning...' : 'Assign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
