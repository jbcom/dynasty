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
import { auditProseQuality, type ProseQualityReport } from "../src/sim/proseQuality";
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
const PRUNE_ONE = process.argv.includes("--prune-one");
const PRUNE_N = arg("prune-n") !== undefined ? Number(arg("prune-n")) : undefined;
const PRUNE_AUTO = process.argv.includes("--prune-auto");
const PRUNE_ALL = process.argv.includes("--prune-all");

interface ActFile {
  acts: Array<{ id: string; wave?: string; tier: number; macroAct: string; scenes: string[] }>;
  scenes: MineScene[];
}

interface FabricEntry {
  sceneId: string;
  tier: number;
  score: number;
  maxSimilarity?: number;
  settings: string[];
  vignettes: string[];
}

interface FabricIndex {
  generated: string;
  keepFraction: number;
  totalScenes: number;
  keptScenes: number;
  byEra: Record<string, number>;
  fabric: Record<string, Record<string, FabricEntry[]>>;
}

interface PruneCandidate {
  wave: string;
  era: string;
  index: number;
  entry: FabricEntry;
  cheapScore: number;
}

interface AuditedPruneCandidate extends PruneCandidate {
  report: ProseQualityReport;
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

function recomputeCounts(fabric: FabricIndex["fabric"]): {
  keptScenes: number;
  byEra: Record<string, number>;
} {
  const byEra: Record<string, number> = {};
  let keptScenes = 0;
  for (const eras of Object.values(fabric)) {
    for (const [era, list] of Object.entries(eras)) {
      byEra[era] = (byEra[era] ?? 0) + list.length;
      keptScenes += list.length;
    }
  }
  return { keptScenes, byEra };
}

function words(text: string): string[] {
  return text.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) ?? [];
}

function sentenceWordCounts(text: string): number[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => words(sentence).length)
    .filter((count) => count > 0);
}

function cheapPruneScore(entry: FabricEntry): number {
  const text = entry.vignettes.join(" ");
  const counts = sentenceWordCounts(text);
  const wordCount = words(text).length;
  const avgSentenceWords = counts.length
    ? counts.reduce((sum, count) => sum + count, 0) / counts.length
    : wordCount;
  const maxSentenceWords = Math.max(0, ...counts);
  const longSentenceRatio = counts.length
    ? counts.filter((count) => count >= 36).length / counts.length
    : 0;
  const emptySettingsPenalty = entry.settings.length === 0 ? 0.25 : 0;
  return (
    Math.max(0, avgSentenceWords - 32) / 28 +
    Math.max(0, maxSentenceWords - 48) / 40 +
    longSentenceRatio +
    Math.max(0, wordCount - 120) / 160 +
    emptySettingsPenalty
  );
}

function collectCandidates(index: FabricIndex): PruneCandidate[] {
  const candidates: PruneCandidate[] = [];
  for (const [wave, eras] of Object.entries(index.fabric)) {
    for (const [era, list] of Object.entries(eras)) {
      for (let i = 0; i < list.length; i += 1) {
        const entry = list[i];
        if (!entry || entry.vignettes.length === 0) continue;
        candidates.push({
          wave,
          era,
          index: i,
          entry,
          cheapScore: cheapPruneScore(entry),
        });
      }
    }
  }
  return candidates;
}

function auditCandidate(candidate: PruneCandidate): AuditedPruneCandidate {
  return {
    ...candidate,
    report: auditProseQuality(
      `fabric:${candidate.wave}:${candidate.era}:${candidate.entry.sceneId}`,
      candidate.entry.vignettes,
    ),
  };
}

function compareAuditedPruneCandidates(a: AuditedPruneCandidate, b: AuditedPruneCandidate): number {
  return (
    Number(a.report.pass) - Number(b.report.pass) ||
    a.report.scanScore - b.report.scanScore ||
    a.report.clarityScore - b.report.clarityScore ||
    a.report.consistencyScore - b.report.consistencyScore ||
    b.cheapScore - a.cheapScore ||
    b.report.averageSentenceWords - a.report.averageSentenceWords ||
    a.entry.sceneId.localeCompare(b.entry.sceneId)
  );
}

function removePicked(index: FabricIndex, picked: AuditedPruneCandidate[]): void {
  const pickedIds = new Set(picked.map((candidate) => candidate.entry.sceneId));
  for (const eras of Object.values(index.fabric)) {
    for (const [era, list] of Object.entries(eras)) {
      eras[era] = list.filter((entry) => !pickedIds.has(entry.sceneId));
    }
  }
}

function writePrunedIndex(index: FabricIndex): void {
  const counts = recomputeCounts(index.fabric);
  index.keptScenes = counts.keptScenes;
  index.byEra = Object.fromEntries(
    [...new Set([...Object.keys(index.byEra ?? {}), ...Object.keys(counts.byEra)])].map((era) => [
      era,
      counts.byEra[era] ?? 0,
    ]),
  );
  writeFileSync(OUT, `${JSON.stringify(index, null, 2)}\n`);
}

function appendTransactions(mode: string, picked: AuditedPruneCandidate[]): void {
  const ts = new Date().toISOString();
  for (const pick of picked) {
    const tx = {
      ts,
      type: `fabric-prune-${mode}`,
      sceneId: pick.entry.sceneId,
      wave: pick.wave,
      era: pick.era,
      tier: pick.entry.tier,
      reason: `Removed played-fabric item: scanScore ${pick.report.scanScore}, clarityScore ${pick.report.clarityScore}, Flesch reading ease ${pick.report.fleschReadingEase}, Flesch-Kincaid ${pick.report.fleschKincaidGrade}, average sentence ${pick.report.averageSentenceWords} words, cheap pre-read score ${Number(pick.cheapScore.toFixed(3))}.`,
      gap: `${pick.era} ${pick.wave} tier-${pick.entry.tier} ${pick.entry.sceneId} needs a rewritten non-first-person replacement that serves the one-dynasty spine without dense legacy prose.`,
      source: `scripts/mine-fabric.ts --prune-${mode}`,
    };
    appendFileSync(TRANSACTIONS, `${JSON.stringify(tx)}\n`);
  }
}

function prune(mode: "one" | "n" | "auto" | "all", count = 1): void {
  const index = JSON.parse(readFileSync(OUT, "utf8")) as FabricIndex;
  let candidates = collectCandidates(index);
  if (mode === "auto") {
    candidates = candidates
      .sort((a, b) => b.cheapScore - a.cheapScore || a.entry.sceneId.localeCompare(b.entry.sceneId))
      .slice(0, Math.min(64, candidates.length));
  }
  const audited = candidates.map(auditCandidate).sort(compareAuditedPruneCandidates);
  const picked =
    mode === "all"
      ? audited.filter(
          (candidate) =>
            !candidate.report.pass &&
            (candidate.report.scanScore < 0.2 ||
              candidate.report.averageSentenceWords > 40 ||
              candidate.cheapScore >= 1.1),
        )
      : audited.slice(0, Math.max(1, count));
  if (picked.length === 0) throw new Error(`No prune candidate found in ${OUT}`);

  removePicked(index, picked);
  writePrunedIndex(index);
  appendTransactions(mode, picked);
  console.error(
    `Pruned ${picked.length} fabric entr${picked.length === 1 ? "y" : "ies"} from ${OUT}; transactions appended to ${TRANSACTIONS}.`,
  );
}

function pruneRequest(): { mode: "one" | "n" | "auto" | "all"; count?: number } | null {
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
  const pruneReq = pruneRequest();
  if (pruneReq) {
    prune(pruneReq.mode, pruneReq.count);
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
