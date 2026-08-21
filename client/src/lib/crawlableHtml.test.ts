import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("crawlable static HTML generation", () => {
  const generator = source("scripts/generate-crawlable-html.mjs");
  const verifier = source("scripts/verify-crawlable-html.mjs");
  const documentHead = source("client/index.html");
  const pricing = source("client/src/pages/Pricing.tsx");
  const seo = source("client/src/lib/seo.tsx");
  const legal = source("client/src/pages/Legal.tsx");
  const sitemap = source("client/public/sitemap.xml");
  const vercel = JSON.parse(source("vercel.json")) as { headers: Array<{ source: string; headers: Array<{ key: string; value: string }> }>; rewrites: Array<{ source: string; destination: string }> };

  it("emits route-specific, semantic HTML for every public SEO route without relying on hydration", () => {
    expect(generator).toContain("const pages = [");
    expect(generator).toContain('id="root">${page.body}');
    expect(generator).toContain('"/compress-image"');
    expect(generator).toContain('"/resize-image"');
    expect(generator).toContain('"/convert-image"');
    expect(generator).toContain('"/privacy"');
    expect(generator).toContain('"/terms"');
    expect(generator).toContain('"@type": "WebSite"');
    expect(generator).toContain('"@type": "FAQPage"');
    expect(generator).not.toContain("aggregateRating");
  });

  it("keeps pricing public and indexable with one canonical sitemap URL while account-only routes stay noindex", () => {
    expect(pricing).not.toMatch(/path="\/pricing"\s+noIndex/);
    expect(generator).toContain('{ path: "/pricing", file: "pricing.html"');
    expect(generator).not.toContain('path: "/pricing", file: "pricing.html", title: "ToolImage Pricing — Free Local Image Tools", description: "ToolImage’s core image compression, resize, and conversion tools are free and run locally in your browser.", noIndex: true');
    expect((sitemap.match(/https:\/\/toolimage\.online\/pricing/g) ?? []).length).toBe(1);
    expect(generator).toContain('path: "/batch", file: "batch.html"');
    expect(generator).toContain('path: "/subscription", file: "subscription.html"');
    expect(generator).toMatch(/path: "\/batch"[\s\S]*?noIndex: true/);
    expect(generator).toMatch(/path: "\/subscription"[\s\S]*?noIndex: true/);
  });

  it("keeps route-specific titles and differentiated search-intent content", () => {
    expect(generator).toContain("ToolImage Privacy Policy | Local Image Processing");
    expect(generator).toContain("ToolImage Terms of Service | Browser-Local Image Tools");
    expect(generator).toContain("Compress JPG Images Online | Private Local Tool | ToolImage");
    expect(legal).toContain("ToolImage Privacy Policy | Local Image Processing");
    expect(legal).toContain("ToolImage Terms of Service | Browser-Local Image Tools");
    expect(seo).toContain("A 20 KB target leaves little room");
    expect(seo).toContain("A 50 KB target can work well");
    expect(seo).toContain("At 100 KB, many images have room");
    expect(seo).toContain("A 200 KB target is less restrictive");
    expect(generator).toContain("PNG is useful for crisp graphics");
    expect(generator).toContain("WebP often begins smaller");
  });

  it("validates a single H1, self canonical, crawlable links, and intended robots state for generated routes", () => {
    expect(verifier).toContain("assert.equal(h1Count, 1");
    expect(verifier).toContain("must expose crawlable internal/support links");
    expect(verifier).toContain("needs a self canonical");
    expect(verifier).toContain("needs its intended robots value");
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
    expect(generator).toContain("const adsenseVerification =");
    expect(generator).toContain("${adsenseVerification}");
    expect(generator).not.toContain("adsbygoogle.push");
  });
});
