export const REGIONAL_PRICE_CONFIG = {
  india: { currency: "INR", label: "India · INR" },
  "united-states": { currency: "USD", label: "United States · USD" },
  "united-kingdom": { currency: "GBP", label: "United Kingdom · GBP" },
  europe: { currency: "EUR", label: "Europe · EUR" },
  canada: { currency: "CAD", label: "Canada · CAD" },
  australia: { currency: "AUD", label: "Australia · AUD" },
} as const;

export type RegionalPriceId = keyof typeof REGIONAL_PRICE_CONFIG;
export const isRegionalPriceId = (value: unknown): value is RegionalPriceId =>
  typeof value === "string" && value in REGIONAL_PRICE_CONFIG;
