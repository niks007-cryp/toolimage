/** ToolImage batch page — Monochrome Instrument: a small, deliberate local workspace for repeat image work. */
import { BatchStudio } from "@/components/BatchStudio";
import { ProAccessPanel } from "@/components/ProAccessPanel";
import { Seo } from "@/components/Seo";
import { SiteShell } from "@/components/SiteShell";
import { useEntitlement } from "@/contexts/EntitlementContext";

export default function Batch() { const { isPro } = useEntitlement(); return <SiteShell><Seo title="ToolImage Pro — Local Batch Image Processing" description="Process image batches locally after your secure ToolImage Pro entitlement is verified." path="/batch" noIndex /><main id="main-content"><section className="batch-page-hero"><p className="eyebrow">TOOLIMAGE PRO / LOCAL WORKFLOW</p><h1>Same image work.<br /><em>Less repetition.</em></h1><p>Batch processing, session presets, and ZIP downloads stay in your browser. Access is granted only after the server confirms an active Pro subscription.</p></section>{isPro ? <BatchStudio /> : <div className="pro-access-wrap"><ProAccessPanel /></div>}</main></SiteShell>; }
