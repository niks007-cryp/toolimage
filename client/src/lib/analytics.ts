export const GA4_MEASUREMENT_ID = "G-0T2DENLPJK";

type AnalyticsItem = {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
};
type AnalyticsParams = Record<string, string | number | boolean | AnalyticsItem[] | undefined>;
type Gtag = (command: "js" | "config" | "event", target: Date | string, params?: AnalyticsParams) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

function gtagAvailable() {
  return typeof window !== "undefined" && typeof window.gtag === "function";
}

export function initializeAnalytics() {
  if (typeof window === "undefined") return;

  if (!document.querySelector(`script[data-toolimage-ga4="${GA4_MEASUREMENT_ID}"]`)) {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
    script.dataset.toolimageGa4 = GA4_MEASUREMENT_ID;
    document.head.appendChild(script);
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(...args: unknown[]) { window.dataLayer?.push(args); } as Gtag;
  window.gtag("js", new Date());

  // Enhanced Measurement is enabled for this web stream. It sends the initial
  // page view plus Wouter history changes, so ToolImage intentionally sends no
  // additional manual page_view events.
  window.gtag("config", GA4_MEASUREMENT_ID);
}

export function trackAnalyticsEvent(name: string, params: AnalyticsParams = {}) {
  if (!gtagAvailable()) return;
  window.gtag!("event", name, params);
}

export function formatCategory(type: string) {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "other";
}

export function targetSizeCategory(bytes: number) {
  if (bytes < 100 * 1024) return "under_100kb";
  if (bytes <= 500 * 1024) return "100_to_500kb";
  if (bytes <= 1024 * 1024) return "500kb_to_1mb";
  return "over_1mb";
}

export function trackToolCompleted(
  tool: "compress" | "resize" | "convert",
  inputFormat: string,
  outputFormat: string,
  targetBytes?: number,
) {
  trackAnalyticsEvent(`image_${tool}`, {
    tool,
    input_format: formatCategory(inputFormat),
    output_format: formatCategory(outputFormat),
    ...(tool === "compress" && targetBytes ? { target_size_category: targetSizeCategory(targetBytes) } : {}),
  });
}

export function trackBatchProcessed(
  tool: "compress" | "resize" | "convert",
  successfulCount: number,
  outputFormat?: string,
) {
  if (successfulCount < 1) return;
  trackAnalyticsEvent("batch_process", {
    tool,
    successful_count: successfulCount,
    ...(outputFormat ? { output_format: formatCategory(outputFormat) } : {}),
  });
}

export const proPlanItem = {
  item_id: "toolimage_pro_monthly_inr",
  item_name: "ToolImage Pro Monthly",
  price: 149,
  quantity: 1,
} as const;

export function trackCheckoutStarted() {
  trackAnalyticsEvent("begin_checkout", { currency: "INR", value: 149, items: [proPlanItem] });
}

export function trackPurchaseConfirmed() {
  trackAnalyticsEvent("purchase", { currency: "INR", value: 149, items: [proPlanItem] });
}
