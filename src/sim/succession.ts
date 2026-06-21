import { childrenOf, memberById } from "./family";
import type { FamilyState, LiveMember } from "./state";

/**
 * FD-10 — SUCCESSION. When the protagonist dies (FD-9), the line passes to an
 * heir: the eldest LIVING child of the late protagonist (primogeniture by default;
 * estate-planning choices may override the named heir via `heirId`). If no living
 * heir exists, the line is extinct. Pure + deterministic — the heir is a function
 * of the tree's recorded birth order, so replay reconstructs the same succession.
 */

export interface SuccessionResult {
  family: FamilyState;
  /** The new protagonist's member id, or null if the line is extinct. */
  heirId: string | null;
}

/**
 * Resolve succession after the protagonist's death in `year`. Picks the eldest
 * living child (lowest member seq = earliest born) unless `namedHeirId` points to
 * a living child. Returns the family with the heir promoted to protagonist, or
 * heirId null when no heir survives (line extinct).
 */
export function succeed(family: FamilyState, year: number, namedHeirId?: string): SuccessionResult {
  const lateId = family.protagonistId;
  const heirs = childrenOf(family, lateId)
    .filter((c) => c.died === undefined || c.died > year)
    .sort((a, b) => seq(a) - seq(b));

  let heir: LiveMember | undefined;
  if (namedHeirId) {
    heir = heirs.find((h) => h.id === namedHeirId);
  }
  heir ??= heirs[0];

  if (!heir) return { family, heirId: null };

  const heirId = heir.id;
  const members = family.members.map((m) => ({
    ...m,
    isProtagonist: m.id === heirId,
  }));
  return { family: { ...family, members, protagonistId: heirId }, heirId };
}

/** The minted-order sequence embedded in a member id (`m12` → 12). */
function seq(m: LiveMember): number {
  const n = Number(m.id.slice(1));
  return Number.isFinite(n) ? n : 0;
}

/** Whether the run's line is extinct (the protagonist is dead with no living heir). */
export function isLineExtinct(family: FamilyState, year: number): boolean {
  const protagonist = memberById(family, family.protagonistId);
  if (protagonist.died === undefined || protagonist.died > year) return false;
  const livingHeirs = childrenOf(family, family.protagonistId).filter(
    (c) => c.died === undefined || c.died > year,
  );
  return livingHeirs.length === 0;
}
