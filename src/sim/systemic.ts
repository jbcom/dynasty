import { branchOf } from "./branch";
import type { Content } from "./content";
import { applyDelta, type Meters } from "./meters";
import type { Rng } from "./rng";
import type { Currency, Market, MarketRegime, MeterId, RankLadder } from "./schema";
import type { GameState, MarketState, RankState } from "./state";

/**
 * SYSTEMIC TICK (SIM1) — the living substrate.
 *
 * A pure, deterministic step run once per elapsed in-world year inside
 * applyChoice. Markets walk (regime hazard → AR(1) price step → meter
 * transmission + housing cashflow), the active currency is resolved (firing a
 * redenomination when it changes), and rank ladders drip/amplify/bleed into the
 * meters. Replay from seed + history reconstructs every value to the bit — all
 * randomness flows through the passed rng.fork, never Math.random/Date.now.
 */

const COUPLING_METERS: MeterId[] = ["money", "power", "reputation", "loyalty", "health", "heat"];

function addDelta(into: Partial<Record<MeterId, number>>, from: Partial<Record<MeterId, number>>) {
  for (const m of COUPLING_METERS) {
    const v = from[m];
    // Use `!== undefined` (not truthiness) so a NaN from malformed content
    // propagates and surfaces as a broken meter rather than being silently
    // swallowed; 0 deltas are harmless to add.
    if (v !== undefined) into[m] = (into[m] ?? 0) + v;
  }
}

/** Pick the next regime id given the current one's hazard, modulated by age. */
function nextRegime(market: Market, ms: MarketState, rng: Rng): string {
  const regime = market.regimes.find((r) => r.id === ms.regime) ?? market.regimes[0];
  if (!regime) return ms.regime;
  const targets = Object.entries(regime.switchTo);
  if (targets.length === 0) return ms.regime;
  // Older regimes are likelier to flip: scale switch probs by regimeAge/dwell.
  const ageFactor = Math.min(2, (ms.regimeAge + 1) / Math.max(1, regime.dwell));
  let roll = rng.float(0, 1);
  for (const [to, p] of targets) {
    if (roll < p * ageFactor) return to;
    roll -= p * ageFactor;
  }
  return ms.regime;
}

/** One market's price step + meter transmission. Returns new state + delta. */
function tickMarket(
  market: Market,
  ms: MarketState,
  rng: Rng,
): { next: MarketState; delta: Partial<Record<MeterId, number>> } {
  const regimeId = nextRegime(market, ms, rng);
  const switched = regimeId !== ms.regime;
  const regime: MarketRegime | undefined =
    market.regimes.find((r) => r.id === regimeId) ?? market.regimes[0];
  if (!regime) {
    // A market with no regimes can't tick (schema forbids this, but stay safe).
    return { next: ms, delta: {} };
  }

  // AR(1) mean reversion toward the regime baseline + a bounded shock.
  const shock = rng.float(-1, 1) * regime.volatility;
  const pull = market.meanReversionK * (regime.baseline - ms.index);
  const rawIndex = ms.index + regime.drift * ms.index + pull + shock * ms.index;
  const index = Math.max(1, rawIndex);
  const peakIndex = Math.max(ms.peakIndex, index);

  const next: MarketState = {
    index,
    peakIndex,
    regime: regimeId,
    regimeAge: switched ? 0 : ms.regimeAge + 1,
    holding: ms.holding,
    leverage: ms.leverage,
  };

  // Meter transmission: the player's stake × index move × leverage × coupling.
  const ret = (index - ms.index) / ms.index;
  const delta: Partial<Record<MeterId, number>> = {};
  const stake = ms.holding * ms.leverage;
  for (const m of COUPLING_METERS) {
    const couple = market.coupling[m];
    if (!couple) continue;
    if (m === "money") {
      delta.money = (delta.money ?? 0) + stake * ret * couple;
    } else if (m === "heat") {
      // Overleverage in a drawdown draws scrutiny.
      const drawdown = 1 - index / peakIndex;
      delta.heat = (delta.heat ?? 0) + Math.max(0, ms.leverage - 1) * drawdown * couple;
    } else {
      delta[m] = (delta[m] ?? 0) + ret * couple;
    }
  }

  // Housing adds steady carry minus debt service (the dynasty's real engine).
  if (market.housing) {
    const h = market.housing;
    const carry = ms.holding * h.rentYield * (1 - h.vacancy) - ms.holding * h.debtService;
    delta.money = (delta.money ?? 0) + carry * (market.coupling.money ?? 1);
  }

  return { next, delta };
}

/** One rank ladder's passive effect: drip + fall-from-grace bleed. */
function tickRank(ladder: RankLadder, rs: RankState): Partial<Record<MeterId, number>> {
  const delta: Partial<Record<MeterId, number>> = {};
  addDelta(delta, ladder.drip);
  // Below the run's peak rung → fall-from-grace bleed.
  if (rs.rung < rs.peak) addDelta(delta, ladder.fallBleed);
  return delta;
}

/** The meter that drives each ladder's standing (rank tracks this meter). */
const RANK_DRIVER: Record<string, MeterId> = {
  social: "reputation",
  commercial: "money",
  religious: "loyalty",
  political: "power",
};

/**
 * Recompute a ladder's rung from its driving meter so ranks are not static.
 * The driver is mapped across the rung count by fixed thresholds; the run's
 * peak rung is tracked (never decreases) to feed the fall-from-grace bleed.
 * Pure + deterministic. Returns the updated RankState.
 */
function progressRank(ladder: RankLadder, rs: RankState, meters: Meters): RankState {
  const driver = RANK_DRIVER[ladder.id];
  const value = driver ? (meters[driver] ?? 0) : 0;
  const rungs = ladder.rungs.length;
  // commercial uses log-ish dollar bands; others use the 0..100-ish meter scale.
  let frac: number;
  if (ladder.id === "commercial") {
    // $0→rung0 … $1e9+→top, spread over orders of magnitude.
    frac = value <= 0 ? 0 : Math.min(1, Math.log10(value) / 9);
  } else {
    frac = Math.min(1, Math.max(0, value / 100));
  }
  const rung = Math.min(rungs - 1, Math.max(0, Math.round(frac * (rungs - 1))));
  return { rung, peak: Math.max(rs.peak, rung) };
}

/**
 * Resolve the active currency for a state: location flag > branch > year window
 * > usd default. Pure.
 */
export function resolveCurrency(content: Content, state: GameState): Currency {
  const branch = branchOf(state);
  const inYear = (c: Currency) =>
    (c.fromYear === undefined || state.year >= c.fromYear) &&
    (c.toYear === undefined || state.year <= c.toYear);

  // 1. Location override.
  const byLocation = content.currencies.filter(
    (c) => c.location && state.flags.includes(c.location) && inYear(c),
  );
  if (byLocation[0]) return byLocation[0];

  // 2. Branch lane, within the year window.
  const byBranch = content.currencies.filter(
    (c) => (c.branch ?? "default") === branch && inYear(c),
  );
  if (byBranch[0]) return byBranch[0];

  // 3. Default lane within window, else usd, else the first currency.
  const byDefault = content.currencies.filter(
    (c) => (c.branch ?? "default") === "default" && inYear(c),
  );
  return (
    byDefault[0] ??
    content.currencies.find((c) => c.id === "usd") ??
    content.currencies[0] ?? { id: "usd", symbol: "$", name: "US Dollar", conversionFactor: 1 }
  );
}

export interface SystemicResult {
  state: GameState;
  /** New flags emitted (currency change, market crash) for the event engine. */
  flags: string[];
}

/**
 * Run the systemic tick ONCE (one elapsed year). Caller loops it per elapsed
 * year on a multi-year timeline hop. Pure: deterministic in (content, state, rng).
 */
export function systemicTick(content: Content, state: GameState, rng: Rng): SystemicResult {
  if (
    content.markets.length === 0 &&
    content.ranks.length === 0 &&
    content.currencies.length === 0
  ) {
    return { state, flags: [] };
  }
  const totalDelta: Partial<Record<MeterId, number>> = {};
  const newFlags: string[] = [];
  const markets: Record<string, MarketState> = { ...state.markets };

  // Markets: each walks on its own deterministic stream.
  for (const market of content.markets) {
    const ms = state.markets[market.id];
    if (!ms) continue;
    const stream = rng.fork(`mkt:${market.id}:${state.year}:${state.history.length}`);
    const { next, delta } = tickMarket(market, ms, stream);
    markets[market.id] = next;
    addDelta(totalDelta, delta);
    // Crash flag when drawdown breaches the threshold (surfaces a crash event).
    if (next.index / next.peakIndex < market.crashThreshold) {
      newFlags.push(`mkt_crash_${market.id}`);
    }
  }

  // Ranks: passive drip + fall-from-grace bleed.
  for (const ladder of content.ranks) {
    const rs = state.ranks[ladder.id];
    if (!rs) continue;
    addDelta(totalDelta, tickRank(ladder, rs));
  }

  // HEAT decay: scandal cools over time (news cycles move on, cases settle), so
  // heat is a manageable pressure rather than a one-way accumulator. Small per
  // in-world year, and only while there is heat to bleed off.
  if (state.meters.heat > 0) {
    totalDelta.heat = (totalDelta.heat ?? 0) - 1.5;
  }

  // Currency: resolve + detect redenomination.
  let currencyId = state.currencyId;
  if (content.currencies.length > 0) {
    const cur = resolveCurrency(content, state);
    if (cur.id !== state.currencyId) {
      // Redenomination: rescale money by the conversion factor, flag it.
      const prevMoney = state.meters.money;
      const converted = prevMoney * cur.conversionFactor;
      totalDelta.money = (totalDelta.money ?? 0) + (converted - prevMoney);
      newFlags.push(`currency_changed_${cur.id}`);
      currencyId = cur.id;
    }
  }

  const meters = applyDelta(content.meters, state.meters, totalDelta);

  // Ranks PROGRESS from the (post-delta) meters so standing is not static —
  // each ladder tracks its driving meter; peak rung is retained for the bleed.
  const ranks: Record<string, RankState> = { ...state.ranks };
  for (const ladder of content.ranks) {
    const rs = state.ranks[ladder.id];
    if (rs) ranks[ladder.id] = progressRank(ladder, rs, meters);
  }

  const nextState: GameState = { ...state, meters, markets, ranks, currencyId };
  return { state: nextState, flags: newFlags };
}
