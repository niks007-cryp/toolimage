import type { VercelRequest, VercelResponse } from "@vercel/node";
import { apiError, method, readJson } from "./_lib/http.js";
import { validateSupportSubmission } from "../shared/support.js";
import { consumeSupportRateLimit } from "./_lib/supportRateLimit.js";

function requestKey(request: VercelRequest) {
  const forwarded = request.headers["x-forwarded-for"];
  const address = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0]?.trim();
  return address || request.socket?.remoteAddress || "unknown";
}

function configuredMail() {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.SUPPORT_TO_EMAIL;
  const from = process.env.SUPPORT_FROM_EMAIL;
  return apiKey && to && from ? { apiKey, to, from } : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!method(req, res, "POST")) return;
  res.setHeader("Cache-Control", "no-store");
  const rateLimit = await consumeSupportRateLimit(requestKey(req));
  if (!rateLimit.allowed) {
    if (rateLimit.unavailable) { res.status(503).json({ error: "Support reporting is temporarily unavailable. Please try again later." }); return; }
    res.setHeader("Retry-After", "900");
    res.status(429).json({ error: "Please wait before sending another report." });
    return;
  }

  try {
    const parsed = validateSupportSubmission(await readJson(req));
    if ("error" in parsed) { res.status(400).json({ error: parsed.error }); return; }
    const mail = configuredMail();
    if (!mail) { res.status(503).json({ error: "Support delivery is not configured yet. Please try again later." }); return; }
    const { value } = parsed;
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${mail.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: mail.from,
        to: [mail.to],
        reply_to: value.email,
        subject: `ToolImage Support — ${value.issueType}`,
        text: [`User email: ${value.email}`, `Issue type: ${value.issueType}`, `Current page: ${value.pageUrl || "Not provided"}`, `Timestamp (UTC): ${new Date().toISOString()}`, `Browser: ${value.browser || "Not provided"}`, "", "Problem description:", value.description].join("\n"),
      }),
    });
    if (!response.ok) {
      console.error("[Support] Email provider rejected a support report", { status: response.status });
      res.status(502).json({ error: "We could not deliver your report right now. Please try again later." });
      return;
    }
    res.status(201).json({ delivered: true });
  } catch {
    console.error("[Support] Support submission failed");
    apiError(res, new Error("We could not process your report right now. Please try again later."), 500);
  }
}
