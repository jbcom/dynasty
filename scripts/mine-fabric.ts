/**
 * MINE FABRIC (FS-4) — walk the 504-act corpus, score every scene via the pure miner core
 * (src/sim/saga/mineFabric.ts), and extract the STANDOUT scenes (top by uniqueness + crossing + quality)
 * into the branch FABRIC of the one dynasty spine. The templated bulk is left behind (the corpus files
 * stay as the source of record; the fabric is the curated subset the spine's trigger lattice draws from).
 *
 *   pnpm vite-node scripts/mine-fabric.ts -- [--keep 0.2] [--out src/data/saga/fabric/index.json]
 *
 * Output: a fabric index keyed by family(wave) × era × setting, each entry the kept scene's id + provenance
 * + the borrowable source vignettes. Deterministic — same corpus → same fabric. Reviewable as a diff.
 * (POV-shift rewrite of the kept scenes into spine branches is FS-5's authoring step, fed by this index.)
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { type MineScene, selectFabric } from "../src/sim/saga/mineFabric";

const SAGA_ROOT = "src/data/saga";
const ACT_FILE = /^(?<archetype>[a-z_]+)\.(?<cls>poor|middle)\.act\.json$/;

const arg = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const KEEP = Number(arg("keep") ?? "0.2");
const OUT = arg("out") ?? "src/data/saga/fabric/index.json";

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

function main(): void {
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
