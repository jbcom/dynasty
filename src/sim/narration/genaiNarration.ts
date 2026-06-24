/**
 * GA-TTS (GT-1) — pure prompts + voice config for the period-voice NARRATION of the saga's key beats. A short
 * TTS read frames the line's bookends in an era-true voice: the FOUNDING (the line begins) and the FINALE (the
 * line closes). The narration is the atmospheric, run-independent FRAMING (not the run's specific name/numbers,
 * which the UI shows) — so, like the dossier brief, it's keyed beat×era and GENERATED OFFLINE (Gemini TTS → a
 * cached .wav), never synthesized at sim runtime (sim purity). Spec: docs/.../genai-surface-audit + GA-TTS.
 *
 * Pure narration text + a stable key + a voice name; the live TTS client + offline runner do the synthesis.
 */

import type { EraBand } from "../genai/portrait";
import { ERA_BAND_ORDER } from "../genai/portrait";

/** The beats that carry a period-voice read — the line's emotional bookends. */
export type NarrationBeat = "founding" | "finale";

/** Every (beat × era) pairing the offline runner sweeps. */
export const NARRATION_BEATS: readonly NarrationBeat[] = ["founding", "finale"];

/**
 * The prebuilt Gemini voice per era band — the read's register shifts across the centuries: a grave, weathered
 * founding voice → a clear modern voice → a cool, composed far-future voice. (Gemini prebuilt voice names.)
 */
const ERA_VOICE: Record<EraBand, string> = {
  founding_1700s: "Charon", // grave, weathered — a colonial chronicler
  federal_1800s: "Charon",
  industrial_late1800s: "Algenib", // resonant, formal — a Gilded-Age orator
  early_1900s: "Algenib",
  midcentury: "Kore", // warm, clear — a mid-century broadcaster
  digital_modern: "Kore",
  near_future: "Aoede", // bright, measured — a near-future register
  stellar: "Aoede", // cool, composed — the star-age voice
};

/** The narration LINE per beat × era — the framing read (run-independent; the UI carries the specific name). */
const BEAT_LINE: Record<NarrationBeat, Record<EraBand, string>> = {
  founding: {
    founding_1700s:
      "From nothing but a name and a will, a line begins — in a raw new country, under a wide and uncertain sky.",
    federal_1800s:
      "A young republic, a young line. The first hands take hold of a future no one has yet mapped.",
    industrial_late1800s:
      "In an age of smoke and fortune, a line is founded — ambition its only inheritance.",
    early_1900s:
      "A new century opens, and with it a new line — built for the modern world being born.",
    midcentury: "In the long bright afternoon of the century, a line begins its climb.",
    digital_modern: "In a world remade by the screen, a line is founded — its name not yet known.",
    near_future:
      "On the threshold of what comes next, a line begins — reaching already past the Earth.",
    stellar: "Among the stars, a line is founded anew — the oldest story, written on a wider sky.",
  },
  finale: {
    founding_1700s:
      "And so the first chapter closes — the line not ended, only beginning to be told.",
    federal_1800s: "The early years pass into memory, and the line carries on toward its horizon.",
    industrial_late1800s:
      "The gilded age fades; what the line built outlasts the men who built it.",
    early_1900s: "The modern century takes its measure of the line, and finds it not yet finished.",
    midcentury: "The afternoon lengthens; the line's long arc bends on toward the stars.",
    digital_modern: "The screen goes dark on this age — the line's story streaming on past it.",
    near_future: "Earth falls away behind the line, and the real distance begins.",
    stellar:
      "The line reaches its farthest light — and the chronicle, at last, rests among the stars.",
  },
};

/** The deterministic key for a beat's narration asset (the .wav stem the player loads). */
export function narrationKey(beat: NarrationBeat, eraBand: EraBand): string {
  return `narration:${beat}:${eraBand}`;
}

/** The era-true narration text for a beat × era (GT-1). Pure. */
export function narrationText(beat: NarrationBeat, eraBand: EraBand): string {
  return BEAT_LINE[beat][eraBand];
}

/** The prebuilt Gemini voice name for an era band (GT-1). Pure. */
export function narrationVoice(eraBand: EraBand): string {
  return ERA_VOICE[eraBand];
}

/** Every narration job (key + text + voice) — the offline runner's default full set. Pure. */
export function allNarrationJobs(): Array<{
  beat: NarrationBeat;
  eraBand: EraBand;
  key: string;
  text: string;
  voice: string;
}> {
  return NARRATION_BEATS.flatMap((beat) =>
    ERA_BAND_ORDER.map((eraBand) => ({
      beat,
      eraBand,
      key: narrationKey(beat, eraBand),
      text: narrationText(beat, eraBand),
      voice: narrationVoice(eraBand),
    })),
  );
}
