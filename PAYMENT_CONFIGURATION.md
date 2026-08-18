# Razorpay Test Mode configuration

ToolImage’s Free image tools do not need an account. Pro access is granted only from the `entitlements` table after server-side Razorpay verification or a signature-verified webhook updates the subscription state.

Configure the following values in Vercel, never in committed source: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`. Set only **Test Mode** Razorpay keys for this work.

Create one Razorpay Test Mode monthly plan per actually supported subscription currency, then configure its server-only identifier as `RAZORPAY_PLAN_ID_INR`, `RAZORPAY_PLAN_ID_USD`, `RAZORPAY_PLAN_ID_GBP`, `RAZORPAY_PLAN_ID_EUR`, `RAZORPAY_PLAN_ID_CAD`, or `RAZORPAY_PLAN_ID_AUD`. A displayed regional price is not evidence that the connected Razorpay account can process that recurring currency. Leave unsupported plan variables absent: the server will reject checkout for that selection rather than simulate support.

Configure the Razorpay webhook endpoint as `https://<your-production-domain>/api/webhooks/razorpay`. Subscribe to `subscription.authenticated`, `subscription.activated`, `subscription.charged`, `subscription.pending`, `subscription.halted`, `subscription.paused`, `subscription.resumed`, `subscription.cancelled`, `subscription.completed`, and `subscription.updated`. Use the exact same `RAZORPAY_WEBHOOK_SECRET` in Razorpay and Vercel.

The project URL is `https://bupmedxcllideobggnaf.supabase.co`. In Supabase Auth, add the deployed ToolImage URL and `https://<your-production-domain>/pricing` to redirect allowlists before enabling real sign-in. Do not place service-role or Razorpay secrets in frontend variables or public files.

## Official references

The implementation follows Razorpay’s subscription Checkout and server-side signature verification guide: https://razorpay.com/docs/payments/subscriptions/integration-guide/. The configured lifecycle-event list follows: https://razorpay.com/docs/webhooks/subscriptions/. International card support is account-activated and must not be inferred from a displayed regional price: https://razorpay.com/docs/payments/international-payments/.
