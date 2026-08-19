import { afterEach, describe, expect, it, vi } from "vitest";
import { consumeSupportRateLimit, supportRateLimitKey } from "../../../api/_lib/supportRateLimit";

const env = { url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN };
afterEach(() => { vi.unstubAllGlobals(); process.env.UPSTASH_REDIS_REST_URL = env.url; process.env.UPSTASH_REDIS_REST_TOKEN = env.token; });

describe("durable support rate limit", () => {
  it("uses the Upstash transaction endpoint and hashes the request address", async () => { process.env.UPSTASH_REDIS_REST_URL = "https://upstash.example"; process.env.UPSTASH_REDIS_REST_TOKEN = "test-token"; const fetchMock = vi.fn(async () => new Response(JSON.stringify([{ result: 1 }, { result: 1 }]), { status: 200 })); vi.stubGlobal("fetch", fetchMock); await expect(consumeSupportRateLimit("198.51.100.24")).resolves.toEqual({ allowed: true, remaining: 4 }); expect(fetchMock).toHaveBeenCalledWith("https://upstash.example/multi-exec", expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer test-token" }) })); expect(supportRateLimitKey("198.51.100.24")).not.toContain("198.51.100.24"); });
  it("fails closed when Upstash is unavailable instead of falling back to process-local state", async () => { delete process.env.UPSTASH_REDIS_REST_URL; delete process.env.UPSTASH_REDIS_REST_TOKEN; await expect(consumeSupportRateLimit("198.51.100.25")).resolves.toMatchObject({ allowed: false, unavailable: true }); });
});
