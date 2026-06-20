import type { Content } from "../sim/content";
import { replay } from "../sim/effects";
import { createRng } from "../sim/rng";
import type { DynastyKey } from "../sim/slots";
import { type GameState, initState } from "../sim/state";
import type { Storage } from "./storage";

const SAVE_KEY = "mmm.save.v1";
const SAVE_VERSION = 1;

/**
 * A save is tiny: just the seed, dynasty, and the choice history. Because the
 * sim is a pure deterministic function of (seed, dynasty, history), replaying
 * reconstructs the exact state — no need to serialize meters/flags/ledger.
 *
 * `dynasty` was added in the de-5b batch; saves without it default to "trump"
 * for backwards compatibility with any pre-de-5b saves (they were always Trump runs).
 */
export interface SaveData {
  version: number;
  seed: string;
  dynasty: DynastyKey;
  history: Array<{ eventId: string; choiceId: string }>;
  savedYear: number;
}

/** Build a SaveData from live state. */
export function toSave(state: GameState): SaveData {
  return {
    version: SAVE_VERSION,
    seed: state.seed,
    dynasty: state.dynasty,
    history: state.history.map((h) => ({ eventId: h.eventId, choiceId: h.choiceId })),
    savedYear: state.year,
  };
}

/** Reconstruct full GameState from a SaveData via deterministic replay. */
export function fromSave(content: Content, save: SaveData): GameState {
  if (save.version !== SAVE_VERSION) {
    throw new Error(`Unsupported save version ${save.version}`);
  }
  // `dynasty` defaults to "trump" for backwards-compatibility with pre-de-5b saves.
  const dynasty: DynastyKey = save.dynasty ?? "trump";
  return replay(content, save.seed, save.history, initState, createRng, dynasty);
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
