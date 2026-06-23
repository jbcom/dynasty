/**
 * LIFE SEEDS (FS-7) — the diegetic EPOCH-0 birth composer for the ONE founding line.
 *
 * The founding-spine pivot collapses onboarding back toward the original Epoch-0 plan
 * ([[founding-spine-pivot]], [[novel-not-fragments]]): instead of picking a wave×class cell from a menu,
 * the player COMPOSES the founder as they grow from birth into a man/woman — given name, gender, class,
 * FIRST JOB, BEST FRIEND, LIFE PARTNER. Each choice is a story SEED: a flag the spine + trigger lattice
 * can read, plus a small motivator nudge that leans the line. This module is the PURE composer — it turns
 * those choices into the seed flags + motivator shifts founding stamps onto the run.
 *
 * Pure + deterministic — no DOM, no RNG, no Date. The choices come from the player; this maps them to data.
 */

import type { Motivators } from "../motivators";

/** The diegetic life-stage choices the player makes as the founder grows up (Epoch-0 birth). */
export interface LifeSeedChoices {
  /** The founder's first trade/work — leans the line's early economic character. */
  firstJob?: FirstJob;
  /** A formative friendship — leans loyalty/community vs. ambition. */
  bestFriend?: BestFriend;
  /** Whether/how the founder takes a life partner — seeds the first succession + lineage lean. */
  lifePartner?: LifePartner;
}

export type FirstJob =
  | "apprentice_tradesman" // a craft — tradition + a little wealth
  | "dock_laborer" // hard labor — honor + community (power−)
  | "shop_clerk" // commerce — wealth + reach
  | "farmhand" // the land — tradition + lineage
  | "printers_devil"; // letters/ideas — worldview + reach

export type BestFriend =
  | "a_loyal_equal" // community/loyalty — lineage + honor
  | "an_ambitious_rival" // a spur — power + wealth
  | "a_mentor_elder" // wisdom — tradition + worldview
  | "none"; // a solitary start — no nudge

export type LifePartner =
  | "marry_for_love" // lineage + honor
  | "marry_for_advantage" // wealth + power
  | "remain_unwed" // reach (the work over the line) — no succession lean
  | undefined;

/** Each seed choice → a small motivator nudge (the lean it gives the founding line). */
const JOB_LEAN: Record<FirstJob, Partial<Motivators>> = {
  apprentice_tradesman: { tradition: 8, wealth: 4 },
  dock_laborer: { honor: 8, power: -6 },
  shop_clerk: { wealth: 8, reach: 4 },
  farmhand: { tradition: 6, lineage: 6 },
  printers_devil: { worldview: 8, reach: 6 },
};
const FRIEND_LEAN: Record<BestFriend, Partial<Motivators>> = {
  a_loyal_equal: { lineage: 6, honor: 4 },
  an_ambitious_rival: { power: 6, wealth: 4 },
  a_mentor_elder: { tradition: 5, worldview: 5 },
  none: {},
};
const PARTNER_LEAN: Record<NonNullable<LifePartner>, Partial<Motivators>> = {
  marry_for_love: { lineage: 8, honor: 5 },
  marry_for_advantage: { wealth: 8, power: 5 },
  remain_unwed: { reach: 8 },
};

/** The seed FLAG a choice sets (so the spine/trigger lattice can read the founder's origin). */
export function seedFlags(choices: LifeSeedChoices): string[] {
  const flags: string[] = [];
  if (choices.firstJob) flags.push(`seed:job:${choices.firstJob}`);
  if (choices.bestFriend && choices.bestFriend !== "none")
    flags.push(`seed:friend:${choices.bestFriend}`);
  if (choices.lifePartner) flags.push(`seed:partner:${choices.lifePartner}`);
  return flags;
}

/** Sum the motivator nudges from all the life-seed choices (clamped −100..100 per axis). Pure. */
export function seedMotivatorShift(choices: LifeSeedChoices): Partial<Motivators> {
  const acc: Record<string, number> = {};
  const add = (lean: Partial<Motivators>): void => {
    for (const [k, v] of Object.entries(lean)) acc[k] = (acc[k] ?? 0) + (v as number);
  };
  if (choices.firstJob) add(JOB_LEAN[choices.firstJob]);
  if (choices.bestFriend) add(FRIEND_LEAN[choices.bestFriend]);
  if (choices.lifePartner) add(PARTNER_LEAN[choices.lifePartner]);
  for (const k of Object.keys(acc)) acc[k] = Math.max(-100, Math.min(100, acc[k]!));
  return acc as Partial<Motivators>;
}

/** Apply the life-seed leans onto a base motivator vector (the founder's starting tilt). Pure. */
export function applyLifeSeeds(base: Motivators, choices: LifeSeedChoices): Motivators {
  const shift = seedMotivatorShift(choices);
  const out = { ...base } as Record<string, number>;
  for (const [k, v] of Object.entries(shift)) {
    out[k] = Math.max(-100, Math.min(100, (out[k] ?? 0) + (v as number)));
  }
  return out as Motivators;
}

/** Whether the founder's life-partner choice carries the FIRST succession (seeds the line continuing). */
export function partnerSeedsSuccession(choices: LifeSeedChoices): boolean {
  return choices.lifePartner === "marry_for_love" || choices.lifePartner === "marry_for_advantage";
}
