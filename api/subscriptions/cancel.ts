import type { VercelRequest, VercelResponse } from "@vercel/node";
import { method } from "../_lib/http.js";
import { adminSupabase, requireUser } from "../_lib/supabase.js";
import { razorpay } from "../_lib/razorpay.js";
import { matchesRecordedSubscription, subscriptionPresentation, type ProviderSubscription } from "../_lib/subscriptionState.js";
import { SUBSCRIPTION_VERIFICATION_MESSAGE, subscriptionErrorStatus } from "../_lib/subscriptionErrors.js";
import { TOOLIMAGE_PRO } from "../../shared/proSubscription.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!method(req, res, "POST")) return;
  try {
    const user = await requireUser(req);
    const db = adminSupabase();
    const { data: entitlement, error } = await db.from("entitlements").select("razorpay_subscription_id,razorpay_plan_id").eq("user_id", user.id).maybeSingle();
    if (error) throw error;
    if (!entitlement?.razorpay_subscription_id) {
      res.status(404).json({ error: "No subscription is available to cancel." });
      return;
    }
    const provider = razorpay();
    const existing = await provider.subscriptions.fetch(entitlement.razorpay_subscription_id) as ProviderSubscription;
    if (!matchesRecordedSubscription(existing, entitlement.razorpay_subscription_id, entitlement.razorpay_plan_id)) {
      res.status(403).json({ error: "Subscription ownership could not be confirmed." });
      return;
    }
    const before = subscriptionPresentation(existing);
    if (before.cancellationPending) {
      res.status(200).json({ cancelled: false, alreadyScheduled: true, status: before.status, nextBillingAt: before.currentPeriodEnd });
      return;
    }
    if (before.status !== "active") {
      res.status(400).json({ error: "Only an active Pro subscription can be cancelled." });
      return;
    }
    const cancelled = await provider.subscriptions.cancel(entitlement.razorpay_subscription_id, true) as ProviderSubscription;
    if (cancelled.id !== entitlement.razorpay_subscription_id) throw new Error("Provider cancellation confirmation mismatch.");
    const state = subscriptionPresentation(cancelled);
    const { error: updateError } = await db.from("entitlements").update({ status: state.entitlementStatus, provider_status: state.providerStatus, current_period_end: state.currentPeriodEnd, lifecycle_state: state.lifecycle, cancel_at_cycle_end: state.cancellationPending, provider_event_at: new Date().toISOString(), provider_verification_error_at: null, provider_updated_at: new Date().toISOString() }).eq("user_id", user.id).eq("razorpay_subscription_id", entitlement.razorpay_subscription_id);
    if (updateError) throw updateError;
    res.status(200).json({ cancelled: state.cancellationPending || state.status === "cancelled", alreadyScheduled: false, plan: TOOLIMAGE_PRO.name, status: state.status, nextBillingAt: state.currentPeriodEnd, cancellationPending: state.cancellationPending });
  } catch (error) {
    if (subscriptionErrorStatus(error) === 401) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    res.status(503).json({ error: SUBSCRIPTION_VERIFICATION_MESSAGE });
  }
}
