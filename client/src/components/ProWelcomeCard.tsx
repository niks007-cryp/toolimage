import { Check, Sparkles, X } from "lucide-react";
import { useState } from "react";

const benefits = ["Batch processing", "Custom saved presets", "ZIP batch downloads"];

export function ProWelcomeCard() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <section className="pro-welcome-card" aria-labelledby="pro-welcome-title">
      <div className="pro-welcome-card__mark"><Sparkles size={19} aria-hidden="true" /></div>
      <div className="pro-welcome-card__copy">
        <p className="eyebrow">TOOLIMAGE PRO</p>
        <h2 id="pro-welcome-title">Smart work.<br /><em>Welcome to Pro.</em></h2>
        <p>Your verified membership unlocks the workflow tools already available in ToolImage.</p>
        <ul>{benefits.map((benefit) => <li key={benefit}><Check size={15} aria-hidden="true" />{benefit}</li>)}</ul>
      </div>
      <button type="button" className="pro-welcome-card__dismiss" onClick={() => setDismissed(true)} aria-label="Dismiss Pro welcome"><X size={17} aria-hidden="true" /></button>
    </section>
  );
}
