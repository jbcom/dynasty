import { childrenOf, memberById } from "./family";
import { type FamilyState, isMemberAlive, type LiveMember } from "./state";

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

/** How the heir is chosen at a protagonist's death (CP-3). */
export type SuccessionMode = "absolute" | "primogeniture" | "matriarchal";

/** Sex preferred FIRST under a succession mode (absolute prefers neither). */
function preferredSex(mode: SuccessionMode): "male" | "female" | null {
  if (mode === "primogeniture") return "male";
  if (mode === "matriarchal") return "female";
  return null;
}

/**
 * Resolve succession after the protagonist's death in `year`. Picks the heir per
 * the succession `mode`: `absolute` = eldest living child regardless of sex;
 * `primogeniture` = eldest son then daughters; `matriarchal` = eldest daughter
 * then sons. A `namedHeirId` (estate planning) overrides when that heir is living.
 * Returns the family with the heir promoted, or heirId null (line extinct).
 */
export function succeed(
  family: FamilyState,
  year: number,
  namedHeirId?: string,
  mode: SuccessionMode = "absolute",
): SuccessionResult {
  const lateId = family.protagonistId;
  // An heir must be ALREADY BORN by `year` and still alive — a child begotten in a
  // later in-world year (the beget stagger can place a birth past the death year)
  // is not yet a person and cannot inherit.
  const living = childrenOf(family, lateId).filter((c) => c.born <= year && isMemberAlive(c, year));
  // Order by birth (seq) within each sex, then by the mode's sex preference.
  const pref = preferredSex(mode);
  const heirs = [...living].sort((a, b) => {
    if (pref) {
      const aPref = a.sex === pref ? 0 : 1;
      const bPref = b.sex === pref ? 0 : 1;
      if (aPref !== bPref) return aPref - bPref;
    }
    return seq(a) - seq(b);
  });

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
  if (isMemberAlive(protagonist, year)) return false;
  const livingHeirs = childrenOf(family, family.protagonistId).filter(
    (c) => c.born <= year && isMemberAlive(c, year),
  );
  return livingHeirs.length === 0;
}
