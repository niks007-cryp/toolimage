import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { trackBatchProcessed, trackCheckoutStarted, trackPurchaseConfirmed, trackToolCompleted } from "./analytics";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

const originalWindow = globalThis.window;
let gtag: ReturnType<typeof vi.fn>;

beforeEach(() => {
  gtag = vi.fn();
  Object.defineProperty(globalThis, "window", { configurable: true, value: { gtag } });
});

afterEach(() => {
  Object.defineProperty(globalThis, "window", { configurable: true, value: originalWindow });
});

describe("ToolImage GA4 integration", () => {
  it("owns exactly one public Measurement ID and initializes one duplicate-safe Google tag", () => {
    const analytics = source("client/src/lib/analytics.ts");
    const main = source("client/src/main.tsx");
    expect(analytics).toContain('GA4_MEASUREMENT_ID = "G-0T2DENLPJK"');
    expect(analytics).toContain('https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}');
    expect(analytics).toContain('script[data-toolimage-ga4="${GA4_MEASUREMENT_ID}"]');
    expect(main).toContain("initializeAnalytics();");
    expect((analytics.match(/googletagmanager\.com/g) || []).length).toBe(1);
  });

  it("uses the existing Enhanced Measurement strategy rather than adding manual SPA page views", () => {
    const analytics = source("client/src/lib/analytics.ts");
    expect(analytics).toContain('window.gtag("config", GA4_MEASUREMENT_ID);');
    expect(analytics).not.toContain('trackAnalyticsEvent("page_view"');
    expect(analytics).not.toContain('gtag("event", "page_view"');
  });

  it("records only non-sensitive successful tool and batch events", () => {
    const analytics = source("client/src/lib/analytics.ts");
    const studio = source("client/src/components/ImageStudio.tsx");
    const batch = source("client/src/components/BatchStudio.tsx");
    expect(analytics).toContain('trackAnalyticsEvent(`image_${tool}`');
    expect(analytics).toContain('trackAnalyticsEvent("batch_process"');
    expect(analytics).toContain("input_format");
    expect(analytics).toContain("output_format");
    expect(analytics).toContain("target_size_category");
    expect(analytics).not.toMatch(/filename|file_name|file_path|email|token|password|razorpay/i);
    expect(studio.indexOf("setResult(processed)")).toBeLessThan(studio.indexOf("trackToolCompleted(mode"));
    expect(batch.indexOf("successfulCount += 1")).toBeLessThan(batch.indexOf("trackBatchProcessed(mode"));
  });

  it("emits only the contracted anonymous event fields from the analytics helpers", () => {
    trackToolCompleted("compress", "image/png", "image/webp", 200 * 1024);
    trackBatchProcessed("convert", 3, "image/webp");
    trackCheckoutStarted();
    trackPurchaseConfirmed();
    expect(gtag).toHaveBeenNthCalledWith(1, "event", "image_compress", {
      tool: "compress",
      input_format: "png",
      output_format: "webp",
      target_size_category: "100_to_500kb",
    });
    expect(gtag).toHaveBeenNthCalledWith(2, "event", "batch_process", {
      tool: "convert",
      successful_count: 3,
      output_format: "webp",
    });
    expect(gtag).toHaveBeenNthCalledWith(3, "event", "begin_checkout", {
      currency: "INR",
      value: 149,
      items: [{ item_id: "toolimage_pro_monthly_inr", item_name: "ToolImage Pro Monthly", price: 149, quantity: 1 }],
    });
    expect(gtag).toHaveBeenNthCalledWith(4, "event", "purchase", {
      currency: "INR",
      value: 149,
      items: [{ item_id: "toolimage_pro_monthly_inr", item_name: "ToolImage Pro Monthly", price: 149, quantity: 1 }],
    });
  });

  it("observes authenticated completion state without changing authentication or sending account data", () => {
    const observer = source("client/src/components/AnalyticsAuthObserver.tsx");
    const app = source("client/src/App.tsx");
    expect(app).toContain("<AnalyticsAuthObserver />");
    expect(observer).toContain('event !== "SIGNED_IN" || !session?.user');
    expect(observer).toContain('event === "SIGNED_OUT"');
    expect(observer).toContain('trackAnalyticsEvent("sign_up", { method })');
    expect(observer).toContain('trackAnalyticsEvent("login", { method })');
    expect(observer).toContain('trackAnalyticsEvent("logout")');
    expect(observer).not.toContain("email:");
    expect(observer).not.toContain("access_token");
    expect(observer).not.toContain("refresh_token");
    expect(observer).not.toContain("password");
  });

  it("fires begin_checkout only after the existing Razorpay dialog starts and purchase only after existing verification reports active", () => {
    const pricing = source("client/src/pages/Pricing.tsx");
    expect(pricing.indexOf("}).open();")).toBeLessThan(pricing.indexOf("trackCheckoutStarted();"));
    expect(pricing).toContain("if (result.active) trackPurchaseConfirmed();");
    expect(pricing.indexOf("if (result.active) trackPurchaseConfirmed();")).toBeGreaterThan(pricing.indexOf("if (!verified.ok)"));
  });

  it("does not modify Razorpay creation, verification, webhook, subscription, or entitlement server handlers for analytics", () => {
    const protectedFiles = [
      "api/subscriptions/create.ts",
      "api/subscriptions/verify.ts",
      "api/webhooks/razorpay.ts",
      "api/entitlement.ts",
    ];
    for (const path of protectedFiles) {
      expect(source(path)).not.toContain("trackAnalyticsEvent");
      expect(source(path)).not.toContain("trackPurchaseConfirmed");
    }
  });
});
