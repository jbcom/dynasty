/**
 * GENAI CINEMATICS (GA-VIDEO GV-2/3) — generate Veo cinematic mp4s, keyed by cinematicKey, into
 * public/assets/generated/cinematics/<key>.mp4 (the CinematicView's lookup, `:`→`_`). Offline/cached,
 * idempotent. Veo is a long-running operation (minutes per clip).
 *
 *   pnpm vite-node scripts/genai-cinematics.ts -- [--handoff <eraBand>] [--finale <outcome>] [--force]
 *
 * With no flag it generates the founding handoff + the 4 finales (the highest-value set); flags narrow it.
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildFinalePrompt,
  buildHandoffPrompt,
  cinematicKey,
  type FinaleOutcome,
} from "../src/sim/cinematic/genaiCinematic";
import { DEFAULT_VIDEO_MODEL, geminiGenerateVideo } from "../src/sim/genai/client";
import type { EraBand } from "../src/sim/genai/portrait";

const OUT_DIR = "public/assets/generated/cinematics";

const arg = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const FORCE = process.argv.includes("--force");

const FINALES: FinaleOutcome[] = ["stars", "contributed", "earthbound", "extinguished"];

interface Job {
  key: string;
  prompt: string;
}

function jobs(): Job[] {
  const handoffFlag = arg("handoff") as EraBand | undefined;
  const finaleFlag = arg("finale") as FinaleOutcome | undefined;
  if (handoffFlag) {
    return [{ key: cinematicKey("handoff", handoffFlag), prompt: buildHandoffPrompt(handoffFlag) }];
  }
  if (finaleFlag) {
    return [{ key: cinematicKey("finale", finaleFlag), prompt: buildFinalePrompt(finaleFlag) }];
  }
  // Default high-value set: the founding handoff + every finale.
  return [
    { key: cinematicKey("handoff", "founding_1700s"), prompt: buildHandoffPrompt("founding_1700s") },
    ...FINALES.map((o) => ({ key: cinematicKey("finale", o), prompt: buildFinalePrompt(o) })),
  ];
}

async function main(): Promise<void> {
  const key = process.env.GEMINI_API_KEY ?? "";
  if (!key) {
    console.error("GEMINI_API_KEY not set — cinematic generation needs a Gemini key.");
    process.exit(1);
  }
  const genVideo = geminiGenerateVideo(key, process.env.GEMINI_VIDEO_MODEL || DEFAULT_VIDEO_MODEL);
  mkdirSync(OUT_DIR, { recursive: true });

  let made = 0;
  for (const job of jobs()) {
    const stem = job.key.replace(/:/g, "_");
    const abs = join(OUT_DIR, `${stem}.mp4`);
    if (!FORCE && existsSync(abs)) {
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
    made++;
    console.error(`  ✓ ${stem}: ${(bytes.length / 1024 / 1024).toFixed(1)} MiB → ${stem}.mp4`);
  }
  console.error(`Cinematic generation complete: ${made} written.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
