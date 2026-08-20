import { type CSSProperties, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { PAGE_TRANSITION_TIMING, createTransitionCounterPair, transitionCounterValue, type TransitionCounterPair, type TransitionPhase, shouldTransitionInternalLink } from "@/lib/pageTransition";

type TransitionState = {
  phase: TransitionPhase;
  counter: TransitionCounterPair | null;
};

const idleState: TransitionState = { phase: "idle", counter: null };

function delay(duration: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, duration));
}

function TransitionCounter({ pair, phase, reduceMotion }: { pair: TransitionCounterPair; phase: TransitionPhase; reduceMotion: boolean }) {
  const [value, setValue] = useState(() => transitionCounterValue(pair, phase, phase === "outgoing" ? 0 : 1));

  useEffect(() => {
    if (phase === "handoff" || reduceMotion) {
      setValue(transitionCounterValue(pair, phase, 1));
      return;
    }
    const duration = phase === "outgoing" ? PAGE_TRANSITION_TIMING.outgoing : PAGE_TRANSITION_TIMING.incoming;
    const from = phase === "outgoing" ? pair.start : pair.end;
    const to = phase === "outgoing" ? pair.end : pair.start;
    let frame = 0;
    let previous = from;
    const startedAt = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(from + (to - from) * eased);
      if (next !== previous) {
        previous = next;
        setValue(next);
      }
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    setValue(from);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [pair, phase, reduceMotion]);

  return <div className="page-transition-counter"><span className="page-transition-counter__label">ROUTE TRANSITION / VISUAL METAPHOR</span><strong>{value} <small>MB</small></strong><span className="page-transition-counter__direction" aria-hidden="true">{phase === "outgoing" ? "↓" : "↑"}</span></div>;
}

export function PageTransition({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  const [state, setState] = useState<TransitionState>(idleState);
  const activeRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  const runTransition = useCallback(async (handoff?: () => void) => {
    if (activeRef.current) return false;
    activeRef.current = true;
    const counter = createTransitionCounterPair();
    if (reduceMotion) {
      setState({ phase: "handoff", counter });
      handoff?.();
      await delay(PAGE_TRANSITION_TIMING.reduced);
      setState(idleState);
      activeRef.current = false;
      return true;
    }
    setState({ phase: "outgoing", counter });
    await delay(PAGE_TRANSITION_TIMING.outgoing);
    setState({ phase: "handoff", counter });
    handoff?.();
    await delay(PAGE_TRANSITION_TIMING.handoff);
    setState({ phase: "incoming", counter });
    await delay(PAGE_TRANSITION_TIMING.incoming);
    setState(idleState);
    activeRef.current = false;
    return true;
  }, [reduceMotion]);

  useEffect(() => {
    const interceptInternalLink = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;
      const modified = event.ctrlKey || event.metaKey || event.altKey || event.shiftKey;
      if (!shouldTransitionInternalLink({ href: anchor.href, currentHref: window.location.href, button: event.button, modified, target: anchor.target, download: anchor.hasAttribute("download"), defaultPrevented: event.defaultPrevented })) return;
      event.preventDefault();
      if (activeRef.current) return;
      void runTransition(() => window.history.pushState(null, "", anchor.href));
    };

    const transitionHistoryNavigation = () => {
      if (activeRef.current) return;
      void runTransition();
    };

    window.addEventListener("click", interceptInternalLink, true);
    window.addEventListener("popstate", transitionHistoryNavigation);
    return () => {
      clearTimers();
      window.removeEventListener("click", interceptInternalLink, true);
      window.removeEventListener("popstate", transitionHistoryNavigation);
    };
  }, [clearTimers, runTransition]);

  const active = state.phase !== "idle";
  const stageStyle = { "--page-transition-duration": `${reduceMotion ? PAGE_TRANSITION_TIMING.reduced : PAGE_TRANSITION_TIMING.outgoing}ms` } as CSSProperties;

  return <div className={`page-transition-root ${active ? "is-transitioning" : ""}`} data-transition-phase={state.phase}>
    <div className="page-transition-stage" style={stageStyle}>{children}</div>
    {active && state.counter && <div className="page-transition-overlay" aria-hidden="true"><TransitionCounter pair={state.counter} phase={state.phase} reduceMotion={Boolean(reduceMotion)} /></div>}
  </div>;
}
