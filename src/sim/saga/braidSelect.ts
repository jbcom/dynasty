/**
 * BRAID SELECTOR (WV-2) — the pure, seeded runtime that decides whether a cross-dynasty crossing weaves
 * into the player's current scene, and with whom. The user's emergent model: NO hand-curated pair list.
 * A scene marks DESTINATION anchors (where another line could enter); other lines mark SOURCE slots
 * (borrowable vignettes of themselves at a setting). At a move, each era-eligible candidate line gets a
 * BIAS weight (place × archetype × class × setting overlap), a seeded roll decides IF + WHO, and the
 * chosen source's vignette is BORROWED into a ThreadRef at the destination — no bespoke per-pair writing.
 *
 * Pure + deterministic: all randomness comes from the injected Rng (seeded via createRng up the stack),
 * so a given seed + state replays identically. No DOM, no Date, no Math.random.
 * ([[braid-slots-genai-architecture]], [[emergent-cause-effect-sim]])
 */

import type { Rng } from "../rng";
import type { BraidSlot, ThreadRef } from "./schema";

/** A candidate partner line that could cross into the player's scene this move. */
export interface BraidCandidate {
  /** The partner line's wave id. */
  wave: string;
  /** The reach tier the crossing reads at (the player's current tier). */
  tier: number;
  /** The era year this line became active — used for era-gating (later dynasties enter past their year). */
  activeFromYear: number;
  /** This line's source slots (borrowable vignettes) available to weave from. */
  sources: readonly BraidSlot[];
  /** Bias inputs — how much this line shares the player's situation (each 0..1). */
  bias: {
    place: number; // same place/neighbourhood
    archetype: number; // compatible power base
    cls: number; // same class rung
  };
  /** How the two lines relate (drives the rival nudge); defaults to neutral. */
  relation?: "opposing" | "contributing" | "neutral";
}

/** What the selector needs about the player's current moment. */
export interface BraidContext {
  /** The current year — gates which candidates are active. */
  year: number;
  /** The player's tier (the crossing reads at this tier). */
  tier: number;
  /** The destination anchors in the player's current scene. */
  destinations: readonly BraidSlot[];
  /** Base probability a crossing fires at all when at least one candidate matches (0..1). */
  baseChance?: number;
}

/**
 * The candidate's source slot that can weave at this destination: same `setting`, and it MUST carry a
 * vignette (the borrowed prose) — a vignette-less source can't produce a crossing, so it's no match.
 */
function matchingSource(candidate: BraidCandidate, dest: BraidSlot): BraidSlot | undefined {
  return candidate.sources.find(
    (s) => s.kind === "source" && s.setting === dest.setting && !!s.vignette,
  );
}

/**
 * The bias weight for a candidate (caller has already confirmed a matching source). Place dominates
 * (you meet who's nearby), then archetype affinity, then shared class — a strictly-positive weighted sum
 * so any plausible pair has SOME chance.
 */
function biasWeight(candidate: BraidCandidate): number {
  const { place, archetype, cls } = candidate.bias;
  return 0.1 + 0.5 * place + 0.25 * archetype + 0.15 * cls;
}

/** A resolved match: the destination it weaves at + the borrowed source + the built ThreadRef. */
export interface BraidMatch {
  destination: BraidSlot;
  source: BraidSlot;
  thread: ThreadRef;
}

/**
 * Decide whether a crossing weaves into the player's scene this move, and build it. Returns null when no
 * candidate plausibly matches, or the seeded roll declines. Deterministic for a given (ctx, candidates,
 * rng) — the rng must be a forked, seeded stream (e.g. `rng.fork(`braid:${year}`)`).
 */
export function selectBraid(
  ctx: BraidContext,
  candidates: readonly BraidCandidate[],
  rng: Rng,
): BraidMatch | null {
  const baseChance = ctx.baseChance ?? 0.5;

  // Build the flat list of (destination, candidate, source, weight) options across all destinations and
  // era-eligible candidates. Era-gating: a line can only cross once it is active (LATER dynasties enter
  // the pool automatically past their activeFromYear) and has a source at the player's tier.
  const options: Array<{
    dest: BraidSlot;
    cand: BraidCandidate;
    source: BraidSlot;
    weight: number;
  }> = [];
  for (const dest of ctx.destinations) {
    if (dest.kind !== "destination") continue;
    for (const cand of candidates) {
      if (cand.activeFromYear > ctx.year) continue; // not yet on the stage
      if (cand.tier !== ctx.tier) continue; // crossings read at the shared tier
      const source = matchingSource(cand, dest);
      if (!source) continue; // no setting-matched, vignette-bearing source → no plausible meeting
      options.push({ dest, cand, source, weight: biasWeight(cand) });
    }
  }
  if (options.length === 0) return null;

  // REPLAY-SAFETY: the weighted pick indexes into `options`, whose build order follows the candidates'
  // (i.e. world.snapshots') iteration order — NOT guaranteed identical fresh-vs-restored. Sort by a
  // stable key so index→option is order-independent, keeping the seeded pick deterministic across restore.
  options.sort(
    (a, b) =>
      a.cand.wave.localeCompare(b.cand.wave) ||
      a.dest.at - b.dest.at ||
      a.source.setting.localeCompare(b.source.setting),
  );

  // IF a crossing fires at all: a seeded chance gate (so most moves pass without a crossing — crossings
  // are special). Forked so the gate stream is independent of the pick stream.
  if (!rng.fork("braid:gate").chance(baseChance)) return null;

  // WHICH crossing: bias-weighted pick among the plausible options.
  const idx = rng.fork("braid:pick").weightedIndex(options.map((o) => o.weight));
  const chosen = options[idx];
  if (!chosen) return null;

  // Build the ThreadRef, BORROWING the source's vignette as the woven crossing prose.
  const thread: ThreadRef = {
    wave: chosen.cand.wave,
    atTier: ctx.tier,
    crossing: chosen.source.vignette ?? "",
    relation: chosen.cand.relation ?? "neutral",
  };
  return { destination: chosen.dest, source: chosen.source, thread };
}

/** The minimal rival shape the candidate adapter needs (a subset of DynastyWorld's RivalSnapshot). */
export interface RivalLike {
  id: string;
  placeId: string;
  archetype: string;
  strategy: string;
  alive: boolean;
}

/** The played line's situation, for computing each candidate's bias overlap. */
export interface PlayerSituation {
  placeId: string;
  archetype: string;
  cls: string;
  tier: number;
  /** The year a rival is considered active from (when their place's wave entered). Keyed by placeId. */
  activeFromByPlace?: Record<string, number>;
}

/** Map a rival's strategy-vs-player relation the same way the glimpse strip does (opposing/contributing). */
const COMPLEMENT: Record<string, string> = {
  accumulate: "seize_power",
  seize_power: "accumulate",
  advance_knowledge: "accumulate",
  spread_belief: "win_renown",
  win_renown: "spread_belief",
};

/**
 * Adapt live rival snapshots into braid CANDIDATES for the player's situation — the bridge from the
 * DynastyWorld to the selector. Each rival's source slots are supplied by `sourcesFor` (its corpus
 * scene slots at the player's tier/setting); the bias overlap is place (same placeId) × archetype (same
 * power base) × class is unknown for rivals so it contributes a neutral 0.5. Pure.
 */
export function candidatesFromSnapshots(
  rivals: readonly RivalLike[],
  player: PlayerSituation,
  playerStrategy: string,
  sourcesFor: (rival: RivalLike) => readonly BraidSlot[],
): BraidCandidate[] {
  const out: BraidCandidate[] = [];
  for (const r of rivals) {
    if (!r.alive) continue;
    const relation: BraidCandidate["relation"] =
      r.strategy === playerStrategy
        ? "opposing"
        : COMPLEMENT[playerStrategy] === r.strategy
          ? "contributing"
          : "neutral";
    out.push({
      wave: r.id,
      tier: player.tier,
      activeFromYear: player.activeFromByPlace?.[r.placeId] ?? Number.NEGATIVE_INFINITY,
      sources: sourcesFor(r),
      bias: {
        place: r.placeId === player.placeId ? 1 : 0,
        archetype: r.archetype === player.archetype ? 1 : 0.4,
        cls: 0.5, // rivals don't expose a class rung; neutral contribution
      },
      relation,
    });
  }
  return out;
}
