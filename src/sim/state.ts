import type { Content } from "./content";
import { initMeters, type Meters } from "./meters";
import { initPersonality, type Personality } from "./personality";
import type { Archetype } from "./slots";

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
  /** The power ARCHETYPE this run embodies — selects the Era-0 start + birth-year
   *  baseline + the no-leak content boundary (FD-3.5: replaces the literal dynasty
   *  key; a founded line's archetype comes from its start-moment). */
  archetype: Archetype;
  /** The protagonist/progenitor's birth year (founding year for a founded line). */
  birthYear: number;
  /**
   * The founder's birth MONTH + DAY (OB-4) — drawn from the seed at founding (chronology is
   * separate from the place geography). The year is `birthYear`; the doctor narrates the full
   * date in the Epoch-0 birth beat via the `{birth_date}` term. Optional for back-compat with
   * saves/fixtures that predate it.
   */
  birthDate?: { month: number; day: number };
  /**
   * FOUNDING metadata (FD-6) for a "found your own dynasty" run. Absent on the
   * preset-dynasty runs (they use the dynasty key). When present: the start-moment
   * id, the player's chosen surname, the cultural lane, and the founding place —
   * which FD-7 world-stacks + FD-8 birth mechanics key off. The 4 presets may also
   * carry these once routed through foundDynasty as shortcuts.
   */
  founding?: {
    momentId: string;
    surname: string;
    culture: string;
    place: string;
    /**
     * The composed origin (CP-R2): the era id, founding year, archetype, and
     * deep-history flag the run was founded with. Carried so a save reconstructs the
     * exact composition via foundByComposition — a synthesized `composed:<place>:<era>`
     * origin id has no start-moment to read these back from. Optional for back-compat
     * with moment-founded saves (fromSave falls back to the moment).
     */
    era?: string;
    year?: number;
    archetype?:
      | "economic"
      | "political"
      | "technological"
      | "religious"
      | "entertainment"
      | "athletic";
    deepHistory?: boolean;
    /** The founding CALLING id (CP-2) — a durable generational lens; optional. */
    calling?: string;
    /**
     * The progenitor's gender (CP-3) — drives the onomastic name pool, pronouns,
     * and (with `successionMode`) who inherits. Defaults to the moment's
     * progenitorSex when the player doesn't override at founding.
     */
    gender?: "male" | "female";
    /**
     * SUCCESSION MODE (CP-3): how the heir is chosen at a protagonist's death.
     * `absolute` = eldest child regardless of sex (default); `primogeniture` =
     * eldest son, then daughters; `matriarchal` = eldest daughter, then sons.
     */
    successionMode?: "absolute" | "primogeniture" | "matriarchal";
    /** Epoch-0 axis stances (CP-4): per-axis chosen option id. */
    axisChoices?: Partial<Record<"faith" | "ideology" | "sociology" | "tech", string>>;
  };
  /**
   * The LIVE family tree (FD-8) — the growing, mutable lineage of a founded run.
   * Absent until a line is founded (foundDynasty seeds the progenitor). Pure +
   * serializable; reconstructed bit-identically by replay. Births (beget),
   * deaths (FD-9), and succession (FD-10) all mutate this.
   */
  family?: FamilyState;
}

/** A living (or dead) member of the run's growing lineage (FD-8). */
export interface LiveMember {
  /** Deterministic id, minted as `m<seq>` in birth order. */
  id: string;
  given: string;
  surname: string;
  sex: "male" | "female";
  born: number;
  died?: number;
  /** Parent member id (the progenitor has none). */
  parentId?: string;
  /** Generation depth from the progenitor (progenitor = 0). */
  generation: number;
  /** Inherited-plus-varied trait vector (0..100), seeds personality/aptitude. */
  traits: { ambition: number; cunning: number; vigor: number; piety: number };
  /** True for the member the player currently steers. */
  isProtagonist: boolean;
}

/** The live lineage state for a founded run (FD-8). */
export interface FamilyState {
  members: LiveMember[];
  /** The member id the player currently controls. */
  protagonistId: string;
  /** Monotonic counter for minting deterministic member ids. */
  nextSeq: number;
  /**
   * The current protagonist's PARTNER member id (CP-5), if taken. A married-in
   * in-law (no parentId) whose traits blend into the next beget. Cleared on
   * succession so the new protagonist may take their own partner.
   */
  partnerId?: string;
}

/** Whether a member is alive as of `year` (single source of truth, FD-8/9/10). */
export function isMemberAlive(m: LiveMember, year: number): boolean {
  return m.died === undefined || m.died > year;
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

/**
 * Default progenitor birth year per ARCHETYPE — the baseline when a run is NOT
 * founded via a start-moment (a founded line overrides this with the moment's
 * year, see founding.ts). Anchored to the archetype's exemplar era so the modern
 * `origins` arc still opens correctly: economic 1946, political 1888,
 * technological 1971, religious 1918, entertainment 1946 (the spectacle/celebrity
 * line shares the postwar media-age baseline), athletic 1946 (the prowess→fame
 * line shares it too). CP-R-ARCH may refine these once their prologues are authored.
 */
export const ARCHETYPE_START: Record<Archetype, number> = {
  economic: 1946,
  political: 1888,
  technological: 1971,
  religious: 1918,
  entertainment: 1946,
  athletic: 1946,
};

/**
 * Flags seeded at run start per ARCHETYPE (activation flag + prologue gate) so the
 * matching prologue chain opens immediately. The literal `*_dynasty_active` /
 * `*_prologue` flag names are retained as the content's gate vocabulary (FD-3.5b
 * will rework the era prologue itself onto the founding flow); the economic
 * archetype is the default origins arc and seeds only its prologue flag.
 */
const ARCHETYPE_SEED_FLAGS: Record<Archetype, string[]> = {
  economic: ["trump_prologue"],
  political: ["kennedy_dynasty_active", "kennedy_prologue"],
  technological: ["musk_dynasty_active", "musk_prologue"],
  religious: ["religious_dynasty_active", "religious_prologue"],
  // CP-R-ARCH: the two new power bases seed their own activation + prologue gates,
  // in the same `*_dynasty_active` / `*_prologue` vocabulary the content gates on.
  entertainment: ["entertainment_dynasty_active", "entertainment_prologue"],
  athletic: ["athletic_dynasty_active", "athletic_prologue"],
};

/**
 * Create the initial state for a new run. A modern run begins in the `origins`
 * era; a founded line (FD-6) passes `startEra` to begin at its start-moment's era
 * (e.g. a deep-history "caliphate" prefix). The starting era is resolved BY ID,
 * not by array position, because deep-history eras sort ahead of `origins`
 * (negative order) and must not silently become every run's start.
 */
export function initState(
  content: Content,
  seed: string,
  archetype: Archetype = "economic",
  startEra = "origins",
): GameState {
  const startIndex = content.eras.findIndex((e) => e.id === startEra);
  const eraIndex = startIndex >= 0 ? startIndex : 0;
  const firstEra = content.eras[eraIndex];
  if (!firstEra) throw new Error("Content has no eras");
  const birthYear = ARCHETYPE_START[archetype];
  // Seed the archetype's flags (activation + prologue gate) so the prologue chain
  // opens immediately without needing an in-game selector to fire.
  const seedFlags = [...ARCHETYPE_SEED_FLAGS[archetype]].sort();
  return {
    seed,
    eraIndex,
    // Age is ALWAYS derived from the year (ageInYear) so it stays monotonic with
    // time. The first era opens in the dynastic-origins past (pre-1946), so the
    // protagonist's "age" starts negative — seeding 0 here would make the very
    // first transition look like age rewound from 0 to a negative value.
    age: ageInYear(firstEra.yearStart, birthYear),
    year: firstEra.yearStart,
    meters: initMeters(content.meters),
    personality: initPersonality(),
    flags: seedFlags,
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
    archetype,
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

/** Derive age from the current year relative to the progenitor's birth year (default: economic 1946). */
export function ageInYear(year: number, birthYear = ARCHETYPE_START.economic): number {
  return year - birthYear;
}
