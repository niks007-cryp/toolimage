/** ToolImage pricing selector — a quiet session-only regional display control, never an account or payment selector. */
import { ChevronDown, Check } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PricingRegionId, PRICING_REGIONS, REGIONAL_PRICES } from "@/lib/pricing";
import { useState } from "react";

export function PricingRegionSelector({ region, onChange }: { region: PricingRegionId; onChange: (region: PricingRegionId) => void }) {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const selected = REGIONAL_PRICES[region];
  return <div className="region-selector"><button type="button" className="region-selector__trigger" aria-expanded={open} aria-haspopup="listbox" onClick={() => setOpen((value) => !value)}><span>{selected.flag} {selected.label}</span><ChevronDown size={14} /></button><AnimatePresence>{open && <motion.div className="region-selector__menu" role="listbox" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: reduceMotion ? 0 : 0.16, ease: [0.23, 1, 0.32, 1] }}>{PRICING_REGIONS.map((item) => <button type="button" key={item.id} role="option" aria-selected={region === item.id} onClick={() => { onChange(item.id); setOpen(false); }}><span>{item.flag} {item.country}</span><small>{item.currency}</small>{region === item.id && <Check size={14} />}</button>)}</motion.div>}</AnimatePresence></div>;
}
