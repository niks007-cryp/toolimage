import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { hashTargetId, routeScrollAction } from "./scrollNavigation";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("shared navigation and scroll restoration", () => {
  it("routes the Free Start using ToolImage CTA to the homepage", () => {
    const pricing = source("client/src/pages/Pricing.tsx");
    expect(pricing).toContain('<Link href="/" className="primary-button">Start using ToolImage</Link>');
    expect(pricing).not.toContain('<Link href="/compress-image" className="primary-button">Start using ToolImage</Link>');
  });

  it("starts ordinary internal route transitions at the document top", () => {
    expect(routeScrollAction({ hash: "", isHistoryNavigation: false })).toEqual({ kind: "top" });
  });

  it("preserves explicit hash targets instead of replacing them with a top scroll", () => {
    expect(hashTargetId("#sign-in")).toBe("sign-in");
    expect(routeScrollAction({ hash: "#sign-in", isHistoryNavigation: false })).toEqual({ kind: "anchor", id: "sign-in" });
  });

  it("restores a previously saved position only for browser history navigation", () => {
    expect(routeScrollAction({ hash: "", isHistoryNavigation: true, savedPosition: { left: 0, top: 486 } })).toEqual({ kind: "restore", position: { left: 0, top: 486 } });
  });

  it("registers one shared app-level restoration component and removes the competing Pricing-only handler", () => {
    const app = source("client/src/App.tsx");
    const pricing = source("client/src/pages/Pricing.tsx");
    const restoration = source("client/src/components/ScrollRestoration.tsx");
    expect(app).toContain("<ScrollRestoration />");
    expect(app).toContain("<><ScrollRestoration /><Suspense");
    expect(restoration).toContain('window.history.scrollRestoration = "manual"');
    expect(restoration).toContain('window.addEventListener("click", persistBeforeInternalNavigation, true)');
    expect(restoration).toContain('window.addEventListener("popstate", markHistoryNavigation)');
    expect(restoration).toContain('window.addEventListener("hashchange", restoreHashTarget)');
    expect(restoration).toContain("applyScrollAction(true)");
    expect(restoration).toContain('behavior: "instant"');
    expect(pricing).not.toContain("window.addEventListener(\"hashchange\", revealSignIn)");
  });
});
