/** ToolImage site shell — Monochrome Instrument: warm paper field, measured rules, calm navigation. */
import { Menu, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { ReactNode, useState } from "react";
import { BrandMark } from "./BrandMark";

const nav = [
  { href: "/compress-image", label: "Compress" },
  { href: "/resize-image", label: "Resize" },
  { href: "/convert-image", label: "Convert" },
  { href: "/pricing", label: "Pricing" },
];

export function SiteShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="site-header__inner">
          <BrandMark />
          <nav className="desktop-nav" aria-label="Primary navigation">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className={location === item.href ? "nav-link is-active" : "nav-link"}>{item.label}</Link>
            ))}
          </nav>
          <Link href="/compress-image" className="header-cta">Compress an image</Link>
          <button className="menu-button" type="button" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((value) => !value)}>
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
        {open && (
          <nav className="mobile-nav" aria-label="Mobile navigation">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className={location === item.href ? "nav-link is-active" : "nav-link"} onClick={() => setOpen(false)}>{item.label}</Link>
            ))}
            <Link href="/compress-image" className="header-cta" onClick={() => setOpen(false)}>Compress an image</Link>
          </nav>
        )}
      </header>
      {children}
      <footer className="site-footer">
        <div className="footer-rail" aria-hidden="true"><span>01</span><i /><span>LOCAL · FAST · PRIVATE</span></div>
        <div className="footer-content">
          <div><BrandMark compact /><p>Made for files that need to fit.</p></div>
          <div className="footer-links"><Link href="/compress-image">Compress</Link><Link href="/resize-image">Resize</Link><Link href="/convert-image">Convert</Link><Link href="/pricing">Pricing</Link></div>
          <div className="footer-links"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><a href="mailto:hello@toolimage.app">Contact</a></div>
        </div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} ToolImage</span><span>Images are processed in your browser.</span></div>
      </footer>
    </div>
  );
}
