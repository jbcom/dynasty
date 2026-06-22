/**
 * SCOPE-DELINEATED GENAI QA RUNNER (spec: docs/superpowers/specs/2026-06-22-scoped-qa-pipeline-design.md).
 *
 * Lifts the existing novel corpus to frontier quality through three passes, each scoped to the
 * context its error class needs, run in ascending scope order so a later pass reads polished prose:
 *
 *   scene    — revise each scene's prose/choice; preserve its wiring; re-validate the file.
 *   lineage  — audit one family's 6-act chain for cross-tier breaks; re-author the affected scenes.
 *   braid    — author pair-specific cross-storyline crossings into midpoint threads (weaveThreads honors them).
 *
 * Reuses the canonical gate (validateSceneFile = schema + leak + id-match) and mergeSceneFile; a
 * failed revision is discarded and the prior version kept — the pipeline never degrades the corpus.
 *
 * Run direct (NOT via `pnpm … | head` — that buffers stderr in the background harness):
 *   GEMINI_API_KEY=… node_modules/.bin/vite-node scripts/genai-qa.ts -- --write > /tmp/qa.log 2>&1
 *
 * Usage:
 *   --pass scene|lineage|braid|all   (default all)   --write   --wave <w>  --cls poor|middle
 *   --concurrency N (default 4)      GEMINI_MODEL / GEMINI_QA_MODEL override the model id.
 */

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_QA_MODEL, geminiGenerate, parseGeneratedObject } from "../src/sim/genai/client";
import { normalizeSceneFile, validateSceneFile, type SceneRequest } from "../src/sim/genai/scene";
import {
  applyBraid,
  applySuccession,
  type BraidRequest,
  buildBraidPassPrompt,
  buildLineagePassPrompt,
  buildScenePassPrompt,
  buildSuccessionPrompt,
  braidPassSystem,
  type LineageSurface,
  lineagePassSystem,
  scenePassSystem,
  type SuccessionRequest,
  successionPassSystem,
} from "../src/sim/genai/qa";
import { type ActChapter, type Scene, SceneSchema } from "../src/sim/saga/schema";
import type { Rung } from "../src/sim/classRung";
import type { Archetype } from "../src/sim/slots";

const argv = process.argv.slice(2);
const WRITE = argv.includes("--write");
const arg = (n: string, d?: string): string | undefined => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};
const PASS = (arg("pass", "all") ?? "all") as "scene" | "lineage" | "braid" | "succession" | "all";
const CONCURRENCY = Number(arg("concurrency", "4"));
const SAGA_ROOT = "src/data/saga";
const ACT_FILE = /^(?<archetype>[a-z_]+)\.(?<cls>poor|middle)\.act\.json$/;

/** Wave → human label, mirroring player.ts:waveLabel (kept local so the script is standalone). */
const WAVE_LABELS: Record<string, string> = {
  ireland: "Irish",
  bavaria: "German",
  italian: "Italian",
  ashkenazi_jewish: "Jewish",
  scandinavian: "Scandinavian",
  chinese: "Chinese",
  baghdad: "Baghdadi",
};
const waveLabel = (w: string): string => WAVE_LABELS[w] ?? w.replace(/_/g, " ");

interface ActFileRef {
  path: string;
  wave: string;
  archetype: Archetype;
  cls: Rung;
}
interface SagaFileShape {
  _comment?: string;
  acts: ActChapter[];
  scenes: Scene[];
}

/** Fallback register context for a scene whose file has no acts (empty/corrupt) — prevents a TypeError
 *  in buildScenePassPrompt, which reads only `title`/`macroAct`. A guarded edge, never the happy path. */
const FALLBACK_ACT: Pick<ActChapter, "title" | "macroAct"> = { title: "Act —", macroAct: "convergence" };

function discoverActFiles(): ActFileRef[] {
  const onlyWave = arg("wave");
  const onlyCls = arg("cls");
  const refs: ActFileRef[] = [];
  for (const wave of readdirSync(SAGA_ROOT, { withFileTypes: true })) {
    if (!wave.isDirectory() || wave.name === "codex") continue;
    if (onlyWave && wave.name !== onlyWave) continue;
    for (const f of readdirSync(join(SAGA_ROOT, wave.name))) {
      const m = ACT_FILE.exec(f);
      if (!m?.groups) continue;
      if (onlyCls && m.groups.cls !== onlyCls) continue;
      refs.push({
        path: join(SAGA_ROOT, wave.name, f),
        wave: wave.name,
        archetype: m.groups.archetype as Archetype,
        cls: m.groups.cls as Rung,
      });
    }
  }
  return refs.sort((a, b) => a.path.localeCompare(b.path));
}

type Generate = ReturnType<typeof geminiGenerate>;

/** Retry transient API errors (429/5xx/timeout) with backoff; surface real errors as null. */
async function call(gen: Generate, sys: string, prompt: string, label: string): Promise<string | null> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await gen(sys, prompt);
    } catch (e) {
      const transient = /\b(429|500|502|503|504|overload|rate|timeout|ECONN|ETIMEDOUT)\b/i.test(
        (e as Error).message,
      );
      if (!transient || attempt === 3) {
        console.error(`  ✗ ${label}: ${(e as Error).message} (gave up after ${attempt + 1})`);
        return null;
      }
      const waitMs = 2000 * 2 ** attempt;
      console.error(`  … ${label}: transient; retry in ${waitMs}ms`);
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
  return null;
}

function readFile(ref: ActFileRef): SagaFileShape | null {
  try {
    return JSON.parse(readFileSync(ref.path, "utf8")) as SagaFileShape;
  } catch (e) {
    console.error(`  ✗ ${ref.path}: unreadable (${(e as Error).message})`);
    return null;
  }
}

/** Write a revised file only if it still passes the canonical gate for EVERY act it contains. */
function writeIfValid(ref: ActFileRef, file: SagaFileShape, label: string): boolean {
  for (const act of file.acts) {
    const req: SceneRequest = { wave: ref.wave, cls: ref.cls, archetype: ref.archetype, tier: act.tier };
    const v = validateSceneFile(file, req);
    if (!v.ok) {
      console.error(`  ✗ ${label}: revision rejected (${v.reasons.join("; ")}) — kept original`);
      return false;
    }
  }
  if (!WRITE) {
    console.error(`  ✓ ${label}: would write (dry-run)`);
    return true;
  }
  writeFileSync(ref.path, `${JSON.stringify(file, null, 2)}\n`);
  console.error(`  ✓ ${label}: written`);
  return true;
}

// ── Pass 1: scene polish ─────────────────────────────────────────────────────
async function passScene(ref: ActFileRef, gen: Generate): Promise<void> {
  const label = `scene ${ref.wave}/${ref.archetype}.${ref.cls}`;
  const file = readFile(ref);
  if (!file) return;
  const actForScene = (sid: string) =>
    file.acts.find((a) => a.scenes.includes(sid)) ?? file.acts[0] ?? FALLBACK_ACT;
  // Revise scenes concurrently within the file. Each revision is validated as an INDIVIDUAL scene
  // (so one bad scene can't sink the file), with one retry; on failure the original is kept.
  const revised = await Promise.all(file.scenes.map((scene) => reviseScene(scene, actForScene(scene.id), gen, label)));
  file.scenes = revised;
  writeIfValid(ref, file, label);
}

/** Revise one scene (≤2 attempts); return a schema-valid revision or the untouched original. */
async function reviseScene(
  scene: Scene,
  act: SagaFileShape["acts"][number],
  gen: Generate,
  label: string,
): Promise<Scene> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await call(gen, scenePassSystem(), buildScenePassPrompt(scene, act), `${label}:${scene.id}`);
    if (!raw) return scene;
    const obj = parseGeneratedObject(raw);
    if (!obj) continue;
    // Coerce model drift (string prose, missing/undefined arrays, numeric-key objects) like the bulk gate.
    const normed = (normalizeSceneFile({ acts: [], scenes: [obj] }) as { scenes?: unknown[] }).scenes?.[0];
    if (!normed) continue;
    // Re-pin the wiring the editor must never change, THEN schema-validate the individual scene.
    const candidate = { ...(normed as Scene), id: scene.id, sense: scene.sense, next: scene.next, requires: scene.requires };
    const v = SceneSchema.safeParse(candidate);
    if (v.success) return v.data;
    console.error(`    · ${scene.id}: invalid revision (${v.error.issues[0]?.message}) — ${attempt === 0 ? "retry" : "kept original"}`);
  }
  return scene;
}

// ── Pass 2: lineage continuity ───────────────────────────────────────────────
/** Distill the lean continuity surface (spine + flag/decision/heir, not full prose). */
function lineageSurface(ref: ActFileRef, file: SagaFileShape): LineageSurface {
  const sceneById = new Map(file.scenes.map((s) => [s.id, s]));
  return {
    wave: ref.wave,
    archetype: ref.archetype,
    cls: ref.cls,
    acts: file.acts
      .slice()
      .sort((a, b) => a.tier - b.tier)
      .map((a) => ({
        id: a.id,
        tier: a.tier,
        macroAct: a.macroAct,
        title: a.title,
        scenes: a.scenes.map((sid) => {
          const s = sceneById.get(sid);
          return {
            id: sid,
            decisionPrompt: s?.decision?.prompt,
            options: s?.decision?.options?.map((o) => ({
              text: o.text,
              setFlags: o.setFlags,
              succession: o.succession,
            })),
            requires: s?.requires,
            beatFlags: s?.beats?.map((b) => b.choice?.setFlags ?? []),
          };
        }),
      })),
  };
}

async function passLineage(ref: ActFileRef, gen: Generate): Promise<void> {
  const label = `lineage ${ref.wave}/${ref.archetype}.${ref.cls}`;
  const file = readFile(ref);
  if (!file) return;
  const raw = await call(gen, lineagePassSystem(), buildLineagePassPrompt(lineageSurface(ref, file)), label);
  if (!raw) return;
  const obj = parseGeneratedObject(raw) as { breaks?: Array<{ actId: string; sceneId: string; kind: string; detail: string; fix: string }> } | null;
  const breaks = obj?.breaks ?? [];
  if (breaks.length === 0) {
    console.error(`  ✓ ${label}: chain coherent (no breaks)`);
    return;
  }
  console.error(`  ⚠ ${label}: ${breaks.length} break(s) — re-authoring affected scenes`);
  // Re-author each flagged scene with the break's fix instruction (whole-unit fix policy).
  const sceneById = new Map(file.scenes.map((s) => [s.id, s]));
  for (const br of breaks) {
    const scene = sceneById.get(br.sceneId);
    if (!scene) {
      console.error(`    · ${br.sceneId}: not found (skipped)`);
      continue;
    }
    const act = file.acts.find((a) => a.scenes.includes(scene.id)) ?? file.acts[0] ?? FALLBACK_ACT;
    const fixPrompt = `${buildScenePassPrompt(scene, act)}\n\nCONTINUITY FIX REQUIRED (${br.kind}): ${br.detail}\nApply this fix: ${br.fix}`;
    const fixRaw = await call(gen, scenePassSystem(), fixPrompt, `${label}:${br.sceneId}`);
    if (!fixRaw) continue;
    const fixed = parseGeneratedObject(fixRaw) as Scene | null;
    if (fixed && fixed.id === scene.id) sceneById.set(scene.id, fixed);
  }
  file.scenes = file.scenes.map((s) => sceneById.get(s.id) ?? s);
  writeIfValid(ref, file, label);
}

// ── Pass 3: braid authoring ──────────────────────────────────────────────────
/** The rival wave for an act, mirroring player.ts:weaveThreads (next wave, wrapping, with a tier match). */
function rivalFor(wave: string, tier: number, allWaves: string[], tierIndex: Set<string>): string | null {
  const waves = allWaves.slice().sort();
  const start = waves.indexOf(wave);
  for (let step = 1; step < waves.length; step++) {
    const rival = waves[(start + step) % waves.length];
    if (rival && rival !== wave && tierIndex.has(`${rival}:${tier}`)) return rival;
  }
  return null;
}

async function passBraid(refs: ActFileRef[], gen: Generate): Promise<void> {
  // Build a (wave:tier) presence index from ALL files first so rival selection matches the player —
  // this read must complete before any braiding (it's the cross-file context the pass needs).
  const allWaves = [...new Set(refs.map((r) => r.wave))];
  const loaded: Array<{ ref: ActFileRef; file: SagaFileShape }> = [];
  const tierIndex = new Set<string>();
  for (const ref of refs) {
    const file = readFile(ref);
    if (!file) continue;
    loaded.push({ ref, file });
    for (const a of file.acts) tierIndex.add(`${ref.wave}:${a.tier}`);
  }
  // Each file braids independently (read-only shared index, writes only its own path) — pool it like
  // the scene/lineage passes rather than running serially.
  await pool(loaded, CONCURRENCY, ({ ref, file }) => braidOneFile(ref, file, allWaves, tierIndex, gen));
}

/** Author the crossings for one file's midpoint scenes; write only if a crossing landed. */
async function braidOneFile(
  ref: ActFileRef,
  file: SagaFileShape,
  allWaves: string[],
  tierIndex: Set<string>,
  gen: Generate,
): Promise<void> {
  const label = `braid ${ref.wave}/${ref.archetype}.${ref.cls}`;
  let touched = false;
  for (const act of file.acts) {
    const midId = act.scenes.find((id) => id.endsWith(":midpoint"));
    if (!midId) continue;
    const mid = file.scenes.find((s) => s.id === midId);
    if (!mid) continue;
    const rival = rivalFor(ref.wave, act.tier, allWaves, tierIndex);
    if (!rival) continue;
    const req: BraidRequest = {
      wave: ref.wave,
      waveLabel: waveLabel(ref.wave),
      rival,
      rivalLabel: waveLabel(rival),
      tier: act.tier,
      macroAct: act.macroAct,
      sceneOpening: (mid.prose ?? []).join(" "),
    };
    const raw = await call(gen, braidPassSystem(), buildBraidPassPrompt(req), `${label}:t${act.tier}`);
    if (!raw) continue;
    const obj = parseGeneratedObject(raw) as { crossing?: string; relation?: string } | null;
    if (!obj?.crossing) continue;
    const merged = applyBraid(mid, rival, act.tier, { crossing: obj.crossing, relation: obj.relation });
    file.scenes = file.scenes.map((s) => (s.id === midId ? merged : s));
    touched = true;
  }
  if (touched) writeIfValid(ref, file, label);
  else console.error(`  · ${label}: nothing to braid (no rival wave at any tier — needs the full corpus)`);
}

// ── Pass 4: succession authoring (the dynastic fork at each close scene) ──────
async function passSuccession(ref: ActFileRef, gen: Generate): Promise<void> {
  const label = `succession ${ref.wave}/${ref.archetype}.${ref.cls}`;
  const file = readFile(ref);
  if (!file) return;
  let touched = false;
  for (const act of file.acts) {
    const closeId = act.scenes.find((id) => id.endsWith(":close"));
    if (!closeId) continue;
    const close = file.scenes.find((s) => s.id === closeId);
    if (!close || close.decision) continue; // already has one
    const req: SuccessionRequest = {
      wave: ref.wave,
      waveLabel: waveLabel(ref.wave),
      archetype: ref.archetype,
      tier: act.tier,
      closeProse: (close.prose ?? []).join(" "),
    };
    const raw = await call(gen, successionPassSystem(), buildSuccessionPrompt(req), `${label}:t${act.tier}`);
    if (!raw) continue;
    const obj = parseGeneratedObject(raw) as { decision?: Scene["decision"] } | null;
    if (!obj?.decision) continue;
    // Normalize numeric-key drift on options, then validate THIS close scene on its own (per-scene, so
    // one bad close can't sink the file's other five — the whole-file gate was rejecting all 6 together).
    const normed = (normalizeSceneFile({ acts: [], scenes: [applySuccession(close, obj.decision)] }) as {
      scenes?: unknown[];
    }).scenes?.[0];
    const v = SceneSchema.safeParse(normed);
    if (!v.success) {
      console.error(`    · ${closeId}: invalid succession (${v.error.issues[0]?.message}) — skipped`);
      continue;
    }
    if (!v.data.decision?.options?.some((o) => o.succession?.takesPartner)) {
      console.error(`    · ${closeId}: no take-partner option — skipped`);
      continue;
    }
    file.scenes = file.scenes.map((s) => (s.id === closeId ? v.data : s));
    touched = true;
  }
  // Write directly — each spliced close was individually schema-validated above (no whole-file all-or-nothing).
  if (touched) {
    if (WRITE) {
      writeFileSync(ref.path, `${JSON.stringify(file, null, 2)}\n`);
      console.error(`  ✓ ${label}: written`);
    } else {
      console.error(`  ✓ ${label}: would write (dry-run)`);
    }
  } else console.error(`  · ${label}: nothing to author (closes already have decisions)`);
}

async function pool<T>(items: T[], n: number, worker: (item: T) => Promise<void>): Promise<void> {
  let idx = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (idx < items.length) await worker(items[idx++]);
    }),
  );
}

async function main() {
  const key = process.env.GEMINI_API_KEY ?? "";
  if (!key) {
    console.error("GEMINI_API_KEY not set — QA is opt-in and needs a key.");
    process.exit(1);
  }
  const model = process.env.GEMINI_QA_MODEL || process.env.GEMINI_MODEL || DEFAULT_QA_MODEL;
  const gen = geminiGenerate(key, model);
  const refs = discoverActFiles();
  console.error(
    `Scoped QA (model ${model}, pass=${PASS})${WRITE ? "" : " DRY-RUN"}: ${refs.length} act file(s), concurrency ${CONCURRENCY}…`,
  );

  if (PASS === "scene" || PASS === "all") {
    console.error("\n── PASS 1: scene polish ──");
    await pool(refs, CONCURRENCY, (ref) => passScene(ref, gen));
  }
  if (PASS === "lineage" || PASS === "all") {
    console.error("\n── PASS 2: lineage continuity ──");
    await pool(refs, CONCURRENCY, (ref) => passLineage(ref, gen));
  }
  if (PASS === "braid" || PASS === "all") {
    console.error("\n── PASS 3: braid authoring ──");
    await passBraid(refs, gen); // cross-file: runs as one coordinated pass
  }
  if (PASS === "succession" || PASS === "all") {
    console.error("\n── PASS 4: succession authoring (close-scene dynastic fork) ──");
    await pool(refs, CONCURRENCY, (ref) => passSuccession(ref, gen));
  }
  console.error("\nScoped QA complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
