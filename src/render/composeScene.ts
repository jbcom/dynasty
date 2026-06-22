/**
 * COMPOSE SCENE (RB-8 step 2) — the PURE core of the caricature compositor. Given the run's identity
 * (archetype × class × era) + the scene's sense + the dominant motivator pole, it returns a SceneFrame
 * DESCRIPTOR: which portrait layers to stack, the era wash ramp, and the sense accent. No DOM, no
 * raster loading, no Date/random — SceneStage.svelte consumes the descriptor and does the actual
 * stacking. Deterministic: identical input → identical descriptor (verified by tests).
 *
 * Five render TRIGGERS share this core (see the design spec's use-case enumeration); they differ only
 * in the `variant` field of the input, which the descriptor reflects:
 *   - scene  : full player portrait + wash (the high-frequency path)
 *   - rival  : a reduced SILHOUETTE vignette, no wash (the glimpse strip)
 *   - ending : full portrait + an outcome overlay layer
 * Generation-turn and era-crossing are `scene` variants with changed identity (the FACE/wash differs);
 * the cross-fade is SceneStage's job, driven by the descriptor's `key`.
 */

import type { Sense } from "../sim/saga/schema";
import type { Archetype } from "../sim/slots";
import { accentForSense, type EraRamp, rampForEra } from "./palettes";

/** The class rung a story track belongs to (the corpus ships poor + middle tracks). */
export type RenderClass = "poor" | "middle";

/** The terminal outcome an ending frame overlays (mirrors convergence.ts resolutions). */
export type EndingOutcome = "stars" | "contributed" | "earthbound" | "extinguished";

/** What the compositor is asked to draw. `variant` selects the trigger; the rest is the identity. */
export interface SceneRenderInput {
  variant: "scene" | "rival" | "ending";
  archetype: Archetype;
  cls: RenderClass;
  /** A wave/period id or a macro-act title — anything carrying the era keywords rampForEra matches. */
  eraId: string;
  /** The scene's sensory frame; absent for rival vignettes (no scene of their own here). */
  sense?: Sense;
  /** The dominant motivator pole — drives the portrait's expression layer + the ending coloring. */
  pole?: string;
  /** The terminal outcome — required for `variant: "ending"`, ignored otherwise. */
  outcome?: EndingOutcome;
}

/** One stacked layer of the composed portrait — an asset id + its semantic role. */
export interface PortraitLayer {
  /** Asset id resolved against assets.json (kind: "portrait-layer"). */
  asset: string;
  role: "base" | "tier" | "mood" | "outcome";
}

/** The descriptor SceneStage renders: stacked layers + the wash + a change-key for cross-fades. */
export interface SceneFrame {
  layers: PortraitLayer[];
  /** The era wash ramp; null for rival vignettes (silhouettes carry no atmospheric wash). */
  wash: EraRamp | null;
  /** The sense accent layered over the wash; null when there's no sense (rival vignette). */
  accent: string | null;
  /** A stable identity key — when it changes, SceneStage cross-fades to the new frame. */
  key: string;
  /** True for the reduced rival silhouette (lower fidelity, no wash). */
  silhouette: boolean;
}

/** Normalize the dominant pole into a small mood token so the asset id space stays bounded. */
function moodFor(pole: string | undefined): string {
  // Poles are free-ish text ("ruthless", "devout", …); collapse to a slug for the asset id.
  return (
    (pole ?? "neutral")
      .toLowerCase()
      .replace(/[^a-z]+/g, "-")
      .replace(/^-|-$/g, "") || "neutral"
  );
}

/**
 * Compose the layered frame for a render request. The portrait is built from layers — base(archetype) +
 * tier(class) + mood(pole) — rather than a per-combination image, which keeps the asset count
 * shippable (see the design spec's option-B decision). The rival variant is a single silhouette layer
 * with no wash; the ending variant adds an outcome overlay.
 */
export function composeScene(input: SceneRenderInput): SceneFrame {
  const { variant, archetype, cls, eraId, sense, pole } = input;
  const mood = moodFor(pole);

  if (variant === "rival") {
    // Reduced fidelity: a single archetype silhouette, no class/mood/wash — the "other lines" read as
    // people without competing with the player's portrait.
    return {
      layers: [{ asset: `portrait/silhouette/${archetype}`, role: "base" }],
      wash: null,
      accent: null,
      key: `rival:${archetype}:${eraId}`,
      silhouette: true,
    };
  }

  const layers: PortraitLayer[] = [
    { asset: `portrait/base/${archetype}`, role: "base" },
    { asset: `portrait/tier/${cls}`, role: "tier" },
    { asset: `portrait/mood/${mood}`, role: "mood" },
  ];

  if (variant === "ending") {
    const outcome = input.outcome ?? "earthbound";
    layers.push({ asset: `portrait/outcome/${outcome}`, role: "outcome" });
    return {
      layers,
      wash: rampForEra(eraId),
      accent: sense ? accentForSense(sense) : null,
      key: `ending:${archetype}:${cls}:${outcome}:${eraId}`,
      silhouette: false,
    };
  }

  // The high-frequency scene path: full portrait + the era wash tinted by the scene's sense.
  return {
    layers,
    wash: rampForEra(eraId),
    accent: sense ? accentForSense(sense) : null,
    key: `scene:${archetype}:${cls}:${mood}:${eraId}:${sense ?? "none"}`,
    silhouette: false,
  };
}
