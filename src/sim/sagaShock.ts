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

/** FORESHADOW-WEIGHT: how grave the looming-hazard omen reads. "none" = no warning; "marginal" = a faint
 *  unease; "grave" = real dread. Tiered so the omen's certainty is PROPORTIONAL to the hazard. */
export type ForeshadowWeight = "none" | "marginal" | "grave";

/**
 * SHOCK-FORESHADOW + FORESHADOW-WEIGHT: how strongly to WARN that a hazard looms before the next tick. A
 * deterministic function (no RNG — replay-safe, view-derived) of this macro-act's exposure × the line's
 * strain. "none" below the exposure threshold or with nothing at stake; "grave" when exposure is high AND the
 * line carries an OUTSTANDING blown meter (un-recovered strain compounds the danger); else "marginal" (a
 * harsh era with only kin to lose, no active strain). The omen gives loss DREAD, proportional to the threat.
 */
export function foreshadowWeight(
  macroActId: string,
  flags: Iterable<string>,
  hasKin: boolean,
): ForeshadowWeight {
  if (shockExposure(macroActId) < 0.75) return "none";
  // Iterate directly (no [...flags] spread) — this runs on the hot view path; a for-of short-circuits
  // without allocating an array each call (Gemini #132 perf).
  let strained = false;
  for (const f of flags) {
    if (f.startsWith("shock_meter:")) {
      strained = true;
      break;
    }
  }
  if (strained) return "grave"; // un-recovered loss + a harsh era → the worst is plausibly near
  if (hasKin) return "marginal"; // exposed, kin to lose, but no active strain → a fainter unease
  return "none";
}

/** SHOCK-FORESHADOW: the boolean predicate (any omen at all). Thin wrapper over foreshadowWeight. Pure. */
export function shockForeshadow(
  macroActId: string,
  flags: Iterable<string>,
  hasKin: boolean,
): boolean {
  return foreshadowWeight(macroActId, flags, hasKin) !== "none";
}

/**
 * RECOVERY-FORESHADOW-TONE: a HOPEFUL omen — the mirror of the shock omen. A line carrying an OUTSTANDING blown
 * meter (`shock_meter:` flag) has a pending recovery roll (rollSagaRecovery looks for exactly that flag), so a
 * rebound is plausibly near. That reads as HOPE rising, not dread. Pure, deterministic, view-derived (no RNG) —
 * the same predicate the recovery roll keys on, surfaced as foresight. True iff the line has un-recovered strain.
 */
export function recoveryForeshadow(flags: Iterable<string>): boolean {
  for (const f of flags) {
    if (f.startsWith("shock_meter:")) return true;
  }
  return false;
}

/** HOPE-OMEN-COPY-VARIETY: the hope omen's text, keyed to WHAT the line is recovering from, so the rebound reads
 *  specific (a fortune rebuilding vs a name being redeemed) rather than boilerplate. Mirrors the shock-note
 *  specificity. Keyed on the FIRST outstanding `shock_meter:` flag (flag order is deterministic, so replay-stable);
 *  an unrecognized/absent meter falls back to the generic line. Pure, no RNG. */
const RECOVERY_OMEN_TEXT: Partial<Record<MeterId, string>> = {
  money: "The worst of the loss is behind you — the coffers are slowly being rebuilt.",
  reputation: "The scandal is fading from memory — the name is finding its way back to grace.",
  health: "The sickness is passing — the house is nursing itself back to strength.",
  loyalty: "The rift is mending — old bonds are being reforged, one by one.",
};
const RECOVERY_OMEN_FALLBACK =
  "The worst of the blow is behind you — the line gathers itself for a turn back upward.";

export function recoveryForeshadowText(flags: Iterable<string>): string {
  for (const f of flags) {
    if (f.startsWith("shock_meter:")) {
      const meter = f.slice("shock_meter:".length) as MeterId;
      return RECOVERY_OMEN_TEXT[meter] ?? RECOVERY_OMEN_FALLBACK;
    }
  }
  return RECOVERY_OMEN_FALLBACK;
}

/** OMEN-DREAD-COPY-VARIETY: the DREAD omen's text, keyed to the MACRO-ACT so dread reads era-specific (the
 *  mirror of HOPE-OMEN-COPY-VARIETY). A founding-era hazard leans toward LOSS OF LIFE (plague, hard winters);
 *  the later, medicine-richer eras lean toward fortune/standing reversals. Keyed on the coarse macro-act
 *  (`macroActForYear`'s output), with a generic fallback for an unrecognized band. Pure, no RNG. */
const DREAD_OMEN_TEXT: Record<string, string> = {
  founding: "A shadow lies over the season — fever and hard winters stalk the young line.",
  convergence:
    "A shadow lies over the season — the old country's troubles follow the line across the water.",
  emergence:
    "A shadow lies over the season — the markets and the mood of the age turn against the house.",
  ascension:
    "A shadow lies over the season — even now, far from earth, fortune is not yet certain.",
};
const DREAD_OMEN_FALLBACK = "A shadow lies over the season; the years ahead feel uncertain.";

export function dreadForeshadowText(macroActId: string): string {
  return DREAD_OMEN_TEXT[macroActId] ?? DREAD_OMEN_FALLBACK;
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
/** SHOCK-CLUSTERING-GUARD: the multiplier applied to the shock chance when the line was JUST shocked — a
 *  cooldown so 3+ back-to-back blows (a death spiral) are rare and losses have rhythm, not a pile-on. */
const RECENT_SHOCK_DAMPENER = 0.4;

export function rollSagaShock(
  family: FamilyState | undefined,
  year: number,
  macroActId: string,
  rng: Rng,
  namedHeirId?: string,
  recentlyShocked = false,
): SagaShock {
  // SHOCK-CLUSTERING-GUARD: dampen the chance right after a shock so blows don't stack into a death spiral.
  const cooldown = recentlyShocked ? RECENT_SHOCK_DAMPENER : 1;
  const chance = BASE_SHOCK_CHANCE * shockExposure(macroActId) * cooldown;
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

/** RECOVERY-CHOICE: when the player has INVESTED in a rebound, the next recovery roll gets a deterministic
 *  boost — a higher chance the rebound fires AND a larger magnitude. Flat multipliers (no extra RNG) so a
 *  replay with the same invest flag reproduces the identical recovery. */
const INVEST_CHANCE_BONUS = 0.4; // added to the 0.5 base → near-certain when invested
const INVEST_MAG_FACTOR = 1.5; // the rebound claws back half again as much

/** Roll a seeded partial rebound for one outstanding blown meter, or null. `outstanding` = the run's flags
 *  set (read for `shock_meter:<meter>` markers). When `invested`, the chance + magnitude are deterministically
 *  boosted (RECOVERY-CHOICE — the player spent a meter to force a stronger comeback). Deterministic for
 *  (outstanding, year, rng, invested). */
export function rollSagaRecovery(
  outstanding: ReadonlySet<string>,
  year: number,
  rng: Rng,
  invested = false,
): SagaRecovery | null {
  const candidates = RECOVERABLE.filter((r) => outstanding.has(shockMeterFlag(r.meter)));
  if (candidates.length === 0) return null;
  const chance = Math.min(1, RECOVERY_CHANCE + (invested ? INVEST_CHANCE_BONUS : 0));
  if (!rng.fork(`recover:${year}`).chance(chance)) return null;
  const pick = rng.fork(`recover:pick:${year}`).pick(candidates);
  const rolled = rng.fork(`recover:mag:${year}`).int(pick.min, pick.max);
  const delta = invested ? Math.round(rolled * INVEST_MAG_FACTOR) : rolled;
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
  /** RECOVERY-INVEST-IN-LEDGER: a recovery the player INVESTED in (vs a lucky rebound) — "by your own hand".
   *  Only meaningful for kind="recovery". */
  invested?: boolean;
}

// Typed by ShockLedgerEntry["kind"] so adding a new entry kind forces a label here (exhaustiveness).
const LEDGER_LABEL: Record<ShockLedgerEntry["kind"], string> = {
  family_death: "A death in the family",
  meter_blow: "A reversal struck the line",
  recovery: "The line recovered",
};

// RECOVERY-INVEST-IN-LEDGER: a recovery the player paid for reads with agency — "by your own hand". The
// fallback mirrors the plain `LEDGER_LABEL.recovery` voice ("The line recovered") + the agency credit.
const INVESTED_RECOVERY_FALLBACK = "The line recovered — by your own hand";
const INVESTED_RECOVERY_LABEL: Partial<Record<MeterId, string>> = {
  health: "The household's strength — restored by your own hand",
  money: "The fortune — rebuilt by your own hand",
  reputation: "The name — redeemed by your own hand",
  loyalty: "Old loyalties — won back by your own hand",
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
    // RECOVERY-INVEST-IN-LEDGER: the optional `:invested` suffix marks a recovery the player paid for.
    const recovered = /^recovered:([a-z]+):(\d+)(:invested)?$/.exec(f);
    if (recovered) {
      const meter = recovered[1] as MeterId;
      const invested = recovered[3] === ":invested"; // explicit (the capture is literally `:invested`)
      const label = invested
        ? (INVESTED_RECOVERY_LABEL[meter] ?? INVESTED_RECOVERY_FALLBACK)
        : (RECOVERY_LABEL[meter] ?? LEDGER_LABEL.recovery);
      out.push({
        year: Number(recovered[2]),
        kind: "recovery",
        label,
        ...(invested && { invested }),
      });
    }
  }
  // family_death < meter_blow < recovery alphabetically — so within a year a comeback sorts last (loss →
  // recover). Plain codepoint compare (NOT localeCompare) — locale/engine-independent for bit-identical replay.
  return out.sort((a, b) => a.year - b.year || (a.kind < b.kind ? -1 : a.kind > b.kind ? 1 : 0));
}
