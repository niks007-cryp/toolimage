/** ToolImage brand mark — Monochrome Instrument: a precise aperture-and-measure symbol. */
import { Link } from "wouter";

const MARK_URL = "/assets/toolimage-mark.png";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="brand-mark" aria-label="ToolImage home">
      <img src={MARK_URL} alt="" className="brand-mark__icon" />
      {!compact && <span className="brand-mark__word">ToolImage<span className="brand-mark__dash">—</span></span>}
    </Link>
  );
}
