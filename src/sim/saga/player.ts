/**
 * NARRATIVE ACTS PLAYER (Narrative Acts model) — the pure runtime that walks an act's scenes as a
 * NOVEL: present a scene's multi-paragraph prose, apply a chosen beat (weave: gather or divert) or
 * the terminal decision (motivator shift + flags), and resolve the next scene (divert → that scene;
 * else the beat/scene `next` fall-through). No DOM, no randomness — deterministic given the choice.
 */

import {
  applyMotivators,
  MOTIVATOR_AXES,
  type MotivatorAxis,
  type Motivators,
} from "../motivators";
import type { ActChapter, Scene } from "./schema";

/** The loaded saga corpus the player walks (acts + scenes, indexed). */
export interface SagaCorpus {
  acts: Map<string, ActChapter>;
  scenes: Map<string, Scene>;
}

/** Build the indexed corpus from raw acts + scenes, with cross-family intersections woven in. Pure. */
export function buildCorpus(acts: ActChapter[], scenes: Scene[]): SagaCorpus {
  const corpus: SagaCorpus = {
    acts: new Map(acts.map((a) => [a.id, a])),
    scenes: new Map(scenes.map((s) => [s.id, s])),
  };
  weaveThreads(corpus);
  return corpus;
}

/**
 * CURATED INTERSECTION POINTS (WV-1) — cross-dynasty crossings happen at a SMALL, deliberate set of
 * moments, not on every act. The earlier auto-spray attached a generic crossing to every act's midpoint;
 * that produced filler that read templated and got dumped as a wall of text. Instead: a curated table of
 * specific points (a tier + the played wave) each naming its few plausible partner lines and the bespoke
 * crossing prose + relation for the moment. A scene becomes a crossing ONLY if it's in this table (or the
 * corpus already authored `scene.thread`). The partner is the first one that actually exists in the
 * corpus at that tier — so the moment is real, chosen, and limited (the user's model: limited encounters
 * per scenario, trigger those). Pure + deterministic; no RNG.
 *
 * `at` matches the act's tier; `wave` the played line; `partners` are tried in order (era/place-plausible
 * neighbours). `crossing` is the woven prose; `relation` drives the interactive rival nudge.
 */
interface IntersectionPoint {
  at: number; // reach tier
  wave: string; // the played line this point fires for
  partners: string[]; // plausible encountering lines, in preference order
  crossing: string; // the woven crossing prose (the moment, in the player's story)
  relation: "opposing" | "contributing" | "neutral";
}

const INTERSECTION_POINTS: readonly IntersectionPoint[] = [
  // The immigrant ground (tier 0): two lines off the same boats, in the same tenements.
  {
    at: 0,
    wave: "ireland",
    partners: ["italian", "bavaria", "ashkenazi_jewish"],
    crossing:
      "Down the same airless stair lives another newcomer family, their language not yours, their hungers exactly yours; a borrowed pot, a shared landing, and a wary nod seals a neighbourliness neither of you will quite admit to.",
    relation: "contributing",
  },
  {
    at: 0,
    wave: "italian",
    partners: ["ireland", "ashkenazi_jewish", "chinese"],
    crossing:
      "At the market stall the two of you reach for the same cheap cut, and in the haggling that follows — half insult, half respect — a rivalry begins that will outlast you both.",
    relation: "opposing",
  },
  // The climb (tier 2): the line meets capital it does not yet have.
  {
    at: 2,
    wave: "bavaria",
    partners: ["ashkenazi_jewish", "ireland", "scandinavian"],
    crossing:
      "The financier who could make your venture sits across a polished table — another family's name on the door — and weighs your line the way you have learned to weigh others.",
    relation: "contributing",
  },
  // The summit (tier 4): two arrived houses contend for the same height.
  {
    at: 4,
    wave: "chinese",
    partners: ["italian", "scandinavian", "bavaria"],
    crossing:
      "At the gala both your houses are toasted in the same breath, and beneath the applause you each measure exactly how far the other has climbed — and how far is left.",
    relation: "opposing",
  },
];

/**
 * Weave the CURATED intersection points into the corpus: for each act whose (tier, wave) matches a
 * point, set the midpoint scene's thread to the first partner that exists at that tier — unless the
 * scene already declares an authored thread (that wins). No act outside the curated set gets a crossing.
 * Idempotent + pure (fixed table, no RNG) — replay-safe.
 */
export function weaveThreads(corpus: SagaCorpus): void {
  // Index (wave→tiers present) ONCE up front, so the partner lookup is O(1) instead of re-scanning all
  // acts per candidate partner per act (CodeRabbit #96).
  const tiersByWave = new Map<string, Set<number>>();
  for (const a of corpus.acts.values()) {
    let tiers = tiersByWave.get(a.wave);
    if (!tiers) {
      tiers = new Set<number>();
      tiersByWave.set(a.wave, tiers);
    }
    tiers.add(a.tier);
  }
  const hasActAtTier = (wave: string, tier: number) => tiersByWave.get(wave)?.has(tier) ?? false;

  for (const act of corpus.acts.values()) {
    const point = INTERSECTION_POINTS.find((p) => p.at === act.tier && p.wave === act.wave);
    if (!point) continue;
    const midId = act.scenes.find((id) => id.endsWith(":midpoint"));
    if (!midId) continue;
    const mid = corpus.scenes.get(midId);
    if (!mid || mid.thread.length > 0) continue; // respect an authored thread
    const partner = point.partners.find((w) => w !== act.wave && hasActAtTier(w, act.tier));
    if (!partner) continue;
    mid.thread = [
      { wave: partner, atTier: act.tier, crossing: point.crossing, relation: point.relation },
    ];
  }
}

/** Human label for a wave id, for crossing prose. Falls back to a tidied id for unknown waves. */
function waveLabel(wave: string): string {
  const LABELS: Record<string, string> = {
    ireland: "Irish",
    bavaria: "German",
    italian: "Italian",
    ashkenazi_jewish: "Jewish",
    scandinavian: "Scandinavian",
    chinese: "Chinese",
    baghdad: "Baghdadi",
  };
  return LABELS[wave] ?? wave.replace(/_/g, " ");
}

/**
 * A deterministic, PAIR-SPECIFIC crossing line for an intersection — the specific moment this line's
 * path cuts across the rival wave's. Names both peoples so it reads as a real crossing, not a generic
 * "another line". Pure; varied by the pair so no two intersections read identically. An authored
 * `crossing` on the ThreadRef always overrides this.
 */
export function crossingLine(wave: string, rival: string): string {
  const a = waveLabel(wave);
  const b = waveLabel(rival);
  return `In the press of the same hard years, the path of a ${b} line cuts across your ${a} one — a glance, a bargain, a rivalry not yet named — and for a moment the two stories are one.`;
}

/** Coerce a loose motivatorShift record to a typed partial (only the 8 known axes). Pure. */
export function toMotivatorDelta(shift: Record<string, number>): Partial<Motivators> {
  const out: Partial<Motivators> = {};
  for (const axis of MOTIVATOR_AXES) {
    if (axis in shift) out[axis] = shift[axis];
  }
  return out;
}

/** Whether a scene's gate is satisfied by the current flags. Pure. */
export function sceneEligible(scene: Scene, flags: ReadonlySet<string>): boolean {
  for (const f of scene.requires.flags) if (!flags.has(f)) return false;
  for (const f of scene.requires.notFlags) if (flags.has(f)) return false;
  return true;
}

/** The result of applying a beat/decision option: the motivator + flag deltas + where to go next. */
export interface ChoiceOutcome {
  motivators: Motivators;
  flags: string[];
  /** The next scene id (a divert), or undefined to fall through to the scene's `next`. */
  divertTo?: string;
}

function withFlags(flags: readonly string[], add: readonly string[]): string[] {
  const set = new Set(flags);
  for (const f of add) set.add(f);
  return [...set];
}

/** Apply a beat's choice. A gather choice nudges motivators + flags but stays in the scene's flow; a divert forks. */
export function applyBeatChoice(
  scene: Scene,
  beatIndex: number,
  motivators: Motivators,
  flags: readonly string[],
): ChoiceOutcome {
  const beat = scene.beats[beatIndex];
  const choice = beat?.choice;
  if (!choice) return { motivators, flags: [...flags] };
  return {
    motivators: applyMotivators(motivators, toMotivatorDelta(choice.motivatorShift)),
    flags: withFlags(flags, choice.setFlags),
    divertTo: choice.gather ? undefined : choice.divertTo,
  };
}

/** Apply the scene's terminal decision option. */
export function applyDecision(
  scene: Scene,
  optionIndex: number,
  motivators: Motivators,
  flags: readonly string[],
): ChoiceOutcome {
  const opt = scene.decision?.options[optionIndex];
  if (!opt) return { motivators, flags: [...flags] };
  return {
    motivators: applyMotivators(motivators, toMotivatorDelta(opt.motivatorShift)),
    flags: withFlags(flags, opt.setFlags),
    divertTo: opt.divertTo,
  };
}

/**
 * Resolve the next scene id after an outcome: an explicit divert wins; else the scene's `next`
 * fall-through; else the next scene in the act's ordered list; else undefined (act ends). Pure.
 */
export function nextScene(
  corpus: SagaCorpus,
  act: ActChapter,
  current: Scene,
  outcome: ChoiceOutcome,
): string | undefined {
  if (outcome.divertTo) return outcome.divertTo;
  // Honor an authored `next` ONLY if it resolves to a real scene — a malformed pointer (e.g. a dropped
  // class segment in a generated id) must NOT silently end the act. Fall back to the act's scene order,
  // which is the authoritative sequence, so traversal is robust to that drift.
  if (current.next && corpus.scenes.has(current.next)) return current.next;
  const i = act.scenes.indexOf(current.id);
  return i >= 0 && i + 1 < act.scenes.length ? act.scenes[i + 1] : undefined;
}

/** The first eligible scene of an act (its opening), given current flags. Pure. */
export function openingScene(
  corpus: SagaCorpus,
  act: ActChapter,
  flags: ReadonlySet<string>,
): Scene | undefined {
  for (const id of act.scenes) {
    const s = corpus.scenes.get(id);
    if (s && sceneEligible(s, flags)) return s;
  }
  return undefined;
}

/**
 * The act chapter for a (wave × archetype × class × tier) cell — the per-generation act. When no act
 * exists for the requested class, falls back to the "poor" track (the base story every line shares
 * until a class-specific track is authored). Pure.
 */
export function actsForTier(
  corpus: SagaCorpus,
  wave: string,
  archetype: string,
  tier: number,
  cls = "poor",
): ActChapter | undefined {
  let fallback: ActChapter | undefined;
  for (const a of corpus.acts.values()) {
    if (a.wave !== wave || a.archetype !== archetype || a.tier !== tier) continue;
    if (a.cls === cls) return a;
    if (a.cls === "poor") fallback = a;
  }
  return fallback;
}

/**
 * FS-8: the AUTHORED dynasty-spine act for a generation (the ONE line, founding→stars). The spine acts
 * carry `spine:g<gen>:*` ids (authored by genai-spine). Returns the act for `gen` whose id starts with
 * `spine:g<gen>:`, or undefined if the spine isn't authored that far. This is how the engine plays the
 * spine instead of the 504-cell corpus ([[founding-spine-pivot]]).
 */
export function spineActForGen(corpus: SagaCorpus, gen: number): ActChapter | undefined {
  const prefix = `spine:g${gen}:`;
  for (const a of corpus.acts.values()) if (a.id.startsWith(prefix)) return a;
  return undefined;
}

/** A braided cross-family fragment: the rival wave, the bespoke crossing line, + the opening scene of
 *  its act at the thread's tier. */
export interface BraidedThread {
  wave: string;
  /** The specific moment the two lines cross (bespoke or the deterministic pair line). */
  crossing: string;
  /** How the two lines relate here — drives the interactive rival nudge (opposing suppresses the rival,
   *  contributing lifts it). Absent → neutral (no mechanical effect). */
  relation?: "opposing" | "contributing" | "neutral";
  scene: Scene;
}

/**
 * Resolve a scene's cross-family INTERSECTIONS (ink threads). For each ThreadRef the scene declares,
 * find ANY act of the referenced wave at that tier (archetype-agnostic — paths cross regardless of
 * the rival's power base) and return its opening scene as a braided fragment to weave in. A ref that
 * points at an unauthored wave/tier is skipped (the intersection simply doesn't fire). Pure.
 */
export function resolveThreads(corpus: SagaCorpus, scene: Scene): BraidedThread[] {
  const out: BraidedThread[] = [];
  for (const ref of scene.thread) {
    let braided: Scene | undefined;
    for (const act of corpus.acts.values()) {
      if (act.wave !== ref.wave || act.tier !== ref.atTier) continue;
      braided = openingScene(corpus, act, new Set());
      if (braided) break;
    }
    if (braided) {
      // Prefer the ref's bespoke/woven crossing; else a generic-but-named fallback for the rival wave.
      const crossing = ref.crossing ?? `The path of a ${waveLabel(ref.wave)} line crosses yours.`;
      out.push({ wave: ref.wave, crossing, relation: ref.relation, scene: braided });
    }
  }
  return out;
}

export type { MotivatorAxis };
