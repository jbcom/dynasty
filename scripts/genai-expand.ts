/**
 * SS-11 — `pnpm genai:expand`: the uniform multi-type GenAI content expander.
 *
 * Wires the live Gemini key to the in-engine, harness-gated expander (src/sim/genai/expand.ts).
 * Pipeline: --type + scope → build prompt → Gemini → parse → VALIDATE through the gate → report,
 * and with --write MERGE the accepted items INTO THE CANONICAL JSON file for that type (no
 * `.gen.json` shadow). DRY by default. Generated content is git-reviewed AND re-validated by the
 * harness audit before it ships.
 *
 * Usage:
 *   GEMINI_API_KEY=… pnpm genai:expand --type events --place ireland --era origins --count 5
 *   GEMINI_API_KEY=… pnpm genai:expand --type tropes --count 3 --write
 *   GEMINI_API_KEY=… pnpm genai:expand --type endings --count 2 --write
 *
 * Never shipped in the game bundle — a dev script (vite-node).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { loadContent } from "../src/data/loadContent";
import { geminiGenerate } from "../src/sim/genai/client";
import { type ExpandRequest, EXPAND_TYPES, type ExpandType, expand } from "../src/sim/genai/expand";

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
  const type = arg("type") as ExpandType | undefined;
  if (!type || !EXPAND_TYPES.includes(type)) {
    console.error(`--type must be one of: ${EXPAND_TYPES.join(", ")}`);
    process.exit(1);
  }
  const content = loadContent();
  const req: ExpandRequest = {
    type,
    count: Number(arg("count", "3")),
    target: {
      ...(arg("place") ? { place: arg("place") } : {}),
      ...(arg("era") ? { era: arg("era") } : {}),
      ...(arg("year") ? { year: Number(arg("year")) } : {}),
      ...(arg("archetypes") ? { archetypes: arg("archetypes")?.split(",") } : {}),
    },
  };

  console.error(`Expanding ${req.count} ${type}${req.target?.place ? ` for ${req.target.place}` : ""}…`);
  const result = await expand(content, req, geminiGenerate(key));

  console.error(`\nACCEPTED: ${result.accepted.length} → ${result.canonicalFile}`);
  for (const e of result.accepted) console.error(`  ✓ ${(e as { id?: string }).id}`);
  console.error(`REJECTED: ${result.rejected.length}`);
  for (const r of result.rejected) console.error(`  ✗ ${r.reasons.join("; ")}`);

  if (!WRITE) {
    console.error("\n(dry run — pass --write to merge the accepted items into the canonical file)");
    return;
  }
  if (result.accepted.length === 0) {
    console.error("nothing accepted — nothing written.");
    return;
  }
  const existing = (() => {
    try {
      return JSON.parse(readFileSync(result.canonicalFile, "utf8"));
    } catch {
      return {};
    }
  })();
  const merged = result.merge(existing);
  writeFileSync(result.canonicalFile, `${JSON.stringify(merged, null, 2)}\n`);
  console.error(`\nmerged ${result.accepted.length} into ${result.canonicalFile}`);
  console.error("NOW: run `pnpm test` (harness audit must stay 0 findings) before committing.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
