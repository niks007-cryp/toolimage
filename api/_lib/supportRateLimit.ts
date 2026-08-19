import { createHash } from "node:crypto";

const WINDOW_SECONDS = 15 * 60;
const MAX_REPORTS_PER_WINDOW = 5;

type UpstashTransactionResult = Array<{ result?: number; error?: string }>;

function limiterConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

export function supportRateLimitKey(address: string) {
  const digest = createHash("sha256").update(address).digest("hex");
  return `toolimage:support-rate:${digest}`;
}

export type SupportRateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; remaining: 0; unavailable?: boolean };

export async function consumeSupportRateLimit(address: string): Promise<SupportRateLimitResult> {
  const config = limiterConfig();
  if (!config) return { allowed: false, remaining: 0, unavailable: true };
  try {
    const response = await fetch(`${config.url}/multi-exec`, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
      body: JSON.stringify([["INCR", supportRateLimitKey(address)], ["EXPIRE", supportRateLimitKey(address), String(WINDOW_SECONDS), "NX"]]),
    });
    if (!response.ok) return { allowed: false, remaining: 0, unavailable: true };
    const body = await response.json() as UpstashTransactionResult;
    const count = body[0]?.result;
    if (typeof count !== "number") return { allowed: false, remaining: 0, unavailable: true };
    if (count > MAX_REPORTS_PER_WINDOW) return { allowed: false, remaining: 0 };
    return { allowed: true, remaining: MAX_REPORTS_PER_WINDOW - count };
  } catch {
    return { allowed: false, remaining: 0, unavailable: true };
  }
}
