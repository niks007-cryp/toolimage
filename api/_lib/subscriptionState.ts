export type ProviderSubscription = {
  id?: string;
  status?: string;
  plan_id?: string;
  customer_id?: string;
  current_end?: number;
  has_scheduled_changes?: boolean;
  change_scheduled_at?: string | null;
};

export type SubscriptionPresentationStatus = "active" | "cancellation_pending" | "cancelled" | "expired" | "payment_issue" | "inactive";

export function matchesRecordedSubscription(snapshot: ProviderSubscription, subscriptionId: string, planId?: string | null) {
  return snapshot.id === subscriptionId && (!planId || snapshot.plan_id === planId);
}

export function entitlementStatusForProvider(status: string, periodEnd?: number) {
  if (status === "active") return "pro";
  if (["cancelled", "completed", "paused", "halted", "pending"].includes(status) && periodEnd && periodEnd * 1000 > Date.now()) return "grace";
  return "inactive";
}

export function subscriptionPresentation(snapshot: ProviderSubscription) {
  const providerStatus = snapshot.status || "inactive";
  const cancellationPending = providerStatus === "active" && Boolean(snapshot.has_scheduled_changes || snapshot.change_scheduled_at === "cycle_end");
  const status: SubscriptionPresentationStatus = cancellationPending
    ? "cancellation_pending"
    : providerStatus === "active"
      ? "active"
      : providerStatus === "cancelled"
        ? "cancelled"
        : providerStatus === "expired" || providerStatus === "completed"
          ? "expired"
          : providerStatus === "pending" || providerStatus === "halted" || providerStatus === "paused"
            ? "payment_issue"
            : "inactive";

  return {
    status,
    providerStatus,
    cancellationPending,
    currentPeriodEnd: snapshot.current_end ? new Date(snapshot.current_end * 1000).toISOString() : null,
    entitlementStatus: entitlementStatusForProvider(providerStatus, snapshot.current_end),
  };
}
