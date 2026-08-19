import type { VercelRequest, VercelResponse } from "@vercel/node";
import { apiError, method } from "../_lib/http.js";
import { adminSupabase, requireUser } from "../_lib/supabase.js";
import { razorpay } from "../_lib/razorpay.js";
import { matchesRecordedSubscription, subscriptionPresentation, type ProviderSubscription } from "../_lib/subscriptionState.js";
import { TOOLIMAGE_PRO } from "../../shared/proSubscription.js";

async function recordedSubscription(userId: string) {
  const db = adminSupabase();
  const { data, error } = await db.from("entitlements").select("razorpay_subscription_id,razorpay_plan_id").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!method(req, res, "GET")) return;
  try {
    const user = await requireUser(req);
    const entitlement = await recordedSubscription(user.id);
    if (!entitlement?.razorpay_subscription_id) {
      res.status(200).json({ subscription: null });
      return;
    }
    const subscription = await razorpay().subscriptions.fetch(entitlement.razorpay_subscription_id) as ProviderSubscription;
    if (!matchesRecordedSubscription(subscription, entitlement.razorpay_subscription_id, entitlement.razorpay_plan_id)) {
      throw new Error("Subscription ownership could not be confirmed.");
    }
    const state = subscriptionPresentation(subscription);
    res.status(200).json({ subscription: { plan: TOOLIMAGE_PRO.name, price: TOOLIMAGE_PRO.priceWithInterval, status: state.status, providerStatus: state.providerStatus, nextBillingAt: state.currentPeriodEnd, cancellationPending: state.cancellationPending } });
  } catch (error) {
    apiError(res, error, error instanceof Error && error.message === "Unauthorized" ? 401 : 500);
  }
}
