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
    expect(subscription).toContain("We’re having trouble verifying your subscription. Please try again later.");
    expect(subscription).toContain("const retry = () => { if (!loading) setRetryKey");
    expect(subscription).toContain("if (isCurrent()) setLoading(false);");
  });

  it("loads from stable user identity and available session data instead of refreshing on each user object identity change", () => {
    const subscription = source("client/src/pages/Subscription.tsx");
    const initialLoad = subscription.split("const cancel =")[0];
    expect(subscription).toContain("const userId = user?.id ?? null;");
    expect(subscription).toContain("const accessToken = session?.access_token;");
    expect(subscription).toContain("}, [userId, accessToken, retryKey]);");
    expect(subscription).not.toContain("}, [user]);");
    expect(initialLoad).not.toContain("const session = await refresh();");
  });

  it("invalidates stale loads during overlap or unmount so only the current request can write state", () => {
    const subscription = source("client/src/pages/Subscription.tsx");
    expect(subscription).toContain("const loadGenerationRef = useRef(0);");
    expect(subscription).toContain("const isCurrent = () => !invalidated && generation === loadGenerationRef.current;");
    expect((subscription.match(/if \(!isCurrent\(\)\) return;/g) || []).length).toBeGreaterThanOrEqual(2);
    expect(subscription).toContain("invalidated = true;");
    expect(subscription).toContain("loadGenerationRef.current += 1;");
  });

  it("has explicit Free, active-session, error, and no-retry paths", () => {
    const subscription = source("client/src/pages/Subscription.tsx");
    expect(subscription).toContain("if (!userId)");
    expect(subscription).toContain("if (!accessToken)");
    expect(subscription).toContain("setSubscription(body.subscription ?? null);");
    expect(subscription).toContain("setError(SAFE_VERIFICATION_MESSAGE);");
    expect(subscription).not.toContain("setInterval(");
    expect(subscription).not.toContain("setTimeout(() => void");
  });
});
