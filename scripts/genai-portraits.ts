/**
 * GENAI PORTRAITS (VL-2) — generate a portrait per founding-spine generation × gender in the locked
 * signature engraving style, via Imagen. Writes raster PNGs to public/assets/generated/portraits/ and
 * license-logs each in src/data/assets.json. Offline/cached build step (like genai-spine) — idempotent
 * (skips existing keys). Commit-before-run; the asset diff is the review.
 *
 *   pnpm vite-node scripts/genai-portraits.ts -- [--gen N] [--gender male|female] [--force]
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_IMAGE_MODEL, geminiGenerateImage } from "../src/sim/genai/client";
import { buildPortraitPrompt, portraitKey } from "../src/sim/genai/portrait";
import { DYNASTY_SPINE } from "../src/sim/saga/spineAuthored";

const OUT_DIR = "public/assets/generated/portraits";
const ASSETS_JSON = "src/data/assets.json";

const arg = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const ONLY_GEN = arg("gen") !== undefined ? Number(arg("gen")) : undefined;
const ONLY_GENDER = arg("gender") as "male" | "female" | undefined;
const FORCE = process.argv.includes("--force");

interface AssetEntry {
  id: string;
  path: string;
  kind: string;
  source: string;
  license: string;
  attribution: string;
}

function loadAssets(): { assets: AssetEntry[] } {
  if (!existsSync(ASSETS_JSON)) return { assets: [] };
  return JSON.parse(readFileSync(ASSETS_JSON, "utf8"));
}

async function main(): Promise<void> {
  const key = process.env.GEMINI_API_KEY ?? "";
  if (!key) {
    console.error("GEMINI_API_KEY not set — portrait generation needs a key.");
    process.exit(1);
  }
  const model = process.env.GEMINI_IMAGE_MODEL || DEFAULT_IMAGE_MODEL;
  const genImage = geminiGenerateImage(key, model);
  mkdirSync(OUT_DIR, { recursive: true });

  const assetsFile = loadAssets();
  const existingIds = new Set(assetsFile.assets.map((a) => a.id));

  const acts = DYNASTY_SPINE.filter((a) => ONLY_GEN === undefined || a.gen === ONLY_GEN);
  const genders: Array<"male" | "female"> = ONLY_GENDER ? [ONLY_GENDER] : ["male", "female"];
  console.error(`Generating portraits with ${model} → ${OUT_DIR} …`);

  let made = 0;
  for (const act of acts) {
    for (const gender of genders) {
      const stem = portraitKey(act, gender);
      const rel = `assets/generated/portraits/${stem}.png`;
      const abs = join("public", rel);
      const id = `portrait_${stem}`;
      if (!FORCE && existsSync(abs)) {
        console.error(`  · ${stem}: exists, skipping`);
        continue;
      }
      const bytes = await genImage(buildPortraitPrompt(act, gender));
      if (!bytes) {
        console.error(`  ✗ ${stem}: model produced no image`);
        continue;
      }
      writeFileSync(abs, bytes);
      if (!existingIds.has(id)) {
        assetsFile.assets.push({
          id,
          path: rel,
          kind: "portrait",
          source: `GenAI (${model}) — signature engraving style`,
          license: "Generated",
          attribution: `Generated for the dynasty spine, generation ${act.gen} (${act.era}), ${gender}`,
        });
        existingIds.add(id);
      }
      made++;
      console.error(`  ✓ ${stem}: ${bytes.length} bytes`);
      // Persist the asset log incrementally so a long/partial run stays consistent.
      writeFileSync(ASSETS_JSON, `${JSON.stringify(assetsFile, null, 2)}\n`);
    }
  }
  console.error(`Portrait generation complete: ${made} written.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
