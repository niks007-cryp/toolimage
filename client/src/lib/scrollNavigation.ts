export type ScrollPosition = { left: number; top: number };

export type RouteScrollAction =
  | { kind: "anchor"; id: string }
  | { kind: "restore"; position: ScrollPosition }
  | { kind: "top" };

export function hashTargetId(hash: string): string | null {
  if (!hash || hash === "#") return null;

  try {
    const id = decodeURIComponent(hash.slice(1));
    return id || null;
  } catch {
    return null;
  }
}

export function routeScrollAction({ hash, isHistoryNavigation, savedPosition }: { hash: string; isHistoryNavigation: boolean; savedPosition?: ScrollPosition | null }): RouteScrollAction {
  const hashId = hashTargetId(hash);
  if (hashId) return { kind: "anchor", id: hashId };
  if (isHistoryNavigation && savedPosition) return { kind: "restore", position: savedPosition };
  return { kind: "top" };
}
