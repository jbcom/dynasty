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
import { hasPresetLeak } from "../leak";
import { SagaFileSchema } from "../saga/schema";
import type { Archetype } from "../slots";
import { type SceneSlot, spineFor } from "../spine";

/** A scene-generation request: which cell + tier's act to flesh. */
export interface SceneRequest {
  wave: string;
  cls: Rung;
  archetype: Archetype;
  tier: number;
}

/** The canonical act file a cell's scenes merge into — one file per wave×archetype×CLASS track. */
export function sceneCanonicalFile(req: SceneRequest): string {
  return `src/data/saga/${req.wave}/${req.archetype}.${req.cls}.act.json`;
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
    "5. Beats are ALTERNATIVES the reader picks between (ink weave). Each beat is",
    '   { prose: ["one framing sentence"], choice: { text, motivatorShift, setFlags, gather:true } }.',
    "   The beat's framing goes in `prose` (an ARRAY of strings), NOT a `line` field. motivatorShift is",
    "   over the 8 axes (wealth/politics/worldview/power/tradition/honor/lineage/reach), small +/- ints.",
    "6. A scene flagged for a decision carries a `decision` (tier major|secondary, a prompt, 2-3 options",
    "   each with text + motivatorShift + setFlags). The major decision is the act's pivotal fate-fork.",
    "7. Output STRICT JSON: a single object { acts:[ActChapter], scenes:[Scene] } matching the shape.",
  ].join("\n");
}

const MOTIVATOR_AXES = "wealth, politics, worldview, power, tradition, honor, lineage, reach";

/** Roman numeral for a reach tier (0→I … 5→VI), for the "Act <N> — …" title prefix. */
function ROMAN_FOR(tier: number): string {
  return ["I", "II", "III", "IV", "V", "VI"][tier] ?? "I";
}

/** Render one scene slot as an instruction block the model fills. */
function slotBlock(slot: SceneSlot, nextId: string | null): string {
  const lines = [
    `  - id "${slot.id}", sense "${slot.sense}": ${slot.intent}`,
    `    prose: 2-4 paragraphs. beats: 2 alternatives, each { prose:["framing sentence"], choice:{text,motivatorShift,setFlags,gather:true} }.`,
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

  // Strip the generic "Act N — " prefix to leave just the register cue (e.g. "The Crossing").
  const titleCue = act.title.replace(/^Act\s+[IVX]+\s+—\s+/, "");
  return [
    `Flesh this ACT into the novel. The line is a ${req.cls}-class ${req.archetype} family that founded`,
    `the ${req.wave} immigration wave. Reach tier ${req.tier} (${act.macroAct} macro-act).`,
    "",
    `TITLE: author a DISTINCT, evocative chapter title SPECIFIC to THIS family's story this generation`,
    `(this is the MESO level — a named chapter, not the macro span). Use "${titleCue}" only as a`,
    `register/theme cue — do NOT copy it; write a fresh title that could only belong to this ${req.wave}`,
    `${req.archetype} ${req.cls} line. Keep the "Act ${ROMAN_FOR(req.tier)} — " prefix, e.g.`,
    `"Act ${ROMAN_FOR(req.tier)} — <your specific chapter title>".`,
    "",
    `Emit ONE act chapter and ITS scenes:`,
    `acts: [{ id:"${act.id}", wave:"${req.wave}", archetype:"${req.archetype}", cls:"${req.cls}", tier:${req.tier},`,
    `  macroAct:"${act.macroAct}", title:"Act ${ROMAN_FOR(req.tier)} — <specific chapter title>", scenes:[${act.scenes.map((s) => `"${s.id}"`).join(", ")}] }]`,
    "",
    `scenes (in this order — each id EXACTLY as given):`,
    slotBlocks,
    "",
    `Motivator axes for every motivatorShift: ${MOTIVATOR_AXES}.`,
    `Return ONLY the JSON object { "acts": [...], "scenes": [...] }.`,
  ].join("\n");
}

/**
 * Coerce an object-with-sequential-numeric-keys ({"0":x,"1":y}) into an array — a recurring Gemini
 * drift where it emits a JSON object instead of a JSON array for `prose`/`beats`/`options`. A real
 * string or array passes through untouched (string→[string] is handled by callers). Pure.
 */
function asArray(v: unknown): unknown {
  if (Array.isArray(v)) return v;
  if (v && typeof v === "object") {
    const keys = Object.keys(v as Record<string, unknown>);
    if (keys.length > 0 && keys.every((k) => /^\d+$/.test(k))) {
      return keys
        .sort((a, b) => Number(a) - Number(b))
        .map((k) => (v as Record<string, unknown>)[k]);
    }
  }
  return v;
}

/**
 * Coerce common, harmless model drift into the canonical shape BEFORE schema validation:
 *   - a beat's framing as `line: "…"` (a string) → `prose: ["…"]` (the array the schema wants).
 *   - a bare-string `prose` → `["…"]`.
 *   - an object-with-numeric-keys for `prose` / `beats` / `decision.options` → an array.
 * Anything it can't normalize is left for the schema to reject. Pure; clones, never mutates input.
 */
export function normalizeSceneFile(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const obj = raw as { scenes?: unknown[]; [k: string]: unknown };
  const scenesArr = asArray(obj.scenes);
  if (!Array.isArray(scenesArr)) return raw;
  // Coerce a `choice`/option object's `setFlags` from an object-with-numeric-keys back to an array
  // (the same Gemini drift `asArray` handles for prose/beats); a real array passes through.
  const fixFlags = (c: unknown): unknown => {
    if (!c || typeof c !== "object") return c;
    const obj2 = { ...(c as Record<string, unknown>) };
    if (obj2.setFlags !== undefined) obj2.setFlags = asArray(obj2.setFlags);
    return obj2;
  };
  const fixBeat = (b: unknown): unknown => {
    if (!b || typeof b !== "object") return b;
    const beat = { ...(b as Record<string, unknown>) };
    if (beat.prose === undefined && typeof beat.line === "string") beat.prose = [beat.line];
    if (typeof beat.prose === "string") beat.prose = [beat.prose];
    else beat.prose = asArray(beat.prose);
    if (beat.choice) beat.choice = fixFlags(beat.choice);
    delete beat.line;
    return beat;
  };
  const scenes = scenesArr.map((s) => {
    if (!s || typeof s !== "object") return s;
    const scene = { ...(s as Record<string, unknown>) };
    if (typeof scene.prose === "string") scene.prose = [scene.prose];
    else scene.prose = asArray(scene.prose);
    const beats = asArray(scene.beats);
    if (Array.isArray(beats)) scene.beats = beats.map(fixBeat);
    if (scene.decision && typeof scene.decision === "object") {
      const dec = { ...(scene.decision as Record<string, unknown>) };
      const opts = asArray(dec.options);
      dec.options = Array.isArray(opts) ? opts.map(fixFlags) : opts;
      scene.decision = dec;
    }
    return scene;
  });
  // Strip markdown the model sometimes wraps around identity tokens (`{surname}` → {surname}); it would
  // otherwise render as literal backticks in the reader. Deep-applied to every string in the file.
  return stripTokenBackticks({ ...obj, scenes });
}

/** A run of identity tokens / spaces wrapped in backticks — a recurring model markdown artifact. */
const TOKEN_BACKTICKS = /`((?:\{[a-z_]+\}|\s)+)`/g;

/** Deep-clone a value, stripping backticks that wrap identity tokens from every string. Pure. */
function stripTokenBackticks<T>(value: T): T {
  if (typeof value === "string") return value.replace(TOKEN_BACKTICKS, "$1") as T;
  if (Array.isArray(value)) return value.map(stripTokenBackticks) as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = stripTokenBackticks(v);
    return out as T;
  }
  return value;
}

/** Validate a generated act file through SagaFileSchema + the leak floor. Returns the parsed file or reasons. */
export function validateSceneFile(
  raw: unknown,
  req: SceneRequest,
): { ok: true; file: { acts: unknown[]; scenes: unknown[] } } | { ok: false; reasons: string[] } {
  const reasons: string[] = [];
  if (hasPresetLeak(raw)) reasons.push("preset-person leak");
  const parsed = SagaFileSchema.safeParse(normalizeSceneFile(raw));
  if (!parsed.success) {
    reasons.push(`schema: ${parsed.error.issues.map((i) => i.message).join("; ")}`);
    return { ok: false, reasons };
  }
  // The act id must match the requested cell+tier — the model must not relabel the act.
  const wantId = `act:${req.wave}:${req.archetype}:${req.cls}:t${req.tier}`;
  if (!parsed.data.acts.some((a) => a.id === wantId))
    reasons.push(`act id mismatch (want ${wantId})`);
  // Scene-ref integrity: every id an act lists in `scenes[]` must resolve to a real scene object in
  // the same file. Catches the model dropping a scene or mis-spelling its id (e.g. a truncated wave
  // "ashkenazi" vs "ashkenazi_jewish") — a defect the schema + leak gates don't see, which otherwise
  // ships as a dangling ref the loader's integrity test only catches post-hoc.
  const sceneIds = new Set(parsed.data.scenes.map((s) => s.id));
  for (const act of parsed.data.acts) {
    for (const sid of act.scenes) {
      if (!sceneIds.has(sid)) reasons.push(`dangling scene ref ${act.id} → ${sid}`);
    }
  }
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

/** The system instruction for the retitle pass — author ONE specific chapter title, nothing else. */
export function titleSystemInstruction(): string {
  return [
    "You title a chapter of a literary dynasty NOVEL. Return ONE evocative chapter title — a few words —",
    "SPECIFIC to this family's story, in the register of a serious historical novel. No quotes, no",
    "preface, no explanation. NEVER a real person's name. Output ONLY the title text.",
  ].join("\n");
}

/**
 * Build the retitle prompt for one act: hand the model the cell + the act's opening prose so the title
 * is rooted in THIS family's actual chapter, plus the generic register cue (not to copy). Pure.
 */
export function buildTitlePrompt(args: {
  wave: string;
  archetype: string;
  cls: string;
  tier: number;
  openingProse: string;
  cue: string;
}): string {
  return [
    `A ${args.cls}-class ${args.archetype} family of the ${args.wave} wave, generation ${args.tier + 1}.`,
    `The chapter opens:`,
    `"""`,
    args.openingProse.slice(0, 700),
    `"""`,
    `Register/theme cue (do NOT copy): "${args.cue}".`,
    `Give a DISTINCT chapter title specific to this family's chapter — a few words only, no "Act N",`,
    `no quotes, no surrounding text.`,
  ].join("\n");
}

/** Pull the inner title string out of a JSON-wrapped model response ({"title":"…"} / ["…"]); else as-is. */
function unwrapJsonTitle(raw: string): string {
  const s = raw.trim();
  if (!s.startsWith("{") && !s.startsWith("[")) return raw;
  try {
    const parsed = JSON.parse(s);
    if (typeof parsed === "string") return parsed;
    if (Array.isArray(parsed) && typeof parsed[0] === "string") return parsed[0];
    if (parsed && typeof parsed === "object") {
      const v = parsed.title ?? parsed.chapter_title ?? parsed.chapterTitle;
      if (typeof v === "string") return v;
    }
  } catch {
    // Not valid JSON — fall back to the first quoted run, else the raw string.
    const q = s.match(/"([^"]+)"/);
    if (q?.[1]) return q[1];
  }
  return raw;
}

/** Normalize a model title to "Act <roman> — <title>"; reject leaks / empties / echoes of the cue. */
export function normalizeTitle(
  raw: string,
  tier: number,
  cue: string,
): { ok: true; title: string } | { ok: false; reason: string } {
  // The model sometimes returns the title wrapped in JSON ({"title":"…"} / ["…"]) despite the
  // "no surrounding text" instruction — unwrap to the inner string before cleaning.
  let t = unwrapJsonTitle(raw)
    .trim()
    .replace(/^["'“”]+|["'“”]+$/g, "")
    .trim();
  t = t.replace(/^Act\s+[IVXivx]+\s*[—:-]\s*/i, "").trim();
  if (!t) return { ok: false, reason: "empty title" };
  if (hasPresetLeak(t)) return { ok: false, reason: "preset-person leak" };
  if (t.length > 60) return { ok: false, reason: "title too long" };
  if (t.toLowerCase() === cue.toLowerCase()) return { ok: false, reason: "echoed the generic cue" };
  return { ok: true, title: `Act ${ROMAN_FOR(tier)} — ${t}` };
}
