import type { Content } from "./content";
import { initMeters, type Meters } from "./meters";
import { initPersonality, type Personality } from "./personality";

/** One entry in the visible Butterfly Log (cause → effect chain, part B). */
export interface LedgerEntry {
  /** Monotonic index within the run. */
  seq: number;
  /** The choice id that emitted this entry. */
  sourceChoice: string;
  /** The event id the choice belonged to. */
  sourceEvent: string;
  /** Human-readable chain text shown to the player. */
  text: string;
  /** Year the cause occurred. */
  year: number;
  /** Butterfly rule id, if this entry was produced by a cross-era rule. */
  ruleId?: string;
}

/** A recorded decision (seed + this list fully reconstructs any run). */
export interface HistoryEntry {
  eventId: string;
  choiceId: string;
  year: number;
}

/** How a run can end. */
export type EndKind = "death" | "coup" | "victory";

export interface EndState {
  kind: EndKind;
  year: number;
  reason: string;
}

/** Accumulated ripple pressure per channel (the chaos engine's running state, part C). */
export type RippleField = Record<string, number>;

/** A scheduled delayed consequence awaiting its due year. */
export interface PendingConsequence {
  consequenceId: string;
  /** In-world year the effect is due to land. */
  dueYear: number;
}

/** The complete, serializable game state. Pure data — no DOM, no functions. */
export interface GameState {
  seed: string;
  /** Index of the current era within content.eras. */
  eraIndex: number;
  /** Trump's age in the current year. */
  age: number;
  /** Current in-world year. */
  year: number;
  meters: Meters;
  /** The personality vector — what kind of man he is becoming. */
  personality: Personality;
  /** Set membership flags (stored as a sorted array for serializability). */
  flags: string[];
  /** Event ids that have already fired (non-repeatable events fire once). */
  firedEvents: string[];
  /** Count of events fired in the current era (drives era budget). */
  eraEventCount: number;
  /** Year of the most recently fired event — events never go backward in time. */
  lastEventYear: number;
  /** Accumulated ripple pressure by channel. */
  ripples: RippleField;
  /** Delayed consequences scheduled to land in a future year. */
  pending: PendingConsequence[];
  /** Consequence ids that have already landed (non-repeatable fire once). */
  firedConsequences: string[];
  ledger: LedgerEntry[];
  history: HistoryEntry[];
  /** Set once the run ends; null while in progress. */
  end: EndState | null;
}

const BIRTH_YEAR = 1946;

/** Create the initial state for a new run. */
export function initState(content: Content, seed: string): GameState {
  const firstEra = content.eras[0];
  if (!firstEra) throw new Error("Content has no eras");
  return {
    seed,
    eraIndex: 0,
    age: 0,
    year: firstEra.yearStart,
    meters: initMeters(content.meters),
    personality: initPersonality(),
    flags: [],
    firedEvents: [],
    eraEventCount: 0,
    lastEventYear: firstEra.yearStart,
    ripples: {},
    pending: [],
    firedConsequences: [],
    ledger: [],
    history: [],
    end: null,
  };
}

/** True if the state holds the given flag. */
export function hasFlag(state: GameState, flag: string): boolean {
  return state.flags.includes(flag);
}

/** Return a new flag list with `flag` added (kept sorted, deduped). */
export function withFlag(flags: readonly string[], flag: string): string[] {
  if (flags.includes(flag)) return [...flags];
  return [...flags, flag].sort();
}

/** Return a new flag list with `flag` removed. */
export function withoutFlag(flags: readonly string[], flag: string): string[] {
  return flags.filter((f) => f !== flag);
}

/** Derive age from the current year (Trump born 1946). */
export function ageInYear(year: number): number {
  return year - BIRTH_YEAR;
}
