import { describe, expect, it, vi } from "vitest";
import { CheckoutPreflightError, createCheckout } from "./checkoutPreflight";

describe("checkout preflight", () => {
  it("stops before a network request when no refreshed session token is available", async () => {
    const request = vi.fn();
    await expect(createCheckout(undefined, request)).rejects.toMatchObject<Partial<CheckoutPreflightError>>({ message: "Please reopen the email sign-in link in this browser, then try again." });
    expect(request).not.toHaveBeenCalled();
  });

  it("surfaces a non-sensitive server error when checkout creation is rejected", async () => {
    const request = vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "Checkout is temporarily unavailable." }) });
    await expect(createCheckout("opaque-test-token", request)).rejects.toMatchObject<Partial<CheckoutPreflightError>>({ message: "Checkout is temporarily unavailable." });
    expect(request).toHaveBeenCalledWith("/api/subscriptions/create", expect.objectContaining({ method: "POST", headers: expect.objectContaining({ Authorization: "Bearer opaque-test-token" }) }));
  });

  it("rejects an incomplete checkout payload rather than opening a provider dialog", async () => {
    const request = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ keyId: "public-key-only" }) });
    await expect(createCheckout("opaque-test-token", request)).rejects.toThrow("Checkout could not be prepared.");
  });

  it("returns the provider checkout fields only after a successful authenticated response", async () => {
    const request = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ subscriptionId: "sub_test", keyId: "public_key", name: "ToolImage Pro", description: "₹149/month" }) });
    await expect(createCheckout("opaque-test-token", request)).resolves.toEqual({ subscriptionId: "sub_test", keyId: "public_key", name: "ToolImage Pro", description: "₹149/month" });
  });
});
