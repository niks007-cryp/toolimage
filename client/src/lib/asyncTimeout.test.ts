import { RequestTimeoutError, fetchWithTimeout, withTimeout } from "./asyncTimeout";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("bounded async resolution", () => {
  afterEach(() => vi.useRealTimers());

  it("rejects a pending operation with a clear timeout error", async () => {
    vi.useFakeTimers();
    const pending = new Promise<void>(() => undefined);
    const result = withTimeout(pending, 8000, "Subscription check timed out. Please try again.");
    const assertion = expect(result).rejects.toMatchObject<Partial<RequestTimeoutError>>({
      name: "RequestTimeoutError",
      message: "Subscription check timed out. Please try again.",
    });

    await vi.advanceTimersByTimeAsync(8000);
    await assertion;
  });

  it("returns a resolved operation before the deadline", async () => {
    await expect(withTimeout(Promise.resolve("resolved"), 8000, "unused")).resolves.toBe("resolved");
  });

  it("aborts a hung fetch and exposes the retryable timeout error", async () => {
    vi.useFakeTimers();
    const request = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
    }));
    vi.stubGlobal("fetch", request);
    const result = fetchWithTimeout("/api/subscriptions/status", {}, 10000, "Subscription check timed out. Please try again.");
    const assertion = expect(result).rejects.toMatchObject<Partial<RequestTimeoutError>>({ message: "Subscription check timed out. Please try again." });

    await vi.advanceTimersByTimeAsync(10000);
    await assertion;
    expect(request).toHaveBeenCalledWith("/api/subscriptions/status", expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });
});
