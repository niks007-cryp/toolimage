/** ToolImage Pro access panel — Monochrome Instrument gate; Google OAuth authenticates through Supabase, while entitlement remains server verified. */
import { Check, Chrome, LoaderCircle, LockKeyhole, Mail, LogOut } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { useEntitlement } from "@/contexts/EntitlementContext";

export function ProAccessPanel({ compact = false }: { compact?: boolean }) {
  const { configured, loading, user, isPro, status, signInWithGoogle, signOut } = useEntitlement();
  const [error, setError] = useState<string | null>(null); const [startingGoogle, setStartingGoogle] = useState(false);
  const continueWithGoogle = async () => { setError(null); setStartingGoogle(true); try { await signInWithGoogle(); } catch (issue) { setError(issue instanceof Error ? issue.message : "Google sign-in could not be started."); setStartingGoogle(false); } };
  if (loading) return <section className="pro-access-panel" aria-live="polite"><LoaderCircle className="spin" size={18} /><p>Checking secure account access…</p></section>;
  if (!configured) return <section className="pro-access-panel"><LockKeyhole size={19} /><div><p className="eyebrow">TOOLIMAGE PRO</p><h2>Secure access is being configured.</h2><p>Free image tools remain available without an account.</p></div></section>;
  if (isPro) return <section className="pro-access-panel pro-access-panel--active"><Check size={19} /><div><p className="eyebrow">TOOLIMAGE PRO ACTIVE</p><h2>{status === "grace" ? "Your billing period remains active." : "Welcome to ToolImage Pro."}</h2><p>Batch processing, custom presets, and ZIP downloads are available in this browser session.</p></div></section>;
  if (user) return <section className="pro-access-panel"><LockKeyhole size={19} /><div><p className="eyebrow">TOOLIMAGE PRO</p><h2>Process multiple images at once.</h2><p>Batch processing, custom presets, and ZIP downloads are available after a verified Pro subscription.</p><Link href="/pricing" className="primary-button">Upgrade to Pro</Link><button type="button" className="text-button" onClick={() => void signOut()}><LogOut size={14} /> Sign out</button></div></section>;
  return <section className={`pro-access-panel ${compact ? "pro-access-panel--compact" : ""}`}><Mail size={19} /><div><p className="eyebrow">TOOLIMAGE PRO</p><h2>Process multiple images at once.</h2><p>Sign in with Google before starting a secure Test Mode subscription.</p><button type="button" className="primary-button" onClick={() => void continueWithGoogle()} disabled={startingGoogle}>{startingGoogle ? <LoaderCircle className="spin" size={16} /> : <Chrome size={16} />} Continue with Google</button><p className="pro-access-panel__oauth-note">Google returns you to this page with a Supabase session. Upgrade access is still verified server-side.</p><p className="pro-access-panel__email-paused">Email sign-in is temporarily unavailable while the hosted provider rate limit resets.</p>{error && <p className="form-error" role="alert">{error}</p>}</div></section>;
}
