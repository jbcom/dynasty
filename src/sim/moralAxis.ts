import { branchOf } from "./branch";
import { tyrannyUtopiaAxis } from "./personality";
import type { GameState } from "./state";

/**
 * BRANCH MORAL AXIS (task-022).
 *
 * Each alternate-history backdrop offers UTOPIAN / CENTRIST / DICTATORIAL
 * sub-paths, and — crucially — "good vs bad" is BRANCH-RELATIVE: a Reich's
 * "utopia" is monstrous by our lights but coherent within its own value system.
 * This resolves which pole a run is on, so endings + the HUD can interrogate the
 * outcome in the branch's own terms rather than a single global good/bad scale.
 *
 * Resolution: pole FLAGS set by the branch pools win (they encode the branch's
 * own value system — e.g. covenant_commonwealth = the theocracy's utopia,
 * gilead_regime = its dictatorship). Absent an explicit pole flag, fall back to
 * the personality tyranny↔utopia axis. Pure + deterministic.
 */

export type MoralPole = "utopian" | "centrist" | "dictatorial";

/**
 * Pole flags by category. These are authored across the branch backdrop pools;
 * a run carrying one is on that pole within its branch's own value frame.
 */
const POLE_FLAGS: Record<MoralPole, readonly string[]> = {
  utopian: [
    // cross-branch
    "utopian_currents",
    "earth_healed",
    "rivalries_abolished",
    // theocracy
    "covenant_commonwealth",
    "covenant_commonwealth_flourishing",
    "covenant_commonwealth_theology",
    "communion_theology_pole",
    "crusade_communion_possible",
    // megachurch
    "charitable_ministry",
    "missionary_uplift",
    // oligarchy
    "abundance_technocracy",
    "board_dissolved_utopian",
    "interstellar_trade_commonwealth",
    // nazi (utopia in the Reich's own — monstrous — value system)
    "reich_america_utopian",
    "reich_utopian_pole",
    // media
    "media_utopian_pole",
    // westcoast
    "pole_utopian",
  ],
  centrist: [
    // oligarchy
    "managed_oligopoly",
    "managed_oligopoly_civil_religion",
    "stabilization_protocols",
    "monopoly_trade_regime",
    // megachurch
    "prosperity_grift",
    // theocracy
    "soft_establishment",
    "missionary_standoff_pole",
    "crusade_detente_possible",
    // nazi
    "reich_america_centrist",
    "reich_centrist_pole",
    // media
    "media_centrist_pole",
    // westcoast
    "pole_centrist",
  ],
  dictatorial: [
    // cross-branch
    "autocratic_currents",
    "embraced_tyranny",
    "warlord_king",
    // theocracy
    "gilead_regime",
    "theodicy_of_fire_pole",
    "crusade_genocide_possible",
    // megachurch
    "personality_cult",
    // oligarchy
    "company_serfdom",
    "alien_subjugation",
    // nazi (the conquest pole; NOT axis_ascendant, which only marks the branch)
    "reich_america_dictatorial",
    "reich_dictatorial_pole",
    "reich_interstellar_conquest",
    // media
    "media_dictatorial_pole",
    "propaganda_state",
    // westcoast
    "pole_dictatorial",
  ],
};

/** Whether the run carries any flag from a pole's set. */
function hasPole(flags: readonly string[], pole: MoralPole): boolean {
  return POLE_FLAGS[pole].some((f) => flags.includes(f));
}

/**
 * The moral pole this run occupies (within its branch's value system).
 *
 * Some deep-future events flag ALL THREE poles at once — those are MENUS of
 * available outcomes ("the three poles diverge from here"), not a resolution.
 * When every pole is flagged we ignore them and let the run's personality axis
 * pick the actual pole (so the menu doesn't lock everyone to dictatorial).
 * Otherwise an explicit single/dual pole flag wins (dictatorial > utopian >
 * centrist — the darkest committed signal); else personality decides.
 */
export function moralPoleOf(state: Pick<GameState, "flags" | "personality">): MoralPole {
  const u = hasPole(state.flags, "utopian");
  const c = hasPole(state.flags, "centrist");
  const d = hasPole(state.flags, "dictatorial");
  // A committed pole = some-but-not-all set. All three = an availability menu → defer.
  if (!(u && c && d)) {
    if (d) return "dictatorial";
    if (u) return "utopian";
    if (c) return "centrist";
  }
  // No committed pole (none set, or an all-three menu) — read the personality
  // axis (−100 utopia … +100 tyranny).
  const axis = tyrannyUtopiaAxis(state.personality);
  if (axis <= -40) return "utopian";
  if (axis >= 40) return "dictatorial";
  return "centrist";
}

/**
 * A branch-relative label for the pole, e.g. the theocracy's "utopian" pole is
 * "the Covenant Commonwealth", the Nazi's is "the New Order's perfected Reich".
 * Returned for HUD/ending copy; falls back to the generic pole name.
 */
export function moralPoleLabel(state: Pick<GameState, "flags" | "personality">): string {
  const branch = branchOf(state);
  const pole = moralPoleOf(state);
  const labels: Partial<Record<string, Record<MoralPole, string>>> = {
    nazi: {
      utopian: "the New Order perfected",
      centrist: "the administered Reich",
      dictatorial: "the iron Reich",
    },
    theocracy: {
      utopian: "the Covenant Commonwealth",
      centrist: "the established church-state",
      dictatorial: "Gilead",
    },
    oligarchy: {
      utopian: "post-scarcity abundance",
      centrist: "the managed oligopoly",
      dictatorial: "the company-town serfdom",
    },
    megachurch: {
      utopian: "the charitable ministry",
      centrist: "the prosperity empire",
      dictatorial: "the cult of personality",
    },
    media: {
      utopian: "the enlightened broadcast",
      centrist: "the spectacle machine",
      dictatorial: "the propaganda state",
    },
    westcoast: {
      utopian: "the Pacific techno-frontier commonwealth",
      centrist: "the managed Pacific republic",
      dictatorial: "the coastal tech-oligarch fiefdom",
    },
    default: {
      utopian: "a utopia",
      centrist: "the muddled middle",
      dictatorial: "a tyranny",
    },
  };
  return labels[branch]?.[pole] ?? pole;
}
