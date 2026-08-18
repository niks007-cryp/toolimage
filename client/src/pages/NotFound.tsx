/** ToolImage 404 — Monochrome Instrument: clear escape route with quiet editorial hierarchy. */
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { SiteShell } from "@/components/SiteShell";

export default function NotFound() { return <SiteShell><main id="main-content" className="not-found"><p className="eyebrow">404 / NOT FOUND</p><h1>That page<br /><em>doesn’t fit.</em></h1><p>It may have moved, changed shape, or never existed.</p><Link href="/" className="primary-button">Back to ToolImage <ArrowRight size={17} /></Link></main></SiteShell>; }
