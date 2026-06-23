/**
 * GENAI PORTRAITS (VL-2 / EI-8) — generate portraits in the locked signature engraving style via Imagen,
 * keyed on the EI-8 COMPOSITE demand matrix (life-stage × era band × archetype/wardrobe × rung tier ×
 * gender). Writes raster PNGs to public/assets/generated/portraits/ under the composite-key filename
 * (`portrait:<…>` → `portrait_<…>.png`, matching PlayScreen's lookup) and license-logs each in
 * src/data/assets.json. Offline/cached build step — idempotent via the on-demand cache (EI-8e): existing
 * keys are skipped, only misses generate. Commit-before-run; the asset diff is the review.
 *
 *   pnpm vite-node scripts/genai-portraits.ts -- [--era <band>] [--archetype <a>] [--tier low|mid|high]
 *                                                 [--stage <s>] [--gender male|female] [--force]
 *
 * With no filters it enumerates the spine's traversed era bands × the adult life-stage × every archetype ×
 * every rung tier × both genders (the live play surface's demand). Filters narrow the sweep. The matrix is
 * large by design (the spec) — narrow with flags rather than blanket-running.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_IMAGE_MODEL, geminiGenerateImage } from "../src/sim/genai/client";
import {
  buildCompositePortraitPrompt,
  compositePortraitKey,
  type EraBand,
  eraBandForYear,
  type PortraitFacets,
} from "../src/sim/genai/portrait";
import {
  type LifeStage,
  type PortraitArchetype,
  type RungTier,
} from "../src/sim/genai/portraitFacets";
import { type PortraitCache, resolvePortrait } from "../src/sim/genai/portraitCache";
import { ARCHETYPES } from "../src/sim/slots";
import { DYNASTY_SPINE } from "../src/sim/saga/spineAuthored";

const OUT_DIR = "public/assets/generated/portraits";
const ASSETS_JSON = "src/data/assets.json";

const arg = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const FORCE = process.argv.includes("--force");

const ALL_ARCHETYPES: PortraitArchetype[] = [...ARCHETYPES, "crime"];
const ALL_TIERS: RungTier[] = ["low", "mid", "high"];
const GENDERS: Array<"male" | "female"> = ["male", "female"];

/** The composite-key filename stem (`portrait:…` → `portrait_…`), matching PlayScreen's lookup. */
function stemFor(f: PortraitFacets): string {
  return compositePortraitKey(f).replace(/:/g, "_");
}

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

/** Build the facet sweep from the flags (or the default: spine era bands × adult × all archetypes × tiers). */
function sweep(): PortraitFacets[] {
  const eraFlag = arg("era") as EraBand | undefined;
  const archFlag = arg("archetype") as PortraitArchetype | undefined;
  const tierFlag = arg("tier") as RungTier | undefined;
  const stageFlag = arg("stage") as LifeStage | undefined;
  const genderFlag = arg("gender") as "male" | "female" | undefined;

  // Default era bands = the distinct bands the authored spine actually traverses (1776 → the stars).
  const eras: EraBand[] = eraFlag
    ? [eraFlag]
    : [...new Set(DYNASTY_SPINE.map((a) => eraBandForYear(a.year)))];
  const archetypes = archFlag ? [archFlag] : ALL_ARCHETYPES;
  const tiers = tierFlag ? [tierFlag] : ALL_TIERS;
  const stages: LifeStage[] = stageFlag ? [stageFlag] : ["adult"];
  const genders = genderFlag ? [genderFlag] : GENDERS;

  const out: PortraitFacets[] = [];
  for (const eraBand of eras)
    for (const archetype of archetypes)
      for (const rungTier of tiers)
        for (const lifeStage of stages)
          for (const gender of genders)
            out.push({ lifeStage, eraBand, archetype, rungTier, gender });
  return out;
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

  // A filesystem-backed PortraitCache so the EI-8e on-demand layer skips assets already on disk (idempotent).
  const fsCache: PortraitCache = {
    has: (k) => Promise.resolve(!FORCE && existsSync(join("public", "assets/generated/portraits", `${k}.png`))),
    get: (k) =>
      Promise.resolve(readFileSync(join("public", "assets/generated/portraits", `${k}.png`))),
    put: (k, bytes) => {
      writeFileSync(join("public", "assets/generated/portraits", `${k}.png`), bytes);
      return Promise.resolve();
    },
  };
  const facets = sweep();
  console.error(`Generating ${facets.length} portrait keys with ${model} → ${OUT_DIR} …`);

  let made = 0;
  for (const f of facets) {
    const stem = stemFor(f);
    const r = await resolvePortrait(stem, buildCompositePortraitPrompt(f), fsCache, genImage);
    if (r.cached) {
      console.error(`  · ${stem}: exists, skipping`);
      continue;
    }
    if (!r.bytes) {
      console.error(`  ✗ ${stem}: model produced no image`);
      continue;
    }
    const id = `portrait_${stem}`;
    if (!existingIds.has(id)) {
      assetsFile.assets.push({
        id,
        path: `assets/generated/portraits/${stem}.png`,
        kind: "portrait",
        source: `GenAI (${model}) — signature engraving style`,
        license: "Generated",
        attribution: `Generated for the dynasty portrait matrix: ${stem}`,
      });
      existingIds.add(id);
    }
    made++;
    console.error(`  ✓ ${stem}: ${r.bytes.length} bytes`);
    writeFileSync(ASSETS_JSON, `${JSON.stringify(assetsFile, null, 2)}\n`);
  }
  console.error(`Portrait generation complete: ${made} written.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
