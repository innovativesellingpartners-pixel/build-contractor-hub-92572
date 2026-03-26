
-- Create team_members table
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL,
  member_user_id UUID,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'viewer',
  permissions JSONB DEFAULT '{}',
  invited_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'invited',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT team_members_role_check CHECK (role IN ('owner', 'manager', 'sales_rep', 'project_manager', 'field_tech', 'viewer')),
  CONSTRAINT team_members_status_check CHECK (status IN ('invited', 'active', 'suspended', 'removed'))
);

-- Indexes
CREATE INDEX idx_team_members_owner ON public.team_members(owner_user_id);
CREATE INDEX idx_team_members_member ON public.team_members(member_user_id);
CREATE INDEX idx_team_members_email ON public.team_members(email);
CREATE UNIQUE INDEX idx_team_members_unique_invite ON public.team_members(owner_user_id, email) WHERE status != 'removed';

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Owner sees all their team members
CREATE POLICY "Owners see their team members"
  ON public.team_members FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid());

-- Members see their own record
CREATE POLICY "Members see own record"
  ON public.team_members FOR SELECT TO authenticated
  USING (member_user_id = auth.uid());

-- Only owner can insert
CREATE POLICY "Owner can insert team members"
  ON public.team_members FOR INSERT TO authenticated
  WITH CHECK (owner_user_id = auth.uid());

-- Only owner can update
CREATE POLICY "Owner can update team members"
  ON public.team_members FOR UPDATE TO authenticated
  USING (owner_user_id = auth.uid());

-- Only owner can delete
CREATE POLICY "Owner can delete team members"
  ON public.team_members FOR DELETE TO authenticated
  USING (owner_user_id = auth.uid());

-- Updated_at trigger
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
