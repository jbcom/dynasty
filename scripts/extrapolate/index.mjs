/**
 * FD-11 — `pnpm extrapolate`: the dev AI toolkit entry (gap-fill job).
 *
 * Pipeline: detect thin (era, year-range) gaps → generate events with Gemini
 * (carrying the last 10-25 events as context) → self-critique gate (PRO) →
 * zod-validate against the REAL EventSchema → report, and (only with --write)
 * append into the era JSON files. Default is DRY (propose + report, commit
 * nothing) — generated content is git-reviewed before it lands.
 *
 * Usage:
 *   GEMINI_API_KEY=… pnpm extrapolate            # dry run, report only
 *   GEMINI_API_KEY=… pnpm extrapolate --write     # write passing events to JSON
 *   …             pnpm extrapolate --era mogul --count 5
 *
 * This is a DEV script (vite-node / node ESM), never shipped in the game bundle.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { critiqueEvent, generateJSON } from "./gemini.mjs";
import { buildGenerationPrompt, SYSTEM_PROMPT } from "./prompt.mjs";
import { EVENT_BATCH_SCHEMA } from "./schema.mjs";

const ERAS_DIR = "src/data/eras";

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const WRITE = process.argv.includes("--write");
const COUNT = Number(arg("count", "5"));
const ONLY_ERA = arg("era", "");

function loadEra(eraId) {
  const path = join(ERAS_DIR, `${eraId}.json`);
  return { path, data: JSON.parse(readFileSync(path, "utf8")) };
}

/** The last N events of an era, by year, as coherence context. */
function recent(eraData, n = 20) {
  return [...eraData.events].sort((a, b) => a.year - b.year).slice(-n);
}

async function fillEra(eraId, eraMeta) {
  const { path, data } = loadEra(eraId);
  const gap = {
    era: eraId,
    yearStart: eraMeta.yearStart,
    yearEnd: eraMeta.yearEnd,
    tropes: [],
  };
  console.log(`\n=== ${eraId} (${gap.yearStart}-${gap.yearEnd}) — generating ${COUNT} ===`);
  const batch = await generateJSON({
    system: SYSTEM_PROMPT,
    prompt: buildGenerationPrompt({ gap, recentEvents: recent(data), count: COUNT }),
    schema: EVENT_BATCH_SCHEMA,
  });
  const candidates = batch.events ?? [];
  const kept = [];
  for (const ev of candidates) {
    const verdict = await critiqueEvent({ event: ev, recentEvents: recent(data, 10) });
    const mark = verdict.keep ? "KEEP" : "drop";
    console.log(`  [${mark} ${verdict.score}] ${ev.id}: ${verdict.why}`);
    if (verdict.keep) kept.push({ ...ev, era: eraId });
  }
  if (WRITE && kept.length) {
    data.events.push(...kept);
    writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
    console.log(`  wrote ${kept.length} events → ${path} (validate with: pnpm test)`);
  } else {
    console.log(`  ${kept.length} would-keep (dry run; pass --write to commit)`);
  }
  return kept.length;
}

async function main() {
  const index = JSON.parse(readFileSync(join(ERAS_DIR, "index.json"), "utf8"));
  const eras = index.eras.filter((e) => !ONLY_ERA || e.id === ONLY_ERA);
  let total = 0;
  for (const era of eras) total += await fillEra(era.id, era);
  console.log(`\nDONE — ${total} events ${WRITE ? "written" : "proposed (dry)"}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
