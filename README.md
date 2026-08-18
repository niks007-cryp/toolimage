# ToolImage

> **Simple image tools. Done exceptionally well.**

ToolImage is a responsive, privacy-focused browser application for compressing images to a target file size, resizing image dimensions, and converting between JPG, PNG, and WebP. The core image work happens locally in the user’s browser, so uploaded images do not need to be sent to an image-processing server.

## Features

| Capability | What it does |
| --- | --- |
| Target-size compression | Compresses a JPG, PNG, or WebP toward selected sizes from 20 KB to 2 MB, or a custom target. |
| Intelligent local compression | Iteratively evaluates quality and dimensions to find the closest practical result rather than applying one fixed setting. |
| Image resizing | Supports fixed dimensions, maintained aspect ratio, and common social-media presets. |
| Image conversion | Converts supported images between JPG, PNG, and WebP formats. |
| Local privacy | Uses the browser’s Canvas APIs; image content is not uploaded by the application for processing. |
| Responsive UX | Designed for modern browsers on desktop, tablet, and mobile operating systems. |
| Accessibility | Includes semantic structure, keyboard-reachable upload controls, visible focus states, descriptive error states, and reduced-motion support. |

## Architecture

ToolImage is a static frontend application. The interface uses React, TypeScript, Tailwind CSS, Wouter routing, and Framer Motion. The image-processing layer is separated from the UI in `client/src/lib/imageProcessing.ts`.

```text
User selects image
        ↓
Browser validates type, size, and dimensions
        ↓
Canvas rasterizes image locally
        ↓
Compression / resize / conversion runs in-browser
        ↓
Result Blob is generated locally
        ↓
User downloads the processed image
```

The application does not require a database, authentication, paid image-processing service, AI provider, or server-side image storage for the current V1 feature set.

## Technology stack

| Layer | Technology |
| --- | --- |
| Framework | React 19 with Vite |
| Language | TypeScript |
| Styling | Tailwind CSS 4 with a custom design system |
| Routing | Wouter |
| Motion | Framer Motion |
| Icons | Lucide React |
| Image processing | Browser Canvas API and Blob download APIs |

## Local development

### Requirements

Use a recent Node.js LTS release and pnpm.

### Install and run

```bash
pnpm install
pnpm dev
```

The development server is exposed on the address printed by Vite. For a production build:

```bash
pnpm check
pnpm build
pnpm start
```

## Environment variables

The V1 application does not require any user-supplied environment variables to perform image processing. The project can run as a static frontend.

If optional analytics are enabled in the host environment, the template supports these injected variables:

| Variable | Purpose |
| --- | --- |
| `VITE_ANALYTICS_ENDPOINT` | Optional analytics script endpoint. |
| `VITE_ANALYTICS_WEBSITE_ID` | Optional analytics site identifier. |

Do not store API keys in the frontend. ToolImage is designed to avoid API-key-dependent image processing.

## Compression algorithm

The target-size compressor follows a local iterative strategy.

1. ToolImage validates the selected image and reads its dimensions in the browser.
2. It renders the image to a local Canvas and tries JPEG or WebP output, depending on the source format.
3. A binary-quality search identifies the highest quality that meets the requested target at the current dimensions.
4. If the file is still too large, the algorithm makes a modest dimension reduction and repeats the quality search.
5. If the target cannot be reached without excessive degradation, ToolImage returns the smallest practical result and communicates that outcome.

PNG sources are compressed to WebP in the target-size workflow because the browser Canvas API does not expose a comparable quality control for lossless PNG encoding. The resize and format-conversion tools retain the chosen output format.

## Privacy architecture

ToolImage’s processing flow is intentionally client-side. File validation, image decoding, Canvas rendering, encoded result creation, preview generation, and final download are all browser operations. No image upload endpoint is used by this V1 application.

This local architecture reduces per-image operating cost and supports privacy-sensitive use cases. Browser capabilities and device memory can differ, so the application validates large files and dimensions before processing and provides clear, nontechnical errors when local processing is not appropriate.

## Vercel deployment

ToolImage can be deployed as a static Vite site.

1. Import the GitHub repository into Vercel.
2. Set the build command to `pnpm build`.
3. Set the output directory to `dist/public`.
4. Deploy without adding image-processing secrets or backend storage configuration.

The Express server in this project supports static-hosting fallback when running the included production server, but the Vite build output can also be served by a static host with SPA fallback support.

## SEO files

The project includes `robots.txt` and `sitemap.xml` in `client/public/`, along with base metadata in `client/index.html`. Before public launch, replace the example canonical domain `https://toolimage.app/` in the metadata and sitemap if the production domain differs.

## Browser support

ToolImage targets current versions of Chrome, Edge, Firefox, Safari, and the default browsers available on modern Windows, macOS, Linux, iOS, Android, and ChromeOS devices. It depends on standard browser features such as Canvas, Blob, File, and object URL APIs.

## Roadmap

Future work may include batch processing, saved presets, processing history, regional pricing selection, optional analytics abstraction, and premium export controls. These are intentionally not simulated in the current V1 release.

## Quality checks performed

The current build has passed TypeScript validation and a Vite production build. The live application was exercised for target-size compression, a YouTube-thumbnail resize preset, and local PNG-to-WebP conversion. Desktop and mobile layouts were reviewed across primary routes.
