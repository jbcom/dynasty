import type { Content } from "../sim/content";
import { replay, replayFromState } from "../sim/effects";
import { foundDynasty } from "../sim/founding";
import { createRng } from "../sim/rng";
import type { Archetype } from "../sim/slots";
import { type GameState, initState } from "../sim/state";
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
    calling?: string;
    gender?: "male" | "female";
    successionMode?: "absolute" | "primogeniture" | "matriarchal";
    axisChoices?: Partial<Record<"faith" | "ideology" | "sociology" | "tech", string>>;
  };
  /** Legacy v1 literal dynasty key, read only when migrating an old save. */
  dynasty?: string;
  history: Array<{ eventId: string; choiceId: string }>;
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
            ...(state.founding.calling ? { calling: state.founding.calling } : {}),
            ...(state.founding.gender ? { gender: state.founding.gender } : {}),
            ...(state.founding.successionMode
              ? { successionMode: state.founding.successionMode }
              : {}),
            ...(state.founding.axisChoices ? { axisChoices: state.founding.axisChoices } : {}),
          },
        }
      : {}),
    history: state.history.map((h) => ({ eventId: h.eventId, choiceId: h.choiceId })),
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
    const base = foundDynasty(content, {
      momentId: save.founding.momentId,
      surname: save.founding.surname,
      seed: save.seed,
      calling: save.founding.calling,
      gender: save.founding.gender,
      successionMode: save.founding.successionMode,
      axisChoices: save.founding.axisChoices,
    }).state;
    return replayFromState(content, base, save.history, createRng);
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
