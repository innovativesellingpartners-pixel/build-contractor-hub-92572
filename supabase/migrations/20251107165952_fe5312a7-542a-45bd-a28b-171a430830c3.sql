-- Create a SECURITY DEFINER function to aggregate admin stats reliably
create or replace function public.admin_get_stats()
returns table(
  total_users bigint,
  total_courses bigint,
  total_services bigint,
  total_roles bigint,
  total_leads bigint,
  total_jobs bigint,
  total_customers bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  -- Only allow admins/super_admins to call
  if not (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'super_admin')) then
    raise exception 'not authorized';
  end if;

  return query
  select
    (select count(*) from public.profiles) as total_users,
    (select count(*) from public.training_courses) as total_courses,
    (select count(*) from public.marketplace_services) as total_services,
    (select count(*) from public.user_roles) as total_roles,
    (select count(*) from public.leads) as total_leads,
    (select count(*) from public.jobs) as total_jobs,
    (select count(*) from public.customers) as total_customers;
end;
$$;