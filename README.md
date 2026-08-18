# ToolImage

> **Simple image tools. Done exceptionally well.**

ToolImage is a privacy-focused browser application for compressing images to a target file size, resizing dimensions, and converting JPG, PNG, and WebP images. Every image-processing operation runs locally in the browser. The application has **no image upload API or image-processing server**. A small server-side layer is used only for optional passwordless sign-in and verified Pro subscription entitlement; it never receives image bytes.

## Features

| Capability | Description |
| --- | --- |
| Target-size compression | Compress a JPG, PNG, or WebP toward a selected file size from 20 KB to 2 MB, or specify a custom target. |
| Quality-aware local processing | Search locally through output quality and dimensions to return the closest practical target-size result. |
| PNG-aware compression | Convert PNG uploads to compact WebP results for target-size compression, retaining transparency where browser support allows. |
| Image resizing | Set exact width and height, preserve the original aspect ratio, or start from common social-media presets. |
| Image conversion | Convert supported images between JPG, PNG, and WebP without server upload. |
| Client-side validation | Check file signatures, zero-byte files, file size, image dimensions, decode failures, and target-size inputs before processing. |
| Responsive, accessible UI | Support keyboard upload activation, visible focus states, reduced motion, mobile layouts, and clear recovery guidance. |

## Privacy architecture

```text
User selects an image
        ↓
Browser checks the file signature and limits
        ↓
Browser Canvas decodes and transforms the image locally
        ↓
Browser creates a local Blob and preview
        ↓
User downloads the finished file
```

ToolImage does not send image bytes to an application server. The browser uses standard `File`, `Image`, `Canvas`, `Blob`, and object-URL APIs for its image workflow. Object URLs are revoked when they are no longer needed.

## Technology stack

| Layer | Technology |
| --- | --- |
| Client framework | React 19 and Vite |
| Language | TypeScript |
| Styling | Tailwind CSS 4 plus a custom CSS design system |
| Routing | Wouter |
| Motion | Framer Motion |
| Icons | Lucide React |
| Image processing | Browser Canvas and Blob APIs |
| Pro identity and entitlement | Supabase Auth and Postgres with row-level security |
| Payments | Razorpay Subscriptions via Vercel serverless API routes; Test Mode only |
| Hosting target | Vite output, Vercel SPA rewrites, and Vercel API functions |

## Project structure

```text
client/
  public/
    assets/          # Versioned visual assets used by the interface
    favicon.svg
    manifest.webmanifest
    robots.txt
    sitemap.xml
  src/
    components/      # Shared UI, workspace, layout, metadata handling
    lib/             # Local image processing and SEO registry
    pages/           # Homepage, tools, legal, pricing, and fallback routes
vercel.json          # Static Vite build and SPA rewrite configuration
api/                 # Server-only entitlement, checkout verification, and webhook handlers
shared/              # Server-authorized regional price identifiers
supabase/migrations/ # Versioned RLS-protected entitlement schema
```

## Local development

Use a recent Node.js LTS release and pnpm.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

The development server prints a local URL. It supports hot reloading for client code.

## Quality and production commands

```bash
pnpm check
pnpm build
pnpm preview
```

`pnpm check` runs TypeScript validation. `pnpm build` generates static production assets in `dist/public`.

## Environment variables

Free image processing needs no credentials. The optional Pro flow requires Vercel environment variables listed in [`PAYMENT_CONFIGURATION.md`](./PAYMENT_CONFIGURATION.md). `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are public client configuration. The Supabase service role, Razorpay secret, webhook secret, and plan identifiers are server-only and must **never** use a `VITE_` prefix or appear in source control.

The included database migration creates one entitlement row per authenticated user, client-readable only through row-level security. Payment sessions and Razorpay webhook events have no client write policy; Vercel handlers use the service role after independently verifying the signed-in user, Razorpay Checkout signature, or webhook signature.

## Deployment

ToolImage is configured for Vercel deployment with static client assets and serverless API functions.

1. Import this repository into Vercel.
2. Use the included `vercel.json` configuration.
3. Build with `pnpm build`; Vercel serves `dist/public`.
4. Add the required Supabase and **Razorpay Test Mode** environment variables in Vercel, following [`PAYMENT_CONFIGURATION.md`](./PAYMENT_CONFIGURATION.md).
5. Add the deployed URL and `/pricing` callback to Supabase Auth redirect allowlists.
6. Configure Razorpay’s Test Mode webhook at `/api/webhooks/razorpay` and subscribe to the documented subscription lifecycle events.
7. The rewrite rule returns `index.html` for client-side routes, while `/api/*` is reserved for serverless handlers.
8. Configure the intended custom domain in Vercel before launch.

The SEO registry and sitemap currently use `https://toolimage.io` as the canonical domain. If production uses a different domain, update `client/src/lib/seo.ts`, `client/index.html`, `client/public/robots.txt`, and `client/public/sitemap.xml` together before deploying.

## SEO

ToolImage provides dedicated, useful routes for:

| Compression pages | Utility pages |
| --- | --- |
| `/compress-image` | `/resize-image` |
| `/compress-jpg` | `/convert-image` |
| `/compress-png` | `/privacy` |
| `/compress-webp` | `/terms` |
| `/compress-image-to-20kb` |  |
| `/compress-image-to-50kb` |  |
| `/compress-image-to-100kb` |  |
| `/compress-image-to-200kb` |  |

Route-specific titles, descriptions, canonical URLs, Open Graph fields, Twitter fields, and `SoftwareApplication` structured data are updated in the browser for each route. The pricing page is marked `noindex` while Test Mode payment integration is being validated.

## Image-processing behavior

For target-size compression, ToolImage performs a bounded local search. At each size pass, it searches for the highest practical JPEG or WebP quality that fits the target. If no practical quality fits, it makes a measured dimension reduction and tries again. The process is bounded and yields to the browser between passes to keep the interface responsive.

PNG output does not have a browser quality setting. For a specific compressed target, ToolImage therefore produces a WebP result locally; this is disclosed in the workspace. The resize and conversion tools retain the selected output format.

## Browser support

ToolImage targets current versions of Chrome, Edge, Firefox, Safari, iOS Safari, Android Chrome, and ChromeOS browsers with Canvas, Blob, File, and object-URL support. On iPhone and iPad, the downloaded result can open in a new tab; users can long-press the image and choose **Save to Photos**.

## Pro access and payment safety

Batch processing, session presets, and ZIP downloads are Pro-only. A browser never decides that a user is Pro: the client requests the server-verified entitlement state. Razorpay Checkout success is verified using the server-held secret, and webhook deliveries are signature-checked and recorded by payload fingerprint for idempotency. Regional display prices are approximate UI context only; the server permits checkout only for an explicitly configured Razorpay plan in the selected currency.

## Roadmap

Before live activation, validate the connected Razorpay account’s supported recurring currencies and cards, complete Test Mode lifecycle testing, configure a canonical Vercel domain, and replace only Test Mode credentials with approved Live Mode variables after a separate security review.
