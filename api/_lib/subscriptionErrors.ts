export const SUBSCRIPTION_VERIFICATION_MESSAGE = "We’re having trouble verifying your subscription. Please try again later.";

export function subscriptionErrorStatus(error: unknown) {
  return error instanceof Error && error.message === "Unauthorized" ? 401 : 503;
}
