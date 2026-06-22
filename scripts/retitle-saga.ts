/**
 * RETITLE SAGA — give every act a DISTINCT, family-specific chapter title (the MESO layer), replacing
 * the generic per-tier seed ("The Crossing"/"The Climb"/…) that was reused across every line. For each
 * act in each saga act file (src/data/saga/<wave>/<arch>.<cls>.act.json), it asks Gemini for one
 * chapter title rooted in that act's
 * OPENING PROSE + cell, normalizes it ("Act <roman> — <title>", leak-free, not an echo of the cue), and
 * rewrites only the act's `title` — the verified prose is untouched. A dev maintenance script (vite-node).
 *
 * Usage: GEMINI_API_KEY=… pnpm vite-node scripts/retitle-saga.ts [--dry]
 */
import { globSync, readFileSync, writeFileSync } from "node:fs";
import { geminiGenerate } from "../src/sim/genai/client";
import { buildTitlePrompt, normalizeTitle, titleSystemInstruction } from "../src/sim/genai/scene";

const DRY = process.argv.includes("--dry");

/** Parse an act id `act:<wave>:<archetype>:<cls>:t<tier>` into its parts. */
function parseActId(id: string): { wave: string; archetype: string; cls: string; tier: number } | null {
  const m = /^act:([^:]+):([^:]+):([^:]+):t(\d)$/.exec(id);
  if (!m) return null;
  return { wave: m[1] as string, archetype: m[2] as string, cls: m[3] as string, tier: Number(m[4]) };
}

const GENERIC_CUES = [
  "The Crossing",
  "The New Ground",
  "The Climb",
  "A Name in the World",
  "The World Player",
  "The Reach for the Stars",
];

async function main() {
  const key = process.env.GEMINI_API_KEY ?? "";
  if (!key) {
    console.error("GEMINI_API_KEY not set.");
    process.exit(1);
  }
  const gen = geminiGenerate(key);
  const files = globSync("src/data/saga/**/*.act.json");
  let retitled = 0;
  let skipped = 0;
  for (const file of files) {
    const data = JSON.parse(readFileSync(file, "utf8")) as {
      acts?: Array<{ id: string; title: string; scenes: string[]; tier: number }>;
      scenes?: Array<{ id: string; prose: string[] }>;
      [k: string]: unknown;
    };
    const sceneById = new Map((data.scenes ?? []).map((s) => [s.id, s]));
    let changed = false;
    for (const act of data.acts ?? []) {
      const cell = parseActId(act.id);
      if (!cell) continue;
      const opening = sceneById.get(act.scenes[0] ?? "");
      const openingProse = (opening?.prose ?? []).join(" ");
      if (!openingProse) continue;
      const cue = GENERIC_CUES[cell.tier] ?? "";
      try {
        const raw = await gen(titleSystemInstruction(), buildTitlePrompt({ ...cell, openingProse, cue }));
        const norm = normalizeTitle(raw, cell.tier, cue);
        if (norm.ok) {
          if (norm.title !== act.title) {
            act.title = norm.title;
            changed = true;
            retitled++;
            console.error(`  ${act.id} → ${norm.title}`);
          }
        } else {
          skipped++;
          console.error(`  ✗ ${act.id}: ${norm.reason} (kept "${act.title}")`);
        }
      } catch (e) {
        skipped++;
        console.error(`  ✗ ${act.id}: ${(e as Error).message}`);
      }
    }
    if (changed && !DRY) writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
  }
  console.error(`\n${DRY ? "[dry] would retitle" : "retitled"} ${retitled} act(s); ${skipped} kept/failed.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
