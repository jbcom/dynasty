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
import {
  dossierBriefKey,
  dossierFigureKey,
  type DossierKind,
  dossierKindForArchetype,
} from "../src/sim/dossier/dossier";
import {
  buildDossierBriefPrompt,
  buildDossierFigurePrompt,
  type DossierState,
  dossierBriefSystem,
} from "../src/sim/dossier/dossierGenai";
import {
  DEFAULT_GEN_MODEL,
  DEFAULT_IMAGE_MODEL,
  geminiGenerate,
  geminiGenerateImage,
} from "../src/sim/genai/client";
import { ERA_BAND_ORDER, type EraBand } from "../src/sim/genai/portrait";
import type { PortraitArchetype } from "../src/sim/genai/portraitFacets";
import { type PortraitCache, resolvePortrait } from "../src/sim/genai/portraitCache";
import { ARCHETYPES } from "../src/sim/slots";

const OUT_DIR = "public/assets/generated/dossiers";
const ASSETS_JSON = "src/data/assets.json";
const BRIEFS_JSON = "src/data/dossierBriefs.json";

/** A representative state digest per era band — the brief is kind×era (run-independent); the live charts carry
 *  the run's exact numbers. A mid-standing line so the assessment reads neither triumphant nor doomed. */
function representativeState(eraBand: EraBand): DossierState {
  const far = eraBand === "near_future" || eraBand === "stellar";
  return {
    familyName: "{family_name}",
    rung: 2,
    topMeters: [
      { label: "Reputation", value: 45 },
      { label: "Reach", value: 30 },
    ],
    rivalsLeading: 2,
    ...(far
      ? {
          scarcity:
            "in a copy-everything age the line's power is the un-copyable — an authentic bloodline, real presence, a singular physical relic; legitimacy among infinite simulacra.",
        }
      : {}),
  };
}

/** Parse the model's brief into paragraphs. Defensively unwraps a JSON-wrapped reply (some models return
 *  `{ "briefing": "..." }` despite the prompt) + strips code fences before splitting on blank lines. */
function toParagraphs(text: string): string[] {
  let body = text.trim().replace(/^```\w*\s*|\s*```$/g, "");
  // If the model wrapped the prose in JSON, pull the longest string field (the briefing) out.
  if (body.startsWith("{") || body.startsWith("[")) {
    try {
      const obj = JSON.parse(body) as unknown;
      const strings: string[] = [];
      const walk = (v: unknown): void => {
        if (typeof v === "string") strings.push(v);
        else if (Array.isArray(v)) v.forEach(walk);
        else if (v && typeof v === "object") Object.values(v).forEach(walk);
      };
      walk(obj);
      // The brief is the longest string (the prose), not the short label fields.
      const longest = strings.sort((a, b) => b.length - a.length)[0];
      if (longest) body = longest;
    } catch {
      // not valid JSON — fall through and split as-is
    }
  }
  return body
    .split(/\n\s*\n|\\n\\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 0);
}

const arg = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const FORCE = process.argv.includes("--force");

const ALL_ARCHETYPES: PortraitArchetype[] = [...ARCHETYPES, "crime"];
const ALL_ERAS: readonly EraBand[] = ERA_BAND_ORDER;

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

  // BRIEFS: the path-voice prose per kind×era, generated offline into a JSON map (loaded at runtime like the
  // scene corpus — no API at sim runtime). Run-independent (the live charts carry the run's exact numbers).
  const genText = geminiGenerate(key, process.env.GEMINI_MODEL || DEFAULT_GEN_MODEL);
  const briefs: Record<string, string[]> = existsSync(BRIEFS_JSON)
    ? JSON.parse(readFileSync(BRIEFS_JSON, "utf8"))
    : {};
  let briefsMade = 0;
  for (const archetype of archetypes) {
    const kind = dossierKindForArchetype(archetype);
    if (kindFlag && kind !== kindFlag) continue;
    for (const eraBand of eras) {
      const bKey = dossierBriefKey(kind, eraBand);
      if (!FORCE && briefs[bKey]) {
        console.error(`  · ${bKey}: exists, skipping`);
        continue;
      }
      const text = await genText(
        dossierBriefSystem(),
        buildDossierBriefPrompt(kind, eraBand, representativeState(eraBand)),
      );
      const paras = toParagraphs(text);
      if (paras.length === 0) {
        console.error(`  ✗ ${bKey}: empty brief`);
        continue;
      }
      briefs[bKey] = paras;
      briefsMade++;
      console.error(`  ✓ ${bKey}: ${paras.length} paras`);
      writeFileSync(BRIEFS_JSON, `${JSON.stringify(briefs, null, 2)}\n`);
    }
  }
  console.error(`Dossier brief generation complete: ${briefsMade} written.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
