-- Keep trigger-only provisioning functions inaccessible through the public REST RPC surface.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Webhook event rows are service-role-only. This explicit deny policy documents that client access is never permitted.
drop policy if exists "webhook_events_deny_client_access" on public.razorpay_webhook_events;
create policy "webhook_events_deny_client_access"
on public.razorpay_webhook_events
for all
to anon, authenticated
using (false)
with check (false);
