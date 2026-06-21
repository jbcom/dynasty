/**
 * FD-3 — `pnpm retag-tropes`: the trope-retag dev job (spec §1e).
 *
 * Walks the authored era events and asks Gemini to classify each by the dynastic
 * trope(s) it embodies, proposing `trope:<id>` tags from the canonical catalog
 * (src/data/tropes.json). This is how the refactor from literal lines
 * (Trump/Kennedy/Musk/Graham) to reusable TROPE INFLUENCES proceeds at scale.
 *
 * Default is DRY: it prints a proposal table and writes NOTHING. With --write it
 * appends the proposed trope:<id> tags to each event's tags (dedup, never
 * removing existing tags), so the change is reviewable in git before it lands.
 *
 * Proposed ids are validated against the canonical catalog; an unknown id is
 * dropped with a warning (the model is told the catalog, but we never trust it to
 * apply a tag the sim's content loader would later reject).
 *
 * Usage:
 *   GEMINI_API_KEY=… pnpm retag-tropes                 # dry, report only
 *   GEMINI_API_KEY=… pnpm retag-tropes --write          # apply proposed tags
 *   …             pnpm retag-tropes --era mogul          # one era
 *   …             pnpm retag-tropes --only-untagged      # skip already-tagged events
 *
 * DEV script (node ESM); never shipped in the game bundle.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { retagEvent } from "./gemini.mjs";
import { loadTropes } from "./prompt.mjs";

const ERAS_DIR = "src/data/eras";

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const WRITE = process.argv.includes("--write");
const ONLY_UNTAGGED = process.argv.includes("--only-untagged");
const ONLY_ERA = arg("era", "");

const CATALOG = new Set(loadTropes().map((t) => t.id));

function existingTropes(ev) {
  return (ev.tags ?? [])
    .filter((t) => t.startsWith("trope:"))
    .map((t) => t.slice("trope:".length));
}

async function retagEra(eraId) {
  const path = join(ERAS_DIR, `${eraId}.json`);
  const data = JSON.parse(readFileSync(path, "utf8"));
  let proposed = 0;
  let applied = 0;
  console.log(`\n=== ${eraId} (${data.events.length} events) ===`);
  for (const ev of data.events) {
    if (ONLY_UNTAGGED && existingTropes(ev).length > 0) continue;
    const verdict = await retagEvent({ event: ev });
    const valid = (verdict.tropes ?? []).filter((id) => {
      if (CATALOG.has(id)) return true;
      console.log(`    ! ${ev.id}: dropping unknown trope "${id}"`);
      return false;
    });
    if (valid.length === 0) {
      console.log(`  [—] ${ev.id}: no trope (${verdict.why})`);
      continue;
    }
    proposed += valid.length;
    const have = new Set(existingTropes(ev));
    const fresh = valid.filter((id) => !have.has(id));
    const mark = fresh.length ? "+" : "=";
    console.log(`  [${mark}] ${ev.id}: ${valid.join(", ")} — ${verdict.why}`);
    if (WRITE && fresh.length) {
      ev.tags = [...(ev.tags ?? []), ...fresh.map((id) => `trope:${id}`)];
      applied += fresh.length;
    }
  }
  if (WRITE && applied) {
    writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
    console.log(`  wrote ${applied} new trope tags → ${path} (validate: pnpm test)`);
  }
  return { proposed, applied };
}

async function main() {
  const index = JSON.parse(readFileSync(join(ERAS_DIR, "index.json"), "utf8"));
  const eras = index.eras.filter((e) => !ONLY_ERA || e.id === ONLY_ERA);
  let proposed = 0;
  let applied = 0;
  for (const era of eras) {
    const r = await retagEra(era.id);
    proposed += r.proposed;
    applied += r.applied;
  }
  console.log(
    `\nDONE — ${proposed} trope classifications; ${WRITE ? `${applied} tags written` : "dry run (pass --write to apply)"}.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
