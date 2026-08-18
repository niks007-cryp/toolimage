/** ToolImage entitlement context — one Supabase session source of truth with server-verified Pro state; never treats browser storage as entitlement proof. */
import { Session, User } from "@supabase/supabase-js";
import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export type EntitlementStatus = "free" | "pro" | "grace" | "inactive";
type EntitlementContextValue = { configured: boolean; loading: boolean; user: User | null; session: Session | null; status: EntitlementStatus; isPro: boolean; refresh: () => Promise<Session | null>; sendMagicLink: (email: string) => Promise<void>; signInWithGoogle: () => Promise<void>; signOut: () => Promise<void>; };
const EntitlementContext = createContext<EntitlementContextValue | null>(null);

async function readEntitlement(token: string | undefined) {
  if (!token) return "free" as EntitlementStatus;
  try { const response = await fetch("/api/entitlement", { headers: { Authorization: `Bearer ${token}` } }); if (!response.ok) return "free" as EntitlementStatus; const body = await response.json() as { status?: EntitlementStatus }; return body.status === "pro" || body.status === "grace" ? body.status : "free"; } catch { return "free" as EntitlementStatus; }
}

export function EntitlementProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<EntitlementStatus>("free");
  const [loading, setLoading] = useState(Boolean(supabase));
  const applySession = useCallback(async (next: Session | null) => { setSession(next); setStatus(await readEntitlement(next?.access_token)); setLoading(false); return next; }, []);
  const refresh = useCallback<() => Promise<Session | null>>(async () => { if (!supabase) { setLoading(false); return null; } const { data, error } = await supabase.auth.getSession(); if (error) throw error; return applySession(data.session); }, [applySession]);
  useEffect(() => { if (!supabase) return; void refresh(); const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => { void applySession(next); }); const onForeground = () => { if (document.visibilityState === "visible") void refresh(); }; const onStorage = (event: StorageEvent) => { if (event.key?.includes("auth-token")) void refresh(); }; window.addEventListener("focus", onForeground); document.addEventListener("visibilitychange", onForeground); window.addEventListener("storage", onStorage); return () => { listener.subscription.unsubscribe(); window.removeEventListener("focus", onForeground); document.removeEventListener("visibilitychange", onForeground); window.removeEventListener("storage", onStorage); }; }, [applySession, refresh]);
  const value = useMemo<EntitlementContextValue>(() => ({ configured: isSupabaseConfigured, loading, user: session?.user ?? null, session, status, isPro: status === "pro" || status === "grace", refresh, sendMagicLink: async (email) => { if (!supabase) throw new Error("Sign-in is not configured yet."); const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/pricing` } }); if (error) throw error; }, signInWithGoogle: async () => { if (!supabase) throw new Error("Sign-in is not configured yet."); const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/pricing` } }); if (error) throw error; }, signOut: async () => { if (supabase) await supabase.auth.signOut(); setStatus("free"); } }), [loading, session, status, refresh]);
  return <EntitlementContext.Provider value={value}>{children}</EntitlementContext.Provider>;
}

export function useEntitlement() { const value = useContext(EntitlementContext); if (!value) throw new Error("useEntitlement must be used inside EntitlementProvider"); return value; }
