import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { apiError, readRaw } from "../_lib/http";
import { adminSupabase } from "../_lib/supabase";

export const config = { api: { bodyParser: false } };
type Subscription = { id?: string; status?: string; customer_id?: string; plan_id?: string; current_end?: number };
function equals(left: string, right: string) { const a = Buffer.from(left); const b = Buffer.from(right); return a.length === b.length && timingSafeEqual(a, b); }
function entitlementStatus(status: string, periodEnd?: number) { if (status === "active") return "pro"; if (["cancelled", "completed", "paused", "halted", "pending"].includes(status) && periodEnd && periodEnd * 1000 > Date.now()) return "grace"; return "inactive"; }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); res.status(405).json({ error: "Method not allowed" }); return; }
  try {
    const raw = await readRaw(req); const secret = process.env.RAZORPAY_WEBHOOK_SECRET; const signature = req.headers["x-razorpay-signature"];
    if (!secret || typeof signature !== "string") throw new Error("Webhook authorization failed.");
    const expected = createHmac("sha256", secret).update(raw).digest("hex"); if (!equals(expected, signature)) throw new Error("Webhook signature verification failed.");
    const event = JSON.parse(raw.toString("utf8")) as { event?: string; payload?: { subscription?: { entity?: Subscription } } }; const subscription = event.payload?.subscription?.entity; const subscriptionId = subscription?.id;
    if (!event.event || !subscriptionId) throw new Error("Unsupported Razorpay webhook payload.");
    const db = adminSupabase(); const fingerprint = createHash("sha256").update(raw).digest("hex");
    const { error: insertError } = await db.from("razorpay_webhook_events").insert({ fingerprint, event_type: event.event, razorpay_subscription_id: subscriptionId, payload: event });
    if (insertError?.code === "23505") { res.status(200).json({ received: true, duplicate: true }); return; } if (insertError) throw insertError;
    const { data: paymentSession, error: sessionError } = await db.from("payment_sessions").select("user_id").eq("razorpay_subscription_id", subscriptionId).maybeSingle(); if (sessionError) throw sessionError;
    if (paymentSession) {
      const providerStatus = subscription.status || "inactive"; const currentPeriodEnd = subscription.current_end ? new Date(subscription.current_end * 1000).toISOString() : null;
      const { error: entitlementError } = await db.from("entitlements").upsert({ user_id: paymentSession.user_id, status: entitlementStatus(providerStatus, subscription.current_end), razorpay_customer_id: subscription.customer_id || null, razorpay_subscription_id: subscriptionId, razorpay_plan_id: subscription.plan_id || null, provider_status: providerStatus, current_period_end: currentPeriodEnd, provider_updated_at: new Date().toISOString() }, { onConflict: "user_id" }); if (entitlementError) throw entitlementError;
    }
    await db.from("razorpay_webhook_events").update({ processed_at: new Date().toISOString() }).eq("fingerprint", fingerprint); res.status(200).json({ received: true });
  } catch (error) { apiError(res, error, 400); }
}
