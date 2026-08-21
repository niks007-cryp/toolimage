import { describe, expect, it } from "vitest";
import { lifecycleForProvider, presentationFromStoredState, shouldApplyProviderEvent } from "../../../api/_lib/subscriptionState";

const future = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
const past = Math.floor(Date.now() / 1000) - 60;

describe("server-confirmed subscription lifecycle", () => {
  it("maps an active verified subscription to durable active Pro state", () => {
    expect(lifecycleForProvider({ status: "active", current_end: future })).toMatchObject({ lifecycle: "active", entitlementStatus: "pro", cancellationPending: false });
  });

  it("keeps Pro through a provider-confirmed cycle-end cancellation", () => {
    expect(lifecycleForProvider({ status: "active", has_scheduled_changes: true, current_end: future })).toMatchObject({ lifecycle: "cancel_at_cycle_end", entitlementStatus: "pro", cancellationPending: true });
    expect(lifecycleForProvider({ status: "cancelled", current_end: future })).toMatchObject({ lifecycle: "cancel_at_cycle_end", entitlementStatus: "grace" });
  });

  it("maps external pending, halted, paused, resumed, and completed events without inventing a UPI-specific state", () => {
    expect(lifecycleForProvider({ status: "pending", current_end: future })).toMatchObject({ lifecycle: "pending", entitlementStatus: "grace" });
    expect(lifecycleForProvider({ status: "halted", current_end: past })).toMatchObject({ lifecycle: "halted", entitlementStatus: "inactive" });
    expect(lifecycleForProvider({ status: "paused", current_end: future })).toMatchObject({ lifecycle: "paused", entitlementStatus: "grace" });
    expect(lifecycleForProvider({ status: "active", current_end: future })).toMatchObject({ lifecycle: "active", entitlementStatus: "pro" });
    expect(lifecycleForProvider({ status: "completed", current_end: past })).toMatchObject({ lifecycle: "ended", entitlementStatus: "inactive" });
  });

  it("does not allow a stale provider event to overwrite a newer lifecycle snapshot", () => {
    expect(shouldApplyProviderEvent("2026-08-21T12:00:00.000Z", "2026-08-21T11:59:59.000Z")).toBe(false);
    expect(shouldApplyProviderEvent("2026-08-21T12:00:00.000Z", "2026-08-21T12:00:01.000Z")).toBe(true);
    expect(shouldApplyProviderEvent(null, "2026-08-21T12:00:00.000Z")).toBe(true);
  });

  it("preserves a known valid active local state during temporary provider verification failure", () => {
    expect(presentationFromStoredState({ status: "pro", provider_status: "active", current_period_end: new Date(future * 1000).toISOString(), lifecycle_state: "active", cancel_at_cycle_end: false, provider_verification_error: true })).toMatchObject({ status: "active", verificationError: true, cancellationPending: false });
  });

  it("recognizes legacy server-confirmed Pro and valid Grace records with no lifecycle snapshot", () => {
    expect(presentationFromStoredState({ status: "pro", razorpay_subscription_id: "stored-reference", provider_status: null, current_period_end: null, lifecycle_state: null, cancel_at_cycle_end: false, provider_verification_error: false })).toMatchObject({ status: "active", lifecycle: "active", providerStatus: "active", verificationError: false });
    expect(presentationFromStoredState({ status: "grace", razorpay_subscription_id: "stored-reference", provider_status: null, current_period_end: new Date(future * 1000).toISOString(), lifecycle_state: null, cancel_at_cycle_end: false, provider_verification_error: false })).toMatchObject({ status: "cancellation_pending", lifecycle: "cancel_at_cycle_end", cancellationPending: true, verificationError: false });
  });

  it("does not recognize a legacy record without a stored subscription reference or a valid Grace period", () => {
    expect(presentationFromStoredState({ status: "pro", razorpay_subscription_id: null, provider_status: null, current_period_end: null, lifecycle_state: null, cancel_at_cycle_end: false, provider_verification_error: false })).toMatchObject({ status: "inactive", lifecycle: "no_subscription" });
    expect(presentationFromStoredState({ status: "grace", razorpay_subscription_id: "stored-reference", provider_status: null, current_period_end: new Date(past * 1000).toISOString(), lifecycle_state: null, cancel_at_cycle_end: false, provider_verification_error: false })).toMatchObject({ status: "inactive", lifecycle: "no_subscription" });
  });

  it("returns a distinct verification-error state when no trustworthy local subscription state exists", () => {
    expect(presentationFromStoredState({ status: "inactive", provider_status: null, current_period_end: null, lifecycle_state: null, cancel_at_cycle_end: false, provider_verification_error: true })).toMatchObject({ status: "verification_error", verificationError: true });
  });
});
