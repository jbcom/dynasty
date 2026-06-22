/**
 * Prune orphan scenes from the saga corpus — scenes no act references (left behind when a
 * regenerated act replaces an older one with different scene ids). Idempotent + safe: it only
 * removes scenes not listed by ANY act in the same file, and rewrites the file in place. A dev
 * maintenance script (vite-node), never shipped.
 *
 * Usage: pnpm vite-node scripts/prune-saga-orphans.ts [--dry]
 */
import { globSync, readFileSync, writeFileSync } from "node:fs";

const DRY = process.argv.includes("--dry");

function main() {
  const files = globSync("src/data/saga/**/*.act.json");
  let totalPruned = 0;
  for (const file of files) {
    const data = JSON.parse(readFileSync(file, "utf8")) as {
      acts?: Array<{ scenes: string[] }>;
      scenes?: Array<{ id: string }>;
      [k: string]: unknown;
    };
    const referenced = new Set<string>();
    for (const act of data.acts ?? []) for (const id of act.scenes) referenced.add(id);
    const before = data.scenes?.length ?? 0;
    const kept = (data.scenes ?? []).filter((s) => referenced.has(s.id));
    const pruned = before - kept.length;
    if (pruned > 0) {
      totalPruned += pruned;
      console.error(`${file}: pruned ${pruned} orphan scene(s)`);
      if (!DRY) {
        writeFileSync(file, `${JSON.stringify({ ...data, scenes: kept }, null, 2)}\n`);
      }
    }
  }
  console.error(`\n${DRY ? "[dry] would prune" : "pruned"} ${totalPruned} orphan scene(s) across ${files.length} file(s).`);
}

main();
