/** ToolImage site shell — Monochrome Instrument: warm paper field, measured rules, calm navigation. */
/** ToolImage shell — Monochrome Instrument navigation: editorial restraint, generous breathing room, and functional teal calls to action. */
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { ReactNode, useState } from "react";
import { BrandMark } from "./BrandMark";

const nav = [
  { href: "/compress-image", label: "Compress" },
  { href: "/resize-image", label: "Resize" },
  { href: "/convert-image", label: "Convert" },
  { href: "/tools", label: "All Tools" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
];

export function SiteShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const transition = { duration: reduceMotion ? 0 : 0.22, ease: [0.23, 1, 0.32, 1] as const };
  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="site-header">
        <div className="site-header__inner">
          <BrandMark />
          <nav className="desktop-nav" aria-label="Primary navigation">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className={location === item.href ? "nav-link is-active" : "nav-link"}>{item.label}</Link>
            ))}
          </nav>
          <Link href="/compress-image" className="header-cta">Get started</Link>
          <button className="menu-button" type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-site-menu" onClick={() => setOpen((value) => !value)}>
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
        <AnimatePresence>
          {open && <motion.nav id="mobile-site-menu" className="mobile-nav mobile-nav-panel" aria-label="Mobile navigation" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={transition}>
            <div className="mobile-nav__rail"><span>TOOLIMAGE / NAVIGATION</span><i /></div>
            {nav.map((item, index) => (
              <motion.div key={item.href} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ ...transition, delay: reduceMotion ? 0 : index * 0.025 }}><Link href={item.href} className={location === item.href ? "nav-link is-active" : "nav-link"} onClick={() => setOpen(false)}>{item.label}</Link></motion.div>
            ))}
            <Link href="/compress-image" className="header-cta" onClick={() => setOpen(false)}>Get started</Link>
          </motion.nav>}
        </AnimatePresence>
      </header>
      {children}
      <footer className="site-footer">
        <div className="footer-rail" aria-hidden="true"><span>01</span><i /><span>LOCAL · FAST · PRIVATE</span></div>
        <div className="footer-content">
          <div><BrandMark compact /><p>Made for files that need to fit.</p></div>
          <div className="footer-links"><Link href="/compress-image">Compress</Link><Link href="/resize-image">Resize</Link><Link href="/convert-image">Convert</Link><Link href="/tools">All tools</Link></div>
          <div className="footer-links"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><a href="mailto:hello@toolimage.io">Contact</a></div>
        </div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} ToolImage</span><span>Images are processed in your browser.</span></div>
      </footer>
    </div>
  );
}
