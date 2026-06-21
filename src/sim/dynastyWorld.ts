/**
 * DYNASTY WORLD (Convergence Saga, SS-8) — the living world of OTHER lines.
 *
 * Every immigration wave you do NOT play still grows its family in parallel: a DynastyAgent
 * (SS-3) advancing each turn, hit by the same cross-cutting EPOCHS (SS-4) and the same misfortune
 * tract (SS-5). Their progress is STORED every turn, so they exist as OPPOSING / CONTRIBUTING /
 * NEUTRAL forces the played line glimpses + may cross. Fully deterministic: the rival roster +
 * every advance is derived from the run seed via createRng — same seed → same world on replay.
 */

import { climb } from "./classRung";
import { advanceAgent, createDynastyAgent, type DynastyAgent } from "./dynastyAgent";
import { type Epoch, epochForYear, epochImpact } from "./macroActs";
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
  };
}

/**
 * Advance the whole rival world one turn at `year`: each rival plans (GOAP), the active epoch's
 * tide nudges it up (riding) or threatens it (a strong negative tide can stall the climb), and a
 * riding rival on a climbing strategy gains a rung. Re-snapshots. Pure + deterministic.
 */
export function advanceWorld(world: DynastyWorld, year: number, rng: Rng): DynastyWorld {
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
      if (r.int(1, 100) <= 40 + Math.round(tide * 40))
        agent.rung = climb({
          rung: agent.rung,
          peakRung: agent.rung,
          hasFallen: false,
          marks: [],
        }).rung;
    }
    snapshots.push(snapshot(agent, epoch));
  }
  return { rivals: world.rivals, snapshots };
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
    const note = s.tide > 0.3 ? "rising" : s.tide < -0.3 ? "struggling" : "holding";
    out.push({ rivalId: s.id, label: s.label, relation, note });
    if (out.length >= max) break;
  }
  return out;
}
