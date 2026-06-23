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

/** The era's visual register (period dress + setting cue) by macro-act — keeps the portrait era-true. */
const ERA_VISUAL: Record<string, string> = {
  founding:
    "late-1700s American colonial dress (a founding generation): plain coat, cravat or shawl, " +
    "candle-lit interior",
  convergence:
    "mid-to-late 1800s industrial-era dress: waistcoat or high-collared dress, gaslit hall",
  emergence:
    "20th-century dress evolving with the decade (1900s suit/dress → mid-century), a city interior",
  ascension:
    "a retro-futurist far-future bearing (NOT chrome sci-fi): tailored future formalwear with an " +
    "engraved, antique-instrument quality, a stellar window beyond",
};

/**
 * Build the portrait prompt for one spine generation: the SIGNATURE STYLE + the era's visual register +
 * the protagonist's bearing (gender + the era's power character). A bust/half-figure, front or 3/4 — the
 * "historical-memory" framing that reads at small size (the Disco Elysium / Suzerain lesson).
 */
export function buildPortraitPrompt(act: SpineAct, gender: "male" | "female"): string {
  const era = ERA_VISUAL[act.macroAct] ?? ERA_VISUAL.founding;
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
