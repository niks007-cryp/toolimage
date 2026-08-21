import { useEffect } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { supabase } from "@/lib/supabase";

function authenticationMethod(provider: string | undefined) {
  return provider === "google" ? "google" : provider === "email" ? "email" : "other";
}

function isNewAccount(createdAt: string | undefined, lastSignInAt: string | undefined) {
  if (!createdAt || !lastSignInAt) return false;
  const created = Date.parse(createdAt);
  const lastSignIn = Date.parse(lastSignInAt);
  return Number.isFinite(created) && Number.isFinite(lastSignIn) && Math.abs(lastSignIn - created) < 60_000;
}

export function AnalyticsAuthObserver() {
  useEffect(() => {
    if (!supabase) return;

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        trackAnalyticsEvent("logout");
        return;
      }

      if (event !== "SIGNED_IN" || !session?.user) return;
      const method = authenticationMethod(session.user.app_metadata.provider);
      if (isNewAccount(session.user.created_at, session.user.last_sign_in_at)) {
        trackAnalyticsEvent("sign_up", { method });
      } else {
        trackAnalyticsEvent("login", { method });
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return null;
}
