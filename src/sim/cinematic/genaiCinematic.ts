/**
 * GA-VIDEO (GV-1) — pure Veo prompts for the dynasty CINEMATICS. Short generated video set pieces that punctuate
 * the run: a generation-handoff "passing of the line", and the dynastic FINALE by its ending. Generated OFFLINE
 * (a Veo operation polled to an mp4) and cached as an asset, played at runtime via a <video> — no API at sim
 * runtime (sim purity). Reuses the era register (the visual layer's signature look) so the film coheres with
 * the portraits/dossiers. Spec: docs/.../genai-surface-audit + the directive GA-VIDEO item.
 *
 * Pure prompt strings + a stable key; the live Veo client + capture are the offline runner's job.
 */

import type { EraBand } from "../genai/portrait";

/** The cinematic flavors — when a film punctuates the run. */
export type CinematicKind =
  | "handoff" // a generation closes → the line passes to the heir (per era band)
  | "finale"; // the run ends → the dynastic close (per ending outcome)

/** The dynastic ending outcomes a finale cinematic can score (mirrors the convergence Destination union). */
export const FINALE_OUTCOMES = ["stars", "contributed", "earthbound", "extinguished"] as const;
export type FinaleOutcome = (typeof FINALE_OUTCOMES)[number];

/** The era register for a handoff film (period look + setting, cohesive with the portrait/dossier signature). */
const ERA_FILM: Record<EraBand, string> = {
  founding_1700s: "a late-1700s candle-lit colonial interior, the founding generation",
  federal_1800s: "an early-19th-century Federal parlor, oil-lamp light",
  industrial_late1800s: "a Gilded-Age hall of gaslight and dark wood",
  early_1900s: "an early-20th-century electric-lit room, the modern century dawning",
  midcentury: "a mid-century interior, clean lines and warm light",
  digital_modern: "a contemporary glass-and-screen interior",
  near_future: "a refined near-future interior, quiet high technology",
  stellar: "a stellar-age chamber with a window onto the colonized stars",
};

/** How each finale outcome looks (the dynastic close). */
const FINALE_FILM: Record<FinaleOutcome, string> = {
  stars:
    "a triumphant ascension among the stars — the line carried to the cosmos, luminous and vast",
  contributed:
    "a dignified legacy — the line's mark left on a world it helped shape, then passing the torch",
  earthbound: "a quiet endurance — the line holding its ground on Earth, neither risen nor fallen",
  extinguished: "a somber extinction — the last of the line, the name fading into the record",
};

/** The locked CINEMATIC STYLE — the engraving-chronicle signature in motion, cohesive with the still art. */
export const CINEMATIC_STYLE =
  "Shot like a moving plate in a dynastic chronicle: a muted, limited palette with a single gold-ochre and " +
  "oxblood accent, painterly and period-grounded, slow and stately camera. NO on-screen text, NO real-person " +
  "likeness, NO modern logos. A short, looping-friendly establishing moment — atmosphere, not a literal scene.";

/** The deterministic asset key for a cinematic (the mp4 stem the CinematicView loads). */
export function cinematicKey(kind: CinematicKind, tag: EraBand | FinaleOutcome): string {
  return `cinematic:${kind}:${tag}`;
}

/** Build the Veo prompt for a generation-HANDOFF film at an era band (GV-1). Pure. */
export function buildHandoffPrompt(eraBand: EraBand): string {
  return [
    `A short cinematic: the passing of a family line to its heir, in ${ERA_FILM[eraBand]}.`,
    "A wordless, atmospheric moment of succession — a hand, a hearth, a threshold; the weight of continuity.",
    CINEMATIC_STYLE,
  ].join(" ");
}

/** Build the Veo prompt for the dynastic FINALE film by its outcome (GV-1). Pure. */
export function buildFinalePrompt(outcome: FinaleOutcome): string {
  return [
    `A short cinematic: the close of a dynasty — ${FINALE_FILM[outcome]}.`,
    "Wordless and atmospheric, the whole arc of the line felt in one final image.",
    CINEMATIC_STYLE,
  ].join(" ");
}
