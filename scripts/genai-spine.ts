/**
 * GENAI SPINE AUTHORING (FS-6) — flesh the AUTHORED dynasty spine (DYNASTY_SPINE) into novel prose.
 *
 * Walks the ~10 authored generations (founding 1776 → stars), builds each act's prompt via
 * buildSpinePrompt (which injects that era's DISTINCT decision architecture — the anti-sameness
 * mechanism), generates, validates through validateSpineFile, and merges into src/data/saga/spine.act.json.
 *
 *   pnpm vite-node scripts/genai-spine.ts -- [--gen N] [--out src/data/saga/spine.act.json]
 *
 * Commit-before-run; the diff is the test. Deterministic-friendly: each gen is generated independently;
 * re-running regenerates (merge dedups by act/scene id, new wins).
 */

import { readFileSync, writeFileSync } from "node:fs";
import { existsSync } from "node:fs";
import { DEFAULT_GEN_MODEL, geminiGenerate } from "../src/sim/genai/client";
import { mergeSceneFile, sceneSystemInstruction } from "../src/sim/genai/scene";
import { buildSpinePrompt, validateSpineFile } from "../src/sim/genai/scene";
import { DYNASTY_SPINE, type SpineAct } from "../src/sim/saga/spineAuthored";

const arg = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const OUT = arg("out") ?? "src/data/saga/spine.act.json";
const ONLY_GEN = arg("gen") !== undefined ? Number(arg("gen")) : undefined;

async function authorAct(act: SpineAct, gen: ReturnType<typeof geminiGenerate>): Promise<unknown | null> {
  const label = `spine g${act.gen} (${act.era})`;
  // 4 attempts: the model intermittently emits objects where the schema wants arrays (the normalizer
  // rescues most, but a stubborn gen can lose two rolls running) — a few extra tries gets every gen.
  for (let attempt = 0; attempt < 4; attempt++) {
    const raw = await gen(sceneSystemInstruction(), buildSpinePrompt(act));
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim());
    } catch {
      console.error(`  · ${label}: unparseable JSON — ${attempt === 0 ? "retry" : "skipped"}`);
      continue;
    }
    const v = validateSpineFile(parsed, act);
    if (v.ok) {
      console.error(`  ✓ ${label}: authored`);
      return v.file;
    }
    console.error(
      `  ✗ ${label}: rejected (${v.reasons.join("; ")}) — ${attempt === 0 ? "retry" : "skipped"}`,
    );
  }
  return null;
}

async function main(): Promise<void> {
  const key = process.env.GEMINI_API_KEY ?? "";
  if (!key) {
    console.error("GEMINI_API_KEY not set — spine authoring needs a key.");
    process.exit(1);
  }
  const model = process.env.GEMINI_MODEL || DEFAULT_GEN_MODEL;
  const gen = geminiGenerate(key, model);
  const acts = DYNASTY_SPINE.filter((a) => ONLY_GEN === undefined || a.gen === ONLY_GEN);
  console.error(`Authoring ${acts.length} spine generation(s) with ${model} → ${OUT}…`);

  let merged: unknown = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : { acts: [], scenes: [] };
  let authored = 0;
  for (const act of acts) {
    const file = await authorAct(act, gen);
    if (!file) continue;
    merged = mergeSceneFile(merged, file as { acts: unknown[]; scenes: unknown[] });
    authored++;
    // Write incrementally so a long run is resumable + partial progress is never lost.
    writeFileSync(OUT, `${JSON.stringify(merged, null, 2)}\n`);
  }
  console.error(`Spine authoring complete: ${authored}/${acts.length} generations written to ${OUT}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
