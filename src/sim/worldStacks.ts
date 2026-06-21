import type { WorldStack } from "./schema";

/**
 * FD-7 — pure world-stack resolution. A world-stack is the ambient STANDING
 * context of a place (geography/politics/religion/ideology + period perils) the
 * family lives within. Resolution: prefer a stack matching BOTH place and era;
 * else a place-only (era-less) stack; else none. A migration changes the run's
 * `place`, which is all that swaps the resolved stack. Pure + deterministic.
 */
export function resolveStack(
  stacks: readonly WorldStack[],
  place: string,
  eraId?: string,
): WorldStack | undefined {
  if (!place) return undefined;
  const forPlace = stacks.filter((s) => s.place === place);
  if (forPlace.length === 0) return undefined;
  // Era-specific match wins over the place-wide (era-less) default.
  if (eraId) {
    const exact = forPlace.find((s) => s.era === eraId);
    if (exact) return exact;
  }
  return forPlace.find((s) => s.era === undefined) ?? forPlace[0];
}
