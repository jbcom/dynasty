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
  "Avoid: cartoon, anime, cel-shading, 3D/CGI render, modern flat vector, watermark, text, " +
  "frame, signature, oversaturation.";

/**
 * EI-8 PRESENTATION (user, 2026-06-23) — the COHESION wrapper for the composite portraits. Unlike the locked
 * engraving SIGNATURE_STYLE (used by the legacy spine portraits + the map), the composite portraits vary their
 * MEDIUM by era × station (a tintype keepsake vs a gilt-framed oil — see PRESENTATION). What holds the gallery
 * together instead is this shared "aged artifact in a dynastic chronicle" framing: a muted/limited palette with
 * one restrained gold-ochre + oxblood accent, keepsake framing, gentle age. The medium signals era+station; the
 * wrapper signals "one family's chronicle."
 */
export const CHRONICLE_WRAPPER =
  "Rendered as an AGED ARTIFACT in a dynastic chronicle: a muted, limited palette with a single restrained " +
  "gold-ochre and oxblood accent, gentle age and patina, keepsake/plate framing. Cohesive with a family's " +
  "kept record of its line. NOT cartoon, NOT cel-shaded, NOT a modern flat digital illustration.";

/**
 * The DIGITAL-era cohesion wrapper (EI-10): the aged-physical-plate framing of CHRONICLE_WRAPPER contradicts a
 * luminous holographic/volumetric capture, so the digital future LOW/MID cells use a wrapper that keeps the
 * gallery's palette + dynastic-record intent while ALLOWING projected light — cohesion without forcing a
 * physical-plate look. (The future HIGH cells are physical oils → they keep CHRONICLE_WRAPPER.)
 */
export const ARCHIVE_WRAPPER =
  "Catalogued in a dynastic ARCHIVE: a restrained, limited palette with a single gold-ochre and oxblood " +
  "accent, on a plain dark void ground — a softly GLOWING, weightless projected-light capture (not a printed " +
  "plate, not aged paper). Cohesive with a family's kept record of its line. NOT cartoon, NOT cel-shaded.";

/**
 * The CONTEMPORARY-screen wrapper (EI-9b): a digital-age PHOTO (a phone snapshot / clean digital capture) is
 * neither an aged physical plate nor a glowing hologram — forcing the chronicle plate made a casual modern
 * photo read as a mounted painting. This wrapper keeps the gallery's restrained palette + dynastic-record
 * intent but reads as a clean, screen-native digital PHOTOGRAPH (no plate, no aging, no projected glow).
 */
// NOTE (EI-9b): Imagen strongly associates "contemporary digital photo + a colored accent border" with a
// phone/device frame, and negative prompts ("no phone/device/screen") don't reliably override it. Rather than
// loop on prompt-fighting, the wrapper just asks for a plain present-day photograph on a neutral ground; the
// distinction we need (a CASUAL modern capture vs the aged formal plate / hologram) reads regardless. A later
// pass could post-crop the device frame if it bothers, but the era + casualness signal is intact.
export const SCREEN_WRAPPER =
  "A plain, candid present-day PHOTOGRAPH of the person on a neutral background in natural light, framed tight " +
  "on the bust, a restrained limited palette with a single gold-ochre and oxblood accent — a real modern photo, " +
  "NOT a printed plate, NOT aged paper, NOT a hologram, NOT a painting. Cohesive with a family's kept record. " +
  "NOT cartoon, NOT cel-shaded.";

/** Which media read as a glowing HOLOGRAPHIC capture (the projected-light future) — future low/mid cells. */
function isHologramCapture(eraBand: EraBand, tier: RungTier): boolean {
  return (eraBand === "near_future" || eraBand === "stellar") && tier !== "high";
}

/** Which media read as a clean contemporary digital PHOTO (no plate, no glow) — the digital-modern low/mid. */
function isScreenCapture(eraBand: EraBand, tier: RungTier): boolean {
  return eraBand === "digital_modern" && tier !== "high";
}

/** The cohesion wrapper for an (era × tier): hologram → archive, modern photo → screen, else the chronicle one. */
function wrapperFor(eraBand: EraBand, tier: RungTier): string {
  if (isHologramCapture(eraBand, tier)) return ARCHIVE_WRAPPER;
  if (isScreenCapture(eraBand, tier)) return SCREEN_WRAPPER;
  return CHRONICLE_WRAPPER;
}

/**
 * EI-8 PRESENTATION MEDIUM by (era band × rung tier) — the real (and, for the future, extrapolated) ARTIFACT a
 * person of that station and time would have had their likeness captured in. A miner's worn tintype of his wife
 * vs a robber baron's gilt-framed oil (the user's examples); carried forward with plausible future media
 * (volumetric captures, holographic state portraits). The medium itself reads station + era.
 */
const PRESENTATION: Record<EraBand, Record<RungTier, string>> = {
  founding_1700s: {
    low: "a rough graphite-and-charcoal sketch on coarse paper, a humble likeness",
    mid: "a modest ink-and-wash drawing",
    high: "a fine intaglio engraving or a small oil miniature, a commissioned likeness",
  },
  federal_1800s: {
    low: "a cut-paper silhouette profile, a cheap keepsake",
    mid: "a small watercolor portrait",
    high: "an oil portrait in a gilt frame, a statement of standing",
  },
  industrial_late1800s: {
    low: "a worn, hand-tinted tintype / carte-de-visite — a fortune-seeker's creased keepsake of home",
    mid: "a sepia cabinet-card photograph",
    high: "a commissioned gilt-framed oil painting, or a formal studio cabinet card of a Gilded-Age magnate",
  },
  early_1900s: {
    low: "a plain black-and-white snapshot, slightly faded",
    mid: "a black-and-white portrait photograph",
    high: "a formal studio photograph in a pressed-card mount",
  },
  midcentury: {
    low: "a small square Polaroid or an ID photo, a little worn",
    mid: "a color portrait photograph",
    high: "a polished color studio portrait",
  },
  digital_modern: {
    low: "a candid phone snapshot",
    mid: "a clean digital portrait photo",
    high: "a polished corporate headshot",
  },
  // SCARCITY INVERSION (user, 2026-06-23): in a post-scarcity digital future, captures are abundant and free,
  // so the EXTREME-wealth flex is a RARE PHYSICAL artifact — a real hand-painted oil on canvas, an anachronistic
  // luxury precisely because it can't be copied. Low/mid stay digital/holographic (the default, abundant medium);
  // high flips to physical, the Gilded-Age oil returning at the very top — now a far more extreme status symbol.
  near_future: {
    low: "a utilitarian GLOWING identity scan-capture, projected light, plainly lit",
    mid: "a luminous VOLUMETRIC portrait — a softly glowing projected-light capture floating free, clearly digital",
    high: "a RARE hand-painted oil portrait on real canvas — an anachronistic luxury in a digital age, a flex of wealth",
  },
  stellar: {
    low: "a worn archival HOLOGRAM-still, a faintly glowing projected image flickering with age",
    mid: "a clear luminous HOLOGRAPHIC portrait — a glowing projected-light capture, weightless and clearly not physical",
    high: "an extravagantly RARE physical oil painting on canvas, hand-made — in a post-scarcity star age the one thing that cannot be copied, the ultimate symbol of dynastic power",
  },
};

/** The presentation medium for an (era band × rung tier) — EI-8 (user). Pure. */
export function presentationFor(eraBand: EraBand, tier: RungTier): string {
  return PRESENTATION[eraBand][tier];
}

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

/** The 8 fine era bands in chronological order (the canonical sequence — reuse instead of re-listing them). */
export const ERA_BAND_ORDER: readonly EraBand[] = ERA_BANDS.map((b) => b.band);

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
 * Build the portrait prompt for a full facet set (EI-8d + the presentation axis): the PRESENTATION MEDIUM
 * (era × station — a tintype keepsake vs a gilt-framed oil) + the fine era register + the life-stage subject
 * + the archetype/rung WARDROBE, held together by the CHRONICLE_WRAPPER. A bust/half-figure that reads at
 * small size. The wardrobe is muted for the youngest stages (an infant/child has no station yet). The medium
 * itself signals who could afford what, when — and extrapolates into the future bands (volumetric/holographic).
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
  const presentation = presentationFor(f.eraBand, f.rungTier);
  return [
    // The MEDIUM leads — this is "${presentation}" OF a person, so the artifact reads era + station first.
    `${presentation.charAt(0).toUpperCase()}${presentation.slice(1)} — a BUST / half-figure likeness of ${subject}, ${era}, ${wardrobe}.`,
    `A member of an American dynasty across the centuries. A composed bearing; let the face carry character`,
    `(resolve, cunning, or care), not a smile. Front or three-quarter view, plain ground.`,
    wrapperFor(f.eraBand, f.rungTier),
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

/** Build the prompt for an encounter figure (EI-8d): era-true, age-true, and characterized by their role. The
 *  presentation medium tracks the era at a middling station (an encountered person's standing isn't tracked). */
export function buildEncounterPortraitPrompt(f: EncounterFacets): string {
  const era = ERA_VISUAL[f.eraBand];
  const sex = f.gender === "male" ? "male" : "female";
  const subject = `${LIFE_STAGE_SUBJECT[f.lifeStage]} (${sex})`;
  const presentation = presentationFor(f.eraBand, "mid");
  return [
    `${presentation.charAt(0).toUpperCase()}${presentation.slice(1)} — a BUST / half-figure likeness of ${subject}, ${era}.`,
    `A distinct person encountered in a dynasty's story — their bearing reads as "${f.role}". A composed`,
    `face that carries character, not a smile. Front or three-quarter view, plain ground.`,
    wrapperFor(f.eraBand, "mid"),
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
