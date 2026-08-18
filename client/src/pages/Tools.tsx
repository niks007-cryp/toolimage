/** ToolImage tools page — Monochrome Instrument: a concise field guide to the real local utilities, not a dashboard. */
import { ArrowRight, ImageDown, Maximize2, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { Seo } from "@/components/Seo";
import { SiteShell } from "@/components/SiteShell";

const tools = [
  { href: "/compress-image", number: "01", eyebrow: "TARGET SIZE", title: "Compress", copy: "Set a file-size target and keep processing in the browser.", icon: Sparkles },
  { href: "/resize-image", number: "02", eyebrow: "EXACT PIXELS", title: "Resize", copy: "Set exact dimensions, maintain a ratio, or use a practical preset.", icon: Maximize2 },
  { href: "/convert-image", number: "03", eyebrow: "FORMAT", title: "Convert", copy: "Move between JPG, PNG, and WebP without uploading a file.", icon: ImageDown },
];

export default function Tools() { return <SiteShell><Seo title="ToolImage Tools — Compress, Resize, and Convert Locally" description="Explore ToolImage’s browser-local tools for image compression, exact resizing, and format conversion." path="/tools" /><main id="main-content" className="info-page"><section className="info-hero"><p className="eyebrow">TOOLIMAGE / TOOL INDEX</p><h1>One image.<br /><em>One clear job.</em></h1><p>Choose the local utility that fits the next step. Every tool starts with your image on your device.</p></section><section className="info-tools">{tools.map((tool) => { const Icon = tool.icon; return <Link key={tool.href} href={tool.href} className="info-tool-card"><span className="info-tool-card__number">{tool.number}</span><Icon size={22} /><p className="eyebrow">{tool.eyebrow}</p><h2>{tool.title}</h2><p>{tool.copy}</p><span className="text-link">Open tool <ArrowRight size={16} /></span></Link>; })}</section></main></SiteShell>; }
