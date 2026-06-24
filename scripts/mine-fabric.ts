/**
 * MINE FABRIC (FS-4) — walk the 504-act corpus, score every scene via the pure miner core
 * (src/sim/saga/mineFabric.ts), and extract the STANDOUT scenes (top by uniqueness + crossing + quality)
 * into the branch FABRIC of the one dynasty spine. The templated bulk is left behind (the corpus files
 * stay as the source of record; the fabric is the curated subset the spine's trigger lattice draws from).
 *
 *   pnpm vite-node scripts/mine-fabric.ts -- [--keep 0.2] [--out src/data/saga/fabric/index.json]
 *   pnpm vite-node scripts/mine-fabric.ts -- --prune-one
 *   pnpm vite-node scripts/mine-fabric.ts -- --prune-n 5
 *   pnpm vite-node scripts/mine-fabric.ts -- --prune-auto
 *   pnpm vite-node scripts/mine-fabric.ts -- --prune-all
 *   pnpm vite-node scripts/mine-fabric.ts -- --keepers 24
 *
 * Output: a fabric index keyed by family(wave) × era × setting, each entry the kept scene's id + provenance
 * + the borrowable source vignettes. Deterministic — same corpus → same fabric. Reviewable as a diff.
 * `--prune-one` is the reductive editorial path: remove exactly one least-scannable kept entry from the
 * existing index and append a transaction record describing the gap to refill later.
 * `--prune-n`, `--prune-auto`, and `--prune-all` reuse this transaction model. `--prune-auto` chooses a
 * small candidate pool through cheap pre-read heuristics before running the library-backed prose audit.
 * (POV-shift rewrite of the kept scenes into spine branches is FS-5's authoring step, fed by this index.)
 */

import { appendFileSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  applyPruneToIndex,
  buildKeeperReport,
  buildPruneTransactions,
  DEFAULT_KEEPER_REPORT_COUNT,
  type FabricEntry,
  type FabricIndex,
  type PruneMode,
  selectPruneCandidates,
} from "../src/sim/saga/pruneFabric";
import { type MineScene, selectFabric } from "../src/sim/saga/mineFabric";

const SAGA_ROOT = "src/data/saga";
const ACT_FILE = /^(?<archetype>[a-z_]+)\.(?<cls>poor|middle)\.act\.json$/;

const arg = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const KEEP = Number(arg("keep") ?? "0.2");
const OUT = arg("out") ?? "src/data/saga/fabric/index.json";
const TRANSACTIONS = arg("transactions") ?? "src/data/saga/fabric/transactions.ndjson";
const KEEPER_OUT = arg("keeper-out") ?? "src/data/saga/fabric/keepers.json";
const PRUNE_ONE = process.argv.includes("--prune-one");
const PRUNE_N = arg("prune-n") !== undefined ? Number(arg("prune-n")) : undefined;
const PRUNE_AUTO = process.argv.includes("--prune-auto");
const PRUNE_ALL = process.argv.includes("--prune-all");

function optionalPositiveIntegerFlag(name: string, fallback: number): number | null {
  const i = process.argv.indexOf(`--${name}`);
  if (i < 0) return null;
  const raw = process.argv[i + 1];
  if (!raw || raw.startsWith("--")) return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) throw new Error(`--${name} must be a positive integer.`);
  return n;
}

const KEEPERS = optionalPositiveIntegerFlag("keepers", DEFAULT_KEEPER_REPORT_COUNT);

interface ActFile {
  acts: Array<{ id: string; wave?: string; tier: number; macroAct: string; scenes: string[] }>;
  scenes: MineScene[];
}

/** Walk the corpus → every scene tagged with its wave + the act/era it came from. */
function loadCorpus(): {
  scenes: MineScene[];
  meta: Map<string, { wave: string; era: string; tier: number }>;
} {
  const scenes: MineScene[] = [];
  const meta = new Map<string, { wave: string; era: string; tier: number }>();
  for (const wave of readdirSync(SAGA_ROOT, { withFileTypes: true })) {
    if (!wave.isDirectory() || wave.name === "codex" || wave.name === "fabric") continue;
    for (const f of readdirSync(join(SAGA_ROOT, wave.name))) {
      if (!ACT_FILE.test(f)) continue;
      const file = JSON.parse(readFileSync(join(SAGA_ROOT, wave.name, f), "utf8")) as ActFile;
      const actBySceneId = new Map<string, (typeof file.acts)[number]>();
      for (const act of file.acts) for (const sid of act.scenes) actBySceneId.set(sid, act);
      for (const s of file.scenes) {
        scenes.push(s);
        const act = actBySceneId.get(s.id);
        meta.set(s.id, {
          wave: wave.name,
          era: act?.macroAct ?? "convergence",
          tier: act?.tier ?? 0,
        });
      }
    }
  }
  return { scenes, meta };
}

function writePrunedIndex(index: FabricIndex): void {
  writeFileSync(OUT, `${JSON.stringify(index, null, 2)}\n`);
}

function appendTransactions(mode: PruneMode, picked: ReturnType<typeof selectPruneCandidates>, count?: number): void {
  const transactions = buildPruneTransactions(mode, picked, new Date().toISOString(), count);
  for (const tx of transactions) appendFileSync(TRANSACTIONS, `${JSON.stringify(tx)}\n`);
}

function prune(mode: PruneMode, count = 1): void {
  const index = JSON.parse(readFileSync(OUT, "utf8")) as FabricIndex;
  const picked = selectPruneCandidates(index, mode, count);
  if (picked.length === 0) throw new Error(`No prune candidate found in ${OUT}`);

  writePrunedIndex(applyPruneToIndex(index, picked));
  appendTransactions(mode, picked, count);
  console.error(
    `Pruned ${picked.length} fabric entr${picked.length === 1 ? "y" : "ies"} from ${OUT}; transactions appended to ${TRANSACTIONS}.`,
  );
}

function writeKeeperReport(count: number): void {
  const index = JSON.parse(readFileSync(OUT, "utf8")) as FabricIndex;
  const report = buildKeeperReport(index, count);
  writeFileSync(KEEPER_OUT, `${JSON.stringify(report, null, 2)}\n`);
  console.error(
    `Wrote ${KEEPER_OUT}: selected ${report.selectedCount}/${report.totalCandidates} keeper candidates from ${OUT}.`,
  );
}

function pruneRequest(): { mode: PruneMode; count?: number } | null {
  const requested = [PRUNE_ONE, PRUNE_N !== undefined, PRUNE_AUTO, PRUNE_ALL].filter(Boolean).length;
  if (requested > 1) throw new Error("Choose only one prune mode.");
  if (PRUNE_ONE) return { mode: "one", count: 1 };
  if (PRUNE_N !== undefined) {
    if (!Number.isInteger(PRUNE_N) || PRUNE_N < 1) throw new Error("--prune-n must be a positive integer.");
    return { mode: "n", count: PRUNE_N };
  }
  if (PRUNE_AUTO) return { mode: "auto", count: 1 };
  if (PRUNE_ALL) return { mode: "all" };
  return null;
}

function main(): void {
  const requested = [PRUNE_ONE, PRUNE_N !== undefined, PRUNE_AUTO, PRUNE_ALL, KEEPERS !== null].filter(Boolean).length;
  if (requested > 1) throw new Error("Choose only one mine-fabric action.");

  const pruneReq = pruneRequest();
  if (pruneReq) {
    prune(pruneReq.mode, pruneReq.count);
    return;
  }
  if (KEEPERS !== null) {
    writeKeeperReport(KEEPERS);
    return;
  }

  const { scenes, meta } = loadCorpus();
  console.error(`Mining ${scenes.length} scenes across the corpus (keep top ${KEEP})…`);

  const kept = selectFabric(scenes, KEEP);
  const sceneById = new Map(scenes.map((s) => [s.id, s]));

  // Fabric index: family(wave) → era → list of kept branch sources.
  const fabric: Record<
    string,
    Record<
      string,
      Array<{
        sceneId: string;
        tier: number;
        score: number;
        maxSimilarity: number;
        settings: string[];
        vignettes: string[];
      }>
    >
  > = {};
  for (const k of kept) {
    const m = meta.get(k.id);
    const sc = sceneById.get(k.id);
    if (!m || !sc) continue;
    // Prefer the GenAI-tagged source braid-slot vignettes (the bespoke borrowable fragments). When a kept
    // scene has none — only italian/ireland got braid-slot tagging; the other 5 families have rich PROSE but
    // no slots — fall back to the scene's first substantial prose paragraph, so EVERY family contributes
    // borrowable crossing prose (CORPUS-MINE-INTERSECTIONS). Deterministic (first qualifying paragraph).
    const slotVignettes = (sc.braidSlots ?? [])
      .filter((b) => b.kind === "source" && b.vignette)
      .map((b) => b.vignette as string);
    const proseFallback = sc.prose.find((p) => p.length > 40);
    const vignettes = slotVignettes.length > 0 ? slotVignettes : proseFallback ? [proseFallback] : [];
    (fabric[m.wave] ??= {});
    (fabric[m.wave]![m.era] ??= []);
    fabric[m.wave]![m.era]!.push({
      sceneId: k.id,
      tier: m.tier,
      score: Number(k.score.toFixed(4)),
      maxSimilarity: Number(k.maxSimilarity.toFixed(4)),
      settings: k.settings,
      vignettes,
    });
  }

  // Stable ordering: sort each era's list by score desc then id.
  for (const wave of Object.values(fabric))
    for (const list of Object.values(wave))
      list.sort((a, b) => b.score - a.score || a.sceneId.localeCompare(b.sceneId));

  const out = {
    generated: "FS-4 mine-fabric (deterministic)",
    keepFraction: KEEP,
    totalScenes: scenes.length,
    keptScenes: kept.length,
    similarity: {
      meanMaxSimilarity: Number(
        (kept.reduce((sum, k) => sum + k.maxSimilarity, 0) / Math.max(1, kept.length)).toFixed(4),
      ),
      highSimilarityKept: kept.filter((k) => k.maxSimilarity >= 0.82).length,
    },
    byEra: Object.fromEntries(
      ["founding", "convergence", "emergence", "ascension"].map((e) => [
        e,
        kept.filter((k) => meta.get(k.id)?.era === e).length,
      ]),
    ),
    fabric,
  };
  writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`);
  console.error(
    `Wrote ${OUT}: kept ${kept.length}/${scenes.length} scenes as fabric across ${Object.keys(fabric).length} waves.`,
  );
  console.error(`By era: ${JSON.stringify(out.byEra)}`);
}

main();
