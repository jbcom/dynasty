/**
 * SCOPE-DELINEATED GENAI QA (spec: docs/superpowers/specs/2026-06-22-scoped-qa-pipeline-design.md).
 *
 * The novel corpus is drafted by the bulk sweep; QA lifts it to frontier quality. The key design
 * judgment: errors live at three distinct IMPACT SCOPES, and each must be QA'd with exactly the
 * context its error class needs — a per-scene edit is blind to continuity and braid errors.
 *
 *   1. SCENE   — one scene's prose/sensory frame/choice quality.
 *   2. LINEAGE — one family's whole 6-act chain: cross-tier continuity (heirs, flags, motivator
 *                drift, consistent voice). May rewrite multiple scenes to repair a break.
 *   3. BRAID   — AUTHOR a pair-specific (wave×rival×tier) crossing. NOT a polish: the current
 *                crossing is a hardcoded template; this writes real intersection prose into the
 *                midpoint scene's thread[], which weaveThreads honors (no loader change).
 *
 * Every builder here is PURE (prompt strings only). The live client + validation gate
 * (validateSceneFile) are applied by the runner. Payloads are minified JSON — these acts are ~80%
 * prose, which no notation compresses (TOON was measured at −12%), so the compact win is per-scope
 * context, not format.
 */

import type { ActChapter, Scene, ThreadRef } from "../saga/schema";

const MOTIVATOR_AXES = "wealth, politics, worldview, power, tradition, honor, lineage, reach";

/** The naming/leak/sense rules every pass shares — the line is composed, referenced ONLY via tokens. */
const SHARED_RULES = [
  "- NEVER write a real person's name. The line is referenced ONLY via {surname} {given_name}",
  "  {full_name} {family_name}; everyone else is a role (your mother, a rival, the priest).",
  "- NEVER re-state WHEN or WHERE as if newly learned — onboarding already set the wave + era.",
  "- The sensory frame (`sense`) leads the prose; the reader feels the scene through that sense.",
  `- motivatorShift is over the 8 axes (${MOTIVATOR_AXES}), small +/- ints.`,
];

// ─────────────────────────────────────────────────────────────────────────────
// Pass 1 — SCENE polish
// ─────────────────────────────────────────────────────────────────────────────

/** System instruction for the scene-polish pass: deepen ONE scene, preserve its wiring exactly. */
export function scenePassSystem(): string {
  return [
    "You are the EDITOR of a literary dynasty NOVEL. You are given ONE scene, already drafted.",
    "Revise it to frontier literary quality: richer sensory prose, sharper period voice, choices",
    "that bite. You POLISH the writing — you do not change the plot or the wiring.",
    "PRESERVE EXACTLY (rejected if changed): the scene `id`, `sense`, `next`, `requires`, the",
    "number of beats, each beat's `choice` shape, and the `decision` tier + option count.",
    "`prose` stays an array of 2-4 FULL paragraphs (each many sentences) — deepen them.",
    ...SHARED_RULES,
    "Output STRICT JSON: the SAME single scene object, revised. No prose outside the JSON.",
  ].join("\n");
}

/** Build the scene-polish prompt: the scene + its act's register cues (title/macroAct). */
export function buildScenePassPrompt(
  scene: Scene,
  act: Pick<ActChapter, "title" | "macroAct">,
): string {
  return [
    `This scene belongs to the chapter "${act.title}" (${act.macroAct} macro-act).`,
    `Revise it. Keep every id/sense/next/beat/decision exactly; lift only the words.`,
    "",
    `SCENE JSON:`,
    JSON.stringify(scene),
    "",
    `Return ONLY the revised scene JSON object.`,
  ].join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// Pass 2 — LINEAGE continuity
// ─────────────────────────────────────────────────────────────────────────────

/** The lean continuity surface of one act-chain — spine + decision/flag/heir surface, not full prose. */
export interface LineageSurface {
  wave: string;
  archetype: string;
  cls: string;
  acts: Array<{
    id: string;
    tier: number;
    macroAct: string;
    title: string;
    scenes: Array<{
      id: string;
      decisionPrompt?: string;
      options?: Array<{ text: string; setFlags?: string[]; succession?: unknown }>;
      requires?: unknown;
      beatFlags?: string[][];
    }>;
  }>;
}

/** System instruction for the lineage pass: find cross-tier breaks, fix the WHOLE affected unit. */
export function lineagePassSystem(): string {
  return [
    "You are the CONTINUITY EDITOR of a multi-generation dynasty NOVEL. You are given one family's",
    "whole act-chain (six reach tiers, oldest first) as a lean spine: titles, decisions, the flags",
    "each choice sets, what later scenes require, and the succession beats.",
    "Find CROSS-TIER breaks: a choice in one tier that contradicts a later tier's premise; a flag",
    "set but never read (or required but never set); an heir/succession that doesn't follow; a voice",
    "or motivator drift that lurches between generations.",
    "Return a JSON object { breaks: [ { actId, sceneId, kind, detail, fix } ] } — `kind` one of",
    "'flag' | 'succession' | 'premise' | 'voice' | 'motivator'; `fix` a one-line instruction for",
    "the targeted re-author. Empty `breaks` means the chain is coherent. Report ONLY real breaks,",
    "not style nits (those are the scene pass's job). Output STRICT JSON, nothing else.",
  ].join("\n");
}

/** Build the lineage prompt from the lean surface of the family's chain. */
export function buildLineagePassPrompt(surface: LineageSurface): string {
  return [
    `A ${surface.cls}-class ${surface.archetype} family of the ${surface.wave} wave, six generations.`,
    `Audit the chain for cross-tier continuity breaks only.`,
    "",
    `CHAIN SPINE JSON:`,
    JSON.stringify(surface),
    "",
    `Return ONLY { "breaks": [...] }.`,
  ].join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// Pass 3 — BRAID authoring (cross-storyline)
// ─────────────────────────────────────────────────────────────────────────────

/** A crossing to author: this line meets a rival line at a tier, in a macro-act era. */
export interface BraidRequest {
  wave: string;
  waveLabel: string;
  rival: string;
  rivalLabel: string;
  tier: number;
  macroAct: string;
  /** The midpoint scene's existing prose, so the crossing is rooted in the actual chapter. */
  sceneOpening: string;
}

/** System instruction for the braid pass: author ONE pair-specific intersection sentence-to-paragraph. */
export function braidPassSystem(): string {
  return [
    "You author a CROSS-STORYLINE intersection in a dynasty NOVEL: the moment a DIFFERENT immigrant",
    "line's path cuts across the reader's, at a shared point in history. Write a SPECIFIC crossing",
    "for THESE TWO lines — a glance, a bargain, a rivalry, a debt — grounded in what both peoples",
    "were actually doing in this era. Not generic: it could only be these two lines, this tier.",
    "1-3 sentences, in the novel's voice. Also pick `relation`: 'opposing' | 'contributing' | 'neutral'.",
    ...SHARED_RULES,
    "Output STRICT JSON: { crossing: string, relation: string }. Nothing else.",
  ].join("\n");
}

/** Build the braid prompt for one (wave × rival × tier) pairing. */
export function buildBraidPassPrompt(req: BraidRequest): string {
  return [
    `Your line: the ${req.waveLabel} (${req.wave}) family. The crossing line: a ${req.rivalLabel}`,
    `(${req.rival}) family. They meet at reach tier ${req.tier} (${req.macroAct} macro-act).`,
    `The reader's chapter at this point opens:`,
    `"""`,
    req.sceneOpening.slice(0, 500),
    `"""`,
    `Author the intersection of these two specific lines here.`,
    "",
    `Return ONLY { "crossing": "...", "relation": "..." }.`,
  ].join("\n");
}

/** Apply an authored crossing to a midpoint scene's thread[], replacing any template entry. Pure. */
export function applyBraid(
  scene: Scene,
  rival: string,
  tier: number,
  authored: { crossing: string; relation?: string },
): Scene {
  const ref: ThreadRef = {
    wave: rival,
    atTier: tier,
    crossing: authored.crossing,
    ...(authored.relation ? { relation: authored.relation as ThreadRef["relation"] } : {}),
  };
  // Replace an existing ref to the same rival, else append.
  const thread = [...(scene.thread ?? []).filter((t) => t.wave !== rival), ref];
  return { ...scene, thread };
}

// ─────────────────────────────────────────────────────────────────────────────
// Pass 4 — SUCCESSION authoring (the dynastic fork at each generation's close)
// ─────────────────────────────────────────────────────────────────────────────

/** A close scene to give its generational decision: the family + the close prose to root it in. */
export interface SuccessionRequest {
  wave: string;
  waveLabel: string;
  archetype: string;
  tier: number;
  /** The close scene's prose, so the decision grows out of the actual ending. */
  closeProse: string;
}

/**
 * System instruction for the succession pass — author the CLOSE scene's terminal DECISION: the dynastic
 * fork that ends a generation. One option MUST take a partner + raise heirs (carrying the `succession`
 * effect that advances the line); the others are real alternatives (raise heirs alone, pour everything
 * into the work and let the line thin, etc.). This is the act's most consequential choice for the LINE.
 */
export function successionPassSystem(): string {
  return [
    "You author the closing DECISION of one generation's chapter in a dynasty NOVEL — the dynastic fork:",
    "does the line continue, and how? Return a `decision` with EXACTLY 3 options.",
    "EXACTLY ONE option must continue the line by taking a partner AND raising heirs — mark it with",
    "`succession: { takesPartner: true, begets: <1-3> }`. The other two are real alternatives that do NOT",
    "carry succession (e.g. raise heirs from an existing bond — `succession:{takesPartner:false,begets:1-2}`",
    "— or pour everything into the calling and let the line narrow — no `succession`). Each option has",
    "text + motivatorShift + setFlags; the decision has tier 'major' + a prompt. Options read as choices a",
    "reader weighs, in this family's voice — never mechanical ('take a wife' is wrong; make it lived).",
    ...SHARED_RULES,
    "Output STRICT JSON: { decision: { tier, prompt, options:[{text,motivatorShift,setFlags,succession?}] } }.",
  ].join("\n");
}

/** Build the succession prompt for one close scene. */
export function buildSuccessionPrompt(req: SuccessionRequest): string {
  return [
    `A ${req.archetype} family of the ${req.waveLabel} (${req.wave}) line, generation ${req.tier + 1}.`,
    `The generation's closing scene reads:`,
    `"""`,
    req.closeProse.slice(0, 600),
    `"""`,
    `Author the dynastic decision that ends this generation and hands (or doesn't) the line forward.`,
    "",
    `Return ONLY { "decision": { ... } }.`,
  ].join("\n");
}

/** Attach an authored decision to a close scene (replaces any existing). Pure. */
export function applySuccession(scene: Scene, decision: Scene["decision"]): Scene {
  return { ...scene, decision };
}
