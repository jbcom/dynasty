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

import guidanceData from "../../data/saga/guidance.json" with { type: "json" };
import type { Rung } from "../classRung";
import { hasPresetLeak } from "../leak";
import { SagaFileSchema } from "../saga/schema";
import type { DecisionArchitecture, SpineAct } from "../saga/spineAuthored";
import type { Archetype } from "../slots";
import { type SceneSlot, spineFor } from "../spine";

/** A bespoke per-(era × class) creative brief (UQ-1) — hand-authored, injected into the prompt + QA. */
interface EraGuidance {
  arc: string;
  tone: string;
  focus: string;
  rhythm: string;
  scannability: string;
  avoid: string;
  qaLookFor: string;
  qaReject: string;
  /** EI-SCARCITY-STORIES (user 2026-06-23): in the post-scarcity far future the drama is what STAYS scarce
   *  when all else is abundant (singular physical artifacts, real presence, authentic line, legitimacy).
   *  Present only on the far-future tiers; folded into the brief so generated near-future/stellar acts
   *  foreground it instead of reusing industrial-era money/land scarcity. */
  scarcity?: string;
}
/** A bespoke per-WAVE/people brief — real history + motivations that make each line + its crossings unique. */
interface WaveGuidance {
  history: string;
  arc: string;
  motivations: string;
  trades: string;
  obstacles: string;
  crime: string;
  braidAffinity: string;
  mythFlags: string;
}
const G = guidanceData as {
  eras: Record<string, EraGuidance>;
  waves: Record<string, WaveGuidance>;
};

/**
 * The bespoke ERA×class brief for a cell — where act UNIQUENESS (arc/tone/rhythm/scannability + the QA
 * criteria) lives. Undefined for an unauthored key (prompt falls back to the spine intent alone).
 */
export function eraGuidanceFor(tier: number, cls: Rung): EraGuidance | undefined {
  return G.eras[`t${tier}.${cls}`];
}
/** The bespoke WAVE/people brief — real history + motivations + braid affinity (drives uniqueness + genuine crossings). */
export function waveGuidanceFor(wave: string): WaveGuidance | undefined {
  return G.waves[wave];
}

/**
 * UQ-2: the brief the SCENE QA pass injects — the same era×class qaLookFor/qaReject + this people's
 * myth-flags that drove generation, so the editor holds the revised prose to the SAME bar. Empty string
 * when neither key is authored (the pass then runs guidance-free, as before).
 */
export function scenePassBrief(wave: string, tier: number, cls: Rung): string {
  const era = eraGuidanceFor(tier, cls);
  const w = waveGuidanceFor(wave);
  const lines: string[] = [];
  if (era) {
    lines.push(
      "HOLD THIS SCENE TO ITS ERA BRIEF (the same one that drove its generation):",
      `- THIS ERA MUST HAVE: ${era.qaLookFor}`,
      `- THIS ERA MUST NOT: ${era.qaReject}`,
      `- SCANNABILITY: ${era.scannability}`,
    );
    // EI-SCARCITY-STORIES: hold the far-future scene to the post-scarcity stakes too (when present).
    if (era.scarcity)
      lines.push(`- SCARCITY (the post-scarcity stakes must drive it): ${era.scarcity}`);
  }
  if (w) {
    lines.push(
      `THIS PEOPLE (${wave}) — keep the prose true to their real history:`,
      `- HISTORICAL ACCURACY — DO NOT INTRODUCE THESE MYTHS: ${w.mythFlags}`,
    );
  }
  return lines.join("\n");
}

/**
 * UQ-2: the brief the LINEAGE QA pass injects — this people's documented arc/history/braid-affinity, so a
 * "premise" break includes drifting OFF the real historical trajectory, not only internal contradiction.
 */
export function lineagePassBrief(wave: string): string {
  const w = waveGuidanceFor(wave);
  if (!w) return "";
  return [
    `THIS PEOPLE — the ${wave} wave's documented trajectory (a chain that contradicts this is a premise break):`,
    `- HISTORY: ${w.history}`,
    `- ARC (arrival → convergence → future): ${w.arc}`,
    `- WHO THEY PLAUSIBLY CROSS: ${w.braidAffinity}`,
    `- MYTHS TO AVOID: ${w.mythFlags}`,
  ].join("\n");
}

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
  // UQ-1: the bespoke briefs — the era×class arc + THIS people's real history — so the cell reads UNIQUE
  // (no two waves' tier-0-poor read alike) and its crossings are motivated by who this people meets.
  const era = eraGuidanceFor(req.tier, req.cls);
  const wave = waveGuidanceFor(req.wave);
  const waveBrief = wave
    ? [
        "",
        `THIS PEOPLE — the ${req.wave} wave (ground every scene in THEIR real history, not generic immigrant beats):`,
        `- HISTORY: ${wave.history}`,
        `- ARC (arrival → convergence → future): ${wave.arc}`,
        `- MOTIVATIONS: ${wave.motivations}`,
        `- TRADES: ${wave.trades}`,
        `- OBSTACLES: ${wave.obstacles}`,
        `- CRIME (only if true for this people — never invent a crime arc): ${wave.crime}`,
        `- WHO THEY CROSS (for any intersection): ${wave.braidAffinity}`,
        `- HISTORICAL ACCURACY — DO NOT REPEAT THESE MYTHS: ${wave.mythFlags}`,
      ].join("\n")
    : "";
  const eraBrief = era
    ? [
        "",
        "CREATIVE BRIEF for THIS generation (follow it — it makes this act distinct from every other):",
        // The ARC below is the HISTORICAL meaning of this tier×class. The per-scene intents carry a
        // separate STRUCTURAL movement ("this act moves as a rise/collapse/…") — that's pacing/form, a
        // different layer. Honor both: the ARC says what this generation MEANS, the movement says how the
        // act is SHAPED. They are orthogonal, not competing. (UQ-reconcile)
        `- ARC (the historical meaning of this generation): ${era.arc}`,
        `- TONE: ${era.tone}`,
        `- FOCUS: ${era.focus}`,
        `- RHYTHM: ${era.rhythm}`,
        `- SCANNABILITY: ${era.scannability}`,
        `- AVOID: ${era.avoid}`,
        // EI-SCARCITY-STORIES: only the far-future tiers carry a scarcity note; fold it in when present so
        // the post-scarcity drama (what stays scarce) drives the act, not recycled money/land stakes.
        ...(era.scarcity
          ? [`- SCARCITY (the post-scarcity stakes — make these the drama): ${era.scarcity}`]
          : []),
        `- THIS ERA MUST HAVE: ${era.qaLookFor}`,
        `- THIS ERA MUST NOT: ${era.qaReject}`,
      ].join("\n")
    : "";
  return [
    `Flesh this ACT into the novel. The line is a ${req.cls}-class ${req.archetype} family that founded`,
    `the ${req.wave} immigration wave. Reach tier ${req.tier} (${act.macroAct} macro-act).`,
    waveBrief,
    eraBrief,
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

// ─────────────────────────────────────────────────────────────────────────────
// FS-3b — the AUTHORED-SPINE generation path (one dynasty line, distinct per-era decision architecture)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Each DECISION ARCHITECTURE → the concrete prompt instruction that gives the era's pivotal decision its
 * distinct SHAPE. This is what makes generated decisions structurally DIVERGE era to era instead of all
 * being "the community stands at a crossroads → 3 generic options" ([[founding-spine-pivot]] / FS-3). The
 * GenAI must build the act's pivotal decision in THIS shape.
 */
const ARCHITECTURE_PROMPT: Record<DecisionArchitecture, string> = {
  bargain:
    "BARGAIN: a founding-era COMPACT — the line trades something now (loyalty, coin, a son, a principle) for a CLAIM on the future. Options name the COST and the claim; not factions, not a yes/no — each is a different price for a different future.",
  allegiance:
    "ALLEGIANCE: pick a SIDE as a conflict splits the world (revolution / civil war / labor vs. capital). Options ARE the factions; the weight is who you stand with when neutrality ends — and what it costs the line either way.",
  venture:
    "VENTURE: a WAGER — risk the line's capital/standing on a bet the era's epoch will reward or ruin. Options differ by RISK TIER (cautious hedge / leveraged plunge / a contrarian bet against the herd), not by ideology.",
  succession:
    "SUCCESSION: the dynastic FORK that ends the generation. EXACTLY ONE option takes a partner AND raises heirs (mark it `succession:{takesPartner:true,begets:1-3}`); the others are real alternatives that do NOT carry succession. The line's most consequential choice.",
  reckoning:
    "RECKONING: the line's accumulated way-of-making-wealth (or its sins) comes DUE — a prosecution, a scandal, a moral debt. Options = face it openly / bury it / weaponize the threat. The past is the antagonist, not a rival.",
  platform:
    "PLATFORM: a mass-REACH play — shape the story the country tells itself (press / airwaves / the feed). Options differ by WHAT TRUTH you bend and how far — sincerity vs. spectacle vs. outright manufacture.",
  expansion:
    "EXPANSION: the terminal STELLAR gambit. The options ARE the seeds of the distinct endings — FORGE ALLIES among the worlds (covenant) / SEIZE COLONIES (conquest) / GO QUIET + HIDDEN on a world that draws no notice. Each is a different fate for the line among the stars.",
  doctrine:
    "DOCTRINE: a worldview COMMITMENT — the line binds itself to a creed (faith / ideology / omertà / a dynastic code) that will gate later branches. Mutually-exclusive identity choice; options are creeds, and the choice is irreversible in spirit.",
};

/**
 * Build the GenAI prompt for one AUTHORED SPINE act (FS-3b). Unlike `buildScenePrompt` (the 504-cell
 * path), this drives the ONE dynasty line and injects the era's DECISION ARCHITECTURE so the pivotal
 * choice takes that era's distinct shape. `gen0Brief` (optional) carries the player's founding identity.
 */
export function buildSpinePrompt(act: SpineAct, gen0Brief = ""): string {
  const architectures = [...new Set(act.beats)];
  const archBlock = architectures.map((a) => `- ${ARCHITECTURE_PROMPT[a]}`).join("\n");
  return [
    `Flesh this generation of the ONE dynasty line into the novel. This is the line FOUNDED at America's`,
    `founding and carried toward the stars — America's story as this family's story.`,
    `Generation ${act.gen}, the ${act.era} (${act.macroAct} macro-act, ~${act.year}).`,
    gen0Brief ? `\n${gen0Brief}` : "",
    "",
    `THIS ERA'S DECISION ARCHITECTURE — build the act's pivotal choice in EXACTLY this shape (this is what`,
    `makes each generation structurally distinct; do NOT default to a generic 'crossroads → 3 options'):`,
    archBlock,
    "",
    `TITLE: a DISTINCT chapter title specific to THIS generation's story. Use "${act.titleCue}" only as a`,
    `register cue — write a fresh title. Keep an "Act ${ROMAN_FOR(act.gen)} — " prefix.`,
    "",
    `Ground the prose in the era's real American history (${act.era}, ~${act.year}); the founding family`,
    `moves through it. Other immigrant families braid in only as woven crossings (do not make them the focus).`,
    "",
    `Emit ONE act chapter and ITS scenes (4-6 scenes: an open, the era's pivotal decision beat(s) in the`,
    `architecture above, and a close). Use these EXACT act fields + scene ids:`,
    `acts: [{ id:"${act.id}", wave:"spine", archetype:"founding", cls:"spine", tier:${Math.min(act.gen, 5)},`,
    `  macroAct:"${act.macroAct}", title:"Act ${ROMAN_FOR(act.gen)} — <specific chapter title>",`,
    `  scenes:["${act.id}:open", "${act.id}:turn", "${act.id}:close"] }]`,
    `Each scene id MUST start with "${act.id}:". The pivotal decision scene carries a major \`decision\`;`,
    `the close carries the succession decision (one option takesPartner+begets).`,
    "",
    `SCENE SHAPE (strict): each scene = { id, sense, prose:[2-4 strings], beats:[], decision?, next? }.`,
    `\`sense\` MUST be EXACTLY one of: "sound" | "sight" | "touch" | "taste" | "smell". \`prose\` is an`,
    `ARRAY of full-paragraph strings (never an object). \`beats\` is an ARRAY (use [] if none).`,
    "",
    `Motivator axes for every motivatorShift: ${MOTIVATOR_AXES}.`,
    `Return ONLY the JSON object { "acts": [...], "scenes": [...] } for this generation's act + its scenes.`,
  ]
    .filter((l) => l !== "")
    .join("\n");
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
    // Coerce `requires.flags`/`requires.notFlags` object-drift → arrays (the schema needs arrays).
    if (scene.requires && typeof scene.requires === "object") {
      const req = { ...(scene.requires as Record<string, unknown>) };
      if (req.flags !== undefined) req.flags = asArray(req.flags);
      if (req.notFlags !== undefined) req.notFlags = asArray(req.notFlags);
      scene.requires = req;
    }
    return scene;
  });
  // Coerce the ACTS array + each act's `scenes` id-list from object-with-numeric-keys drift too (the
  // FS-6 spine path hit "expected array, received object" here — the normalizer only fixed `scenes`,
  // never `acts`/`acts[].scenes`).
  const actsArr = asArray(obj.acts);
  const acts = Array.isArray(actsArr)
    ? actsArr.map((a) => {
        if (!a || typeof a !== "object") return a;
        const act = { ...(a as Record<string, unknown>) };
        const sc = asArray(act.scenes);
        if (Array.isArray(sc)) act.scenes = sc;
        return act;
      })
    : actsArr;
  // Strip markdown the model sometimes wraps around identity tokens (`{surname}` → {surname}); it would
  // otherwise render as literal backticks in the reader. Deep-applied to every string in the file.
  return stripTokenBackticks({ ...obj, ...(acts !== undefined ? { acts } : {}), scenes });
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

/**
 * Validate a generated SPINE act file (FS-6) — the authored one-dynasty path. Same schema + leak +
 * dangling-ref floor as the cell validator, but the act id must be the spine act's id (`spine:gN:*`),
 * not a wave×cls×archetype cell id. Returns the parsed file or the reasons it was rejected.
 */
export function validateSpineFile(
  raw: unknown,
  act: SpineAct,
): { ok: true; file: { acts: unknown[]; scenes: unknown[] } } | { ok: false; reasons: string[] } {
  const reasons: string[] = [];
  if (hasPresetLeak(raw)) reasons.push("preset-person leak");
  const parsed = SagaFileSchema.safeParse(normalizeSceneFile(raw));
  if (!parsed.success) {
    reasons.push(`schema: ${parsed.error.issues.map((i) => i.message).join("; ")}`);
    return { ok: false, reasons };
  }
  if (!parsed.data.acts.some((a) => a.id === act.id))
    reasons.push(`spine act id mismatch (want ${act.id})`);
  const sceneIds = new Set(parsed.data.scenes.map((s) => s.id));
  const declaredIds = new Set(parsed.data.acts.flatMap((a) => a.scenes));
  for (const a of parsed.data.acts)
    for (const sid of a.scenes)
      if (!sceneIds.has(sid)) reasons.push(`dangling scene ref ${a.id} → ${sid}`);
  // ORPHAN check (FS-6): every emitted scene object MUST be listed in some act's scenes[] — else the
  // model authored a scene the act never references (loader orphan). Catches the reverse of dangling.
  for (const s of parsed.data.scenes)
    if (!declaredIds.has(s.id)) reasons.push(`orphan scene ${s.id} (not in any act's scenes[])`);
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
