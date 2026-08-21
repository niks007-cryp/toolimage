import type { VercelRequest, VercelResponse } from "@vercel/node";
import { apiError, method } from "../_lib/http.js";
import { adminSupabase, requireUser } from "../_lib/supabase.js";
import { razorpay } from "../_lib/razorpay.js";
import { matchesRecordedSubscription, subscriptionPresentation, type ProviderSubscription } from "../_lib/subscriptionState.js";
import { TOOLIMAGE_PRO } from "../../shared/proSubscription.js";

const SENSITIVE_DIAGNOSTIC_VALUE = /\b(?:rzp_(?:live|test)_[A-Za-z0-9]+|(?:sub|cust|pay|order|invoice|inv)_[A-Za-z0-9_]+|bearer\s+\S+|(?:authorization|x-api-key|api[-_ ]?key)\s*[:=]\s*(?:bearer\s+)?\S+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d\s().-]{6,}\d|[A-Za-z0-9_-]{24,})\b/gi;

async function recordedSubscription(userId: string) {
  const db = adminSupabase();
  const { data, error } = await db.from("entitlements").select("razorpay_subscription_id,razorpay_plan_id").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function safeDiagnosticText(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.replace(SENSITIVE_DIAGNOSTIC_VALUE, "[redacted]").replace(/[\u0000-\u001f\u007f]/g, " ").trim();
  return normalized ? normalized.slice(0, 240) : null;
}

function safeDiagnosticToken(value: unknown) {
  const text = safeDiagnosticText(value);
  return text && /^[A-Za-z0-9_-]{1,80}$/.test(text) ? text : null;
}

function safeHttpStatus(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 100 && value <= 599 ? value : null;
}

function logRazorpayFetchFailure(error: unknown) {
  const errorRecord = asRecord(error);
  const providerError = asRecord(errorRecord?.error);
  console.error("[Subscription status] Razorpay fetch failed", {
    providerHttpStatus: safeHttpStatus(errorRecord?.statusCode),
    razorpayErrorCode: safeDiagnosticToken(providerError?.code),
    providerErrorDescription: safeDiagnosticText(providerError?.description),
    providerErrorReason: safeDiagnosticToken(providerError?.reason),
    providerErrorSource: safeDiagnosticToken(providerError?.source),
    providerErrorStep: safeDiagnosticToken(providerError?.step),
    sdkErrorType: error === null ? "null" : Array.isArray(error) ? "array" : typeof error,
    sdkErrorName: error instanceof Error ? safeDiagnosticToken(error.name) : null,
  });
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
    let subscription: ProviderSubscription;
    try {
      subscription = await razorpay().subscriptions.fetch(entitlement.razorpay_subscription_id) as ProviderSubscription;
    } catch (error) {
      logRazorpayFetchFailure(error);
      throw error;
    }
    if (!matchesRecordedSubscription(subscription, entitlement.razorpay_subscription_id, entitlement.razorpay_plan_id)) {
      throw new Error("Subscription ownership could not be confirmed.");
    }
    const state = subscriptionPresentation(subscription);
    res.status(200).json({ subscription: { plan: TOOLIMAGE_PRO.name, price: TOOLIMAGE_PRO.priceWithInterval, status: state.status, providerStatus: state.providerStatus, nextBillingAt: state.currentPeriodEnd, cancellationPending: state.cancellationPending } });
  } catch (error) {
    apiError(res, error, error instanceof Error && error.message === "Unauthorized" ? 401 : 500);
  }
}
