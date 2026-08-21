alter table public.entitlements
  add column if not exists lifecycle_state text,
  add column if not exists cancel_at_cycle_end boolean not null default false,
  add column if not exists provider_event_at timestamptz,
  add column if not exists provider_verification_error_at timestamptz;

alter table public.entitlements
  drop constraint if exists entitlements_lifecycle_state_check;

alter table public.entitlements
  add constraint entitlements_lifecycle_state_check
  check (lifecycle_state is null or lifecycle_state in ('active', 'cancel_at_cycle_end', 'cancelled', 'ended', 'pending', 'halted', 'paused', 'no_subscription', 'verification_error'));

alter table public.razorpay_webhook_events
  add column if not exists razorpay_event_id text,
  add column if not exists provider_event_at timestamptz;

create unique index if not exists razorpay_webhook_events_event_id_unique
  on public.razorpay_webhook_events (razorpay_event_id)
  where razorpay_event_id is not null;
