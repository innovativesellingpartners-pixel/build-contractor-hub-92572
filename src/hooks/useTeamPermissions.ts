import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type TeamRole = 'owner' | 'manager' | 'sales_rep' | 'project_manager' | 'field_tech' | 'office_staff' | 'viewer';

export interface TeamPermissions {
  leads: boolean;
  estimates: boolean;
  customers: boolean;
  jobs: boolean;
  daily_logs: boolean;
  crews: boolean;
  schedules: boolean;
  financials: boolean;
  billing: boolean;
  reports: boolean;
  team_management: boolean;
  settings: boolean;
  create_daily_logs: boolean;
  edit_daily_logs: boolean;
}

const ROLE_PERMISSIONS: Record<TeamRole, TeamPermissions> = {
  owner: {
    leads: true, estimates: true, customers: true, jobs: true,
    daily_logs: true, crews: true, schedules: true, financials: true,
    billing: true, reports: true, team_management: true, settings: true,
    create_daily_logs: true, edit_daily_logs: true,
  },
  manager: {
    leads: true, estimates: true, customers: true, jobs: true,
    daily_logs: true, crews: true, schedules: true, financials: true,
    billing: false, reports: true, team_management: true, settings: false,
    create_daily_logs: true, edit_daily_logs: true,
  },
  sales_rep: {
    leads: true, estimates: true, customers: true, jobs: false,
    daily_logs: false, crews: false, schedules: false, financials: false,
    billing: false, reports: false, team_management: false, settings: false,
    create_daily_logs: false, edit_daily_logs: false,
  },
  project_manager: {
    leads: false, estimates: true, customers: true, jobs: true,
    daily_logs: true, crews: true, schedules: true, financials: false,
    billing: false, reports: true, team_management: false, settings: false,
    create_daily_logs: true, edit_daily_logs: true,
  },
  field_tech: {
    leads: false, estimates: false, customers: false, jobs: true,
    daily_logs: true, crews: false, schedules: false, financials: false,
    billing: false, reports: false, team_management: false, settings: false,
    create_daily_logs: true, edit_daily_logs: false,
  },
  office_staff: {
    leads: true, estimates: true, customers: true, jobs: true,
    daily_logs: true, crews: false, schedules: true, financials: false,
    billing: false, reports: true, team_management: false, settings: false,
    create_daily_logs: true, edit_daily_logs: true,
  },
  viewer: {
    leads: true, estimates: true, customers: true, jobs: true,
    daily_logs: true, crews: true, schedules: true, financials: false,
    billing: false, reports: true, team_management: false, settings: false,
    create_daily_logs: false, edit_daily_logs: false,
  },
};

export function useTeamPermissions() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['team-permissions', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Check if user is a team member of someone else's account
      const { data: membership } = await supabase
        .from('team_members')
        .select('*')
        .eq('member_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (membership) {
        const role = membership.role as TeamRole;
        const basePerms = { ...(ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.viewer) };
        // Apply granular overrides
        const overrides = (membership.permissions as Record<string, boolean> | null) || {};
        Object.entries(overrides).forEach(([key, val]) => {
          if (key in basePerms) {
            (basePerms as any)[key] = val;
          }
        });
        return {
          isOwner: false,
          isTeamMember: true,
          role,
          permissions: basePerms,
          ownerUserId: membership.owner_id,
          memberRecord: membership,
        };
      }

      // User is the account owner
      return {
        isOwner: true,
        isTeamMember: false,
        role: 'owner' as TeamRole,
        permissions: ROLE_PERMISSIONS.owner,
        ownerUserId: user.id,
        memberRecord: null,
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  return {
    isOwner: data?.isOwner ?? true,
    isTeamMember: data?.isTeamMember ?? false,
    role: data?.role ?? 'owner' as TeamRole,
    permissions: data?.permissions ?? ROLE_PERMISSIONS.owner,
    ownerUserId: data?.ownerUserId ?? user?.id,
    isLoading,
    hasPermission: (perm: keyof TeamPermissions) => data?.permissions?.[perm] ?? true,
  };
}

export { ROLE_PERMISSIONS };
