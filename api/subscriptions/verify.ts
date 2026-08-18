import { createHmac, timingSafeEqual } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { apiError, method, readJson } from "../_lib/http";
import { adminSupabase, requireUser } from "../_lib/supabase";

const activeStatuses = new Set(["active"]);
function safeEquals(left: string, right: string) { const a = Buffer.from(left); const b = Buffer.from(right); return a.length === b.length && timingSafeEqual(a, b); }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!method(req, res, "POST")) return;
  try {
    const user = await requireUser(req); const body = await readJson(req);
    const subscriptionId = typeof body.subscriptionId === "string" ? body.subscriptionId : "";
    const paymentId = typeof body.paymentId === "string" ? body.paymentId : "";
    const signature = typeof body.signature === "string" ? body.signature : "";
    if (!subscriptionId || !paymentId || !signature) throw new Error("Incomplete Razorpay verification data.");
    const secret = process.env.RAZORPAY_KEY_SECRET; if (!secret) throw new Error("Razorpay Test Mode is not configured.");
    const expected = createHmac("sha256", secret).update(`${paymentId}|${subscriptionId}`).digest("hex");
    if (!safeEquals(expected, signature)) throw new Error("Razorpay signature verification failed.");
    const db = adminSupabase();
    const { data: paymentSession, error: sessionError } = await db.from("payment_sessions").select("id,user_id").eq("razorpay_subscription_id", subscriptionId).eq("user_id", user.id).maybeSingle();
    if (sessionError) throw sessionError; if (!paymentSession) throw new Error("This subscription does not belong to the signed-in account.");
    const provider = await (await import("razorpay")).default; const client = new provider({ key_id: process.env.RAZORPAY_KEY_ID!, key_secret: secret });
    const subscription = await client.subscriptions.fetch(subscriptionId) as unknown as { status?: string; customer_id?: string; plan_id?: string; current_end?: number; created_at?: number };
    const providerStatus = subscription.status || "authenticated"; const status = activeStatuses.has(providerStatus) ? "pro" : "free";
    const currentPeriodEnd = subscription.current_end ? new Date(subscription.current_end * 1000).toISOString() : null;
    const { error: updateError } = await db.from("payment_sessions").update({ status: "verified", verified_at: new Date().toISOString() }).eq("id", paymentSession.id); if (updateError) throw updateError;
    const { error: entitlementError } = await db.from("entitlements").upsert({ user_id: user.id, status, razorpay_customer_id: subscription.customer_id || null, razorpay_subscription_id: subscriptionId, razorpay_plan_id: subscription.plan_id || null, provider_status: providerStatus, current_period_end: currentPeriodEnd, provider_updated_at: new Date().toISOString() }, { onConflict: "user_id" }); if (entitlementError) throw entitlementError;
    res.status(200).json({ verified: true, active: status === "pro", providerStatus });
  } catch (error) { apiError(res, error, error instanceof Error && error.message === "Unauthorized" ? 401 : 400); }
}
