/**
 * GENAI CINEMATICS (GA-VIDEO GV-2/3) — generate Veo cinematic mp4s, keyed by cinematicKey, into
 * public/assets/generated/cinematics/<key>.mp4 (the CinematicView's lookup, `:`→`_`). Offline/cached,
 * idempotent. Veo is a long-running operation (minutes per clip).
 *
 *   pnpm vite-node scripts/genai-cinematics.ts -- [--handoff <eraBand>] [--finale <outcome>] [--force]
 *
 * With no flag it generates the founding handoff + the 4 finales (the highest-value set); flags narrow it.
 */

import "./env";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildFinalePrompt,
  buildHandoffPrompt,
  cinematicKey,
  FINALE_OUTCOMES,
} from "../src/sim/cinematic/genaiCinematic";
import { DEFAULT_VIDEO_MODEL, geminiGenerateVideo } from "../src/sim/genai/client";
import { ERA_BAND_ORDER } from "../src/sim/genai/portrait";
import { registerGeneratedAsset } from "./generated-assets";

const OUT_DIR = "public/assets/generated/cinematics";

const arg = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const FORCE = process.argv.includes("--force");

/** Validate a raw flag value against the allowed set, exiting with a clear message before any (paid, slow) Veo call. */
function validate<T extends string>(flag: string, raw: string, allowed: readonly T[]): T {
  if (!(allowed as readonly string[]).includes(raw)) {
    console.error(`--${flag}: "${raw}" is not one of: ${allowed.join(", ")}`);
    process.exit(1);
  }
  return raw as T;
}

interface Job {
  key: string;
  prompt: string;
}

function jobs(): Job[] {
  const handoffRaw = arg("handoff");
  const finaleRaw = arg("finale");
  if (handoffRaw !== undefined) {
    const band = validate("handoff", handoffRaw, ERA_BAND_ORDER);
    return [{ key: cinematicKey("handoff", band), prompt: buildHandoffPrompt(band) }];
  }
  if (finaleRaw !== undefined) {
    const outcome = validate("finale", finaleRaw, FINALE_OUTCOMES);
    return [{ key: cinematicKey("finale", outcome), prompt: buildFinalePrompt(outcome) }];
  }
  // Default high-value set: the founding handoff + every finale.
  return [
    { key: cinematicKey("handoff", "founding_1700s"), prompt: buildHandoffPrompt("founding_1700s") },
    ...FINALE_OUTCOMES.map((o) => ({ key: cinematicKey("finale", o), prompt: buildFinalePrompt(o) })),
  ];
}

async function main(): Promise<void> {
  const key = process.env.GEMINI_API_KEY ?? "";
  if (!key) {
    console.error("GEMINI_API_KEY not set — cinematic generation needs a Gemini key.");
    process.exit(1);
  }
  const model = process.env.GEMINI_VIDEO_MODEL || DEFAULT_VIDEO_MODEL;
  const genVideo = geminiGenerateVideo(key, model);
  mkdirSync(OUT_DIR, { recursive: true });

  let made = 0;
  for (const job of jobs()) {
    const stem = job.key.replace(/:/g, "_");
    const abs = join(OUT_DIR, `${stem}.mp4`);
    const register = () =>
      registerGeneratedAsset({
        id: `cinematic_${stem}`,
        path: `assets/generated/cinematics/${stem}.mp4`,
        kind: "video",
        source: `GenAI (${model}) — engraving-chronicle cinematic`,
        license: "Generated",
        attribution: `Generated dynasty cinematic: ${job.key}`,
      });
    if (!FORCE && existsSync(abs)) {
      register();
      console.error(`  · ${stem}: exists, skipping`);
      continue;
    }
    console.error(`  … ${stem}: generating (Veo is slow) …`);
    const bytes = await genVideo(job.prompt);
    if (!bytes) {
      console.error(`  ✗ ${stem}: no video produced`);
      continue;
    }
    writeFileSync(abs, bytes);
    register();
    made++;
    console.error(`  ✓ ${stem}: ${(bytes.length / 1024 / 1024).toFixed(1)} MiB → ${stem}.mp4`);
  }
  console.error(`Cinematic generation complete: ${made} written.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
