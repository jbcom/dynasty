import type { Content } from "../sim/content";
import { replay } from "../sim/effects";
import { type Composition, foundByComposition, foundDynasty } from "../sim/founding";
import { createRng } from "../sim/rng";
import type { Archetype } from "../sim/slots";
import { type GameState, initState } from "../sim/state";
import { Game } from "./loop";
import type { Storage } from "./storage";

const SAVE_KEY = "mmm.save.v1";
const SAVE_VERSION = 2;

/**
 * A save is tiny: the seed, the run's identity, and the choice history. Because
 * the sim is a pure deterministic function of (initial state, history), replaying
 * reconstructs the exact state — no need to serialize meters/flags/ledger.
 *
 * IDENTITY (FD-3.5): the run is identified by its ARCHETYPE (default economic) and,
 * for a FOUNDED line, its `founding` metadata (momentId/surname) — which is what
 * foundDynasty needs to rebuild the founded initial state before replay. A v1 save
 * (pre-FD-3.5, literal `dynasty`) is mapped onto its archetype for compatibility.
 */
export interface SaveData {
  version: number;
  seed: string;
  archetype: Archetype;
  /**
   * Present for a founded line; absent for a plain archetype run. Carries the FULL
   * founding configuration (CP-6) so foundDynasty rebuilds the exact founded base
   * before replay — dropping any field would diverge the reconstruction.
   */
  founding?: {
    momentId: string;
    surname: string;
    /** The player-chosen progenitor GIVEN name (ONB-1) — persisted so a reload reconstructs the exact
     *  founder (a free-typed given name isn't re-derivable from the seed). */
    given?: string;
    calling?: string;
    gender?: "male" | "female";
    successionMode?: "absolute" | "primogeniture" | "matriarchal";
    axisChoices?: Partial<Record<"faith" | "ideology" | "sociology" | "tech", string>>;
    /**
     * The composed origin (CP-R2): place/era/culture/year/archetype/deepHistory.
     * Carried so a pure-composition run (whose momentId is a synthesized
     * `composed:…` id with no start-moment) reconstructs via foundByComposition.
     * Absent on legacy moment-founded saves — those rebuild from the moment.
     */
    place?: string;
    era?: string;
    culture?: string;
    year?: number;
    archetype?: Archetype;
    deepHistory?: boolean;
  };
  /** Legacy v1 literal dynasty key, read only when migrating an old save. */
  dynasty?: string;
  /**
   * The ordered choice log. An entry is EITHER an event-flow choice (eventId + choiceId) OR a SAGA walk
   * step (SAGA-RESTORE-CURSOR: `saga` = "beat" | "decision", `index` = chosen beat/option). Replaying
   * this whole sequence — event steps through the sim, saga steps through the engine's SagaDriver —
   * reconstructs a saga-deep founded run bit-identically (the saga clock/family/world re-derive from the
   * choice sequence). Legacy saves carry event-only entries; those still replay unchanged.
   */
  history: Array<{
    eventId?: string;
    choiceId?: string;
    saga?: "beat" | "decision";
    index?: number;
  }>;
  /**
   * RIVAL-CROSSING-EXPLOIT: the player-press side-log. Kept SEPARATE from `history` because a press must not
   * shift `history.length` (the saga RNG fork key). On load, the press nudges are re-applied to the rebuilt
   * rival world; the heat costs are already baked into the replayed meters, so only the rival nudge replays.
   * Absent on saves made before this feature — those load with no presses.
   */
  presses?: Array<{ at: number; rivalId: string; year: number }>;
  savedYear: number;
}

/** Map a legacy v1 literal dynasty key onto its archetype. */
const LEGACY_DYNASTY_ARCHETYPE: Record<string, Archetype> = {
  trump: "economic",
  kennedy: "political",
  musk: "technological",
};

/** Build a SaveData from live state. */
export function toSave(state: GameState): SaveData {
  return {
    version: SAVE_VERSION,
    seed: state.seed,
    archetype: state.archetype,
    ...(state.founding
      ? {
          founding: {
            momentId: state.founding.momentId,
            surname: state.founding.surname,
            ...(state.founding.given ? { given: state.founding.given } : {}),
            place: state.founding.place,
            culture: state.founding.culture,
            ...(state.founding.era ? { era: state.founding.era } : {}),
            ...(state.founding.year !== undefined ? { year: state.founding.year } : {}),
            ...(state.founding.archetype ? { archetype: state.founding.archetype } : {}),
            ...(state.founding.deepHistory ? { deepHistory: true } : {}),
            ...(state.founding.calling ? { calling: state.founding.calling } : {}),
            ...(state.founding.gender ? { gender: state.founding.gender } : {}),
            ...(state.founding.successionMode
              ? { successionMode: state.founding.successionMode }
              : {}),
            ...(state.founding.axisChoices ? { axisChoices: state.founding.axisChoices } : {}),
          },
        }
      : {}),
    // Carry each step's discriminant verbatim — event steps keep eventId/choiceId, saga steps keep
    // saga/index — so the full ordered choice log reconstructs an event- OR saga-deep run on replay.
    history: state.history.map((h) =>
      h.saga ? { saga: h.saga, index: h.index } : { eventId: h.eventId, choiceId: h.choiceId },
    ),
    // RIVAL-CROSSING-EXPLOIT: the press side-log (only when non-empty) — re-applied at load by the interleave.
    ...(state.presses && state.presses.length ? { presses: state.presses } : {}),
    savedYear: state.year,
  };
}

/** Reconstruct full GameState from a SaveData via deterministic replay. */
export function fromSave(content: Content, save: SaveData): GameState {
  if (save.version !== SAVE_VERSION && save.version !== 1) {
    throw new Error(`Unsupported save version ${save.version}`);
  }
  // A founded line is rebuilt from its start-moment, then the history replays from
  // that founded base (initState alone cannot reproduce a founded initial state).
  if (save.founding) {
    const f = save.founding;
    // CP-R2: a composed-origin save (place/era/culture/year/archetype present)
    // reconstructs via foundByComposition — its synthesized `composed:…` momentId
    // has no start-moment to read back from. A legacy moment-founded save (those
    // fields absent) rebuilds from the start-moment via foundDynasty.
    const hasComposition =
      f.place !== undefined &&
      f.era !== undefined &&
      f.culture !== undefined &&
      f.year !== undefined &&
      f.archetype !== undefined;
    let base: GameState;
    if (hasComposition) {
      const composition: Composition = {
        place: f.place as string,
        era: f.era as string,
        culture: f.culture as string,
        year: f.year as number,
        archetype: f.archetype as Archetype,
        gender: f.gender ?? "male",
        deepHistory: f.deepHistory,
        originId: f.momentId,
        surname: f.surname,
        ...(f.given ? { given: f.given } : {}),
        seed: save.seed,
        calling: f.calling,
        successionMode: f.successionMode,
        axisChoices: f.axisChoices,
      };
      base = foundByComposition(content, composition).state;
    } else {
      base = foundDynasty(content, {
        momentId: f.momentId,
        surname: f.surname,
        ...(f.given ? { given: f.given } : {}),
        seed: save.seed,
        calling: f.calling,
        gender: f.gender,
        successionMode: f.successionMode,
        axisChoices: f.axisChoices,
      }).state;
    }
    // SAGA-RESTORE-CURSOR: a founded line plays the NOVEL, whose beat/decision steps live in the choice
    // log alongside any event steps. Reconstruct by replaying the WHOLE interleaved sequence through the
    // engine (event steps via choose, saga steps via pickBeat/pickDecision) — the saga clock, family
    // aging, and rival world all re-derive from the choices, so the rebuild is bit-identical to live play.
    return Game.reconstruct(content, base, save.history, save.presses ?? []);
  }
  // Plain archetype run: archetype field (v2), else legacy literal dynasty (v1).
  const archetype: Archetype =
    save.archetype ?? LEGACY_DYNASTY_ARCHETYPE[save.dynasty ?? "trump"] ?? "economic";
  return replay(content, save.seed, save.history, initState, createRng, archetype);
}

/** Persist the current state. Call after every choice (autosave). */
export async function saveGame(storage: Storage, state: GameState): Promise<void> {
  await storage.set(SAVE_KEY, JSON.stringify(toSave(state)));
}

/** Load and reconstruct a saved run, or null if none exists / the save is corrupt. */
export async function loadGame(storage: Storage, content: Content): Promise<GameState | null> {
  const raw = await storage.get(SAVE_KEY);
  if (!raw) return null;
  try {
    const save = JSON.parse(raw) as SaveData;
    return fromSave(content, save);
  } catch {
    // Corrupt/incompatible save (bad JSON, unknown event id, version mismatch) —
    // treat as no save rather than crashing into a broken run.
    return null;
  }
}

/** Whether a save exists. */
export async function hasSave(storage: Storage): Promise<boolean> {
  return (await storage.get(SAVE_KEY)) !== null;
}

/** Delete the save (e.g. on New Game). */
export async function clearSave(storage: Storage): Promise<void> {
  await storage.remove(SAVE_KEY);
}
