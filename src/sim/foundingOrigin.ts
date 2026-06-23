/**
 * FOUNDING-ORIGIN RESOLVER (FS-ONB-DRIFT).
 *
 * The player FOUNDS the line at the 1776 American founding (the founding-spine pivot). This is the
 * deterministic core of the founding-era onboarding: a chosen (REGION × POWER BASE × STANDING) resolves
 * to the line's starting MOTIVATORS, its game ARCHETYPE coloring, the starting class RUNG, and the seed
 * FLAGS that color the spine. It REPLACES `waveSelect`'s role for the PLAYER — the immigration waves
 * remain only as the recurring CAST/braid fabric, no longer the player's origin.
 *
 * Grounded in docs/superpowers/specs/2026-06-22-founding-era-research.md: the six interlocking power
 * bases with LAND as substrate, the region economies/faiths, and capital-gated standing. Pure — no DOM,
 * no randomness; same selection → identical seed.
 */

import { initClassState } from "./classRung";
import { applyMotivators, initMotivators, type Motivators } from "./motivators";
import type { Archetype } from "./slots";

/** The three founding regions (Tidewater/backcountry is a South sub-split surfaced in copy + flags). */
export type FoundingRegion = "new_england" | "mid_atlantic" | "south";

/** The six interlocking founding-era power bases (research §4). LAND is the substrate under most. */
export type PowerBase = "land" | "commerce" | "pulpit" | "law" | "press" | "military";

/** Where the founder starts within their base: established (gentry/master) vs. rising (apprentice/yeoman). */
export type Standing = "established" | "rising";

export interface FoundingOriginChoice {
  region: FoundingRegion;
  base: PowerBase;
  standing: Standing;
}

export interface RegionDef {
  id: FoundingRegion;
  label: string;
  /** One-line evocative cue for the onboarding card (research-grounded). */
  blurb: string;
  /** The power bases that read as native to this region (offered first; all remain selectable). */
  nativeBases: readonly PowerBase[];
  /** Region-flavoring motivator nudge (faith/science, tradition/progress, insular/expansive). */
  motivators: Partial<Motivators>;
  /** Seed flags the region stamps for spine/branch coloring. */
  flags: readonly string[];
}

export interface PowerBaseDef {
  id: PowerBase;
  label: string;
  blurb: string;
  /** The game-archetype this base colors the one spine as (research bases → 6 archetypes). */
  archetype: Archetype;
  /** The base's signature motivator profile (the primary lever the choice grounds). */
  motivators: Partial<Motivators>;
  /** Seed flags the base stamps. */
  flags: readonly string[];
}

/** The three regions, with their researched economy/culture/faith and native bases. */
export const FOUNDING_REGIONS: readonly RegionDef[] = [
  {
    id: "new_england",
    label: "New England",
    blurb:
      "Town meeting and meetinghouse — Congregational order, rocky-soil family farms, and the cod-and-timber wharves of Boston and Newport.",
    nativeBases: ["pulpit", "commerce", "law"],
    // Faith-charged, education-minded, town-rooted.
    motivators: { worldview: -15, tradition: -10, honor: -10 },
    flags: ["region:new_england"],
  },
  {
    id: "mid_atlantic",
    label: "The Mid-Atlantic",
    blurb:
      "The Breadbasket — the most diverse colonies, Quaker tolerance, the great ports of Philadelphia and New York, and the Hudson's manor estates.",
    nativeBases: ["commerce", "press", "land"],
    // Pluralist, commercial, outward-facing.
    motivators: { reach: 15, tradition: 10, wealth: 10 },
    flags: ["region:mid_atlantic"],
  },
  {
    id: "south",
    label: "The South",
    blurb:
      "Tobacco, rice, and indigo worked by enslaved labor; an Anglican gentry on river plantations above a dissenting backcountry of Scots-Irish and German farms.",
    nativeBases: ["land", "law", "military"],
    // Land-and-honor, Anglican-traditional, hierarchical.
    motivators: { wealth: 15, honor: -10, lineage: 15, tradition: -10 },
    flags: ["region:south"],
  },
];

/** The six power bases, each with its archetype coloring + signature motivator profile. */
export const POWER_BASES: readonly PowerBaseDef[] = [
  {
    id: "land",
    label: "Land",
    blurb:
      "The master resource — acreage is wealth, rank, and the vote itself. A planter's estate or a yeoman's freehold, with western grants waiting to be surveyed.",
    archetype: "economic",
    motivators: { wealth: 30, lineage: 20, tradition: -15 },
    flags: ["base:land", "power:land"],
  },
  {
    id: "commerce",
    label: "Commerce",
    blurb:
      "The merchant house — warehouse, wharf, and credit under one family firm. With no banks, the great merchant IS the bank.",
    archetype: "economic",
    motivators: { wealth: 30, reach: 25, honor: 10 },
    flags: ["base:commerce", "power:commerce"],
  },
  {
    id: "pulpit",
    label: "The Pulpit",
    blurb:
      "Moral authority — the weekly sermon was the only regular public address, the minister often the only college man in town.",
    archetype: "religious",
    motivators: { worldview: -35, power: -15, honor: -20 },
    flags: ["base:pulpit", "power:pulpit"],
  },
  {
    id: "law",
    label: "Law & Politics",
    blurb:
      "The escalator into revolutionary leadership — read law under a practitioner, take a seat in the assembly, run the county court.",
    archetype: "political",
    motivators: { politics: 20, power: 25, honor: 15 },
    flags: ["base:law", "power:law"],
  },
  {
    id: "press",
    label: "The Press",
    blurb:
      "Printer, bookseller, postmaster — control of the public sphere, where a pamphlet can move a colony to revolution.",
    archetype: "entertainment",
    motivators: { reach: 30, worldview: 15, power: 10 },
    flags: ["base:press", "power:press"],
  },
  {
    id: "military",
    label: "The Sword",
    blurb:
      "A commission is a social title — militia colonel or Continental officer, war reputation that converts to bounty land and high office.",
    archetype: "athletic",
    motivators: { power: 30, honor: 20, lineage: 15 },
    flags: ["base:military", "power:military"],
  },
];

/** Established founders start a tier up; rising founders start at the bottom rung (capital-gated). */
export function startRungForStanding(standing: Standing): number {
  return standing === "established" ? 2 : 0;
}

/** Standing's motivator + wealth nudge: established = capital + lineage; rising = hunger. */
function standingMotivators(standing: Standing): Partial<Motivators> {
  return standing === "established"
    ? { wealth: 20, lineage: 10 }
    : { wealth: -25, power: 10, reach: 10 };
}

export function regionDef(id: FoundingRegion): RegionDef {
  const def = FOUNDING_REGIONS.find((r) => r.id === id);
  if (!def) throw new Error(`unknown founding region: ${id}`);
  return def;
}

export function powerBaseDef(id: PowerBase): PowerBaseDef {
  const def = POWER_BASES.find((b) => b.id === id);
  if (!def) throw new Error(`unknown power base: ${id}`);
  return def;
}

export interface FoundingStart {
  archetype: Archetype;
  motivators: Motivators;
  classState: ReturnType<typeof initClassState>;
  /** Seed flags (region + base + standing) for spine/branch coloring. */
  flags: string[];
}

/**
 * Resolve a (region × base × standing) selection to the founded starting context. The base sets the
 * archetype + primary motivator profile; the region flavors it; standing sets the starting rung + a
 * capital nudge. Pure + deterministic. Mirrors `resolveWaveStart`'s seam so the founding path drops in.
 */
export function resolveFoundingStart(choice: FoundingOriginChoice): FoundingStart {
  const region = regionDef(choice.region);
  const base = powerBaseDef(choice.base);
  let motivators = initMotivators();
  motivators = applyMotivators(motivators, base.motivators);
  motivators = applyMotivators(motivators, region.motivators);
  motivators = applyMotivators(motivators, standingMotivators(choice.standing));
  return {
    archetype: base.archetype,
    motivators,
    classState: initClassState(startRungForStanding(choice.standing)),
    flags: [...region.flags, ...base.flags, `standing:${choice.standing}`],
  };
}
