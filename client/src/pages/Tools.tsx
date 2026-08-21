import { ArrowRight, FileArchive, ImageDown, Maximize2, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { Seo } from "@/components/Seo";
import { SiteShell } from "@/components/SiteShell";

const tools = [
  { href: "/compress-image", number: "01", eyebrow: "TARGET SIZE", title: "Compress", copy: "Set a file-size target and keep processing in the browser.", icon: Sparkles },
  { href: "/resize-image", number: "02", eyebrow: "EXACT PIXELS", title: "Resize", copy: "Set exact dimensions, maintain a ratio, or use a practical preset.", icon: Maximize2 },
  { href: "/convert-image", number: "03", eyebrow: "FORMAT", title: "Convert", copy: "Move between JPG, PNG, and WebP without uploading a file.", icon: ImageDown },
  { href: "/batch", number: "04", eyebrow: "PRO PREVIEW", title: "Batch", copy: "Process a small image set locally, then package the completed files as ZIP.", icon: FileArchive },
];

export default function Tools() { return <SiteShell><Seo title="ToolImage Tools — Compress, Resize, and Convert Locally" description="Explore ToolImage’s browser-local tools for image compression, exact resizing, and format conversion." path="/tools" /><main id="main-content" className="info-page"><section className="info-hero"><p className="eyebrow">TOOLIMAGE / TOOL INDEX</p><h1>One image.<br /><em>One clear job.</em></h1><p>Choose the local utility that fits the next step. Every tool starts with your image on your device.</p></section><section className="info-tools">{tools.map((tool) => { const Icon = tool.icon; return <Link key={tool.href} href={tool.href} className="info-tool-card"><span className="info-tool-card__number">{tool.number}</span><Icon size={22} /><p className="eyebrow">{tool.eyebrow}</p><h2>{tool.title}</h2><p>{tool.copy}</p><span className="text-link">Open tool <ArrowRight size={16} /></span></Link>; })}</section><section className="about-sheet"><div><p className="eyebrow">START WITH THE CONSTRAINT</p><h2>Pick the next<br />useful step.</h2></div><div><p>Use compression when a file needs to fit a target size, resizing when a destination requires exact pixels, and conversion when a site or app needs a particular format. You can resize before compression or choose a format after setting the dimensions that fit your project.</p><p><Link href="/compress-image-to-20kb">20 KB target</Link> · <Link href="/compress-image-to-50kb">50 KB target</Link> · <Link href="/compress-image-to-100kb">100 KB target</Link> · <Link href="/compress-image-to-200kb">200 KB target</Link></p></div></section></main></SiteShell>; }
