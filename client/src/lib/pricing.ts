export type PricingRegionId = "india" | "united-states" | "united-kingdom" | "europe" | "canada" | "australia";

export interface RegionalPrice {
  id: PricingRegionId;
  country: string;
  label: string;
  flag: string;
  currency: "INR" | "USD" | "GBP" | "EUR" | "CAD" | "AUD";
  price: number;
  locale: string;
}

export const REGIONAL_PRICES: Record<PricingRegionId, RegionalPrice> = {
  india: { id: "india", country: "India", label: "India · INR", flag: "🇮🇳", currency: "INR", price: 149, locale: "en-IN" },
  "united-states": { id: "united-states", country: "United States", label: "United States · USD", flag: "🇺🇸", currency: "USD", price: 4.99, locale: "en-US" },
  "united-kingdom": { id: "united-kingdom", country: "United Kingdom", label: "United Kingdom · GBP", flag: "🇬🇧", currency: "GBP", price: 3.99, locale: "en-GB" },
  europe: { id: "europe", country: "Europe", label: "Europe · EUR", flag: "🇪🇺", currency: "EUR", price: 4.49, locale: "en-IE" },
  canada: { id: "canada", country: "Canada", label: "Canada · CAD", flag: "🇨🇦", currency: "CAD", price: 6.49, locale: "en-CA" },
  australia: { id: "australia", country: "Australia", label: "Australia · AUD", flag: "🇦🇺", currency: "AUD", price: 7.49, locale: "en-AU" },
};

export const PRICING_REGIONS = Object.values(REGIONAL_PRICES);
const SESSION_REGION_KEY = "toolimage-pricing-region";
const EUROPE_REGIONS = new Set(["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE"]);

function regionFromLocale(locale?: string): PricingRegionId {
  const region = locale?.match(/-([A-Z]{2})\b/)?.[1];
  if (region === "IN") return "india";
  if (region === "GB") return "united-kingdom";
  if (region === "CA") return "canada";
  if (region === "AU") return "australia";
  if (EUROPE_REGIONS.has(region || "")) return "europe";
  return "united-states";
}

export function getInitialPricingRegion(): PricingRegionId {
  if (typeof window === "undefined") return "united-states";
  const sessionValue = window.sessionStorage.getItem(SESSION_REGION_KEY) as PricingRegionId | null;
  if (sessionValue && REGIONAL_PRICES[sessionValue]) return sessionValue;
  return regionFromLocale(Intl.DateTimeFormat().resolvedOptions().locale);
}

export function setPricingRegionForSession(region: PricingRegionId) {
  if (typeof window !== "undefined") window.sessionStorage.setItem(SESSION_REGION_KEY, region);
}

export function formatRegionalPrice(region: PricingRegionId) {
  const price = REGIONAL_PRICES[region];
  return new Intl.NumberFormat(price.locale, { style: "currency", currency: price.currency, minimumFractionDigits: price.currency === "INR" ? 0 : 2, maximumFractionDigits: price.currency === "INR" ? 0 : 2 }).format(price.price);
}
