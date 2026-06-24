/**
 * GENAI DOSSIER FIGURES (VD-6) — generate the atmospheric establishing PLATES for the visual dossiers via
 * Imagen, keyed by `dossierFigureKey` (kind × era × archetype), in the signature engraving style. Writes
 * raster PNGs to public/assets/generated/dossiers/ under the composite-key filename (`:` → `_`, matching
 * FigurePanel's lookup) and license-logs each in src/data/assets.json. Offline/cached, idempotent via the
 * EI-8e on-demand cache. Commit-before-run; the asset diff is the review.
 *
 *   pnpm vite-node scripts/genai-dossiers.ts -- [--kind <k>] [--era <band>] [--archetype <a>] [--force]
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { dossierFigureKey, type DossierKind, dossierKindForArchetype } from "../src/sim/dossier/dossier";
import { buildDossierFigurePrompt } from "../src/sim/dossier/dossierGenai";
import { DEFAULT_IMAGE_MODEL, geminiGenerateImage } from "../src/sim/genai/client";
import type { EraBand } from "../src/sim/genai/portrait";
import type { PortraitArchetype } from "../src/sim/genai/portraitFacets";
import { type PortraitCache, resolvePortrait } from "../src/sim/genai/portraitCache";
import { ARCHETYPES } from "../src/sim/slots";

const OUT_DIR = "public/assets/generated/dossiers";
const ASSETS_JSON = "src/data/assets.json";

const arg = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const FORCE = process.argv.includes("--force");

const ALL_ARCHETYPES: PortraitArchetype[] = [...ARCHETYPES, "crime"];
const ALL_ERAS: EraBand[] = [
  "founding_1700s",
  "federal_1800s",
  "industrial_late1800s",
  "early_1900s",
  "midcentury",
  "digital_modern",
  "near_future",
  "stellar",
];

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
    console.error("GEMINI_API_KEY not set — dossier figure generation needs a key.");
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

  // Sweep: by flags, else every (kind via archetype × era). The kind is derived from the archetype.
  const archFlag = arg("archetype") as PortraitArchetype | undefined;
  const eraFlag = arg("era") as EraBand | undefined;
  const kindFlag = arg("kind") as DossierKind | undefined;
  const archetypes = archFlag ? [archFlag] : ALL_ARCHETYPES;
  const eras = eraFlag ? [eraFlag] : ALL_ERAS;

  let made = 0;
  for (const archetype of archetypes) {
    const kind = dossierKindForArchetype(archetype);
    if (kindFlag && kind !== kindFlag) continue;
    for (const eraBand of eras) {
      const figKey = dossierFigureKey(kind, eraBand, archetype);
      const stem = figKey.replace(/:/g, "_");
      const r = await resolvePortrait(stem, buildDossierFigurePrompt(kind, eraBand, archetype), fsCache, genImage);
      if (r.cached) {
        console.error(`  · ${stem}: exists, skipping`);
        continue;
      }
      if (!r.bytes) {
        console.error(`  ✗ ${stem}: model produced no image`);
        continue;
      }
      const id = `dossierfig_${stem}`;
      if (!existingIds.has(id)) {
        assetsFile.assets.push({
          id,
          path: `assets/generated/dossiers/${stem}.png`,
          kind: "dossier-figure",
          source: `GenAI (${model}) — signature engraving style`,
          license: "Generated",
          attribution: `Dossier figure: ${kind} / ${eraBand} / ${archetype}`,
        });
        existingIds.add(id);
      }
      made++;
      console.error(`  ✓ ${stem}: ${r.bytes.length} bytes`);
      writeFileSync(ASSETS_JSON, `${JSON.stringify(assetsFile, null, 2)}\n`);
    }
  }
  console.error(`Dossier figure generation complete: ${made} written.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
