import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("account, subscription, and batch parity contracts", () => {
  const shell = source("client/src/components/SiteShell.tsx");
  const router = source("client/src/App.tsx");
  const batch = source("client/src/pages/Batch.tsx");
  const accessPanel = source("client/src/components/ProAccessPanel.tsx");
  const subscription = source("client/src/pages/Subscription.tsx");
  const pricing = source("client/src/pages/Pricing.tsx");
  const welcomeCard = source("client/src/components/ProWelcomeCard.tsx");

  it("renders authenticated account state and global sign out without exposing the user email", () => {
    expect(shell).toContain('useEntitlement()');
    expect(shell).toContain('aria-label="Signed in"');
    expect(shell).toContain('>Account</span>');
    expect(shell).toContain('> Sign out</button>');
    expect(shell).not.toContain("user.email");
  });

  it("renders an unauthenticated sign-in action and equivalent mobile account controls", () => {
    expect(shell).toContain('href="/pricing#sign-in"');
    expect(shell).toContain('> Sign in</Link>');
    expect(shell).toContain('className="mobile-account-action"');
    expect(shell).toContain('className="mobile-account-state"');
  });

  it("routes global and access-panel sign out to the stable Pricing authentication section", () => {
    expect(shell).toContain('window.location.assign("/pricing#sign-in")');
    expect(shell).toContain('window.location.hash = "sign-in"');
    expect(accessPanel).toContain('window.location.assign("/pricing#sign-in")');
    expect(accessPanel).toContain('id="sign-in"');
    expect(pricing).toContain('document.getElementById("sign-in")?.scrollIntoView');
    expect(pricing).toContain('window.addEventListener("hashchange", revealSignIn)');
  });

  it("shows the Pro badge only when the existing server-confirmed entitlement derives isPro", () => {
    expect(shell).toContain('!entitlementLoading && isPro && <Link href="/subscription" className="pro-status"');
    expect(shell).not.toContain("localStorage");
  });

  it("registers the authenticated subscription-management destination and reuses protected endpoints", () => {
    expect(router).toContain('path="/subscription" component={Subscription}');
    expect(subscription).toContain('fetch("/api/subscriptions/status"');
    expect(subscription).toContain('fetch("/api/subscriptions/cancel"');
    expect(subscription).toContain('if (!user) { setSubscription(null); return; }');
  });

  it("keeps the anonymous batch gate and server-confirmed Free versus Pro render split", () => {
    expect(batch).toContain('isPro ? <BatchStudio /> : <div className="pro-access-wrap"><ProAccessPanel /></div>');
    expect(accessPanel).toContain('if (isPro)');
    expect(accessPanel).toContain('if (user)');
    expect(accessPanel).not.toContain("Test Mode subscription");
  });

  it("renders the dismissible welcome card only from the existing server-confirmed isPro branch", () => {
    expect(pricing).toContain('{isPro && <ProWelcomeCard />}');
    expect(welcomeCard).toContain('Smart work.');
    expect(welcomeCard).toContain('Welcome to Pro.');
    expect(welcomeCard).toContain('setDismissed(true)');
    expect(welcomeCard).not.toContain("localStorage");
  });
});
