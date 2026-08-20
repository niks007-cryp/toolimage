export const PAGE_TRANSITION_TIMING = {
  outgoing: 330,
  handoff: 120,
  incoming: 410,
  reduced: 80,
} as const;

export type TransitionPhase = "idle" | "outgoing" | "handoff" | "incoming";

export type TransitionCounterPair = {
  start: number;
  end: number;
};

export type TransitionableLink = {
  href: string;
  currentHref: string;
  button?: number;
  modified?: boolean;
  target?: string | null;
  download?: boolean;
  defaultPrevented?: boolean;
};

export function createTransitionCounterPair(random: () => number = Math.random): TransitionCounterPair {
  const start = 84 + Math.round(random() * 42);
  const end = Math.max(12, Math.min(36, Math.round(start * (0.15 + random() * 0.16))));
  return { start, end };
}

export function nextTransitionPhase(phase: TransitionPhase): TransitionPhase {
  if (phase === "outgoing") return "handoff";
  if (phase === "handoff") return "incoming";
  if (phase === "incoming") return "idle";
  return "outgoing";
}

export function transitionCounterValue(pair: TransitionCounterPair, phase: TransitionPhase, progress: number): number {
  const clamped = Math.max(0, Math.min(1, progress));
  if (phase === "outgoing") return Math.round(pair.start + (pair.end - pair.start) * clamped);
  if (phase === "incoming") return Math.round(pair.end + (pair.start - pair.end) * clamped);
  return phase === "handoff" ? pair.end : pair.start;
}

export function shouldTransitionInternalLink({ href, currentHref, button = 0, modified = false, target, download = false, defaultPrevented = false }: TransitionableLink): boolean {
  if (defaultPrevented || modified || button !== 0 || download || (target && target !== "_self")) return false;

  try {
    const destination = new URL(href, currentHref);
    const current = new URL(currentHref);
    if (destination.origin !== current.origin || destination.href === current.href) return false;
    // Same-document anchors should remain immediate so keyboard skip-links and anchor semantics stay native.
    if (destination.pathname === current.pathname && destination.search === current.search) return false;
    return true;
  } catch {
    return false;
  }
}
