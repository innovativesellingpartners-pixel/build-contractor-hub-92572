
CREATE OR REPLACE FUNCTION public.get_user_tier_data(p_user_id uuid)
RETURNS TABLE(
  tier_id text,
  billing_cycle text,
  subscription_status text,
  role text,
  training_access boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.tier_id::text,
    s.billing_cycle::text,
    s.status::text AS subscription_status,
    ur.role::text,
    COALESCE((p.training_access)::boolean, true) AS training_access
  FROM (SELECT p_user_id AS uid) params
  LEFT JOIN public.subscriptions s
    ON s.user_id = params.uid AND s.status = 'active'
  LEFT JOIN public.user_roles ur
    ON ur.user_id = params.uid
  LEFT JOIN public.profiles p
    ON p.user_id = params.uid
  LIMIT 1;
END;
$$;
