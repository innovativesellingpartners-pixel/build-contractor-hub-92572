
-- 1. Backfill: Create contractors rows for all profiles with ct1_contractor_number that don't already have one
INSERT INTO public.contractors (id, business_name, contractor_number, created_at)
SELECT 
  p.user_id,
  COALESCE(p.company_name, 'My Business'),
  p.ct1_contractor_number,
  p.created_at
FROM public.profiles p
WHERE p.ct1_contractor_number IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.contractors c WHERE c.id = p.user_id
  );

-- 2. Backfill: Create contractor_users mappings for all newly created contractors
INSERT INTO public.contractor_users (user_id, contractor_id, role)
SELECT 
  p.user_id,
  p.user_id,
  'owner'
FROM public.profiles p
WHERE p.ct1_contractor_number IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.contractor_users cu WHERE cu.user_id = p.user_id
  );

-- 3. Update handle_new_user() to also create contractors + contractor_users rows
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, user_id)
  VALUES (NEW.id, NEW.id)
  ON CONFLICT (id) DO NOTHING;

  -- Create contractor record (contractor_number auto-assigned by trigger)
  INSERT INTO public.contractors (id, business_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'business_name', 'My Business'))
  ON CONFLICT (id) DO NOTHING;

  -- Create contractor_users mapping
  INSERT INTO public.contractor_users (user_id, contractor_id, role)
  VALUES (NEW.id, NEW.id, 'owner')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;
