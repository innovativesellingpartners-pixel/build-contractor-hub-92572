
-- Backfill: Create contractor records for existing users who don't have one
INSERT INTO public.contractors (id, business_name)
SELECT p.user_id, 'My Business'
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.contractors c WHERE c.id = p.user_id
)
ON CONFLICT (id) DO NOTHING;

-- Backfill: Create contractor_users mappings for existing users who don't have one
INSERT INTO public.contractor_users (user_id, contractor_id, role)
SELECT p.user_id, p.user_id, 'owner'
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.contractor_users cu WHERE cu.user_id = p.user_id
)
ON CONFLICT DO NOTHING;
