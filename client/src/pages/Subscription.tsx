import { Check, CreditCard, LoaderCircle, ShieldCheck, X } from "lucide-react";
import { useEffect, useRef, useState, type RefObject } from "react";
import { Link } from "wouter";
import { Seo } from "@/components/Seo";
import { SiteShell } from "@/components/SiteShell";
import { useEntitlement } from "@/contexts/EntitlementContext";

type SubscriptionStatus = "active" | "cancellation_pending" | "cancelled" | "expired" | "payment_issue" | "inactive";
type ManagedSubscription = { plan: string; price: string; status: SubscriptionStatus; providerStatus: string; nextBillingAt: string | null; cancellationPending: boolean };

const statusCopy: Record<SubscriptionStatus, { label: string; detail: string; tone: "good" | "warning" | "quiet" }> = {
  active: { label: "Active", detail: "Your Pro subscription is active and renews monthly unless cancelled.", tone: "good" },
  cancellation_pending: { label: "Cancellation scheduled", detail: "Future renewal is stopped. Pro remains active until the end of the current paid period.", tone: "warning" },
  cancelled: { label: "Cancelled", detail: "The subscription is cancelled.", tone: "quiet" },
  expired: { label: "Expired", detail: "This subscription is no longer active.", tone: "quiet" },
  payment_issue: { label: "Payment issue", detail: "A payment or subscription issue was reported. Access reflects the server-confirmed entitlement state.", tone: "warning" },
  inactive: { label: "Inactive", detail: "No active ToolImage Pro subscription is available for this account.", tone: "quiet" },
};

function formatDate(value: string | null) {
  if (!value) return "Not available";
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? "Not available" : new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(parsed);
}

function CancelDialog({ open, busy, error, onClose, onConfirm, returnFocusRef }: { open: boolean; busy: boolean; error: string | null; onClose: () => void; onConfirm: () => void; returnFocusRef: RefObject<HTMLButtonElement | null> }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  if (!open) return null;
  const close = () => { if (!busy) { returnFocusRef.current?.focus(); onClose(); } };
  return <div className="subscription-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) close(); }}><div className="subscription-dialog" role="dialog" aria-modal="true" aria-labelledby="cancel-pro-title" aria-describedby="cancel-pro-description"><button ref={closeRef} type="button" className="subscription-dialog__close" disabled={busy} onClick={close} aria-label="Close cancellation confirmation"><X size={18} /></button><p className="eyebrow">TOOLIMAGE PRO / CONFIRMATION</p><h2 id="cancel-pro-title">Cancel Pro subscription?</h2><p id="cancel-pro-description">Future ₹149 monthly renewals will stop at the end of the current billing cycle. Your Pro access remains active until the provider-confirmed period end.</p><p className="subscription-dialog__note">This request applies only to the subscription securely recorded for your signed-in account.</p>{error && <p className="form-error" role="alert">{error}</p>}<div className="subscription-dialog__actions"><button type="button" className="secondary-button" disabled={busy} onClick={close}>Keep Pro</button><button type="button" className="danger-button" disabled={busy} onClick={onConfirm}>{busy ? <><LoaderCircle className="spin" size={16} /> Confirming</> : "Cancel Pro"}</button></div></div></div>;
}

export default function Subscription() {
  const { user, loading: entitlementLoading, refresh } = useEntitlement();
  const [subscription, setSubscription] = useState<ManagedSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const cancelTriggerRef = useRef<HTMLButtonElement>(null);

  const load = async () => {
    if (!user) { setSubscription(null); return; }
    setLoading(true); setError(null);
    try {
      const session = await refresh();
      if (!session?.access_token) throw new Error("Please sign in again to manage your subscription.");
      const response = await fetch("/api/subscriptions/status", { headers: { Authorization: `Bearer ${session.access_token}` } });
      const body = await response.json().catch(() => ({})) as { subscription?: ManagedSubscription | null; error?: string };
      if (!response.ok) throw new Error(body.error || "We could not load your subscription.");
      setSubscription(body.subscription ?? null);
    } catch (issue) { setError(issue instanceof Error ? issue.message : "We could not load your subscription."); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [user]);

  const cancel = async () => {
    setCancelling(true); setError(null);
    try {
      const session = await refresh();
      if (!session?.access_token) throw new Error("Please sign in again to manage your subscription.");
      const response = await fetch("/api/subscriptions/cancel", { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` } });
      const body = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(body.error || "Cancellation could not be confirmed.");
      setDialogOpen(false);
      await load();
    } catch (issue) { setError(issue instanceof Error ? issue.message : "Cancellation could not be confirmed."); }
    finally { setCancelling(false); }
  };

  const state = subscription ? statusCopy[subscription.status] : statusCopy.inactive;
  return <SiteShell><Seo title="Manage ToolImage Pro Subscription" description="View the server-confirmed ToolImage Pro subscription state and manage future renewal." path="/subscription" noIndex /><main id="main-content" className="subscription-page"><section className="subscription-hero"><p className="eyebrow">TOOLIMAGE / ACCOUNT</p><h1>Manage<br /><em>Pro.</em></h1><p>Subscription details are retrieved from the server-confirmed subscription recorded for this account.</p></section><section className="subscription-sheet" aria-busy={loading || entitlementLoading}>{!user && !entitlementLoading ? <div className="subscription-empty"><ShieldCheck size={24} /><h2>Sign in to manage Pro.</h2><p>Use the account that holds your ToolImage Pro subscription to view its status and renewal information.</p><Link href="/pricing" className="primary-button">Go to pricing</Link></div> : loading || entitlementLoading ? <div className="subscription-empty"><LoaderCircle className="spin" size={24} /><h2>Checking your subscription.</h2></div> : <><div className="subscription-sheet__header"><div><p className="eyebrow">SERVER-CONFIRMED SUBSCRIPTION</p><h2>ToolImage Pro</h2></div><span className={`subscription-status subscription-status--${state.tone}`}><Check size={14} />{state.label}</span></div>{error && <p className="form-error" role="alert">{error}</p>}<dl className="subscription-facts"><div><dt>Plan</dt><dd>{subscription?.plan ?? "ToolImage Pro"}</dd></div><div><dt>Price</dt><dd>{subscription?.price ?? "₹149/month"}</dd></div><div><dt>Billing</dt><dd>Recurring monthly</dd></div><div><dt>Next billing date</dt><dd>{formatDate(subscription?.nextBillingAt ?? null)}</dd></div></dl><div className={`subscription-state subscription-state--${state.tone}`}><CreditCard size={19} /><div><strong>{state.label}</strong><p>{state.detail}</p>{subscription?.cancellationPending && subscription.nextBillingAt && <p className="subscription-state__date">Pro remains available until {formatDate(subscription.nextBillingAt)}.</p>}</div></div>{subscription?.status === "active" && <div className="subscription-cancel"><div><h3>Cancel future renewal</h3><p>Cancellation stops the next renewal. Your current Pro access remains available through the provider-confirmed billing period.</p></div><button ref={cancelTriggerRef} type="button" className="danger-button" onClick={() => setDialogOpen(true)}>Cancel Pro</button></div>}{subscription?.status === "cancellation_pending" && <div className="subscription-cancel subscription-cancel--scheduled"><div><h3>Cancellation is scheduled</h3><p>No further renewal is planned. You do not need to take any action.</p></div></div>}<div className="subscription-links"><Link href="/terms">Terms of Service</Link><Link href="/refunds">Refund &amp; Cancellation</Link><Link href="/privacy">Privacy Policy</Link></div></>}</section></main><CancelDialog open={dialogOpen} busy={cancelling} error={error} onClose={() => setDialogOpen(false)} onConfirm={() => void cancel()} returnFocusRef={cancelTriggerRef} /></SiteShell>;
}
