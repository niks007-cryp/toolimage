import { useEffect, useRef, useState, type RefObject } from "react";
import { Check, CreditCard, LoaderCircle, ShieldCheck, X } from "lucide-react";
import { Link } from "wouter";
import { Seo } from "@/components/Seo";
import { SiteShell } from "@/components/SiteShell";
import { useEntitlement } from "@/contexts/EntitlementContext";
import { fetchWithTimeout } from "@/lib/asyncTimeout";

type SubscriptionStatus = "active" | "cancellation_pending" | "cancelled" | "ended" | "payment_issue" | "inactive" | "verification_error";
type ManagedSubscription = { plan: string; price: string; status: SubscriptionStatus; lifecycle: string; providerStatus: string; nextBillingAt: string | null; cancellationPending: boolean; verificationError: boolean };
type StatusResponse = { subscription?: ManagedSubscription | null; verificationError?: boolean; verificationMessage?: string | null; error?: string };
const SUBSCRIPTION_STATUS_TIMEOUT_MS = 10000;
const SAFE_VERIFICATION_MESSAGE = "We’re having trouble verifying your subscription. Please try again later.";

const statusCopy: Record<SubscriptionStatus, { label: string; detail: string; tone: "good" | "warning" | "quiet" }> = {
  active: { label: "Active", detail: "Your Pro subscription is active and renews monthly unless cancelled.", tone: "good" },
  cancellation_pending: { label: "Cancellation scheduled", detail: "Future renewal is stopped. Pro remains active until the end of the current paid period.", tone: "warning" },
  cancelled: { label: "Cancelled", detail: "The subscription is cancelled.", tone: "quiet" },
  ended: { label: "Ended", detail: "This subscription has reached the end of its paid period.", tone: "quiet" },
  payment_issue: { label: "Payment issue", detail: "A payment or mandate issue was reported. Access reflects the server-confirmed entitlement state.", tone: "warning" },
  inactive: { label: "Inactive", detail: "No active ToolImage Pro subscription is available for this account.", tone: "quiet" },
  verification_error: { label: "Verification needed", detail: SAFE_VERIFICATION_MESSAGE, tone: "warning" },
};

function formatDate(value: string | null) { if (!value) return "Not available"; const parsed = new Date(value); return Number.isNaN(parsed.valueOf()) ? "Not available" : new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(parsed); }

function CancelDialog({ open, busy, error, onClose, onConfirm, returnFocusRef }: { open: boolean; busy: boolean; error: string | null; onClose: () => void; onConfirm: () => void; returnFocusRef: RefObject<HTMLButtonElement | null> }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  if (!open) return null;
  const close = () => { if (!busy) { returnFocusRef.current?.focus(); onClose(); } };
  return <div className="subscription-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) close(); }}><div className="subscription-dialog" role="dialog" aria-modal="true" aria-labelledby="cancel-pro-title" aria-describedby="cancel-pro-description"><button ref={closeRef} type="button" className="subscription-dialog__close" disabled={busy} onClick={close} aria-label="Close cancellation confirmation"><X size={18} /></button><p className="eyebrow">TOOLIMAGE PRO / CONFIRMATION</p><h2 id="cancel-pro-title">Cancel Pro subscription?</h2><p id="cancel-pro-description">Future ₹149 monthly renewals will stop at the end of the current billing cycle. Your Pro access remains active until the provider-confirmed period end.</p><p className="subscription-dialog__note">This request applies only to the subscription securely recorded for your signed-in account.</p>{error && <p className="form-error" role="alert">{error}</p>}<div className="subscription-dialog__actions"><button type="button" className="secondary-button" disabled={busy} onClick={close}>Keep Pro</button><button type="button" className="danger-button" disabled={busy} onClick={onConfirm}>{busy ? <><LoaderCircle className="spin" size={16} /> Confirming</> : "Cancel Pro"}</button></div></div></div>;
}

export default function Subscription() {
  const { user, session, loading: entitlementLoading, refresh } = useEntitlement();
  const [subscription, setSubscription] = useState<ManagedSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const cancelTriggerRef = useRef<HTMLButtonElement>(null);
  const loadGenerationRef = useRef(0);
  const userId = user?.id ?? null;
  const accessToken = session?.access_token;

  useEffect(() => {
    const generation = ++loadGenerationRef.current; let invalidated = false; const isCurrent = () => !invalidated && generation === loadGenerationRef.current;
    if (!userId) { setSubscription(null); setError(null); setLoading(false); return () => { invalidated = true; }; }
    if (!accessToken) { setSubscription(null); setError("Please sign in again to manage your subscription."); setLoading(false); return () => { invalidated = true; }; }
    setLoading(true); setError(null);
    void (async () => {
      try {
        const response = await fetchWithTimeout("/api/subscriptions/status", { headers: { Authorization: `Bearer ${accessToken}` } }, SUBSCRIPTION_STATUS_TIMEOUT_MS, SAFE_VERIFICATION_MESSAGE);
        const body = await response.json().catch(() => ({})) as StatusResponse;
        if (!response.ok) throw new Error(body.error || SAFE_VERIFICATION_MESSAGE);
        if (!isCurrent()) return;
        setSubscription(body.subscription ?? null);
        setError(body.verificationError ? body.verificationMessage || SAFE_VERIFICATION_MESSAGE : null);
      } catch {
        if (!isCurrent()) return;
        setSubscription(null);
        setError(SAFE_VERIFICATION_MESSAGE);
      } finally { if (isCurrent()) setLoading(false); }
    })();
    return () => { invalidated = true; if (generation === loadGenerationRef.current) loadGenerationRef.current += 1; };
  }, [userId, accessToken, retryKey]);

  const retry = () => { if (!loading) setRetryKey((value) => value + 1); };
  const cancel = async () => {
    setCancelling(true); setError(null);
    try {
      const refreshedSession = await refresh();
      if (!refreshedSession?.access_token) throw new Error("sign-in");
      const response = await fetch("/api/subscriptions/cancel", { method: "POST", headers: { Authorization: `Bearer ${refreshedSession.access_token}` } });
      const body = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(body.error || SAFE_VERIFICATION_MESSAGE);
      setDialogOpen(false); setRetryKey((value) => value + 1);
    } catch (issue) { setError(issue instanceof Error && issue.message === "sign-in" ? "Please sign in again to manage your subscription." : SAFE_VERIFICATION_MESSAGE); }
    finally { setCancelling(false); }
  };

  const state = subscription ? statusCopy[subscription.status] : statusCopy.inactive;
  const providerWarning = Boolean(subscription?.verificationError || error === SAFE_VERIFICATION_MESSAGE);
  return <SiteShell><Seo title="Manage ToolImage Pro Subscription" description="View the server-confirmed ToolImage Pro subscription state and manage future renewal." path="/subscription" noIndex /><main id="main-content" className="subscription-page"><section className="subscription-hero"><p className="eyebrow">TOOLIMAGE / ACCOUNT</p><h1>Manage<br /><em>Pro.</em></h1><p>Subscription details are retrieved from the server-confirmed subscription state recorded for this account.</p></section><section className="subscription-sheet" aria-busy={loading || entitlementLoading}>{!user && !entitlementLoading ? <div className="subscription-empty"><ShieldCheck size={24} /><h2>Sign in to manage Pro.</h2><p>Use the account that holds your ToolImage Pro subscription to view its status and renewal information.</p><Link href="/pricing" className="primary-button">Go to pricing</Link></div> : loading || entitlementLoading ? <div className="subscription-empty"><LoaderCircle className="spin" size={24} /><h2>Checking your subscription.</h2></div> : !subscription ? <div className="subscription-empty"><ShieldCheck size={24} /><h2>No Pro subscription found.</h2><p>Upgrade when you are ready to unlock ToolImage Pro.</p>{error && <p className="form-error" role="alert">{error}</p>}<div className="subscription-dialog__actions"><Link href="/pricing" className="primary-button">View plans</Link>{providerWarning && <button type="button" className="secondary-button" onClick={retry}>Retry</button>}</div></div> : <><div className="subscription-sheet__header"><div><p className="eyebrow">SERVER-CONFIRMED SUBSCRIPTION</p><h2>ToolImage Pro</h2></div><span className={`subscription-status subscription-status--${state.tone}`}><Check size={14} />{state.label}</span></div>{error && <div className="form-error" role="alert"><p>{error}</p>{providerWarning && <button type="button" className="secondary-button" onClick={retry}>Retry</button>}</div>}<dl className="subscription-facts"><div><dt>Plan</dt><dd>{subscription.plan}</dd></div><div><dt>Price</dt><dd>{subscription.price}</dd></div><div><dt>Billing</dt><dd>Recurring monthly</dd></div><div><dt>Next billing date</dt><dd>{formatDate(subscription.nextBillingAt)}</dd></div></dl><div className={`subscription-state subscription-state--${state.tone}`}><CreditCard size={19} /><div><strong>{state.label}</strong><p>{state.detail}</p>{subscription.cancellationPending && subscription.nextBillingAt && <p className="subscription-state__date">Pro remains available until {formatDate(subscription.nextBillingAt)}.</p>}</div></div>{subscription.status === "active" && <div className="subscription-cancel"><div><h3>Cancel future renewal</h3><p>Cancellation stops the next renewal. Your current Pro access remains available through the provider-confirmed billing period.</p></div><button ref={cancelTriggerRef} type="button" className="danger-button" onClick={() => setDialogOpen(true)}>Cancel Subscription</button></div>}{subscription.status === "cancellation_pending" && <div className="subscription-cancel subscription-cancel--scheduled"><div><h3>Cancellation is scheduled</h3><p>No further renewal is planned. You do not need to take any action.</p></div></div>}<div className="subscription-links"><Link href="/terms">Terms of Service</Link><Link href="/refunds">Refund &amp; Cancellation</Link><Link href="/privacy">Privacy Policy</Link></div></>}</section></main><CancelDialog open={dialogOpen} busy={cancelling} error={error} onClose={() => setDialogOpen(false)} onConfirm={() => void cancel()} returnFocusRef={cancelTriggerRef} /></SiteShell>;
}
