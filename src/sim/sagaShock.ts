/**
 * WV-3-MORTALITY — seeded DISRUPTION/MORTALITY shocks on the saga clock (anti-Suzerain divergence).
 *
 * The divergence audit (divergenceAudit.unit) found the founded SAGA path near-identical across seeds:
 * the seeded market substrate that diverges the EVENT path is inert on the saga clock, so every run plays
 * the same arc to the same ending. This module injects the missing exogenous variability — a per-saga-tick,
 * era-weighted, SEEDED chance of a shock that strikes the family OR a meter, so the line's path is no longer
 * fully player-controlled and runs DIVERGE in events (an unplanned death forces an early succession; a loss
 * reshapes the family; a meter shock can move the convergence gate).
 *
 * PURE + DETERMINISTIC: every roll comes from an injected createRng-seeded fork (no Math.random/Date.now),
 * so the same seed + choices reconstructs the identical run (emergence ≠ nondeterminism,
 * [[emergent-cause-effect-sim]]). The era-medicine factor (mortality.ts) tempers the hazard so modern/future
 * eras are gentler than the harsh founding centuries.
 */

import { macroActMedicine } from "./mortality";
import type { Rng } from "./rng";
import type { MeterId } from "./schema";
import { type FamilyState, isMemberAlive } from "./state";

/** A shock kind — what the disruption hits. */
export type SagaShockKind =
  | "none"
  | "family_death" // an exogenous death of a (non-protagonist) family member
  | "meter_blow"; // a sudden hit to a single meter (plague-driven loss, panic, scandal)

/** A resolved shock: what happened this tick. `none` when the hazard didn't fire. */
export interface SagaShock {
  kind: SagaShockKind;
  /** For family_death: the member id struck (already marked died in the returned family). */
  memberId?: string;
  /** For meter_blow: which meter and the (negative) delta to apply. */
  meter?: MeterId;
  delta?: number;
  /** A short situational tag for the prose/UI seed (e.g. "plague", "fire", "panic"). */
  note?: string;
  /** SHOCK-FAMILY-SUCCESSION-PRESSURE: true when the family_death victim was the GROOMED/named heir — the
   *  caller clears the `heir_<id>` flag so the next succession falls back to a weaker eldest-living heir. */
  tookHeir?: boolean;
}

/** The meters a shock can blow, with the flavor note that frames it. Negative-only (shocks are losses). */
const METER_BLOWS: ReadonlyArray<{ meter: MeterId; note: string; min: number; max: number }> = [
  { meter: "health", note: "plague", min: -25, max: -8 },
  { meter: "money", note: "fire", min: -40, max: -12 },
  { meter: "reputation", note: "scandal", min: -20, max: -6 },
  { meter: "loyalty", note: "betrayal", min: -18, max: -5 },
  { meter: "heat", note: "scrutiny", min: 6, max: 20 }, // heat RISES (a shock that draws danger)
];

/**
 * The base per-saga-tick probability that ANY shock fires, before era-medicine tempering. A saga tick is a
 * generational span (~25y at a succession), so this is the chance a generation lives through a disruption.
 * Tuned so the harsh founding eras see roughly one shock every ~3 generations; modern eras far fewer.
 */
const BASE_SHOCK_CHANCE = 0.33;

/**
 * The exposure multiplier for a macro-act: macro-act medicine (0.1 founding … 0.9 ascension) suppresses the
 * hazard — a founding-era line is far more exposed than an interstellar one. Floored at 0.15 so even the far
 * future isn't fully safe. The ONE home for the formula (shared by rollSagaShock + SHOCK-FORESHADOW).
 */
export function shockExposure(macroActId: string): number {
  return Math.max(0.15, 1 - macroActMedicine(macroActId));
}

/**
 * SHOCK-FORESHADOW: should the player be WARNED a hazard looms before the next tick? A deterministic threshold
 * (no RNG — replay-safe, view-derived): true when this macro-act's exposure is high AND the line carries
 * outstanding strain (a `shock_meter:*` marker from an un-recovered blow) OR there is a non-protagonist member
 * to lose. The omen gives loss DREAD, not just aftermath. Pure.
 */
export function shockForeshadow(
  macroActId: string,
  flags: Iterable<string>,
  hasKin: boolean,
): boolean {
  if (shockExposure(macroActId) < 0.75) return false;
  const strained = [...flags].some((f) => f.startsWith("shock_meter:"));
  return strained || hasKin;
}

/**
 * Roll one seeded disruption shock for a saga tick. Macro-act-weighted (better medicine → lower hazard) and
 * deterministic for a given (family, year, macroActId, rng). `macroActId` is the saga's coarse band
 * (founding/convergence/emergence/ascension — what `macroActForYear` returns), NOT a fine era id; the saga
 * clock runs on macro-acts, so the hazard tempers off `macroActMedicine`. Returns `{ kind: "none" }` when
 * nothing fires, a family_death (the struck member id), or a meter_blow (meter + delta). Never strikes the
 * protagonist (their death is the existing age-based mortality's domain — this adds COLLATERAL loss + meter
 * shocks, the exogenous variability the audit found missing). Pure — applies no meter change itself.
 */
export function rollSagaShock(
  family: FamilyState | undefined,
  year: number,
  macroActId: string,
  rng: Rng,
  namedHeirId?: string,
): SagaShock {
  const chance = BASE_SHOCK_CHANCE * shockExposure(macroActId);
  if (!rng.fork(`shock:${year}`).chance(chance)) return { kind: "none" };

  // Which kind? A living non-protagonist member can be struck (family_death); otherwise (or by the coin) a
  // meter_blow. Bias slightly toward meter_blow so the family isn't decimated.
  const livingOthers =
    family?.members.filter((m) => m.id !== family.protagonistId && isMemberAlive(m, year)) ?? [];
  const kindRng = rng.fork(`shock:kind:${year}`);
  const wantDeath = livingOthers.length > 0 && kindRng.chance(0.4);

  if (wantDeath && family) {
    // SHOCK-FAMILY-SUCCESSION-PRESSURE: if a GROOMED heir is named + alive, the blow lands on THEM with a
    // raised probability (a dynasty's hardest loss is its chosen successor) — else a random other member.
    // Striking the heir flags `tookHeir` so the caller clears the named-heir flag → a weaker fallback heir.
    const heir = namedHeirId ? livingOthers.find((m) => m.id === namedHeirId) : undefined;
    const victim =
      heir && kindRng.fork("heirhit").chance(0.5)
        ? heir
        : kindRng.fork("victim").pick(livingOthers);
    const tookHeir = victim.id === namedHeirId;
    return {
      kind: "family_death",
      memberId: victim.id,
      note: tookHeir ? "heir_lost" : "plague",
      ...(tookHeir ? { tookHeir: true } : {}),
    };
  }

  const blow = rng.fork(`shock:meter:${year}`).pick(METER_BLOWS);
  const delta = rng.fork(`shock:mag:${year}`).int(blow.min, blow.max);
  return { kind: "meter_blow", meter: blow.meter, delta, note: blow.note };
}

/** The TONE of an aftermath note — a loss (family_death/meter_blow) styles negative; a recovery styles
 *  positive. Distinct from SagaShockKind (the roll outcome) so the UI can accent a rebound green, not red. */
export type SagaNoteKind = Exclude<SagaShockKind, "none"> | "recovery";

/** A short, UI-facing aftermath note for a shock OR a recovery — what the player is told happened
 *  (WV-3-SHOCK-SCENES / WV-3-SHOCK-RECOVERY). */
export interface SagaShockNote {
  kind: SagaNoteKind;
  /** A one-line era-neutral aftermath sentence (the SceneReader/PlayScreen surfaces it for one turn). */
  text: string;
  /** The flavor tag (plague/fire/scandal / rebuilt/redeemed/…) for any styling. */
  note: string;
}

/** The aftermath lines per (kind, note). Era-neutral + short — a loss beat the player reads once. */
const SHOCK_TEXT: Record<string, string> = {
  family_death: "A death in the family — the plague took one of your own this season.",
  "family_death:heir_lost":
    "The groomed heir is dead — the succession you had planned for is undone, and a lesser hand must now take up the name.",
  "meter_blow:plague": "Plague swept through; the household's health is broken for a time.",
  "meter_blow:fire": "Fire took the stores — a hard, sudden loss of fortune.",
  "meter_blow:scandal": "A scandal spread faster than any denial; the name is tarnished.",
  "meter_blow:betrayal": "A trusted hand turned; loyalty bought over years drained in a day.",
  "meter_blow:scrutiny": "Watchful eyes turned your way — the line draws dangerous attention.",
};

/** Build the one-line aftermath note for a resolved shock (null for `none`). Pure. */
export function shockNote(shock: SagaShock): SagaShockNote | null {
  if (shock.kind === "none") return null;
  // family_death distinguishes the groomed-heir loss (sharper); meter_blow keys on its flavor note.
  const key =
    shock.kind === "family_death"
      ? shock.tookHeir
        ? "family_death:heir_lost"
        : "family_death"
      : `meter_blow:${shock.note ?? ""}`;
  const text = SHOCK_TEXT[key] ?? "A sudden reversal struck the line this season.";
  return { kind: shock.kind, text, note: shock.note ?? "" };
}

/**
 * WV-3-SHOCK-RECOVERY — the two-act shape: a meter_blow can REBOUND on a later saga tick. Given the meters
 * that were previously blown (the run carries a stable `shock_meter:<meter>` flag per outstanding blow), a
 * seeded chance per tick grants a PARTIAL positive rebound to one of them — the family rebuilds after the
 * fire, lives down the scandal. Returns the meter to rebound + its (positive) delta + the flag to clear, or
 * null when no recovery fires. Pure + seeded; the caller applies the meter delta + clears the flag. Heat is
 * never "recovered" here (a heat spike cools via the normal systemic tick, not a windfall).
 */
export interface SagaRecovery {
  meter: MeterId;
  delta: number;
  /** The `shock_meter:<meter>` flag to clear once the rebound is applied. */
  clearFlag: string;
  note: string;
}

/** The stable flag marking an outstanding (un-recovered) meter blow, for the recovery roll to find. */
export const shockMeterFlag = (meter: MeterId): string => `shock_meter:${meter}`;

const RECOVERY_CHANCE = 0.5; // per tick, when at least one blown meter is outstanding
const RECOVERABLE: ReadonlyArray<{ meter: MeterId; note: string; min: number; max: number }> = [
  { meter: "health", note: "convalescence", min: 5, max: 16 },
  { meter: "money", note: "rebuilt", min: 8, max: 28 },
  { meter: "reputation", note: "redeemed", min: 4, max: 14 },
  { meter: "loyalty", note: "reconciled", min: 4, max: 12 },
];

/** Roll a seeded partial rebound for one outstanding blown meter, or null. `outstanding` = the run's flags
 *  set (read for `shock_meter:<meter>` markers). Deterministic for (outstanding, year, rng). */
export function rollSagaRecovery(
  outstanding: ReadonlySet<string>,
  year: number,
  rng: Rng,
): SagaRecovery | null {
  const candidates = RECOVERABLE.filter((r) => outstanding.has(shockMeterFlag(r.meter)));
  if (candidates.length === 0) return null;
  if (!rng.fork(`recover:${year}`).chance(RECOVERY_CHANCE)) return null;
  const pick = rng.fork(`recover:pick:${year}`).pick(candidates);
  const delta = rng.fork(`recover:mag:${year}`).int(pick.min, pick.max);
  return { meter: pick.meter, delta, clearFlag: shockMeterFlag(pick.meter), note: pick.note };
}

/** Apply a resolved family_death shock to a family (mark the struck member died). Pure. No-op otherwise. */
export function applyFamilyDeathShock(
  family: FamilyState,
  shock: SagaShock,
  year: number,
): FamilyState {
  if (shock.kind !== "family_death" || !shock.memberId) return family;
  return {
    ...family,
    members: family.members.map((m) =>
      m.id === shock.memberId && m.died === undefined ? { ...m, died: year } : m,
    ),
  };
}

/** DOSSIER-SHOCK-LEDGER: one entry in the line's "what befell the family" log. */
export interface ShockLedgerEntry {
  year: number;
  /** A disaster (death / reversal) or a comeback (a blown meter rebounding) — SHOCK-LEDGER-RECOVERIES. */
  kind: "family_death" | "meter_blow" | "recovery";
  /** A short label for the season (the player reviews the line's hard seasons AND its comebacks). */
  label: string;
}

// Typed by ShockLedgerEntry["kind"] so adding a new entry kind forces a label here (exhaustiveness).
const LEDGER_LABEL: Record<ShockLedgerEntry["kind"], string> = {
  family_death: "A death in the family",
  meter_blow: "A reversal struck the line",
  recovery: "The line recovered",
};

// SHOCK-LEDGER-RECOVERIES: a comeback reads better naming WHAT was clawed back, so the recovery label is
// meter-aware (the fortune rebuilt, the name redeemed…). Falls back to the generic "The line recovered".
const RECOVERY_LABEL: Partial<Record<MeterId, string>> = {
  health: "The household's strength returned",
  money: "The fortune was rebuilt",
  reputation: "The name was redeemed",
  loyalty: "Old loyalties were won back",
};

/**
 * Parse the run's `shock:<kind>:<year>` and `recovered:<meter>:<year>` flags into a chronological ledger of the
 * line's hard seasons AND its comebacks — the inspectable "what befell the family" history the Timeline/Dossier
 * surfaces (DOSSIER-SHOCK-LEDGER + SHOCK-LEDGER-RECOVERIES). Pure read of state.flags; sorted by year then kind
 * (a recovery sorts AFTER the shocks in its year, so a same-year blow→recover reads loss-then-comeback). Unknown
 * / malformed flags are skipped. Flags are de-duplicated first: a repeated flag would otherwise yield two
 * entries with the same (year, kind), and TimelineView keys its `#each` on `year + kind` — duplicate keys crash
 * Svelte at render.
 */
export function shockLedger(flags: Iterable<string>): ShockLedgerEntry[] {
  const out: ShockLedgerEntry[] = [];
  for (const f of new Set(flags)) {
    const shock = /^shock:(family_death|meter_blow):(\d+)$/.exec(f);
    if (shock) {
      const kind = shock[1] as "family_death" | "meter_blow";
      out.push({ year: Number(shock[2]), kind, label: LEDGER_LABEL[kind] });
      continue;
    }
    const recovered = /^recovered:([a-z]+):(\d+)$/.exec(f);
    if (recovered) {
      const meter = recovered[1] as MeterId;
      out.push({
        year: Number(recovered[2]),
        kind: "recovery",
        label: RECOVERY_LABEL[meter] ?? LEDGER_LABEL.recovery,
      });
    }
  }
  // family_death < meter_blow < recovery alphabetically — so within a year a comeback sorts last (loss →
  // recover). Plain codepoint compare (NOT localeCompare) — locale/engine-independent for bit-identical replay.
  return out.sort((a, b) => a.year - b.year || (a.kind < b.kind ? -1 : a.kind > b.kind ? 1 : 0));
}
