import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PAGE_TRANSITION_TIMING, createTransitionCounterPair, nextTransitionPhase, shouldTransitionInternalLink, transitionCounterValue } from "./pageTransition";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("shared premium page transition policy", () => {
  it("creates one bounded, stable decorative counter pair per navigation", () => {
    const pair = createTransitionCounterPair(() => 0.5);
    expect(pair).toEqual({ start: 105, end: 24 });
    expect(pair.start).toBeGreaterThanOrEqual(84);
    expect(pair.start).toBeLessThanOrEqual(126);
    expect(pair.end).toBeGreaterThanOrEqual(12);
    expect(pair.end).toBeLessThanOrEqual(36);
    expect(pair.end).toBeLessThan(pair.start);
  });

  it("follows the outgoing, handoff, incoming, idle lifecycle and reverses the counter direction", () => {
    const pair = { start: 100, end: 20 };
    expect(nextTransitionPhase("idle")).toBe("outgoing");
    expect(nextTransitionPhase("outgoing")).toBe("handoff");
    expect(nextTransitionPhase("handoff")).toBe("incoming");
    expect(nextTransitionPhase("incoming")).toBe("idle");
    expect(transitionCounterValue(pair, "outgoing", 0)).toBe(100);
    expect(transitionCounterValue(pair, "outgoing", 1)).toBe(20);
    expect(transitionCounterValue(pair, "incoming", 0)).toBe(20);
    expect(transitionCounterValue(pair, "incoming", 1)).toBe(100);
    expect(PAGE_TRANSITION_TIMING.outgoing + PAGE_TRANSITION_TIMING.handoff + PAGE_TRANSITION_TIMING.incoming).toBeGreaterThanOrEqual(700);
    expect(PAGE_TRANSITION_TIMING.outgoing + PAGE_TRANSITION_TIMING.handoff + PAGE_TRANSITION_TIMING.incoming).toBeLessThanOrEqual(900);
  });

  it("transitions only ordinary internal route changes and leaves external, modified, download, and same-page hash navigation native", () => {
    const currentHref = "https://toolimage.online/compress-image";
    expect(shouldTransitionInternalLink({ href: "/resize-image", currentHref })).toBe(true);
    expect(shouldTransitionInternalLink({ href: "/pricing#sign-in", currentHref })).toBe(true);
    expect(shouldTransitionInternalLink({ href: "https://example.com", currentHref })).toBe(false);
    expect(shouldTransitionInternalLink({ href: "/resize-image", currentHref, modified: true })).toBe(false);
    expect(shouldTransitionInternalLink({ href: "/resize-image", currentHref, download: true })).toBe(false);
    expect(shouldTransitionInternalLink({ href: "#main-content", currentHref })).toBe(false);
  });

  it("uses one app-level controller that hands off after outgoing motion and guards repeated links while active", () => {
    const app = source("client/src/App.tsx");
    const controller = source("client/src/components/PageTransition.tsx");
    const styles = source("client/src/index.css");
    expect(app).toContain("<PageTransition><Suspense");
    expect(controller).toContain('if (activeRef.current) return false');
    expect(controller).toContain('window.history.pushState(null, "", anchor.href)');
    expect(controller).toContain('window.addEventListener("popstate", transitionHistoryNavigation)');
    expect(controller).toContain('window.addEventListener("click", interceptInternalLink, true)');
    expect(controller).toContain("const reduceMotion = useReducedMotion()");
    expect(controller).toContain("if (reduceMotion)");
    expect(controller).toContain("PAGE_TRANSITION_TIMING.reduced");
    expect(styles).toContain('.page-transition-root[data-transition-phase="outgoing"] .page-transition-stage');
    expect(styles).toContain("scale(.9468)");
    expect(styles).toContain("scale(.916)");
    expect(styles).toContain("font-size: clamp(56px, 12vw, 160px)");
    expect(styles).toContain("max-width: min(calc(100vw - 32px), 40rem)");
    expect(styles).toContain("@media (max-width: 520px)");
    expect(styles).toContain('@media (prefers-reduced-motion: reduce)');
  });
});
