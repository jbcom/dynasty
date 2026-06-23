/**
 * DYNASTY WORLD (Convergence Saga, SS-8) — the living world of OTHER lines.
 *
 * Every immigration wave you do NOT play still grows its family in parallel: a DynastyAgent
 * (SS-3) advancing each turn, hit by the same cross-cutting EPOCHS (SS-4) and the same misfortune
 * tract (SS-5). Their progress is STORED every turn, so they exist as OPPOSING / CONTRIBUTING /
 * NEUTRAL forces the played line glimpses + may cross. Fully deterministic: the rival roster +
 * every advance is derived from the run seed via createRng — same seed → same world on replay.
 */

import { climb, MAX_RUNG } from "./classRung";
import { advanceAgent, createDynastyAgent, type DynastyAgent } from "./dynastyAgent";
import { type Epoch, epochForYear, epochImpact, macroActForYear } from "./macroActs";
import { macroActMedicine } from "./mortality";
import { applyMotivators, type Motivators } from "./motivators";
import type { Rng } from "./rng";
import type { Place } from "./schema";
import { ARCHETYPES, type Archetype } from "./slots";
import { type ArrivalClass, seedMotivatorsForClass, startRungForClass } from "./waveSelect";

/** A rival line's stored snapshot (the part that persists + drives intersections). */
export interface RivalSnapshot {
  id: string;
  placeId: string;
  label: string;
  archetype: Archetype;
  rung: number;
  strategy: string;
  /** How the active epoch is treating this line this turn, [-1,1] (drives rise/fall). */
  tide: number;
  alive: boolean;
  /** SHOCK-AFTERMATH-IN-RIVALS: the rival is in a seeded setback (lost a rung, not yet rebounded) — a
   *  faltering competitor, a window the player can exploit. Surfaced in glimpses/standings. */
  faltering: boolean;
}

/** The relation a rival holds toward the played line at an intersection. */
export type Relation = "opposing" | "contributing" | "neutral";

/** A glimpse of another line surfacing in the played line's story. */
export interface Glimpse {
  rivalId: string;
  label: string;
  relation: Relation;
  /** A short situational tag for the UI/prose seed (e.g. "rising", "ruined", "rival in trade"). */
  note: string;
  /** The rival's current rung (0..MAX_RUNG) — so the UI can show the player's crossings moving it
   *  (an opposing crossing suppresses it, a contributing one lifts it). RB-4. */
  rung: number;
}

/** The full rival world: the agents + their stored snapshots. */
export interface DynastyWorld {
  rivals: DynastyAgent[];
  snapshots: RivalSnapshot[];
}

/**
 * Build the rival world deterministically from the run seed: one rival line per WAVE place the
 * player did NOT pick, each given a seeded archetype + class-seeded motivators. Pure given the rng.
 */
export function createDynastyWorld(
  places: readonly Place[],
  playerPlaceId: string,
  rng: Rng,
): DynastyWorld {
  const rivals: DynastyAgent[] = [];
  for (const p of places) {
    if (p.kind === "destination" || p.arrivalYears === undefined) continue;
    if (p.id === playerPlaceId) continue;
    const r = rng.fork(`rival:${p.id}`);
    const archetype = ARCHETYPES[r.fork("arch").int(0, ARCHETYPES.length - 1)] as Archetype;
    const cls: ArrivalClass = p.arrivalClass ?? "poor";
    // give each rival a little seeded character so the world isn't uniform.
    const motivators: Motivators = applyMotivators(seedMotivatorsForClass(cls), {
      power: r.fork("pw").int(-30, 40),
      worldview: r.fork("wv").int(-30, 30),
      reach: r.fork("re").int(-20, 40),
    });
    rivals.push(
      createDynastyAgent({
        id: `rival:${p.id}`,
        archetype,
        motivators,
        rung: startRungForClass(cls),
      }),
    );
  }
  return { rivals, snapshots: rivals.map((r) => snapshot(r, null)) };
}

/** Snapshot a rival's current state (optionally with the active epoch's tide). */
function snapshot(agent: DynastyAgent, epoch: Epoch | null): RivalSnapshot {
  const tide = epoch ? epochImpact(epoch, agent.motivators) : 0;
  const place = agent.id.replace(/^rival:/, "");
  return {
    id: agent.id,
    placeId: place,
    label: place,
    archetype: agent.archetype,
    rung: agent.rung,
    strategy: agent.strategy ?? "endure",
    tide,
    alive: true,
    faltering: agent.stumbled ?? false,
  };
}

/** The played line's vantage the rival world REACTS to (WV-3-RIVAL-REACT): its rung + chosen strategy. */
export interface PlayerVantage {
  rung: number;
  strategy: string;
}

/**
 * Advance the whole rival world one turn at `year`: each rival plans (GOAP), the active epoch's
 * tide nudges it up (riding) or threatens it (a strong negative tide can stall the climb), and a
 * riding rival on a climbing strategy gains a rung. Re-snapshots. Pure + deterministic.
 *
 * WV-3-RIVAL-REACT: when `vantage` is given, a rival pursuing the SAME strategy as the player and within
 * one rung of them is a DIRECT COMPETITOR — it escalates (a meaningfully higher climb chance) to contest
 * the same ground, so the player's position perturbs the world differently per run (the Yuka-reactive
 * half). Deterministic: the escalation is a fixed bonus read off the player vantage, the climb roll stays
 * seeded on (agent, year). Without a vantage the world advances exactly as before (back-compat).
 */
export function advanceWorld(
  world: DynastyWorld,
  year: number,
  rng: Rng,
  vantage?: PlayerVantage,
): DynastyWorld {
  const epoch = epochForYear(year);
  const snapshots: RivalSnapshot[] = [];
  for (const agent of world.rivals) {
    const strategy = advanceAgent(agent);
    const tide = epoch ? epochImpact(epoch, agent.motivators) : 0;
    // A line riding its epoch + pursuing an ambitious strategy climbs; a badly-out-of-step line
    // stalls. (Misfortune drops are applied by SS-5 in the per-turn class system; here the world
    // models the steady tide.)
    const climbing = strategy !== "endure" && tide > 0.1;
    if (climbing) {
      const r = rng.fork(`worldclimb:${agent.id}:${year}`);
      // A direct competitor (same strategy as the player, within one rung) digs in to contest the ground
      // the player is also climbing — a +25 climb-chance escalation. The player's vantage thus changes the
      // rival world's trajectory (and the convergence race) differently each run.
      const competes =
        vantage !== undefined &&
        strategy === vantage.strategy &&
        Math.abs(agent.rung - vantage.rung) <= 1;
      const escalation = competes ? 25 : 0;
      if (r.int(1, 100) <= 40 + Math.round(tide * 40) + escalation)
        agent.rung = climb({
          rung: agent.rung,
          peakRung: agent.rung,
          hasFallen: false,
          marks: [],
        }).rung;
    }
    // SHOCK-AFTERMATH-IN-RIVALS: rivals weather their OWN seeded setbacks, so the convergence race feels
    // alive — a rival can falter mid-climb (a window the player can exploit), then rebound. Era-weighted off
    // the same macro-act medicine as the player's shock (a founding-era rival is far more exposed than an
    // interstellar one). Deterministic per (agent, year). A stumbled rival REBOUNDS (regains the rung) on a
    // later turn it survives un-struck — the two-act blow→recover shape, mirrored for the world.
    rivalShock(agent, year, rng.fork(`rivalshock:${agent.id}:${year}`));
    snapshots.push(snapshot(agent, epoch));
  }
  return { rivals: world.rivals, snapshots };
}

/** Per-turn base chance a rival takes a setback, before era-weighting. Tuned alongside the player's
 *  BASE_SHOCK_CHANCE (0.33) but lower — the world shouldn't churn faster than the played line. */
const RIVAL_SHOCK_CHANCE = 0.22;

/**
 * SHOCK-AFTERMATH-IN-RIVALS: roll + apply one seeded setback/rebound to a rival, in place. A rival not
 * currently stumbled may STUMBLE (lose a rung, flagged `stumbled`) at an era-weighted rate; a rival that is
 * stumbled REBOUNDS the next turn it isn't struck again (regains the rung, clears the flag) — the two-act
 * blow→recover shape mirrored for the world. Floored exposure so even the far future isn't fully safe, and a
 * rung-0 rival can't drop below the ladder. Deterministic for (agent, year, rng). Mutates the agent like the
 * climb logic above (advanceWorld owns the world's mutation).
 */
function rivalShock(agent: DynastyAgent, year: number, rng: Rng): void {
  const exposure = Math.max(0.15, 1 - macroActMedicine(macroActForYear(year)));
  const struck = rng.fork("hit").chance(RIVAL_SHOCK_CHANCE * exposure);
  if (agent.stumbled) {
    // Already down — a turn without a fresh blow lets the line claw the rung back (rebound).
    if (!struck) {
      agent.rung = Math.min(MAX_RUNG, agent.rung + 1);
      agent.stumbled = false;
    }
    return;
  }
  // Standing — a fresh setback drops a rung (never below the ladder floor) and marks the rival faltering.
  if (struck && agent.rung > 0) {
    agent.rung = Math.max(0, agent.rung - 1);
    agent.stumbled = true;
  }
}

/**
 * The player's line ACTS on a rival's: a crossing where the player opposes a rival suppresses its
 * climb (negative delta), one where the player contributes lifts it (positive). Mutates the named
 * rival agent's rung (clamped to the rung ladder) so the effect persists + compounds into later
 * advanceWorld turns and the final convergence ending — turning read-only glimpses into a real
 * interaction. No-op for an unknown id. Pure given the world (mutates the agent in place, as
 * advanceWorld already does); returns the world for chaining.
 */
/**
 * RIVAL-RISE-NEWS-WEIGHT: the surge-dispatch headline, tiered by how far a rival has pulled ahead (the rung
 * gap > 0). Mild when just ahead, urgent when leaving you behind — so the pressure scales like the foreshadow's
 * dread did. Pure; `name` is the already-humanized place. The ONE home for the phrasing (engine + tests share it).
 */
export function surgeHeadline(name: string, gap: number): string {
  if (gap >= 3) return `The ${name} line has left you behind — its star is nearly out of reach.`;
  if (gap === 2) return `The ${name} line is pulling away — its star rises fast.`;
  return `The ${name} line has edged ahead of you.`;
}

/** Humanize a rival snapshot label / id (`rival:east_coast` → "East Coast") for player-facing copy. The ONE
 *  home for this transform (was duplicated in loop.rivalNews + TimelineView — Gemini #126 DRY). */
export function humanizeRivalLabel(label: string): string {
  return label
    .replace(/^rival:/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function nudgeRival(world: DynastyWorld, rivalId: string, rungDelta: number): DynastyWorld {
  const agent = world.rivals.find((a) => a.id === rivalId);
  if (!agent) return world;
  agent.rung = Math.max(0, Math.min(MAX_RUNG, agent.rung + rungDelta));
  // Keep the matching snapshot in sync — glimpses, convergence endings, and the UI read `snapshots`,
  // not `rivals`, so without this the nudge would be invisible until the next advanceWorld rebuild.
  const snaps = world.snapshots.map((s) => (s.id === rivalId ? { ...s, rung: agent.rung } : s));
  return { rivals: world.rivals, snapshots: snaps };
}

/**
 * Detect GLIMPSES of rival lines from the played line's vantage at `year`. A rival becomes
 * visible once it (or the player) has climbed enough that their paths plausibly cross (rung
 * proximity). Relation: a rival pursuing the SAME strategy as the player is OPPOSING (they compete
 * for the same ground); a complementary strategy is CONTRIBUTING; otherwise NEUTRAL. Pure.
 */
export function detectGlimpses(
  world: DynastyWorld,
  playerRung: number,
  playerStrategy: string,
  max = 3,
): Glimpse[] {
  const COMPLEMENT: Record<string, string> = {
    accumulate: "seize_power",
    seize_power: "accumulate",
    advance_knowledge: "accumulate",
    spread_belief: "win_renown",
    win_renown: "spread_belief",
  };
  const out: Glimpse[] = [];
  for (const s of world.snapshots) {
    if (!s.alive) continue;
    if (Math.abs(s.rung - playerRung) > 1) continue; // only lines near your station are visible
    let relation: Relation = "neutral";
    if (s.strategy === playerStrategy) relation = "opposing";
    else if (COMPLEMENT[playerStrategy] === s.strategy) relation = "contributing";
    // SHOCK-AFTERMATH-IN-RIVALS: a faltering rival (mid-setback) reads "struggling" regardless of tide — the
    // player should SEE the window the rival's stumble opens, not just its epoch fit.
    const note = s.faltering
      ? "struggling"
      : s.tide > 0.3
        ? "rising"
        : s.tide < -0.3
          ? "struggling"
          : "holding";
    out.push({ rivalId: s.id, label: s.label, relation, note, rung: s.rung });
    if (out.length >= max) break;
  }
  return out;
}
