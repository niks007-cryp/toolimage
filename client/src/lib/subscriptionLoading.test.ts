import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("subscription loading resilience", () => {
  it("bounds the shared session and entitlement waits before clearing global loading", () => {
    const entitlement = source("client/src/contexts/EntitlementContext.tsx");
    expect(entitlement).toContain('withTimeout(supabase.auth.getSession(), AUTH_SESSION_TIMEOUT_MS, "Session check timed out.")');
    expect(entitlement).toContain('fetchWithTimeout("/api/entitlement"');
    expect(entitlement).toContain("setLoading(false);");
  });

  it("bounds subscription status loading and surfaces a retryable error instead of a permanent checker", () => {
    const subscription = source("client/src/pages/Subscription.tsx");
    expect(subscription).toContain('fetchWithTimeout("/api/subscriptions/status"');
    expect(subscription).toContain('"Subscription check timed out. Please try again."');
    expect(subscription).toContain("finally { setLoading(false); }");
  });
});
