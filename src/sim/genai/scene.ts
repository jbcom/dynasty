/**
 * GENAI SCENE AUTHORING (Narrative Acts model) — the prompt + validation that flesh the SPINE's
 * scene slots into a page of the NOVEL. Given a cell (wave × class × archetype) and a reach tier, it
 * hands the model the act's ordered scene slots (sense + intent + which bear the tiered decisions) and
 * asks for multi-paragraph, sensory, in-voice prose with a weave of alternative beats and the tiered
 * decision options. The output is validated through the canonical `SagaFileSchema` (the real gate for
 * the novel model) plus a preset-person leak check — so a malformed act never reaches the corpus.
 *
 * Pure given the spine + content; the live Gemini client is injected by the runner.
 */

import type { Rung } from "../classRung";
import { SagaFileSchema } from "../saga/schema";
import type { Archetype } from "../slots";
import { type SceneSlot, spineFor } from "../spine";

/** The preset-person leak floor — identical to the events gate; the line is composed, never real. */
const LEAK = /\b(Donald|Trump|Drumpf|Elon|Musk|Kennedy|Fred(erick)?|Friedrich)\b/i;

/** A scene-generation request: which cell + tier's act to flesh. */
export interface SceneRequest {
  wave: string;
  cls: Rung;
  archetype: Archetype;
  tier: number;
}

/** The canonical act file a cell's scenes merge into — a family's novel lives together. */
export function sceneCanonicalFile(req: SceneRequest): string {
  return `src/data/saga/${req.wave}/${req.archetype}.act.json`;
}

/** The system instruction for novel authoring — voice, length, and the inviolable rules. */
export function sceneSystemInstruction(): string {
  return [
    "You author a literary dynasty NOVEL for a deterministic life-simulator. You write PROSE, not",
    "sentence fragments — immersive, sensory, period-accurate scenes a reader sinks into.",
    "ABSOLUTE RULES (output is rejected if violated):",
    "1. Each scene's `prose` is an array of 2-4 FULL paragraphs (each many sentences). Build the moment.",
    "2. The sensory frame (`sense`) leads the prose — the reader feels the scene through that sense.",
    "3. NEVER re-state WHEN or WHERE as if newly learned. The reader already knows the era and the",
    "   wave they founded. No 'you overhear the year', no 'you are an Irish immigrant in 1885'.",
    "4. NEVER write a real person's name (no Trump/Musk/Kennedy/etc.). The line is referenced ONLY via",
    "   the tokens {surname} {given_name} {full_name} {family_name}. Others are roles (your mother, a rival).",
    "5. Beats are ALTERNATIVES the reader picks between (ink weave) — each a short framing line + a",
    "   `choice` with a `motivatorShift` over the 8 axes (wealth/politics/worldview/power/tradition/",
    "   honor/lineage/reach, each a small +/- integer) and any `setFlags`. Gather:true (rejoin flow).",
    "6. A scene flagged for a decision carries a `decision` (tier major|secondary, a prompt, 2-3 options",
    "   each with text + motivatorShift + setFlags). The major decision is the act's pivotal fate-fork.",
    "7. Output STRICT JSON: a single object { acts:[ActChapter], scenes:[Scene] } matching the shape.",
  ].join("\n");
}

const MOTIVATOR_AXES = "wealth, politics, worldview, power, tradition, honor, lineage, reach";

/** Render one scene slot as an instruction block the model fills. */
function slotBlock(slot: SceneSlot, nextId: string | null): string {
  const lines = [
    `  - id "${slot.id}", sense "${slot.sense}": ${slot.intent}`,
    `    prose: 2-4 paragraphs. beats: 2 alternatives (framing line + choice w/ motivatorShift+setFlags).`,
  ];
  if (slot.decision) {
    lines.push(
      `    decision: tier "${slot.decision}" — prompt + ${slot.decision === "major" ? "3" : "2"} options (text+motivatorShift+setFlags).`,
    );
  }
  if (nextId) lines.push(`    next: "${nextId}".`);
  return lines.join("\n");
}

/** Build the user prompt for a cell's tier act: the act header + every scene slot to flesh. */
export function buildScenePrompt(req: SceneRequest): string {
  const act = spineFor({ wave: req.wave, cls: req.cls, archetype: req.archetype }).find(
    (a) => a.tier === req.tier,
  );
  if (!act) throw new Error(`no spine act for ${req.wave}/${req.archetype} tier ${req.tier}`);

  const slotBlocks = act.scenes
    .map((s, i) => slotBlock(s, act.scenes[i + 1]?.id ?? null))
    .join("\n");

  return [
    `Flesh this ACT into the novel. The line is a ${req.cls}-class ${req.archetype} family that founded`,
    `the ${req.wave} immigration wave. Reach tier ${req.tier} (${act.macroAct} macro-act).`,
    "",
    `Emit ONE act chapter and ITS scenes:`,
    `acts: [{ id:"${act.id}", wave:"${req.wave}", archetype:"${req.archetype}", tier:${req.tier},`,
    `  macroAct:"${act.macroAct}", title:"${act.title}", scenes:[${act.scenes.map((s) => `"${s.id}"`).join(", ")}] }]`,
    "",
    `scenes (in this order — each id EXACTLY as given):`,
    slotBlocks,
    "",
    `Motivator axes for every motivatorShift: ${MOTIVATOR_AXES}.`,
    `Return ONLY the JSON object { "acts": [...], "scenes": [...] }.`,
  ].join("\n");
}

/** Validate a generated act file through SagaFileSchema + the leak floor. Returns the parsed file or reasons. */
export function validateSceneFile(
  raw: unknown,
  req: SceneRequest,
): { ok: true; file: { acts: unknown[]; scenes: unknown[] } } | { ok: false; reasons: string[] } {
  const reasons: string[] = [];
  if (LEAK.test(JSON.stringify(raw))) reasons.push("preset-person leak");
  const parsed = SagaFileSchema.safeParse(raw);
  if (!parsed.success) {
    reasons.push(`schema: ${parsed.error.issues.map((i) => i.message).join("; ")}`);
    return { ok: false, reasons };
  }
  // The act id must match the requested cell+tier — the model must not relabel the act.
  const wantId = `act:${req.wave}:${req.archetype}:t${req.tier}`;
  if (!parsed.data.acts.some((a) => a.id === wantId))
    reasons.push(`act id mismatch (want ${wantId})`);
  if (reasons.length) return { ok: false, reasons };
  return { ok: true, file: parsed.data };
}

/** Merge a validated act file into the existing canonical file, dedup acts + scenes by id (new wins). */
export function mergeSceneFile(
  existing: unknown,
  fresh: { acts: unknown[]; scenes: unknown[] },
): unknown {
  const base = (existing && typeof existing === "object" ? existing : {}) as {
    acts?: unknown[];
    scenes?: unknown[];
    _comment?: string;
  };
  const mergeById = (old: unknown[] = [], add: unknown[] = []): unknown[] => {
    const addIds = new Set(add.map((x) => (x as { id?: string }).id));
    const kept = old.filter((x) => !addIds.has((x as { id?: string }).id));
    return [...kept, ...add];
  };
  return {
    ...(base._comment ? { _comment: base._comment } : {}),
    acts: mergeById(base.acts, fresh.acts),
    scenes: mergeById(base.scenes, fresh.scenes),
  };
}
