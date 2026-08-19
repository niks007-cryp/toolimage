export type CheckoutCreation = { subscriptionId: string; keyId: string; name?: string; description?: string };

export class CheckoutPreflightError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CheckoutPreflightError";
  }
}

export async function createCheckout(accessToken: string | undefined, request: typeof fetch = fetch, payload: { region: "india" } = { region: "india" }): Promise<CheckoutCreation> {
  if (!accessToken) throw new CheckoutPreflightError("Please reopen the email sign-in link in this browser, then try again.");

  const response = await request("/api/subscriptions/create", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({})) as Partial<CheckoutCreation> & { error?: string };
  if (!response.ok || !body.subscriptionId || !body.keyId) throw new CheckoutPreflightError(body.error || "Checkout could not be prepared.");
  return { subscriptionId: body.subscriptionId, keyId: body.keyId, name: body.name, description: body.description };
}
