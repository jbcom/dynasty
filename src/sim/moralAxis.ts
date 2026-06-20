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
    "covenant_commonwealth",
    "covenant_commonwealth_flourishing",
    "charitable_ministry",
    "abundance_technocracy",
    "board_dissolved_utopian",
    "utopian_currents",
    "earth_healed",
    "rivalries_abolished",
  ],
  centrist: [
    "managed_oligopoly",
    "prosperity_grift",
    "soft_establishment",
    "managed_oligopoly_civil_religion",
    "stabilization_protocols",
  ],
  dictatorial: [
    "gilead_regime",
    "personality_cult",
    "company_serfdom",
    "autocratic_currents",
    "embraced_tyranny",
    "warlord_king",
    "axis_ascendant",
  ],
};

/** Whether the run carries any flag from a pole's set. */
function hasPole(flags: readonly string[], pole: MoralPole): boolean {
  return POLE_FLAGS[pole].some((f) => flags.includes(f));
}

/**
 * The moral pole this run occupies (within its branch's value system).
 * Explicit pole flags take precedence (dictatorial > utopian > centrist when
 * several are set — the darkest authored signal wins); else the personality
 * tyranny↔utopia axis decides.
 */
export function moralPoleOf(state: Pick<GameState, "flags" | "personality">): MoralPole {
  if (hasPole(state.flags, "dictatorial")) return "dictatorial";
  if (hasPole(state.flags, "utopian")) return "utopian";
  if (hasPole(state.flags, "centrist")) return "centrist";
  // No authored pole flag yet — read the personality axis (−100 utopia … +100 tyranny).
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
