import { describe, expect, it } from "vitest";
import { TOOLIMAGE_PRO } from "../../../shared/proSubscription";
import { TOOLIMAGE_PRO_PLAN_ID } from "../../../api/_lib/toolimageProPlan";
import { entitlementStatusForProvider, matchesRecordedSubscription, subscriptionPresentation } from "../../../api/_lib/subscriptionState";

const future = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
const past = Math.floor(Date.now() / 1000) - 60;

describe("ToolImage Pro Live subscription state", () => {
  it("pins commercial facts to the confirmed ₹149 INR monthly Live plan", () => {
    expect(TOOLIMAGE_PRO).toMatchObject({ name: "ToolImage Pro", priceWithInterval: "₹149/month", currency: "INR", interval: "month", trial: "None" });
    expect(TOOLIMAGE_PRO_PLAN_ID).toBe("plan_TRGdfbe7eayNRL");
  });
  it("treats only the recorded subscription and plan as owned by the user", () => {
    expect(matchesRecordedSubscription({ id: "sub_owner", plan_id: TOOLIMAGE_PRO_PLAN_ID }, "sub_owner", TOOLIMAGE_PRO_PLAN_ID)).toBe(true);
    expect(matchesRecordedSubscription({ id: "sub_other", plan_id: TOOLIMAGE_PRO_PLAN_ID }, "sub_owner", TOOLIMAGE_PRO_PLAN_ID)).toBe(false);
    expect(matchesRecordedSubscription({ id: "sub_owner", plan_id: "plan_other" }, "sub_owner", TOOLIMAGE_PRO_PLAN_ID)).toBe(false);
  });
  it("keeps Pro through a provider-confirmed scheduled cycle-end cancellation", () => {
    expect(subscriptionPresentation({ id: "sub_active", status: "active", has_scheduled_changes: true, current_end: future })).toMatchObject({ status: "cancellation_pending", cancellationPending: true, entitlementStatus: "pro" });
  });
  it("maps cancelled, expired, and payment-problem provider states honestly", () => {
    expect(subscriptionPresentation({ status: "cancelled", current_end: future })).toMatchObject({ status: "cancellation_pending", entitlementStatus: "grace" });
    expect(subscriptionPresentation({ status: "expired", current_end: past }).status).toBe("ended");
    expect(subscriptionPresentation({ status: "pending", current_end: future })).toMatchObject({ status: "payment_issue", entitlementStatus: "grace" });
    expect(entitlementStatusForProvider("pending", past)).toBe("inactive");
  });
});
