import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "dist", "public");
const routes = JSON.parse(await readFile(path.join(output, "crawlable-routes.json"), "utf8"));

for (const route of routes) {
  const html = await readFile(path.join(output, route.file), "utf8");
  const h1Count = (html.match(/<h1\b/gi) || []).length;
  const anchors = (html.match(/<a\b[^>]*href=/gi) || []).length;
  const canonical = `https://toolimage.online${route.path}`;
  assert.equal(h1Count, 1, `${route.path} must have exactly one raw HTML H1`);
  assert.ok(anchors >= 4, `${route.path} must expose crawlable internal/support links`);
  assert.ok(html.includes(`<title>${route.title}</title>`), `${route.path} needs its unique title`);
  assert.ok(html.includes(`<link rel="canonical" href="${canonical}">`), `${route.path} needs a self canonical`);
  assert.ok(html.includes(`meta name="robots" content="${route.noIndex ? "noindex,follow" : "index,follow"}`), `${route.path} needs its intended robots value`);
  assert.ok(html.includes('meta property="og:title"'), `${route.path} needs Open Graph title metadata`);
  assert.ok(html.includes('meta name="twitter:description"'), `${route.path} needs Twitter description metadata`);
}

const home = await readFile(path.join(output, "index.html"), "utf8");
assert.ok((home.match(/<script type="application\/ld\+json">/g) || []).length === 2, "Homepage must contain WebSite and FAQPage JSON-LD");
assert.ok(home.includes("Make the file fit."), "Homepage fallback must retain its meaningful H1 copy");
assert.ok(home.includes("/compress-image"), "Homepage fallback must expose tool links");
console.log(`Verified ${routes.length} crawlable route documents.`);
