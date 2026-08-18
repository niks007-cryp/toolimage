/** ToolImage batch page — Monochrome Instrument: a small, deliberate local workspace for repeat image work. */
import { BatchStudio } from "@/components/BatchStudio";
import { Seo } from "@/components/Seo";
import { SiteShell } from "@/components/SiteShell";

export default function Batch() { return <SiteShell><Seo title="ToolImage Pro Preview — Local Batch Image Processing" description="Process a small image batch locally, save session presets, and download completed images as a ZIP without uploading files." path="/batch" noIndex /><main id="main-content"><section className="batch-page-hero"><p className="eyebrow">TOOLIMAGE PRO / WORKFLOW PREVIEW</p><h1>Same image work.<br /><em>Less repetition.</em></h1><p>Batch processing, custom presets, and ZIP downloads are prepared locally in your browser. Pricing is shown for planning; payments are not active.</p></section><BatchStudio /></main></SiteShell>; }
