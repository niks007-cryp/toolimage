import type { VercelRequest, VercelResponse } from "@vercel/node";
import { method } from "../_lib/http.js";
import { adminSupabase, requireUser } from "../_lib/supabase.js";
import { presentationFromStoredState } from "../_lib/subscriptionState.js";
import { SUBSCRIPTION_VERIFICATION_MESSAGE, subscriptionErrorStatus } from "../_lib/subscriptionErrors.js";
import { TOOLIMAGE_PRO } from "../../shared/proSubscription.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!method(req, res, "GET")) return;
  try {
    const user = await requireUser(req);
    const db = adminSupabase();
    const { data: entitlement, error } = await db.from("entitlements").select("status,razorpay_subscription_id,provider_status,current_period_end,lifecycle_state,cancel_at_cycle_end,provider_verification_error_at").eq("user_id", user.id).maybeSingle();
    if (error) throw error;
    if (!entitlement?.razorpay_subscription_id) {
      res.status(200).json({ subscription: null, verificationError: false });
      return;
    }
    const state = presentationFromStoredState({ ...entitlement, provider_verification_error: Boolean(entitlement.provider_verification_error_at) });
    res.status(200).json({
      subscription: {
        plan: TOOLIMAGE_PRO.name,
        price: TOOLIMAGE_PRO.priceWithInterval,
        status: state.status,
        lifecycle: state.lifecycle,
        providerStatus: state.providerStatus,
        nextBillingAt: state.currentPeriodEnd,
        cancellationPending: state.cancellationPending,
        verificationError: state.verificationError,
      },
      verificationError: state.verificationError,
      verificationMessage: state.verificationError ? SUBSCRIPTION_VERIFICATION_MESSAGE : null,
    });
  } catch (error) {
    if (subscriptionErrorStatus(error) === 401) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    res.status(503).json({ subscription: null, verificationError: true, error: SUBSCRIPTION_VERIFICATION_MESSAGE });
  }
}
