/**
 * PORTRAIT PROMPTS (VL-2) — the GenAI image pass for the founding-spine line's protagonist per generation.
 *
 * The visual layer ([[visual-layer-revival]]): a unique portrait per generation of the ONE dynasty,
 * generated via Imagen in a LOCKED SIGNATURE STYLE so every portrait coheres into the game's own polished
 * look (NOT cartoony, NOT procedural/hand-SVG). The style spec is reused verbatim in every prompt — the
 * single constraint that makes generated images read as one identity (the design doc's #1 lesson).
 *
 * Pure prompt strings only — the live image client is injected by the runner. Deterministic: the same
 * generation/era/gender → the same prompt → a stable cache key.
 */

import type { SpineAct } from "../saga/spineAuthored";
import {
  type LifeStage,
  type PortraitArchetype,
  type RungTier,
  wardrobeFor,
} from "./portraitFacets";

/**
 * THE SIGNATURE STYLE — a fixed period-engraving / aquatint ink-line look with a muted wash. Chosen
 * because it (a) spans 1776→far-future without breaking (reads as "the historical record of a life"),
 * (b) is GenAI-stable across eras (line + limited wash drifts less than painterly), (c) suits the
 * "book of your life" dynastic tone. Reused VERBATIM in every portrait + the map so all assets cohere.
 */
export const SIGNATURE_STYLE =
  "in the style of a fine 18th–19th century intaglio ENGRAVING / aquatint: precise ink crosshatch line " +
  "work over a muted limited wash, aged-parchment ground, deep ink shadows, a single restrained gold-ochre " +
  "and oxblood accent; the look of a printed plate in a dynastic chronicle. Cohesive, polished, period-" +
  "grounded but timeless. NOT cartoon, NOT 3D render, NOT photographic, NOT modern digital illustration.";

/** Negative direction folded into every prompt to hold the signature look. */
export const STYLE_NEGATIVE =
  "Avoid: cartoon, anime, cel-shading, 3D/CGI render, photo-realism, modern flat vector, watermark, text, " +
  "frame, signature, oversaturation.";

/**
 * EI-8a — the FINE era bands for portraits. The line runs 1776→the stars, and "a child in 1790 ≠ a child
 * in 1990 ≠ a child among the stars," so the visual register is sub-banded finer than the 4 `MacroAct`s.
 * Eight bands span the whole run; `eraBandForYear` maps the saga-clock year → band. Spec:
 * docs/superpowers/specs/2026-06-23-emergent-infancy-onboarding-design.md §"EI-8 — the portrait-demand MATRIX".
 */
export type EraBand =
  | "founding_1700s"
  | "federal_1800s"
  | "industrial_late1800s"
  | "early_1900s"
  | "midcentury"
  | "digital_modern"
  | "near_future"
  | "stellar";

/** Year → fine era band (ordered, inclusive upper bounds; the last band catches the far future). */
export const ERA_BANDS: ReadonlyArray<{ band: EraBand; to: number }> = [
  { band: "founding_1700s", to: 1799 },
  { band: "federal_1800s", to: 1859 },
  { band: "industrial_late1800s", to: 1899 },
  { band: "early_1900s", to: 1939 },
  { band: "midcentury", to: 1979 },
  { band: "digital_modern", to: 2040 },
  { band: "near_future", to: 2200 },
  { band: "stellar", to: Number.POSITIVE_INFINITY },
];

/** The fine era band a given saga-clock year falls in (EI-8a). Pure. */
export function eraBandForYear(year: number): EraBand {
  for (const b of ERA_BANDS) {
    if (year <= b.to) return b.band;
  }
  return "stellar";
}

/** The era's visual register (period dress + setting cue) by FINE era band — keeps the portrait era-true. */
const ERA_VISUAL: Record<EraBand, string> = {
  founding_1700s:
    "late-1700s American colonial dress (a founding generation): plain coat, cravat or shawl, " +
    "candle-lit interior",
  federal_1800s:
    "early-19th-century Federal/antebellum dress: tailcoat or empire-waist gown, an oil-lamp parlor",
  industrial_late1800s:
    "mid-to-late 1800s industrial-era dress: waistcoat or high-collared dress, gaslit hall",
  early_1900s:
    "early-20th-century dress (1900s–1930s): three-piece suit or drop-waist dress, an electric-lit interior",
  midcentury:
    "mid-century dress (1940s–1970s): sharp tailored suit or shift dress, a modern city interior",
  digital_modern:
    "late-20th / early-21st-century dress (1980s–2030s): contemporary tailoring, a glass-and-screen interior",
  near_future:
    "a near-future bearing (NOT chrome sci-fi): refined future formalwear of engraved, antique-instrument " +
    "quality, a quiet high-tech interior",
  stellar:
    "a retro-futurist far-future bearing among the stars (NOT chrome sci-fi): tailored future formalwear " +
    "with an engraved, antique-instrument quality, a stellar window beyond",
};

/**
 * Build the portrait prompt for one spine generation: the SIGNATURE STYLE + the era's visual register +
 * the protagonist's bearing (gender + the era's power character). A bust/half-figure, front or 3/4 — the
 * "historical-memory" framing that reads at small size (the Disco Elysium / Suzerain lesson).
 */
export function buildPortraitPrompt(act: SpineAct, gender: "male" | "female"): string {
  // EI-8a: resolve the FINE era band from the generation's in-world year (not the coarse macro-act).
  const era = ERA_VISUAL[eraBandForYear(act.year)];
  const subject = gender === "male" ? "a man" : "a woman";
  return [
    `A dignified BUST / half-figure PORTRAIT of ${subject}, ${era}.`,
    `Generation ${act.gen} of an American dynasty (${act.era}). A composed, weighty bearing — this is the`,
    `head of a family line at the height of its ${act.macroAct} chapter; let the face carry character`,
    `(resolve, cunning, or care), not a smile. Front or three-quarter view, plain dark ground.`,
    SIGNATURE_STYLE,
    STYLE_NEGATIVE,
  ].join(" ");
}

/** The deterministic asset key (and filename stem) for a generation's portrait. */
export function portraitKey(act: SpineAct, gender: "male" | "female"): string {
  return `spine_g${act.gen}_${gender}`;
}

/**
 * EI-8d — the COMPOSITE portrait facets: everything the demand matrix keys on. `buildCompositePortraitPrompt`
 * + `compositePortraitKey` generalize the gen×gender pair above to LIFE-STAGE × ERA-BAND × ARCHETYPE/WARDROBE
 * (+ rung tier) × gender (EI-8a/8b/8c). Spec: §"EI-8 — the portrait-demand MATRIX".
 */
export interface PortraitFacets {
  lifeStage: LifeStage;
  eraBand: EraBand;
  archetype: PortraitArchetype;
  rungTier: RungTier;
  gender: "male" | "female";
}

/** How each life stage reads in the bust framing (the wardrobe/bearing scales by stage, not just dress). */
const LIFE_STAGE_SUBJECT: Record<LifeStage, string> = {
  infant: "an infant",
  child: "a child",
  youth: "a youth",
  adult: "an adult",
  elder: "an elder",
};

/**
 * Build the portrait prompt for a full facet set (EI-8d): the SIGNATURE STYLE + the fine era register + the
 * life-stage subject + the archetype/rung WARDROBE. A bust/half-figure that reads at small size. The wardrobe
 * is muted for the youngest stages (an infant/child has no station yet) so the look stays period-true.
 */
export function buildCompositePortraitPrompt(f: PortraitFacets): string {
  const era = ERA_VISUAL[f.eraBand];
  const sex = f.gender === "male" ? "male" : "female";
  const subject = `${LIFE_STAGE_SUBJECT[f.lifeStage]} (${sex})`;
  // An infant/child wears no station yet — let dress read period-plain rather than imposing an adult calling.
  const stationed = f.lifeStage === "infant" || f.lifeStage === "child";
  const wardrobe = stationed
    ? "in plain period dress befitting the child of the household"
    : wardrobeFor(f.archetype, f.rungTier);
  return [
    `A dignified BUST / half-figure PORTRAIT of ${subject}, ${era}, ${wardrobe}.`,
    `A member of an American dynasty across the centuries. A composed bearing; let the face carry character`,
    `(resolve, cunning, or care), not a smile. Front or three-quarter view, plain dark ground.`,
    SIGNATURE_STYLE,
    STYLE_NEGATIVE,
  ].join(" ");
}

/**
 * The deterministic composite asset key (EI-8d): `portrait:<lifeStage>:<eraBand>:<archetype>:<rungTier>:<g>`.
 * Stable for a facet set → the same prompt → a reproducible cached asset (sim purity holds; gen is offline).
 */
export function compositePortraitKey(f: PortraitFacets): string {
  const g = f.gender === "male" ? "m" : "f";
  return `portrait:${f.lifeStage}:${f.eraBand}:${f.archetype}:${f.rungTier}:${g}`;
}

/**
 * EI-8d — an ENCOUNTER figure's portrait: a storyline person met across the centuries (first friend,
 * betrayer, partner, rival head, mentor, …). Keyed on their life-stage + the encounter's era band + a ROLE
 * token (not the line's archetype/rung) so they read as distinct people.
 */
export interface EncounterFacets {
  role: string;
  lifeStage: LifeStage;
  eraBand: EraBand;
  gender: "male" | "female";
}

/** Build the prompt for an encounter figure (EI-8d): era-true, age-true, and characterized by their role. */
export function buildEncounterPortraitPrompt(f: EncounterFacets): string {
  const era = ERA_VISUAL[f.eraBand];
  const sex = f.gender === "male" ? "male" : "female";
  const subject = `${LIFE_STAGE_SUBJECT[f.lifeStage]} (${sex})`;
  return [
    `A BUST / half-figure PORTRAIT of ${subject}, ${era}.`,
    `A distinct person encountered in a dynasty's story — their bearing reads as "${f.role}". A composed`,
    `face that carries character, not a smile. Front or three-quarter view, plain dark ground.`,
    SIGNATURE_STYLE,
    STYLE_NEGATIVE,
  ].join(" ");
}

/** The deterministic encounter asset key (EI-8d): `portrait:enc:<role>:<lifeStage>:<eraBand>:<g>`. */
export function encounterPortraitKey(f: EncounterFacets): string {
  const g = f.gender === "male" ? "m" : "f";
  // Normalize the role token so it's filesystem/key safe (lowercase, non-alnum → underscore).
  const role = f.role
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `portrait:enc:${role}:${f.lifeStage}:${f.eraBand}:${g}`;
}
