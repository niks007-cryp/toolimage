import type { VercelRequest, VercelResponse } from "@vercel/node";
import { apiError, method } from "../_lib/http.js";
import { adminSupabase, requireUser } from "../_lib/supabase.js";
import { razorpay } from "../_lib/razorpay.js";
import { matchesRecordedSubscription, subscriptionPresentation, type ProviderSubscription } from "../_lib/subscriptionState.js";
import { TOOLIMAGE_PRO } from "../../shared/proSubscription.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!method(req, res, "POST")) return;
  try {
    const user = await requireUser(req);
    const db = adminSupabase();
    const { data: entitlement, error } = await db.from("entitlements").select("razorpay_subscription_id,razorpay_plan_id").eq("user_id", user.id).maybeSingle();
    if (error) throw error;
    if (!entitlement?.razorpay_subscription_id) throw new Error("No subscription is available to cancel.");

    const provider = razorpay();
    const existing = await provider.subscriptions.fetch(entitlement.razorpay_subscription_id) as ProviderSubscription;
    if (!matchesRecordedSubscription(existing, entitlement.razorpay_subscription_id, entitlement.razorpay_plan_id)) throw new Error("Subscription ownership could not be confirmed.");
    const before = subscriptionPresentation(existing);
    if (before.cancellationPending) {
      res.status(200).json({ cancelled: false, alreadyScheduled: true, status: before.status, nextBillingAt: before.currentPeriodEnd });
      return;
    }
    if (before.status !== "active") throw new Error("Only an active Pro subscription can be cancelled.");

    const cancelled = await provider.subscriptions.cancel(entitlement.razorpay_subscription_id, true) as ProviderSubscription;
    if (cancelled.id !== entitlement.razorpay_subscription_id) throw new Error("Razorpay did not confirm this cancellation.");
    const state = subscriptionPresentation(cancelled);
    const { error: updateError } = await db.from("entitlements").update({ status: state.entitlementStatus, provider_status: state.providerStatus, current_period_end: state.currentPeriodEnd, provider_updated_at: new Date().toISOString() }).eq("user_id", user.id).eq("razorpay_subscription_id", entitlement.razorpay_subscription_id);
    if (updateError) throw updateError;
    res.status(200).json({ cancelled: state.cancellationPending || state.status === "cancelled", alreadyScheduled: false, plan: TOOLIMAGE_PRO.name, status: state.status, nextBillingAt: state.currentPeriodEnd, cancellationPending: state.cancellationPending });
  } catch (error) {
    apiError(res, error, error instanceof Error && error.message === "Unauthorized" ? 401 : 400);
  }
}
