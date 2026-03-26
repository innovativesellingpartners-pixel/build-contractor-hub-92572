
-- 1. Drop old team_members table and recreate with new schema
DROP TABLE IF EXISTS public.team_members CASCADE;

CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'team_member',
  permissions JSONB DEFAULT '{}',
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  job_title TEXT,
  invited_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(owner_id, member_id),
  CONSTRAINT team_members_role_check CHECK (role IN ('owner', 'manager', 'sales_rep', 'project_manager', 'field_tech', 'office_staff', 'viewer')),
  CONSTRAINT team_members_status_check CHECK (status IN ('active', 'suspended', 'removed'))
);

CREATE INDEX idx_team_members_owner ON public.team_members(owner_id);
CREATE INDEX idx_team_members_member ON public.team_members(member_id);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners see their team" ON public.team_members FOR SELECT TO authenticated
  USING (owner_id = auth.uid());
CREATE POLICY "Members see own record" ON public.team_members FOR SELECT TO authenticated
  USING (member_id = auth.uid());
CREATE POLICY "Owners insert team" ON public.team_members FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners update team" ON public.team_members FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());
CREATE POLICY "Owners delete team" ON public.team_members FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Add billing-ready columns and parent_owner_id to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS max_team_seats INTEGER DEFAULT 999,
  ADD COLUMN IF NOT EXISTS per_seat_price NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parent_owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_parent_owner ON public.profiles(parent_owner_id);

-- 3. Create security definer helper for team membership check
CREATE OR REPLACE FUNCTION public.is_team_member_of(_owner_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE owner_id = _owner_id
      AND member_id = auth.uid()
      AND status = 'active'
  );
$$;
