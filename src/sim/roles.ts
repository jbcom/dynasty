import { type GameState, withFlag } from "./state";

/**
 * ROLE-SWAP INVARIANT (P7).
 *
 * Donald-as-president is NOT a required spine. Across every timeline — the
 * default world, the role-flip, even the eternal-Reich world — exactly ONE of
 * {Trump, Musk} ends up in American political leadership and the OTHER runs the
 * commercial empire. This module is the single place that enforces that
 * invariant so the butterfly/override system never collapses as branches
 * multiply: it reads the raw signals each arc emits and derives the canonical
 * role flags that endings and era gates consume.
 *
 * Pure and deterministic — safe inside applyChoice / replay.
 *
 * Canonical derived flags:
 *  - trump_political      Donald holds political power.
 *  - musk_political       Musk holds political power (the flip).
 *  - trump_commercial_path  Donald runs the empire instead of holding power.
 *  - musk_commercial_path   Musk runs the empire instead of holding power.
 *  - role_flip            The non-default assignment is active (Musk political).
 */

/** Raw signals that mean "Donald took the political road." */
const TRUMP_POLITICAL_SIGNALS = [
  "consolidated_power",
  "mandate_claimed",
  "dynasty_declared",
  "embraced_tyranny",
  "warlord_king",
  "earth_god_king",
];

/** Raw signals that mean "Donald chose the purely commercial road." */
const TRUMP_COMMERCIAL_SIGNALS = ["trump_commercial_path", "walked_away", "quiet_succession"];

/** Raw signal that Musk seized political power (from the Musk character-timeline). */
const MUSK_POLITICAL_SIGNAL = "musk_takes_power";

function hasAny(flags: readonly string[], signals: readonly string[]): boolean {
  return signals.some((s) => flags.includes(s));
}

/**
 * Resolve the {Trump, Musk} ⇄ {political, commercial} assignment from the raw
 * signals on `state` and stamp the canonical role flags. Mutual exclusion is
 * enforced: whoever is political forces the other commercial. If Musk takes
 * power, Donald is routed commercial regardless of his own political signals —
 * the flip wins, because there is only one Oval Office. Returns a new state.
 */
export function resolveRoles(state: GameState): GameState {
  const muskPolitical = state.flags.includes(MUSK_POLITICAL_SIGNAL);
  const trumpPoliticalSignal = hasAny(state.flags, TRUMP_POLITICAL_SIGNALS);
  const trumpCommercialSignal = hasAny(state.flags, TRUMP_COMMERCIAL_SIGNALS);

  // No role has resolved yet — leave the state untouched (early/childhood eras).
  if (!muskPolitical && !trumpPoliticalSignal && !trumpCommercialSignal) return state;

  // The flip wins: there is only one seat of power.
  const trumpPolitical = !muskPolitical && trumpPoliticalSignal;

  const toSet: string[] = [];
  if (trumpPolitical) {
    toSet.push("trump_political", "musk_commercial_path");
  } else if (muskPolitical) {
    toSet.push("musk_political", "trump_commercial_path", "role_flip");
  } else {
    // Donald explicitly chose commerce and no one else has taken power yet —
    // the seat is open, but Donald is committed to the empire.
    toSet.push("trump_commercial_path");
  }

  let flags = state.flags;
  for (const f of toSet) flags = withFlag(flags, f);
  return flags === state.flags ? state : { ...state, flags };
}
