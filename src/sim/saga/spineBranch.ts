import type { BranchKey } from "../branch";
import type { Scene } from "./schema";

/**
 * SPINE → DESTINY BRANCH ON-RAMPS (FS-SPINE-BRANCH-ONRAMPS).
 *
 * Under the founding-spine pivot the player steers the ONE line toward a NAMED DESTINY by their spine
 * decisions; the alt-history BACKDROP (branch.ts BranchKey — which variant of the world the line is
 * shaping) must fork off those SPINE choices, not off the dead 1885 origins events that previously held
 * the only on-ramps. This module is the regen-safe bridge: a deterministic table mapping a spine
 * decision's own flag (the 98 authored `gN_*` flags in spine.act.json) to the branch SIGNATURE flag it
 * implies, plus a pure transform that stamps the signature flag onto any spine scene choice that already
 * sets the mapped path flag.
 *
 * Why a transform, not authored JSON: spine.act.json is GenAI-generated (regeneratable), so flags baked
 * into it would be lost on regen. Applying the map at load time (loadSaga) keeps the spine's own
 * vocabulary as the source of truth and the destiny on-ramps derived + stable. Pure, deterministic.
 */

/**
 * Spine-path flag → the destiny branch its choice steers toward. Conservative: only paths that clearly
 * express a destiny are mapped (a hedge/neutral venture stays branch-neutral). Each branch has several
 * on-ramps across generations so the destiny is reachable from more than one era's decision. This also
 * fixes the latent gap where `oligarchy` + `media_dynasty` were set NOWHERE (so those branches were
 * unreachable) — they now have authored spine on-ramps.
 */
export const SPINE_FLAG_TO_BRANCH: Readonly<Record<string, BranchKey>> = {
  // OLIGARCHY — concentrated capital, crushed labor, the corporate monolith / techno-feudal state.
  g3_crush_labor: "oligarchy",
  g3_land_sold_to_capital: "oligarchy",
  g3_law_built_the_trust: "oligarchy",
  g3_military_broke_the_strike: "oligarchy",
  g3_succession_corporate_monolith: "oligarchy",
  g4_sided_with_capital: "oligarchy",
  g4_industrial_baron: "oligarchy",
  g4_labor_crushed: "oligarchy",
  g6_commerce_lbo: "oligarchy",
  g6_succession_corporate: "oligarchy",
  g8_law_corporate_sovereignty: "oligarchy",
  g8_trust_succession: "oligarchy",
  g7_monopoly_secured: "oligarchy",
  doctrine_techno_feudal: "oligarchy",

  // MEDIA — the telecom/broadcast/multimedia empire, spectacle, the platform that shapes opinion.
  g3_press_yellow_journalism: "media",
  g5_press_safe_consensus: "media",
  g5_telecom_empire: "media",
  g6_bought_the_next_medium: "media",
  g6_cable_secured: "media",
  g6_multimedia_empire: "media",
  g6_platform_spectacle: "media",
  g6_truth_spectacle: "media",
  g6_tuned_in: "media",
  g6_exposed_government: "media",
  g6_succession_digital_pioneer: "media",
  g9_press_relay_monopoly: "media",

  // MEGACHURCH — sincerity-platform broadcast faith, the televangelist empire.
  g6_pulpit_televangelist: "megachurch",
  g6_pulpit_religious_right: "megachurch",
  g6_platform_sincerity: "megachurch",
  g7_pulpit_streamed_faith: "megachurch",
  g7_pulpit_networked_movement: "megachurch",

  // THEOCRACY — faith carried to power: the covenant path, the martyr/scholar faith successions.
  g0_pulpit_blessed_cause: "theocracy",
  g0_pulpit_defied_magistrates: "theocracy",
  g1_doctrine_faith: "theocracy",
  g1_pulpit_revival: "theocracy",
  g9_path_covenant: "theocracy",
  g9_pulpit_interstellar_creed: "theocracy",
  g9_pulpit_established_church: "theocracy",
  g1_succession_martyr: "theocracy",
  g0_succession_scholar: "theocracy",

  // NAZI / authoritarian state — the citadel doctrine, the manifest-state + conquest interstellar path,
  // the armed militia that seizes order.
  doctrine_state_citadel: "nazi",
  g7_doctrine_state: "nazi",
  g7_succession_state: "nazi",
  g9_law_empire: "nazi",
  g9_manifest_state: "nazi",
  g9_conquest: "nazi",
  g9_path_conquest: "nazi",
  armed_militia: "nazi",

  // WESTCOAST — the technologist/space frontier: the space race, satellites, the reach for the stars.
  g5_aerospace_pioneer: "westcoast",
  g4_focused_on_technology: "westcoast",
  g5_space_race: "westcoast",
  g6_succession_satellite: "westcoast",
  g6_satellite_pioneer: "westcoast",
  g8_committed_to_the_deep: "westcoast",
  g8_focused_on_stars: "westcoast",
  g8_orbital_succession: "westcoast",
  g8_colony_succession: "westcoast",
  g9_ordered_the_deep_jump: "westcoast",
};

/**
 * The branch SIGNATURE flag stamped for each branch — a canonical `anyOf` entry from branch.ts
 * BRANCH_SIGNATURES (the on-ramp flag branchOf detects; not necessarily the first listed). Kept in sync
 * with branch.ts (spineBranch.unit asserts each value resolves back to its key via branchOf).
 */
export const BRANCH_SIGNATURE_FLAG: Readonly<Record<BranchKey, string>> = {
  nazi: "axis_ascendant",
  megachurch: "megachurch_dynasty",
  theocracy: "evangelical_origin",
  media: "media_dynasty",
  oligarchy: "oligarch_dynasty",
  westcoast: "west_coast_origin",
  default: "", // no signature — the neutral fallback branch
};

/** The signature flag a spine-path flag implies, or undefined if the path is branch-neutral. */
export function branchSignatureForFlag(flag: string): string | undefined {
  const branch = SPINE_FLAG_TO_BRANCH[flag];
  if (!branch) return undefined;
  const sig = BRANCH_SIGNATURE_FLAG[branch];
  return sig.length > 0 ? sig : undefined;
}

/** Add any branch-signature flags implied by `setFlags`, without dropping or reordering the originals. */
function withBranchOnRamps(setFlags: readonly string[]): string[] {
  const out = [...setFlags];
  for (const f of setFlags) {
    const sig = branchSignatureForFlag(f);
    if (sig && !out.includes(sig)) out.push(sig);
  }
  return out;
}

/**
 * Stamp the destiny branch on-ramps onto a spine scene: any beat/decision-option whose `setFlags`
 * contains a mapped spine-path flag also gets the matching branch signature flag. Non-spine scenes (and
 * spine choices on branch-neutral paths) pass through unchanged. Pure — returns a new Scene.
 */
export function applySpineBranchOnRamps(scene: Scene): Scene {
  if (!scene.id.startsWith("spine:g")) return scene;
  // A beat's setFlags live on its optional `choice`; map those, leave choiceless beats untouched.
  const beats = scene.beats?.map((b) =>
    b.choice
      ? { ...b, choice: { ...b.choice, setFlags: withBranchOnRamps(b.choice.setFlags) } }
      : b,
  );
  const decision = scene.decision
    ? {
        ...scene.decision,
        options: scene.decision.options.map((o) => ({
          ...o,
          setFlags: withBranchOnRamps(o.setFlags),
        })),
      }
    : undefined;
  return {
    ...scene,
    ...(beats ? { beats } : {}),
    ...(decision ? { decision } : {}),
  };
}
