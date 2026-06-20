import type { Content } from "./content";
import { initMeters, type Meters } from "./meters";
import { initPersonality, type Personality } from "./personality";
import type { DynastyKey } from "./slots";

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

/**
 * How a run can end. `kind` is free-form (death | coup | victory | jail |
 * bankruptcy | assassination | first_contact | …) so endings are authored data,
 * not a fixed enum. `endingId` references the winning ending definition.
 */
export type EndKind = string;

export interface EndState {
  kind: EndKind;
  year: number;
  reason: string;
  /** Id of the data-driven ending that fired (absent for legacy/built-in ends). */
  endingId?: string;
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
  /** Live market state by market id (SIM1 systemic layer). */
  markets: Record<string, MarketState>;
  /** Current + peak rung per rank ladder (SIM1). Peak drives fall-from-grace. */
  ranks: Record<string, RankState>;
  /** Currency id `money` was denominated in last tick (redenomination detector). */
  currencyId: string;
  /** Set once the run ends; null while in progress. */
  end: EndState | null;
  /** The dynasty being played — selects the Era-0 start + birth-year baseline. */
  dynasty: DynastyKey;
  /** The protagonist's birth year (1946 Trump / 1971 Musk / 1888 Kennedy). */
  birthYear: number;
}

/** Per-market live state (index walk + the player's stake). */
export interface MarketState {
  /** Current index value. */
  index: number;
  /** Highest index seen (drawdown reference). */
  peakIndex: number;
  /** Active regime id. */
  regime: string;
  /** Steps spent in the current regime (older regimes are likelier to flip). */
  regimeAge: number;
  /** Player's stake: positive = long, negative = short, 0 = out. */
  holding: number;
  /** Borrow multiplier on the stake (the Trump special). */
  leverage: number;
}

/** Per-ladder rank state. */
export interface RankState {
  /** Current rung index. */
  rung: number;
  /** Highest rung reached this run (fall-from-grace reference). */
  peak: number;
}

/** Birth year per dynasty. Trump 1946, Musk 1971, Kennedy 1888. */
export const DYNASTY_START: Record<DynastyKey, number> = {
  trump: 1946,
  musk: 1971,
  kennedy: 1888,
};

/**
 * The flag that activates each non-Trump dynasty's gear (so dynastyOf / slots /
 * character timelines resolve to the right house from turn zero). Trump has no
 * activation flag — it's the default and needs no explicit flag.
 */
const DYNASTY_FLAG: Partial<Record<DynastyKey, string>> = {
  musk: "musk_dynasty_active",
  kennedy: "kennedy_dynasty_active",
};

/** Create the initial state for a new run, optionally for a non-Trump dynasty. */
export function initState(
  content: Content,
  seed: string,
  dynasty: DynastyKey = "trump",
): GameState {
  const firstEra = content.eras[0];
  if (!firstEra) throw new Error("Content has no eras");
  const birthYear = DYNASTY_START[dynasty];
  const activationFlag = DYNASTY_FLAG[dynasty];
  return {
    seed,
    eraIndex: 0,
    // Age is ALWAYS derived from the year (ageInYear) so it stays monotonic with
    // time. The first era opens in the dynastic-origins past (pre-1946), so the
    // protagonist's "age" starts negative — seeding 0 here would make the very
    // first transition look like age rewound from 0 to a negative value.
    age: ageInYear(firstEra.yearStart, birthYear),
    year: firstEra.yearStart,
    meters: initMeters(content.meters),
    personality: initPersonality(),
    // The dynasty-activation flag is set from the start so dynastyOf / slots /
    // character timelines resolve to this house from turn zero.
    flags: activationFlag ? [activationFlag] : [],
    firedEvents: [],
    eraEventCount: 0,
    lastEventYear: firstEra.yearStart,
    ripples: {},
    pending: [],
    firedConsequences: [],
    ledger: [],
    history: [],
    markets: initMarkets(content),
    ranks: initRanks(content),
    currencyId: "usd",
    end: null,
    dynasty,
    birthYear,
  };
}

/** Seed live market state from the content's market defs (index at base, out of position). */
export function initMarkets(content: Content): Record<string, MarketState> {
  const out: Record<string, MarketState> = {};
  for (const m of content.markets) {
    out[m.id] = {
      index: m.baseIndex,
      peakIndex: m.baseIndex,
      regime: m.regimes[0]?.id ?? "stable",
      regimeAge: 0,
      holding: 0,
      leverage: 1,
    };
  }
  return out;
}

/** Seed rank state at the bottom rung of every ladder. */
export function initRanks(content: Content): Record<string, RankState> {
  const out: Record<string, RankState> = {};
  for (const r of content.ranks) out[r.id] = { rung: 0, peak: 0 };
  return out;
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

/** Derive age from the current year relative to the dynasty's birth year (default: Trump 1946). */
export function ageInYear(year: number, birthYear = DYNASTY_START.trump): number {
  return year - birthYear;
}
