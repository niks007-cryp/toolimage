import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("crawlable static HTML generation", () => {
  const generator = source("scripts/generate-crawlable-html.mjs");
  const verifier = source("scripts/verify-crawlable-html.mjs");
  const documentHead = source("client/index.html");
  const vercel = JSON.parse(source("vercel.json")) as { headers: Array<{ source: string; headers: Array<{ key: string; value: string }> }>; rewrites: Array<{ source: string; destination: string }> };

  it("emits route-specific, semantic HTML for every public SEO route without relying on hydration", () => {
    expect(generator).toContain('const pages = [');
    expect(generator).toContain('id="root">${page.body}');
    expect(generator).toContain('"/compress-image"');
    expect(generator).toContain('"/resize-image"');
    expect(generator).toContain('"/convert-image"');
    expect(generator).toContain('"/privacy"');
    expect(generator).toContain('"/terms"');
    expect(generator).toContain('"@type": "WebSite"');
    expect(generator).toContain('"@type": "FAQPage"');
    expect(generator).not.toContain('aggregateRating');
  });

  it("validates a single H1, self canonical, crawlable links, and intended robots state for generated routes", () => {
    expect(verifier).toContain('assert.equal(h1Count, 1');
    expect(verifier).toContain('must expose crawlable internal/support links');
    expect(verifier).toContain('needs a self canonical');
    expect(verifier).toContain('needs its intended robots value');
  });

  it("routes public documents to their generated HTML and applies only non-disruptive headers", () => {
    expect(vercel.rewrites).toContainEqual({ source: "/compress-image", destination: "/compress-image.html" });
    expect(vercel.rewrites).toContainEqual({ source: "/pricing", destination: "/pricing.html" });
    const security = vercel.headers.find((entry) => entry.source === "/(.*)")?.headers ?? [];
    expect(security).toContainEqual({ key: "X-Content-Type-Options", value: "nosniff" });
    expect(security).toContainEqual({ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" });
    expect(security).toContainEqual({ key: "X-Frame-Options", value: "SAMEORIGIN" });
    const permissions = security.find((header) => header.key === "Permissions-Policy")?.value ?? "";
    expect(permissions).toContain("camera=()");
    expect(permissions).not.toContain("payment");
    expect(security).not.toContainEqual(expect.objectContaining({ key: "Content-Security-Policy" }));
  });

  it("emits the approved AdSense verification script once through each shared head path", () => {
    const adsenseUrl = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5233202766979924";
    expect((documentHead.match(/pagead2\.googlesyndication\.com/g) || []).length).toBe(1);
    expect(documentHead).toContain(`async src="${adsenseUrl}" crossorigin="anonymous"`);
    expect((generator.match(/pagead2\.googlesyndication\.com/g) || []).length).toBe(1);
    expect(generator).toContain('const adsenseVerification =');
    expect(generator).toContain('${adsenseVerification}');
    expect(generator).not.toContain('adsbygoogle.push');
  });
});
