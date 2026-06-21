/**
 * EX-4 — `pnpm genai:breadth`: the dev-bulk GenAI breadth runner.
 *
 * Wires the live Gemini key to the in-engine, harness-gated toolkit
 * (src/sim/genai). Pipeline: targets → buildPrompt → Gemini → parse → VALIDATE
 * through the gate (validate.ts — the same invariants the harness audit enforces) →
 * report, and only with --write append the ACCEPTED events into the matching
 * eras/<place>/<period>/<archetype-or-place>.gen.json file. DRY by default: proposes
 * + reports, commits nothing. Generated content is git-reviewed AND re-validated by
 * the harness audit before it lands.
 *
 * Usage:
 *   GEMINI_API_KEY=… pnpm genai:breadth                       # dry run, report only
 *   GEMINI_API_KEY=… pnpm genai:breadth --era origins --place ireland --count 3 --write
 *
 * Never shipped in the game bundle — a dev script (vite-node).
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { loadContent } from "../src/data/loadContent";
import { geminiGenerate } from "../src/sim/genai/client";
import { generateBreadth } from "../src/sim/genai/generate";
import type { GenTarget } from "../src/sim/genai/prompt";

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const WRITE = process.argv.includes("--write");

async function main() {
  const key = process.env.GEMINI_API_KEY ?? "";
  if (!key) {
    console.error("GEMINI_API_KEY not set — generation is opt-in and needs a key.");
    process.exit(1);
  }
  const content = loadContent();
  const era = arg("era", "origins") as string;
  const place = arg("place"); // optional
  const archetypesArg = arg("archetypes"); // comma-separated, optional
  const count = Number(arg("count", "3"));
  const eraDef = content.eras.find((e) => e.id === era);
  if (!eraDef) {
    console.error(`unknown era "${era}"`);
    process.exit(1);
  }

  const target: GenTarget = {
    era,
    year: eraDef.yearStart,
    count,
    ...(place ? { place } : {}),
    ...(archetypesArg ? { archetypes: archetypesArg.split(",") } : {}),
  };

  console.error(`Generating ${count} events for ${era}${place ? `/${place}` : ""}…`);
  const { accepted, rejected } = await generateBreadth(content, [target], geminiGenerate(key));

  console.error(`\nACCEPTED: ${accepted.length}`);
  for (const e of accepted) console.error(`  ✓ ${e.id} — ${e.title}`);
  console.error(`REJECTED: ${rejected.length}`);
  for (const r of rejected) console.error(`  ✗ ${r.reasons.join("; ")}`);

  if (!WRITE) {
    console.error("\n(dry run — pass --write to append the accepted events)");
    return;
  }
  if (accepted.length === 0) {
    console.error("nothing accepted — nothing written.");
    return;
  }
  // Write into a .gen.json sibling in the place/period dir so generated content is
  // visibly separate from hand-authored events.json and easy to review/revert.
  const periodDir = arg("period"); // e.g. 1885-1946-origins; required for --write
  if (!periodDir) {
    console.error("--write needs --period <dir> (e.g. 1885-1946-origins) to place the file.");
    process.exit(1);
  }
  const placeDir = place ?? "_shared";
  const out = join("src/data/eras", placeDir, periodDir, `${archetypesArg ?? "gen"}.gen.json`);
  mkdirSync(dirname(out), { recursive: true });
  const existing = (() => {
    try {
      return JSON.parse(readFileSync(out, "utf8")).events as unknown[];
    } catch {
      return [];
    }
  })();
  writeFileSync(out, `${JSON.stringify({ era, events: [...existing, ...accepted] }, null, 2)}\n`);
  console.error(`\nwrote ${accepted.length} events → ${out}`);
  console.error("NOW: run `pnpm test` (harness audit must stay 0 findings) before committing.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
