/**
 * GENAI ENCOUNTER PORTRAITS (GA-ENCOUNTER-PORTRAITS) — generate the rival lines' "head" portraits via Imagen,
 * keyed by `encounterPortraitKey(rivalEncounterFacets(...))` (the RivalDossier's lookup, `:` → `_`), in the
 * signature engraving style. Sweeps every eligible rival place (places.json with arrivalYears) × era band —
 * the rival roster is derived from places, so this covers all lines a run can field. Writes PNGs to
 * public/assets/generated/portraits/ and license-logs each in src/data/assets.json. Offline/cached, idempotent.
 *
 *   pnpm vite-node scripts/genai-encounter-portraits.ts -- [--era <eraBand>] [--rival <placeId>] [--force]
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import placesData from "../src/data/world/places.json";
import { DEFAULT_IMAGE_MODEL, geminiGenerateImage } from "../src/sim/genai/client";
import {
  buildEncounterPortraitPrompt,
  encounterPortraitKey,
  ERA_BAND_ORDER,
  type EraBand,
  rivalEncounterFacets,
} from "../src/sim/genai/portrait";
import { type PortraitCache, resolvePortrait } from "../src/sim/genai/portraitCache";

const OUT_DIR = "public/assets/generated/portraits";
const ASSETS_JSON = "src/data/assets.json";

const arg = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
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

/** The eligible rival place ids — those a run can field as a line (a non-destination place with arrival years). */
function rivalPlaceIds(): string[] {
  const arr = (placesData as { places: Array<{ id: string; kind?: string; arrivalYears?: unknown }> })
    .places;
  return arr.filter((p) => p.kind !== "destination" && p.arrivalYears !== undefined).map((p) => p.id);
}

async function main(): Promise<void> {
  const key = process.env.GEMINI_API_KEY ?? "";
  if (!key) {
    console.error("GEMINI_API_KEY not set — encounter-portrait generation needs a key.");
    process.exit(1);
  }
  const model = process.env.GEMINI_IMAGE_MODEL || DEFAULT_IMAGE_MODEL;
  const genImage = geminiGenerateImage(key, model);
  mkdirSync(OUT_DIR, { recursive: true });

  const assetsFile = loadAssets();
  const existingIds = new Set(assetsFile.assets.map((a) => a.id));

  const fsCache: PortraitCache = {
    has: (k) => Promise.resolve(!FORCE && existsSync(join(OUT_DIR, `${k}.png`))),
    get: (k) => Promise.resolve(readFileSync(join(OUT_DIR, `${k}.png`))),
    put: (k, bytes) => {
      writeFileSync(join(OUT_DIR, `${k}.png`), bytes);
      return Promise.resolve();
    },
  };

  const eraFlag = arg("era") as EraBand | undefined;
  const rivalFlag = arg("rival");
  const eras = eraFlag ? [eraFlag] : ERA_BAND_ORDER;
  const placeIds = rivalFlag ? [rivalFlag] : rivalPlaceIds();

  let made = 0;
  for (const placeId of placeIds) {
    for (const eraBand of eras) {
      const facets = rivalEncounterFacets(`rival:${placeId}`, eraBand);
      const stem = encounterPortraitKey(facets).replace(/:/g, "_");
      const r = await resolvePortrait(stem, buildEncounterPortraitPrompt(facets), fsCache, genImage);
      if (r.cached) {
        console.error(`  · ${stem}: exists, skipping`);
        continue;
      }
      if (!r.bytes) {
        console.error(`  ✗ ${stem}: model produced no image`);
        continue;
      }
      const id = `encounter_${stem}`;
      if (!existingIds.has(id)) {
        assetsFile.assets.push({
          id,
          path: `assets/generated/portraits/${stem}.png`,
          kind: "portrait",
          source: `GenAI (${model}) — signature engraving style`,
          license: "Generated",
          attribution: `Encounter portrait: rival ${placeId} head / ${eraBand}`,
        });
        existingIds.add(id);
      }
      made++;
      console.error(`  ✓ ${stem}: ${r.bytes.length} bytes`);
      writeFileSync(ASSETS_JSON, `${JSON.stringify(assetsFile, null, 2)}\n`);
    }
  }
  console.error(`Encounter-portrait generation complete: ${made} written.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
