/**
 * VD-5 — the GenAI prompts for a dossier's BRIEF (path-voice analytical prose) and FIGURE (atmospheric art).
 * Pure prompt strings; the live Gemini text client + Imagen client are injected by the runner (the
 * portrait/scene pattern). Deterministic: the same (kind, eraBand, stateDigest) → the same prompt → a cached
 * brief/figure that replays. Spec: docs/superpowers/specs/2026-06-23-visual-dossiers-design.md.
 *
 * Sim purity holds — these are pure builders; the sim never calls a model. The runner resolves the keys
 * (dossierBriefKey / dossierFigureKey) through the on-demand cache, exactly like scenes + portraits.
 */

import type { EraBand } from "../genai/portrait";
import { SIGNATURE_STYLE, STYLE_NEGATIVE } from "../genai/portrait";
import type { PortraitArchetype } from "../genai/portraitFacets";
import type { DossierKind } from "./dossier";

/** The in-fiction VOICE + lens of each dossier kind (the analyst writing the briefing). */
const KIND_VOICE: Record<DossierKind, string> = {
  intelligence:
    "a hardened consigliere's INTELLIGENCE assessment — territory, rivals, threats, and leverage, cold and exact",
  rnd: "a visionary chief's R&D BRIEF — what is being built, the breakthroughs and the risks, forward-looking",
  portfolio:
    "a magnate's HOLDINGS & MARKET assessment — positions, exposure, the state of the race for capital",
  marketing:
    "a star's MARKETING & REACH read — the public's appetite, the name's reach, the next play for attention",
  warroom:
    "a statesman's WAR-ROOM brief — coalitions, debts, the contest for office and the levers of power",
  doctrine:
    "a prophet's DOCTRINE & FLOCK study — the faithful, the message, the schisms and the harvest of souls",
  scouting: "a champion's SCOUTING & PERFORMANCE report — form, rivals, the path to the title",
};

/** The era register for the brief (period framing so the assessment reads true to its time). */
const ERA_REGISTER: Record<EraBand, string> = {
  founding_1700s: "the late-1700s American founding",
  federal_1800s: "the early-19th-century republic",
  industrial_late1800s: "the Gilded Age",
  early_1900s: "the early 20th century",
  midcentury: "the mid-20th century",
  digital_modern: "the digital present",
  near_future: "the near future",
  stellar: "the post-scarcity star age",
};

/** A compact, model-facing digest of the run's state (passed into the prompt so the brief is about THIS run). */
export interface DossierState {
  familyName: string;
  rung: number; // 0..5, the line's standing
  topMeters: Array<{ label: string; value: number }>; // the salient meters
  rivalsLeading: number; // how many rival lines are above the player
  scarcity?: string; // EI-SCARCITY-STORIES: the post-scarcity stake, present only for far-future eras
}

/** The system instruction for dossier briefs — terse, in-voice, no leaks. */
export function dossierBriefSystem(): string {
  return [
    "You write a short in-world DOSSIER briefing for a dynasty life-sim — analytical, in the assessor's",
    "voice, 2-3 tight paragraphs. NOT a story; a briefing. Ground it in the supplied state.",
    "RULES: never write a real person's name; refer to the line only as {family_name}. No meta ('as an AI').",
    "Period-true to the era. Terse, concrete, scannable — this is a briefing, not prose.",
    "OUTPUT PLAIN PROSE ONLY: 2-3 paragraphs separated by a blank line. Do NOT wrap it in JSON, markdown,",
    "code fences, keys, or a header — return the paragraphs themselves and nothing else.",
  ].join("\n");
}

/**
 * Build the dossier BRIEF prompt (VD-5): the path voice + era register + the run's state digest, with the
 * far-future SCARCITY stake folded in when present (EI-SCARCITY-STORIES). Pure.
 */
export function buildDossierBriefPrompt(
  kind: DossierKind,
  eraBand: EraBand,
  state: DossierState,
): string {
  const meters = state.topMeters.map((m) => `${m.label} ${m.value}`).join(", ");
  return [
    `Write ${KIND_VOICE[kind]}, set in ${ERA_REGISTER[eraBand]}.`,
    `Subject: the {family_name} line — standing tier ${state.rung} of 5; ${state.rivalsLeading} rival lines lead it.`,
    `Salient indicators: ${meters}.`,
    state.scarcity
      ? `THE STAKE (make this the brief's spine, not mere wealth): ${state.scarcity}`
      : "",
    "2-3 tight paragraphs, in the assessor's voice, grounded in the above. A briefing, not a story.",
  ]
    .filter(Boolean)
    .join(" ");
}

/** The atmospheric FIGURE per dossier kind — what the generated art depicts (no people; a place/object/diagram). */
const KIND_FIGURE: Record<DossierKind, string> = {
  intelligence:
    "a surveillance-style overhead of a contested district — docks, alleys, marked territory — a redacted intel plate",
  rnd: "a workshop/laboratory bench of instruments, schematics and a half-built apparatus — an R&D plate",
  portfolio:
    "a counting-house / trading-floor of ledgers, ticker tape and strongboxes — a financial plate",
  marketing: "a hall of bills, marquees and a crowd's gaze — a publicity plate",
  warroom: "a war-room table of maps, markers and standards — a campaign plate",
  doctrine:
    "a meeting-hall / temple interior of pews, lecterns and gathered seats — a doctrinal plate",
  scouting: "an arena / training-ground of equipment, marks and the field — a performance plate",
};

/**
 * Build the dossier FIGURE prompt (VD-5): the kind's depicted scene + the era register, in the SIGNATURE
 * engraving style (cohesive with the portraits/map), NO people (it's a place/object plate, not a portrait).
 * Pure. The runner resolves this via the Imagen on-demand+cache (dossierFigureKey).
 */
export function buildDossierFigurePrompt(
  kind: DossierKind,
  eraBand: EraBand,
  // `archetype` is part of the figure KEY (1:1 with kind today) but the prompt derives purely from kind+era —
  // the establishing plate depicts the kind's setting, which the archetype already determines. Accepted so the
  // signature matches the keyed call site; if archetypes ever share a kind, vary the prompt on it here.
  _archetype: PortraitArchetype,
): string {
  return [
    `A wide establishing PLATE (NO people, no portrait): ${KIND_FIGURE[kind]}, set in ${ERA_REGISTER[eraBand]}.`,
    SIGNATURE_STYLE,
    STYLE_NEGATIVE,
    "Empty of figures — a place/object plate that frames a briefing.",
  ].join(" ");
}
