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
 *   # NOVEL scene authoring — one act of one cell:
 *   GEMINI_API_KEY=… pnpm genai:expand --type scene --wave ireland --cls poor --archetype economic --tier 1 --write
 *   # …or sweep the WHOLE lattice (every wave × archetype × tier) to flesh the novel to length:
 *   GEMINI_API_KEY=… pnpm genai:expand --type scene --all --cls poor --write
 *
 * Never shipped in the game bundle — a dev script (vite-node).
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { loadContent } from "../src/data/loadContent";
import type { Rung } from "../src/sim/classRung";
import { geminiGenerate } from "../src/sim/genai/client";
import { type ExpandRequest, EXPAND_TYPES, type ExpandType, expand } from "../src/sim/genai/expand";
import { type Archetype, ARCHETYPES } from "../src/sim/slots";
import { SPINE_TIERS } from "../src/sim/spine";

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const WRITE = process.argv.includes("--write");
const ALL = process.argv.includes("--all");

/** Run one expand request, report, and (with --write) merge the accepted items into the canonical file. */
async function runOne(
  content: ReturnType<typeof loadContent>,
  req: ExpandRequest,
  generate: ReturnType<typeof geminiGenerate>,
  label: string,
): Promise<boolean> {
  console.error(`\n— ${label}`);
  const result = await expand(content, req, generate);
  console.error(`  ACCEPTED ${result.accepted.length} → ${result.canonicalFile}`);
  for (const r of result.rejected) console.error(`  ✗ ${r.reasons.join("; ")}`);
  if (!WRITE) return result.accepted.length > 0;
  if (result.accepted.length === 0) {
    console.error("  (nothing accepted — nothing written)");
    return false;
  }
  const existing = (() => {
    try {
      return JSON.parse(readFileSync(result.canonicalFile, "utf8"));
    } catch {
      return {};
    }
  })();
  const merged = result.merge(existing);
  mkdirSync(dirname(result.canonicalFile), { recursive: true });
  writeFileSync(result.canonicalFile, `${JSON.stringify(merged, null, 2)}\n`);
  console.error(`  merged → ${result.canonicalFile}`);
  return true;
}

/** The cells to author for scene mode: a single --wave/--archetype/--tier, or the full --all lattice. */
function sceneCells(content: ReturnType<typeof loadContent>): Array<{ wave: string; cls: Rung; archetype: Archetype; tier: number }> {
  const cls = (arg("cls", "poor") as Rung) ?? "poor";
  if (ALL) {
    const waves = content.places.filter((p) => p.kind !== "destination").map((p) => p.id);
    const tiers = arg("tiers") ? arg("tiers")!.split(",").map(Number) : SPINE_TIERS;
    const cells: Array<{ wave: string; cls: Rung; archetype: Archetype; tier: number }> = [];
    for (const wave of waves) for (const archetype of ARCHETYPES) for (const tier of tiers) cells.push({ wave, cls, archetype, tier });
    return cells;
  }
  return [
    {
      wave: arg("wave", "ireland") ?? "ireland",
      cls,
      archetype: (arg("archetype", "economic") as Archetype) ?? "economic",
      tier: Number(arg("tier", "0")),
    },
  ];
}

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
  const generate = geminiGenerate(key);

  if (type === "scene") {
    const cells = sceneCells(content);
    console.error(`Authoring ${cells.length} act(s) of the novel${ALL ? " (full lattice sweep)" : ""}…`);
    let ok = 0;
    for (const scene of cells) {
      const did = await runOne(
        content,
        { type, scene, count: 1 },
        generate,
        `act:${scene.wave}:${scene.archetype}:${scene.cls}:t${scene.tier}`,
      );
      if (did) ok += 1;
    }
    console.error(`\n${ok}/${cells.length} acts authored.`);
    if (WRITE) console.error("NOW: run `pnpm test` (harness audit must stay 0 findings) before committing.");
    return;
  }

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
  await runOne(content, req, generate, `${req.count} ${type}${req.target?.place ? ` for ${req.target.place}` : ""}`);
  if (WRITE) console.error("NOW: run `pnpm test` (harness audit must stay 0 findings) before committing.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
