
-- Step 1: Create both tables first (no cross-references in policies yet)
CREATE TABLE public.contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  timezone TEXT DEFAULT 'America/Detroit',
  subscription_tier TEXT DEFAULT 'free',
  voice_ai_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contractors ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.contractor_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID NOT NULL REFERENCES public.contractors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'staff')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(contractor_id, user_id)
);

ALTER TABLE public.contractor_users ENABLE ROW LEVEL SECURITY;

-- Step 2: Now add all RLS policies (both tables exist)
CREATE POLICY "Users can view their own memberships"
  ON public.contractor_users FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Owners can manage memberships"
  ON public.contractor_users FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.contractor_users cu2
      WHERE cu2.contractor_id = contractor_users.contractor_id
        AND cu2.user_id = auth.uid()
        AND cu2.role = 'owner'
    )
  );

CREATE POLICY "Contractor members can view"
  ON public.contractors FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.contractor_users cu
      WHERE cu.contractor_id = contractors.id AND cu.user_id = auth.uid()
    )
  );

CREATE POLICY "Contractor owners can update"
  ON public.contractors FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.contractor_users cu
      WHERE cu.contractor_id = contractors.id AND cu.user_id = auth.uid()
        AND cu.role IN ('owner', 'admin')
    )
  );

-- Step 3: Add contractor_id to calendar_connections
ALTER TABLE public.calendar_connections
  ADD COLUMN IF NOT EXISTS contractor_id UUID REFERENCES public.contractors(id);

-- Step 4: Bootstrap data from contractor_ai_profiles
DO $$
DECLARE
  rec RECORD;
  new_cid UUID;
BEGIN
  FOR rec IN
    SELECT DISTINCT contractor_id AS uid, business_name
    FROM public.contractor_ai_profiles
  LOOP
    INSERT INTO public.contractors (id, business_name)
    VALUES (rec.uid, COALESCE(rec.business_name, 'My Business'))
    ON CONFLICT (id) DO NOTHING
    RETURNING id INTO new_cid;

    IF new_cid IS NULL THEN new_cid := rec.uid; END IF;

    INSERT INTO public.contractor_users (contractor_id, user_id, role)
    VALUES (new_cid, rec.uid, 'owner')
    ON CONFLICT (contractor_id, user_id) DO NOTHING;

    UPDATE public.calendar_connections
    SET contractor_id = new_cid
    WHERE user_id = rec.uid AND contractor_id IS NULL;
  END LOOP;
END $$;
