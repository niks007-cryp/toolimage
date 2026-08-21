import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { apiError, readRaw } from "../_lib/http.js";
import { adminSupabase } from "../_lib/supabase.js";
import { lifecycleForProvider, shouldApplyProviderEvent, type ProviderSubscription } from "../_lib/subscriptionState.js";

export const config = { api: { bodyParser: false } };
type RazorpayWebhook = { event?: string; created_at?: number; payload?: { subscription?: { entity?: ProviderSubscription } } };

function equals(left: string, right: string) { const a = Buffer.from(left); const b = Buffer.from(right); return a.length === b.length && timingSafeEqual(a, b); }
function eventTime(event: RazorpayWebhook) { return typeof event.created_at === "number" ? new Date(event.created_at * 1000).toISOString() : null; }
function headerValue(value: string | string[] | undefined) { return typeof value === "string" && value.length <= 255 ? value : null; }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); res.status(405).json({ error: "Method not allowed" }); return; }
  try {
    const raw = await readRaw(req); const secret = process.env.RAZORPAY_WEBHOOK_SECRET; const signature = req.headers["x-razorpay-signature"];
    if (!secret || typeof signature !== "string") throw new Error("Webhook authorization failed.");
    const expected = createHmac("sha256", secret).update(raw).digest("hex"); if (!equals(expected, signature)) throw new Error("Webhook signature verification failed.");
    const event = JSON.parse(raw.toString("utf8")) as RazorpayWebhook; const subscription = event.payload?.subscription?.entity; const subscriptionId = subscription?.id;
    if (!event.event || !subscriptionId) throw new Error("Unsupported Razorpay webhook payload.");
    const db = adminSupabase(); const fingerprint = createHash("sha256").update(raw).digest("hex"); const razorpayEventId = headerValue(req.headers["x-razorpay-event-id"]); const providerEventAt = eventTime(event);
    const { error: insertError } = await db.from("razorpay_webhook_events").insert({ fingerprint, razorpay_event_id: razorpayEventId, event_type: event.event, razorpay_subscription_id: subscriptionId, provider_event_at: providerEventAt, payload: event });
    if (insertError?.code === "23505") { res.status(200).json({ received: true, duplicate: true }); return; } if (insertError) throw insertError;
    const { data: paymentSession, error: sessionError } = await db.from("payment_sessions").select("user_id").eq("razorpay_subscription_id", subscriptionId).maybeSingle(); if (sessionError) throw sessionError;
    const { data: existingEntitlement, error: entitlementLookupError } = await db.from("entitlements").select("user_id,provider_event_at").eq("razorpay_subscription_id", subscriptionId).maybeSingle(); if (entitlementLookupError) throw entitlementLookupError;
    const userId = paymentSession?.user_id || existingEntitlement?.user_id;
    if (userId) {
      if (!shouldApplyProviderEvent(existingEntitlement?.provider_event_at || null, providerEventAt)) {
        await db.from("razorpay_webhook_events").update({ processed_at: new Date().toISOString() }).eq("fingerprint", fingerprint); res.status(200).json({ received: true, stale: true }); return;
      }
      const state = lifecycleForProvider(subscription);
      const payload = { user_id: userId, status: state.entitlementStatus, razorpay_customer_id: subscription.customer_id || null, razorpay_subscription_id: subscriptionId, razorpay_plan_id: subscription.plan_id || null, provider_status: state.providerStatus, current_period_end: state.currentPeriodEnd, lifecycle_state: state.lifecycle, cancel_at_cycle_end: state.cancellationPending, provider_event_at: providerEventAt, provider_verification_error_at: null, provider_updated_at: new Date().toISOString() };
      const { error: entitlementError } = await db.from("entitlements").upsert(payload, { onConflict: "user_id" }); if (entitlementError) throw entitlementError;
    }
    await db.from("razorpay_webhook_events").update({ processed_at: new Date().toISOString() }).eq("fingerprint", fingerprint); res.status(200).json({ received: true });
  } catch (error) { apiError(res, error, 400); }
}
