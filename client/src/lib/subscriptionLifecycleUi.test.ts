import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("../pages/Subscription.tsx", import.meta.url), "utf8");

describe("subscription lifecycle interface contract", () => {
  it("uses server state rather than a browser-side Razorpay fetch", () => {
    expect(source).toContain('fetchWithTimeout("/api/subscriptions/status"');
    expect(source).not.toContain("subscriptions.fetch");
  });

  it("distinguishes verification errors from inactive subscriptions with safe retry behavior", () => {
    expect(source).toContain('"verification_error"');
    expect(source).toContain("We’re having trouble verifying your subscription. Please try again later.");
    expect(source).toContain(">Retry</button>");
    expect(source).not.toContain("Unexpected server error");
  });

  it("renders a no-subscription upgrade state and keeps cancellation available only for active subscriptions", () => {
    expect(source).toContain("No Pro subscription found.");
    expect(source).toContain('subscription.status === "active"');
    expect(source).toContain("Cancel Subscription");
    expect(source).toContain("Cancellation is scheduled");
  });
});
