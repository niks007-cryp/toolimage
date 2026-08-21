import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(repoRoot, "dist", "public");
const siteUrl = "https://toolimage.online";
const socialImage = `${siteUrl}/assets/toolimage-hero-compression.webp`;
const favicon = '<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="icon" href="/assets/toolimage-mark.png" type="image/png"><link rel="apple-touch-icon" href="/assets/toolimage-mark.png"><link rel="manifest" href="/manifest.webmanifest">';
const adsenseVerification = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5233202766979924" crossorigin="anonymous"></script>';
const fallbackStyles = `<style>.crawlable-fallback{background:#f8f7f2;color:#1c211f;font-family:"DM Sans",sans-serif;line-height:1.55}.crawlable-fallback a{color:#0d786d}.crawlable-fallback__shell{margin:auto;max-width:1120px;padding:1.5rem}.crawlable-fallback header,.crawlable-fallback footer{border-color:#d9dad3;border-style:solid;border-width:0 0 1px}.crawlable-fallback footer{border-width:1px 0 0}.crawlable-fallback nav ul,.crawlable-fallback__links{display:flex;flex-wrap:wrap;gap:.8rem;list-style:none;margin:0;padding:1rem 0}.crawlable-fallback section{border-bottom:1px solid #d9dad3;padding:2rem 0}.crawlable-fallback h1{font-family:"DM Serif Display",Georgia,serif;font-size:clamp(2.6rem,8vw,5rem);line-height:.95;margin:0 0 1rem}.crawlable-fallback h2{font-family:"DM Serif Display",Georgia,serif;font-size:clamp(1.8rem,4vw,3rem);line-height:1.05}.crawlable-fallback h3{font-size:1.1rem}.crawlable-fallback p,.crawlable-fallback li{max-width:72ch}.crawlable-fallback__tools{display:grid;gap:1rem;grid-template-columns:repeat(auto-fit,minmax(14rem,1fr))}.crawlable-fallback__card{border:1px solid #d9dad3;padding:1rem}.crawlable-fallback__note{background:#e3efed;padding:1rem}.crawlable-fallback details{border-top:1px solid #d9dad3;padding:.75rem 0}.crawlable-fallback summary{cursor:pointer;font-weight:700}.crawlable-fallback__skip{left:-999px;position:absolute}.crawlable-fallback__skip:focus{left:1rem;top:1rem;z-index:2}</style>`;

const faq = [
  ["Are my images uploaded to a server?", "No. ToolImage processes supported images in the browser on your own device. Your file does not need to travel to a server for compression, resizing, or conversion."],
  ["Can I compress an image to 20 KB?", "Yes, you can request 20 KB. When that target would severely affect image quality, ToolImage creates the smallest practical version and explains the result."],
  ["Which formats can I use?", "ToolImage currently supports JPG, JPEG, PNG, and WebP files."],
  ["Will this work on my phone?", "Yes. ToolImage is a responsive browser application designed for modern mobile, tablet, and desktop browsers."],
];

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
}

function link(href, label) {
  return `<a href="${href}">${escapeHtml(label)}</a>`;
}

function shell(content) {
  return `<div class="crawlable-fallback"><a class="crawlable-fallback__skip" href="#main-content">Skip to main content</a><header><div class="crawlable-fallback__shell">${link("/", "ToolImage")}<nav aria-label="Primary navigation"><ul><li>${link("/compress-image", "Compress")}</li><li>${link("/resize-image", "Resize")}</li><li>${link("/convert-image", "Convert")}</li><li>${link("/tools", "All tools")}</li><li>${link("/pricing", "Pricing")}</li><li>${link("/about", "About")}</li></ul></nav></div></header><main id="main-content" class="crawlable-fallback__shell">${content}</main><footer><div class="crawlable-fallback__shell"><nav aria-label="Footer navigation"><div class="crawlable-fallback__links">${link("/privacy", "Privacy Policy")} ${link("/terms", "Terms of Service")} <a href="mailto:support@toolimage.online">Email support</a></div></nav><p>Images are processed in your browser.</p></div></footer></div>`;
}

function cards(items) {
  return `<div class="crawlable-fallback__tools">${items.map(([href, title, copy]) => `<article class="crawlable-fallback__card"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(copy)}</p>${link(href, `Open ${title.toLowerCase()}`)}</article>`).join("")}</div>`;
}

const toolData = {
  "/compress-image": { title: "Compress Images to a Target Size — Private Local Tool | ToolImage", description: "Compress JPG, PNG, and WebP images to a practical target size in your browser. No upload, account, or server-side image processing.", h1: "Fit the file. Keep the image.", label: "Image compression", guide: "Choose a target size and ToolImage tests local quality settings first. When needed, it carefully reduces dimensions to find a practical result without uploading the image.", related: [["/resize-image", "Resize images", "Set precise dimensions while preserving the original aspect ratio."], ["/convert-image", "Convert images", "Move between JPG, PNG, and WebP locally."]] },
  "/resize-image": { title: "Resize Images Online — Private Browser Tool | ToolImage", description: "Resize JPG, PNG, and WebP images locally in your browser with precise dimensions, aspect-ratio control, and useful presets.", h1: "Find the right dimensions.", label: "Image resizer", guide: "Set width and height in pixels, preserve the original ratio, or use a practical preset. ToolImage resizes the file inside your browser before you download it.", related: [["/compress-image", "Compress images", "Target a practical file size after resizing."], ["/convert-image", "Convert images", "Choose the format that fits the next destination."]] },
  "/convert-image": { title: "Convert JPG, PNG, and WebP Online — Private Tool | ToolImage", description: "Convert JPG, PNG, and WebP images in your browser. ToolImage creates your chosen local file format without uploading the image.", h1: "The right format, locally.", label: "Image converter", guide: "Choose JPG for common photographs, PNG when transparency matters, or WebP for a compact modern image file. Conversion happens locally before download.", related: [["/compress-image", "Compress images", "Make a file fit a practical target size."], ["/resize-image", "Resize images", "Set dimensions for your next project."]] },
  "/compress-jpg": { title: "Compress JPG Online — Private, Local Image Compression | ToolImage", description: "Compress JPG images in your browser. Choose a target size, preserve practical quality, and download without uploading your image.", h1: "Compress JPGs. Keep the detail.", label: "JPG compression", guide: "Upload a JPG, select a target size, and let ToolImage search locally for a practical result. Your original image does not need to leave your browser.", related: [["/compress-image", "Compress an image", "Use the general target-size compressor."], ["/convert-image", "Convert images", "Choose a different image format locally."]] },
  "/compress-png": { title: "Compress PNG Online — Private PNG to WebP Compression | ToolImage", description: "Compress PNG images in your browser. ToolImage creates a compact WebP when a smaller target file is needed, while preserving transparency where supported.", h1: "Compress PNGs. Keep transparency.", label: "PNG compression", guide: "PNG is lossless, so ToolImage creates a WebP result for target-size compression when a smaller file is needed. Use Convert if you need to keep a PNG output.", related: [["/compress-image", "Compress an image", "Choose a practical target size."], ["/convert-image", "Convert images", "Select a format for the final file."]] },
  "/compress-webp": { title: "Compress WebP Online — Reduce WebP File Size Locally | ToolImage", description: "Reduce WebP image size in your browser with a chosen target size. No upload, no account, and a practical quality-first compression approach.", h1: "Compress WebP. Stay compact.", label: "WebP compression", guide: "WebP is already efficient, but ToolImage can still evaluate local quality and dimensions to approach a useful target size without unnecessary reduction.", related: [["/compress-image", "Compress an image", "Use the general target-size compressor."], ["/resize-image", "Resize images", "Set the dimensions that fit your destination."]] },
  "/compress-image-to-20kb": { title: "Compress Image to 20 KB — Private Online Tool | ToolImage", description: "Make an image close to 20 KB in your browser. ToolImage balances quality and dimensions locally, then explains when 20 KB is not practical.", h1: "Make an image 20 KB.", label: "20 KB image compression", guide: "Very small file targets depend on source dimensions and detail. ToolImage processes the file locally and returns the closest practical result when 20 KB would overly reduce quality.", related: [["/compress-image", "Compress an image", "Choose another target size."], ["/resize-image", "Resize images", "Reduce dimensions before compression when appropriate."]] },
  "/compress-image-to-50kb": { title: "Compress Image to 50 KB — Free Local Tool | ToolImage", description: "Compress an image to 50 KB in your browser. Select the target, keep processing local, and download the closest practical result.", h1: "Make an image 50 KB.", label: "50 KB image compression", guide: "Upload a supported image and select the target. ToolImage tests local quality settings before reducing dimensions only when it is needed.", related: [["/compress-image", "Compress an image", "Choose another target size."], ["/resize-image", "Resize images", "Set useful dimensions locally."]] },
  "/compress-image-to-100kb": { title: "Compress Image to 100 KB — Browser-Based Tool | ToolImage", description: "Reduce an image to 100 KB locally in your browser. ToolImage finds a practical balance between file size, dimensions, and visual quality.", h1: "Make an image 100 KB.", label: "100 KB image compression", guide: "A 100 KB target often leaves more room for detail. ToolImage searches locally for a practical quality and dimension balance before download.", related: [["/compress-image", "Compress an image", "Choose another target size."], ["/convert-image", "Convert images", "Pick a file format for the result."]] },
  "/compress-image-to-200kb": { title: "Compress Image to 200 KB — Private Image Tool | ToolImage", description: "Compress an image to 200 KB in your browser. No account or image upload is required for ToolImage’s local processing workflow.", h1: "Make an image 200 KB.", label: "200 KB image compression", guide: "Choose 200 KB when you need a smaller shareable image while retaining useful information. ToolImage performs the work locally in your browser.", related: [["/compress-image", "Compress an image", "Choose another target size."], ["/convert-image", "Convert images", "Choose the file format that fits."]] },
};

function toolPage(pathname, page) {
  return { ...page, path: pathname, schema: { "@type": "SoftwareApplication", name: "ToolImage", applicationCategory: "MultimediaApplication", operatingSystem: "Web", description: page.description, url: `${siteUrl}${pathname}` }, body: shell(`<section><p>${escapeHtml(page.label.toUpperCase())}</p><h1>${escapeHtml(page.h1)}</h1><p>${escapeHtml(page.description)}</p><p class="crawlable-fallback__note"><strong>Private by design.</strong> Your file is processed in your browser and remains on your device.</p></section><section><h2>How it works</h2><p>${escapeHtml(page.guide)}</p><p>${link(pathname, `Open the ${page.label}`)}</p></section><section><h2>Related local image tools</h2>${cards(page.related)}</section>`) };
}

const pages = [
  {
    path: "/",
    file: "index.html",
    title: "ToolImage — Compress, Resize, and Convert Images Locally",
    description: "Compress, resize, and convert JPG, PNG, and WebP images privately in your browser with free local image tools from ToolImage.",
    schema: [
      { "@type": "WebSite", name: "ToolImage", url: siteUrl, description: "Private browser-local image compression, resizing, and conversion tools." },
      { "@type": "FAQPage", mainEntity: faq.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) },
    ],
    body: shell(`<section><p>TOOLIMAGE / BUILT TO FIT</p><h1>Make the file fit.</h1><p>ToolImage helps you compress images to a target size, resize dimensions, and convert JPG, PNG, and WebP files. The core tools run locally in your browser, so your image stays on your device while you work.</p><p>${link("/compress-image", "Compress an image")}</p></section><section><h2>Private image tools for everyday files</h2><p>Use image compression when a file needs to fit an upload limit, image resizing when a project calls for exact pixels, and image conversion when a destination needs JPG, PNG, or WebP. Each tool is designed for practical work without an upload queue or an account requirement for the core workflow.</p>${cards([["/compress-image", "Compress images", "Choose a target size and keep practical image quality."], ["/resize-image", "Resize images", "Set exact dimensions or preserve the original aspect ratio."], ["/convert-image", "Convert images", "Move between JPG, PNG, and WebP locally."]])}</section><section><h2>How ToolImage works</h2><ol><li>Choose an image from your device.</li><li>Set a target size, dimension, or output format.</li><li>Process the result locally in your browser and download it when ready.</li></ol><p>Supported input formats include JPG, JPEG, PNG, and WebP. Local processing means the image content does not need to travel to a ToolImage image-processing server.</p></section><section><h2>Good to know before you begin</h2>${faq.map(([question, answer], index) => `<details${index === 0 ? " open" : ""}><summary>${escapeHtml(question)}</summary><p>${escapeHtml(answer)}</p></details>`).join("")}</section><section><h2>Explore ToolImage</h2><p>Learn how the tools are designed, review privacy and terms, or explore the complete local image-tool index.</p><div class="crawlable-fallback__links">${link("/tools", "All image tools")} ${link("/about", "About ToolImage")} ${link("/privacy", "Privacy Policy")} ${link("/terms", "Terms of Service")}</div></section>`),
  },
  ...Object.entries(toolData).map(([pathname, page]) => ({ file: `${pathname.slice(1)}.html`, ...toolPage(pathname, page) })),
  {
    path: "/tools",
    file: "tools.html",
    title: "ToolImage Tools — Compress, Resize, and Convert Locally",
    description: "Explore ToolImage’s browser-local tools for image compression, exact resizing, and format conversion.",
    body: shell(`<section><p>TOOLIMAGE / TOOL INDEX</p><h1>One image. One clear job.</h1><p>Choose the local image utility that fits the next step. Every core tool starts with your image on your device.</p></section><section><h2>Choose a local image tool</h2>${cards([["/compress-image", "Compress", "Reduce an image file size toward a practical target."], ["/resize-image", "Resize", "Set width and height or start from a useful preset."], ["/convert-image", "Convert", "Choose JPG, PNG, or WebP without uploading the image."]])}</section>`),
  },
  {
    path: "/about",
    file: "about.html",
    title: "About ToolImage — Local Image Utilities",
    description: "Learn why ToolImage keeps image compression, resizing, and conversion practical, private, and browser-local.",
    body: shell(`<section><p>TOOLIMAGE / ABOUT</p><h1>Less ceremony. More useful.</h1><p>ToolImage is built for the small image tasks that should take seconds, not a new account, a dashboard, or an upload queue.</p></section><section><h2>Your files belong on your device.</h2><p>Compression, resize, and conversion happen inside a modern browser wherever practical. The goal is a calmer workspace that gets out of the way.</p><ul><li>Local browser processing</li><li>Clear, practical controls</li><li>No account required for the core tools</li></ul></section>`),
  },
  {
    path: "/privacy",
    file: "privacy.html",
    title: "ToolImage Privacy Policy",
    description: "Learn how ToolImage handles browser-local image processing and privacy for its image utilities.",
    body: shell(`<article><p>TOOLIMAGE / PRIVACY</p><h1>Privacy Policy</h1><h2>Local processing</h2><p>ToolImage is designed to process images in your browser. When you compress, resize, or convert a supported image, the file is handled by your device rather than being uploaded to a ToolImage image-processing server.</p><h2>Contact</h2><p>For privacy questions, <a href="mailto:support@toolimage.online">email support@toolimage.online</a>.</p></article>`),
  },
  {
    path: "/terms",
    file: "terms.html",
    title: "ToolImage Terms of Service",
    description: "Read the terms that govern ToolImage’s browser-local image utilities.",
    body: shell(`<article><p>TOOLIMAGE / TERMS</p><h1>Terms of Service</h1><h2>Using the tools</h2><p>You are responsible for ensuring you have the rights to process and use the images you select. ToolImage is provided as an image utility and should be used with supported, lawful files.</p><h2>Availability</h2><p>ToolImage is provided without a guarantee of uninterrupted availability or support for every browser, image format, or device.</p></article>`),
  },
  { path: "/pricing", file: "pricing.html", title: "ToolImage Pricing — Free Local Image Tools", description: "ToolImage’s core image compression, resize, and conversion tools are free and run locally in your browser.", noIndex: true, body: shell(`<section><h1>Useful now. More when it matters.</h1><p>Every core ToolImage tool is free, works locally in your browser, and does not require an account.</p>${link("/compress-image", "Start using ToolImage")}</section>`) },
  { path: "/batch", file: "batch.html", title: "ToolImage Pro — Local Batch Image Processing", description: "Process image batches locally after your secure ToolImage Pro entitlement is verified.", noIndex: true, body: shell(`<section><h1>Same image work. Less repetition.</h1><p>Batch processing is available only after server-confirmed Pro access.</p>${link("/pricing", "View pricing")}</section>`) },
  { path: "/subscription", file: "subscription.html", title: "Manage ToolImage Pro Subscription", description: "View the server-confirmed ToolImage Pro subscription state and manage future renewal.", noIndex: true, body: shell(`<section><h1>Manage Pro.</h1><p>Sign in with the account that holds your ToolImage Pro subscription to view its server-confirmed status and renewal information.</p>${link("/pricing#sign-in", "Sign in")}</section>`) },
];

function head(page, assets) {
  const canonical = `${siteUrl}${page.path}`;
  const robots = page.noIndex ? "noindex,follow" : "index,follow";
  const schemas = page.schema ? (Array.isArray(page.schema) ? page.schema : [page.schema]).map((schema) => `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", ...schema }).replace(/</g, "\\u003c")}</script>`).join("") : "";
  return `<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5"><meta name="description" content="${escapeHtml(page.description)}"><meta name="robots" content="${robots}"><meta name="theme-color" content="#F8F7F2"><meta property="og:title" content="${escapeHtml(page.title)}"><meta property="og:description" content="${escapeHtml(page.description)}"><meta property="og:type" content="website"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${socialImage}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(page.title)}"><meta name="twitter:description" content="${escapeHtml(page.description)}"><meta name="twitter:image" content="${socialImage}"><link rel="canonical" href="${canonical}">${adsenseVerification}${favicon}${fallbackStyles}<title>${escapeHtml(page.title)}</title>${assets}${schemas}</head>`;
}

const base = await readFile(path.join(outputDir, "index.html"), "utf8");
const assets = [...base.matchAll(/<script type="module"[^>]*><\/script>|<link rel="stylesheet"[^>]*>/g)].map((match) => match[0]).join("");
if (!assets) throw new Error("Vite asset references were not found in dist/public/index.html.");

await mkdir(outputDir, { recursive: true });
for (const page of pages) {
  const document = `<!doctype html><html lang="en">${head(page, assets)}<body><div id="root">${page.body}</div></body></html>`;
  await writeFile(path.join(outputDir, page.file), document);
}

await writeFile(path.join(outputDir, "crawlable-routes.json"), `${JSON.stringify(pages.map(({ path: pathname, file, title, description, noIndex = false }) => ({ path: pathname, file, title, description, noIndex })), null, 2)}\n`);
