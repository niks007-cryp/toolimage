-- ToolImage payment foundation: server-managed Pro entitlements only.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'free' check (status in ('free', 'pro', 'grace', 'inactive')),
  razorpay_customer_id text,
  razorpay_subscription_id text unique,
  razorpay_plan_id text,
  provider_status text,
  current_period_end timestamptz,
  provider_updated_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  razorpay_subscription_id text not null unique,
  razorpay_plan_id text not null,
  display_region text not null,
  status text not null default 'created' check (status in ('created', 'verified', 'failed', 'expired')),
  created_at timestamptz not null default now(),
  verified_at timestamptz
);

create table if not exists public.razorpay_webhook_events (
  fingerprint text primary key,
  event_type text not null,
  razorpay_subscription_id text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  payload jsonb not null
);

create index if not exists payment_sessions_user_id_idx on public.payment_sessions(user_id);
create index if not exists razorpay_webhook_events_subscription_idx on public.razorpay_webhook_events(razorpay_subscription_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists entitlements_set_updated_at on public.entitlements;
create trigger entitlements_set_updated_at
before update on public.entitlements
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;

  insert into public.entitlements (user_id, status)
  values (new.id, 'free')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.entitlements enable row level security;
alter table public.payment_sessions enable row level security;
alter table public.razorpay_webhook_events enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "entitlements_select_own" on public.entitlements;
create policy "entitlements_select_own"
on public.entitlements for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "payment_sessions_select_own" on public.payment_sessions;
create policy "payment_sessions_select_own"
on public.payment_sessions for select
to authenticated
using ((select auth.uid()) = user_id);

-- No client write policy exists for payment or entitlement data. Vercel API functions use the service role.
