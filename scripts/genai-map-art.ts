/**
 * GENAI MAP ART (GA-MAP-ART GM-2) — generate the era-progressing cartographic BASE plates, keyed by mapKey,
 * into public/assets/generated/map/<key>.png (the MapView's lookup, `:`→`_`). Offline/cached, idempotent.
 *
 *   pnpm vite-node scripts/genai-map-art.ts -- [--era <eraBand>] [--force]
 *
 * With no flag it generates every era band's base; --era narrows to one. Reuses the Imagen image generator
 * (the same pipeline as portraits/dossiers).
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_IMAGE_MODEL, geminiGenerateImage } from "../src/sim/genai/client";
import { allMapJobs } from "../src/sim/genai/mapArt";
import { ERA_BAND_ORDER } from "../src/sim/genai/portrait";

const OUT_DIR = "public/assets/generated/map";

const arg = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const FORCE = process.argv.includes("--force");

/** The jobs to run — every era band by default, or just the one named by --era (validated). Reuses allMapJobs. */
function jobs(): ReturnType<typeof allMapJobs> {
  const all = allMapJobs();
  const eraRaw = arg("era");
  if (eraRaw === undefined) return all;
  const job = all.find((j) => j.eraBand === eraRaw);
  if (!job) {
    console.error(`--era: "${eraRaw}" is not one of: ${ERA_BAND_ORDER.join(", ")}`);
    process.exit(1);
  }
  return [job];
}

async function main(): Promise<void> {
  const key = process.env.GEMINI_API_KEY ?? "";
  if (!key) {
    console.error("GEMINI_API_KEY not set — map generation needs a Gemini key.");
    process.exit(1);
  }
  const genImage = geminiGenerateImage(key, process.env.GEMINI_IMAGE_MODEL || DEFAULT_IMAGE_MODEL);
  mkdirSync(OUT_DIR, { recursive: true });

  let made = 0;
  for (const job of jobs()) {
    const stem = job.key.replace(/:/g, "_");
    const abs = join(OUT_DIR, `${stem}.png`);
    if (!FORCE && existsSync(abs)) {
      console.error(`  · ${stem}: exists, skipping`);
      continue;
    }
    console.error(`  … ${stem}: generating …`);
    const bytes = await genImage(job.prompt);
    if (!bytes) {
      console.error(`  ✗ ${stem}: no image produced`);
      continue;
    }
    writeFileSync(abs, bytes);
    made++;
    console.error(`  ✓ ${stem}: ${(bytes.length / 1024).toFixed(0)} KiB → ${stem}.png`);
  }
  console.error(`Map generation complete: ${made} written.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
