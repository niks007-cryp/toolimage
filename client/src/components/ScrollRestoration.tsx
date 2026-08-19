import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { routeScrollAction, type ScrollPosition } from "@/lib/scrollNavigation";

const scrollStateKey = "__toolimageScrollPosition";

type ScrollHistoryState = Record<string, unknown> & { [scrollStateKey]?: ScrollPosition };

function currentHistoryState(): ScrollHistoryState {
  return typeof window.history.state === "object" && window.history.state !== null ? window.history.state as ScrollHistoryState : {};
}

function savedScrollPosition(): ScrollPosition | null {
  const position = currentHistoryState()[scrollStateKey];
  return position && Number.isFinite(position.left) && Number.isFinite(position.top) ? position : null;
}

function persistScrollPosition() {
  const state = currentHistoryState();
  window.history.replaceState({ ...state, [scrollStateKey]: { left: window.scrollX, top: window.scrollY } satisfies ScrollPosition }, "", window.location.href);
}

function applyScrollAction(isHistoryNavigation: boolean) {
  const action = routeScrollAction({ hash: window.location.hash, isHistoryNavigation, savedPosition: savedScrollPosition() });
  if (action.kind === "anchor") {
    document.getElementById(action.id)?.scrollIntoView({ block: "start", behavior: "instant" });
    return;
  }
  if (action.kind === "restore") {
    window.scrollTo({ left: action.position.left, top: action.position.top, behavior: "instant" });
    return;
  }
  window.scrollTo({ left: 0, top: 0, behavior: "instant" });
}

export function ScrollRestoration() {
  const [pathname] = useLocation();
  const isHistoryNavigation = useRef(false);

  useEffect(() => {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";

    let frame = 0;
    let historyFrame = 0;
    const save = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        persistScrollPosition();
      });
    };
    const markHistoryNavigation = () => {
      isHistoryNavigation.current = true;
      historyFrame = window.requestAnimationFrame(() => {
        historyFrame = window.requestAnimationFrame(() => {
          historyFrame = 0;
          applyScrollAction(true);
        });
      });
    };
    const persistBeforeInternalNavigation = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin === window.location.origin) persistScrollPosition();
    };
    const restoreHashTarget = () => {
      if (!window.location.hash) return;
      window.requestAnimationFrame(() => applyScrollAction(false));
    };

    persistScrollPosition();
    window.addEventListener("scroll", save, { passive: true });
    window.addEventListener("beforeunload", persistScrollPosition);
    window.addEventListener("click", persistBeforeInternalNavigation, true);
    window.addEventListener("popstate", markHistoryNavigation);
    window.addEventListener("hashchange", restoreHashTarget);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      if (historyFrame) window.cancelAnimationFrame(historyFrame);
      window.removeEventListener("scroll", save);
      window.removeEventListener("beforeunload", persistScrollPosition);
      window.removeEventListener("click", persistBeforeInternalNavigation, true);
      window.removeEventListener("popstate", markHistoryNavigation);
      window.removeEventListener("hashchange", restoreHashTarget);
    };
  }, []);

  useEffect(() => {
    const historyNavigation = isHistoryNavigation.current;
    isHistoryNavigation.current = false;
    const frame = window.requestAnimationFrame(() => applyScrollAction(historyNavigation));
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
}
