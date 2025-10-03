-- Create profiles table first
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  contact_name text,
  company_name text,
  phone text,
  business_address text,
  city text,
  state text,
  zip_code text,
  logo_url text,
  subscription_tier text,
  trade text,
  tax_id text,
  username text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- Create tier subscription table
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  tier_id text not null check (tier_id in ('launch', 'growth', 'accel')),
  billing_cycle text not null check (billing_cycle in ('quarterly', 'yearly')),
  status text not null default 'active' check (status in ('active', 'cancelled', 'expired')),
  clover_payment_id text,
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS on subscriptions
alter table public.subscriptions enable row level security;

-- Subscriptions policies
create policy "Users can view own subscription"
  on public.subscriptions
  for select
  using (auth.uid() = user_id);

create policy "Users can create own subscription"
  on public.subscriptions
  for insert
  with check (auth.uid() = user_id);

-- Function to get user tier
create or replace function public.get_user_tier(user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select tier_id
  from public.subscriptions
  where subscriptions.user_id = get_user_tier.user_id
    and status = 'active'
  limit 1;
$$;

-- Function to check if user has full access (myct1.com domain)
create or replace function public.has_full_access(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from auth.users
    where id = has_full_access.user_id
      and email like '%@myct1.com'
  );
$$;

-- Trigger to update updated_at timestamp
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.update_updated_at();

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row
  execute function public.update_updated_at();