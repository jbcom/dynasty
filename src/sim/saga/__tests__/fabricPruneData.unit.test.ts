import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import fabricIndex from "../../../data/saga/fabric/index.json" with { type: "json" };
import keeperReport from "../../../data/saga/fabric/keepers.json" with { type: "json" };
import proseBaseline from "../../../data/saga/prose-quality-baseline.json" with { type: "json" };

const KEY_PILLARS_5_PRUNED = [
  "act:bavaria:entertainment:poor:t3:midpoint",
  "act:bavaria:technological:poor:t3:midpoint",
  "act:bavaria:athletic:poor:t4:turn",
] as const;

function retainedSceneIds(): Set<string> {
  const ids = new Set<string>();
  for (const eras of Object.values(fabricIndex.fabric)) {
    for (const entries of Object.values(eras)) {
      for (const entry of entries) ids.add(entry.sceneId);
    }
  }
  return ids;
}

function transactions(): Array<{
  type?: string;
  sceneId?: string;
  source?: string;
  reason?: string;
  gap?: string;
}> {
  return readFileSync("src/data/saga/fabric/transactions.ndjson", "utf8")
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
}

describe("KEY-PILLARS-5 fabric chaff prune data", () => {
  it("removes the reviewed prune-n batch from played fabric and records rewrite gaps", () => {
    const retained = retainedSceneIds();
    expect(fabricIndex.keptScenes).toBe(499);
    expect(keeperReport.totalCandidates).toBe(499);

    for (const sceneId of KEY_PILLARS_5_PRUNED) {
      expect(retained.has(sceneId), `${sceneId} should be pruned from played fabric`).toBe(false);
    }

    const txByScene = new Map(
      transactions()
        .filter((tx) =>
          KEY_PILLARS_5_PRUNED.includes(tx.sceneId as (typeof KEY_PILLARS_5_PRUNED)[number]),
        )
        .map((tx) => [tx.sceneId, tx]),
    );
    expect(txByScene.size).toBe(KEY_PILLARS_5_PRUNED.length);
    for (const sceneId of KEY_PILLARS_5_PRUNED) {
      const tx = txByScene.get(sceneId);
      expect(tx).toMatchObject({
        type: "fabric-prune-n",
        source: "scripts/mine-fabric.ts --prune-n 3",
      });
      expect(tx?.reason).toContain("scanScore");
      expect(tx?.reason).toContain("cheap pre-read score");
      expect(tx?.gap).toContain("rewritten non-first-person replacement");
    }
  });

  it("ratchets the prose baseline after removing the worst live fabric failures", () => {
    expect(proseBaseline.total).toBe(622);
    expect(proseBaseline.failed).toBe(283);
    expect(proseBaseline.passRate).toBeGreaterThanOrEqual(0.545);
    expect(proseBaseline.minScanScore).toBeGreaterThan(0);
    const worstLabels = new Set(proseBaseline.worst.map((entry) => entry.label));
    for (const sceneId of KEY_PILLARS_5_PRUNED) {
      expect(worstLabels.has(`fabric:bavaria:emergence:${sceneId}`)).toBe(false);
      expect(worstLabels.has(`fabric:bavaria:ascension:${sceneId}`)).toBe(false);
    }
  });
});
