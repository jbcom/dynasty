import type { Content } from "../sim/content";
import { replay } from "../sim/effects";
import { createRng } from "../sim/rng";
import { type GameState, initState } from "../sim/state";
import type { Storage } from "./storage";

const SAVE_KEY = "mmm.save.v1";
const SAVE_VERSION = 1;

/**
 * A save is tiny: just the seed and the choice history. Because the sim is a
 * pure deterministic function of (seed, history), replaying reconstructs the
 * exact state — no need to serialize meters/flags/ledger.
 */
export interface SaveData {
  version: number;
  seed: string;
  history: Array<{ eventId: string; choiceId: string }>;
  savedYear: number;
}

/** Build a SaveData from live state. */
export function toSave(state: GameState): SaveData {
  return {
    version: SAVE_VERSION,
    seed: state.seed,
    history: state.history.map((h) => ({ eventId: h.eventId, choiceId: h.choiceId })),
    savedYear: state.year,
  };
}

/** Reconstruct full GameState from a SaveData via deterministic replay. */
export function fromSave(content: Content, save: SaveData): GameState {
  if (save.version !== SAVE_VERSION) {
    throw new Error(`Unsupported save version ${save.version}`);
  }
  return replay(content, save.seed, save.history, initState, createRng);
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
