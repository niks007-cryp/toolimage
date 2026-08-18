/** ToolImage Pro access panel — Monochrome Instrument account gate with Google OAuth and the existing email fallback. */
import { Check, LoaderCircle, LockKeyhole, Mail, LogOut, RefreshCw } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link } from "wouter";
import { useEntitlement } from "@/contexts/EntitlementContext";

export function ProAccessPanel({ compact = false }: { compact?: boolean }) {
  const {
    configured,
    loading,
    user,
    isPro,
    status,
    refresh,
    signInWithGoogle,
    sendMagicLink,
    signOut,
  } = useEntitlement();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [googleSigningIn, setGoogleSigningIn] = useState(false);
  const [checking, setChecking] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSending(true);

    try {
      await sendMagicLink(email);
      setSent(true);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "We could not send that sign-in link.");
    } finally {
      setSending(false);
    }
  };

  const startGoogleSignIn = async () => {
    setError(null);
    setGoogleSigningIn(true);

    try {
      await signInWithGoogle();
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "We could not start Google sign-in.");
      setGoogleSigningIn(false);
    }
  };

  const checkSession = async () => {
    setError(null);
    setChecking(true);

    try {
      const next = await refresh();
      if (!next) {
        setError("This browser is not signed in yet. Open the email link in this same browser, then return here.");
      }
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "We could not refresh secure access.");
    } finally {
      setChecking(false);
    }
  };

  if (loading) {
    return <section className="pro-access-panel" aria-live="polite"><LoaderCircle className="spin" size={18} /><p>Checking secure account access…</p></section>;
  }

  if (!configured) {
    return <section className="pro-access-panel"><LockKeyhole size={19} /><div><p className="eyebrow">TOOLIMAGE PRO</p><h2>Secure access is being configured.</h2><p>Free image tools remain available without an account.</p></div></section>;
  }

  if (isPro) {
    return <section className="pro-access-panel pro-access-panel--active"><Check size={19} /><div><p className="eyebrow">TOOLIMAGE PRO ACTIVE</p><h2>{status === "grace" ? "Your billing period remains active." : "Welcome to ToolImage Pro."}</h2><p>Batch processing, custom presets, and ZIP downloads are available in this browser session.</p></div></section>;
  }

  if (user) {
    return <section className="pro-access-panel"><LockKeyhole size={19} /><div><p className="eyebrow">TOOLIMAGE PRO</p><h2>Process multiple images at once.</h2><p>Batch processing, custom presets, and ZIP downloads are available after a verified Pro subscription.</p><Link href="/pricing" className="primary-button">Upgrade to Pro</Link><button type="button" className="text-button" onClick={() => void signOut()}><LogOut size={14} /> Sign out</button></div></section>;
  }

  return (
    <section className={`pro-access-panel ${compact ? "pro-access-panel--compact" : ""}`}>
      <Mail size={19} />
      <div>
        <p className="eyebrow">TOOLIMAGE PRO</p>
        <h2>Process multiple images at once.</h2>
        <p>Sign in securely to begin a ToolImage Pro Test Mode subscription.</p>
        <button
          type="button"
          className="primary-button mt-5 flex w-full max-w-[510px] justify-center !bg-[#fffefa] !text-[#1f2823] ring-1 ring-[#90a99f] shadow-[inset_0_0_0_1px_#ffffff] hover:!bg-[#f0f6f3]"
          onClick={() => void startGoogleSignIn()}
          disabled={googleSigningIn || sending}
        >
          {googleSigningIn ? <LoaderCircle className="spin" size={16} /> : <span className="font-sans text-base font-black leading-none text-[#4285f4]" aria-hidden="true">G</span>}
          Continue with Google
        </button>
        <div className="my-5 flex max-w-[510px] items-center gap-3 text-[9px] font-bold tracking-[0.16em] text-[#737a73]" aria-hidden="true">
          <i className="h-px flex-1 bg-[#cbd2ca]" />
          <span>OR</span>
          <i className="h-px flex-1 bg-[#cbd2ca]" />
        </div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#526158]">Continue with email</p>
        {sent ? (
          <>
            <p className="pro-access-panel__sent"><Check size={15} /> Email sent. Open its sign-in link in this same browser, then return here.</p>
            <p>Opening the link in another browser signs in only that browser. ToolImage never transfers sessions or tokens between browsers.</p>
            <button type="button" className="primary-button" onClick={() => void checkSession()} disabled={checking || googleSigningIn}>{checking ? <LoaderCircle className="spin" size={16} /> : <RefreshCw size={16} />} I opened the link here</button>
            <button type="button" className="text-button" onClick={() => { setSent(false); setError(null); }} disabled={googleSigningIn}>Use a different email</button>
          </>
        ) : (
          <form onSubmit={submit} className="pro-access-form">
            <label className="sr-only" htmlFor="pro-email">Email address</label>
            <input id="pro-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" disabled={googleSigningIn} />
            <button className="primary-button" type="submit" disabled={sending || googleSigningIn}>{sending ? <LoaderCircle className="spin" size={16} /> : <Mail size={16} />} Email sign-in link</button>
          </form>
        )}
        {error && <p className="form-error" role="alert">{error}</p>}
      </div>
    </section>
  );
}
