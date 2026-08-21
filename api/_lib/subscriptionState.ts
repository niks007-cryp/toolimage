export type ProviderSubscription = {
  id?: string;
  status?: string;
  plan_id?: string;
  customer_id?: string;
  current_end?: number;
  has_scheduled_changes?: boolean;
  change_scheduled_at?: string | null;
};

export type SubscriptionLifecycle = "active" | "cancel_at_cycle_end" | "cancelled" | "ended" | "pending" | "halted" | "paused" | "no_subscription" | "verification_error";
export type SubscriptionPresentationStatus = "active" | "cancellation_pending" | "cancelled" | "ended" | "payment_issue" | "inactive" | "verification_error";
export type EntitlementAccessStatus = "pro" | "grace" | "inactive";

export type StoredSubscriptionState = {
  status?: string | null;
  razorpay_subscription_id?: string | null;
  provider_status?: string | null;
  current_period_end?: string | null;
  lifecycle_state?: string | null;
  cancel_at_cycle_end?: boolean | null;
  provider_verification_error?: boolean | null;
};

const periodIsFuture = (periodEnd?: number | null) => Boolean(periodEnd && periodEnd * 1000 > Date.now());
const storedPeriodIsFuture = (periodEnd?: string | null) => Boolean(periodEnd && new Date(periodEnd).getTime() > Date.now());

export function matchesRecordedSubscription(snapshot: ProviderSubscription, subscriptionId: string, planId?: string | null) {
  return snapshot.id === subscriptionId && (!planId || snapshot.plan_id === planId);
}

export function shouldApplyProviderEvent(storedEventAt: string | null | undefined, incomingEventAt: string | null | undefined) {
  if (!storedEventAt) return true;
  if (!incomingEventAt) return false;
  return new Date(incomingEventAt).getTime() >= new Date(storedEventAt).getTime();
}

export function lifecycleForProvider(snapshot: ProviderSubscription) {
  const providerStatus = snapshot.status || "inactive";
  const cancellationPending = (providerStatus === "active" && Boolean(snapshot.has_scheduled_changes || snapshot.change_scheduled_at === "cycle_end")) || (providerStatus === "cancelled" && periodIsFuture(snapshot.current_end));
  const lifecycle: SubscriptionLifecycle = cancellationPending
    ? "cancel_at_cycle_end"
    : providerStatus === "active"
      ? "active"
      : providerStatus === "cancelled"
        ? "cancelled"
        : providerStatus === "completed" || providerStatus === "expired"
          ? "ended"
          : providerStatus === "pending"
            ? "pending"
            : providerStatus === "halted"
              ? "halted"
              : providerStatus === "paused"
                ? "paused"
                : "no_subscription";
  const entitlementStatus: EntitlementAccessStatus = lifecycle === "active" || lifecycle === "cancel_at_cycle_end"
    ? (lifecycle === "active" ? "pro" : providerStatus === "active" ? "pro" : "grace")
    : (lifecycle === "pending" || lifecycle === "halted" || lifecycle === "paused") && periodIsFuture(snapshot.current_end)
      ? "grace"
      : "inactive";
  return {
    lifecycle,
    providerStatus,
    cancellationPending,
    currentPeriodEnd: snapshot.current_end ? new Date(snapshot.current_end * 1000).toISOString() : null,
    entitlementStatus,
  };
}

export function entitlementStatusForProvider(status: string, periodEnd?: number) {
  return lifecycleForProvider({ status, current_end: periodEnd }).entitlementStatus;
}

export function subscriptionPresentation(snapshot: ProviderSubscription) {
  const state = lifecycleForProvider(snapshot);
  const status: SubscriptionPresentationStatus = state.lifecycle === "active"
    ? "active"
    : state.lifecycle === "cancel_at_cycle_end"
      ? "cancellation_pending"
      : state.lifecycle === "cancelled"
        ? "cancelled"
        : state.lifecycle === "ended"
          ? "ended"
          : state.lifecycle === "pending" || state.lifecycle === "halted" || state.lifecycle === "paused"
            ? "payment_issue"
            : "inactive";
  return { ...state, status, verificationError: false };
}

export function presentationFromStoredState(stored: StoredSubscriptionState) {
  const lifecycle = (stored.lifecycle_state || "") as SubscriptionLifecycle;
  const legacyPro = !lifecycle && stored.status === "pro" && Boolean(stored.razorpay_subscription_id);
  const legacyGrace = !lifecycle && stored.status === "grace" && Boolean(stored.razorpay_subscription_id) && storedPeriodIsFuture(stored.current_period_end);
  const effectiveLifecycle: SubscriptionLifecycle = lifecycle || (legacyPro ? "active" : legacyGrace ? "cancel_at_cycle_end" : "no_subscription");
  const providerStatus = stored.provider_status || (legacyPro || legacyGrace ? "active" : "inactive");
  const cancellationPending = Boolean(stored.cancel_at_cycle_end || effectiveLifecycle === "cancel_at_cycle_end");
  const trustedActive = legacyPro || legacyGrace || ((stored.status === "pro" || stored.status === "grace") && (effectiveLifecycle === "active" || effectiveLifecycle === "cancel_at_cycle_end" || (effectiveLifecycle === "pending" || effectiveLifecycle === "halted" || effectiveLifecycle === "paused") && storedPeriodIsFuture(stored.current_period_end)));
  const verificationError = Boolean(stored.provider_verification_error);
  if (verificationError && !trustedActive) {
    return { status: "verification_error" as const, lifecycle: "verification_error" as const, providerStatus, cancellationPending: false, currentPeriodEnd: stored.current_period_end || null, entitlementStatus: "inactive" as const, verificationError: true };
  }
  const status: SubscriptionPresentationStatus = effectiveLifecycle === "active"
    ? "active"
    : effectiveLifecycle === "cancel_at_cycle_end"
      ? "cancellation_pending"
      : effectiveLifecycle === "cancelled"
        ? "cancelled"
        : effectiveLifecycle === "ended"
          ? "ended"
          : effectiveLifecycle === "pending" || effectiveLifecycle === "halted" || effectiveLifecycle === "paused"
            ? "payment_issue"
            : "inactive";
  return { status, lifecycle: effectiveLifecycle, providerStatus, cancellationPending, currentPeriodEnd: stored.current_period_end || null, entitlementStatus: (stored.status === "pro" || stored.status === "grace") ? stored.status : "inactive", verificationError };
}
