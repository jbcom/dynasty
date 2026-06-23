import type { GameState } from "./state";

/**
 * BRANCH RESOLUTION (alt-history consistency).
 *
 * A run follows one alternate-history BRANCH, determined by the divergent
 * starting hand chosen in Era 0 (and a couple of later overlays). The branch
 * key selects which variant of each backdrop timeline to load (usa.nazi.json
 * vs usa.default.json …), which terms/titles resolve (President vs
 * Reichskommissar …), and which real-history events are excluded.
 *
 * Pure and deterministic — derived purely from the run's flags.
 *
 * Backdrop branches are mutually exclusive (you are in exactly one history).
 * The role-flip is a SEPARATE overlay (Musk-as-leader) that threads through any
 * backdrop, so it is reported independently, not as a backdrop branch.
 */

/** The mutually-exclusive alternate-history backdrop a run inhabits. */
export type BranchKey =
  | "default"
  | "nazi"
  | "westcoast"
  | "theocracy"
  | "media"
  | "megachurch"
  | "oligarchy";

/**
 * Ordered branch detection: the first whose signature flag is present wins, so
 * a more-specific divergence takes precedence over the default. Each backdrop
 * is keyed off the Era-0 origin flags authored in origins.json.
 */
export const BRANCH_SIGNATURES: ReadonlyArray<{ key: BranchKey; anyOf: readonly string[] }> = [
  { key: "nazi", anyOf: ["axis_ascendant", "nazi_dynasty", "arrived_as_nazi"] },
  { key: "megachurch", anyOf: ["megachurch_dynasty", "televangelist_empire"] },
  { key: "theocracy", anyOf: ["evangelical_scion", "faith_to_power", "evangelical_origin"] },
  { key: "media", anyOf: ["pleasure_king", "media_dynasty", "vice_empire"] },
  { key: "oligarchy", anyOf: ["oligarch_dynasty", "corporate_state", "plutocracy"] },
  { key: "westcoast", anyOf: ["west_coast_origin", "west_coast_dynasty"] },
];

/** The alternate-history backdrop this run inhabits (default = our timeline). */
export function branchOf(state: Pick<GameState, "flags">): BranchKey {
  for (const sig of BRANCH_SIGNATURES) {
    if (sig.anyOf.some((f) => state.flags.includes(f))) return sig.key;
  }
  return "default";
}
