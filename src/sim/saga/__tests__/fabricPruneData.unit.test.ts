import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import fabricIndex from "../../../data/saga/fabric/index.json" with { type: "json" };
import keeperReport from "../../../data/saga/fabric/keepers.json" with { type: "json" };
import proseBaseline from "../../../data/saga/prose-quality-baseline.json" with { type: "json" };

const KEY_PILLARS_5_PRUNED = [
  {
    sceneId: "act:bavaria:entertainment:poor:t3:midpoint",
    wave: "bavaria",
    era: "emergence",
    tier: 3,
    reason: [
      "scanScore 0",
      "clarityScore 0.044",
      "Flesch reading ease 8.6",
      "Flesch-Kincaid 23.3",
      "average sentence 45.33 words",
      "cheap pre-read score 2.337",
    ],
  },
  {
    sceneId: "act:bavaria:technological:poor:t3:midpoint",
    wave: "bavaria",
    era: "emergence",
    tier: 3,
    reason: [
      "scanScore 0",
      "clarityScore 0.175",
      "Flesch reading ease 8.7",
      "Flesch-Kincaid 25.3",
      "average sentence 53.5 words",
      "cheap pre-read score 1.167",
    ],
  },
  {
    sceneId: "act:bavaria:athletic:poor:t4:turn",
    wave: "bavaria",
    era: "ascension",
    tier: 4,
    reason: [
      "scanScore 0.005",
      "clarityScore 0.123",
      "Flesch reading ease 13.2",
      "Flesch-Kincaid 21.5",
      "average sentence 40.67 words",
      "cheap pre-read score 1.84",
    ],
  },
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

    expect(fabricIndex.byEra.emergence).toBe(153);
    expect(fabricIndex.byEra.ascension).toBe(223);

    for (const { sceneId } of KEY_PILLARS_5_PRUNED) {
      expect(retained.has(sceneId), `${sceneId} should be pruned from played fabric`).toBe(false);
    }

    const prunedSceneIds = KEY_PILLARS_5_PRUNED.map((expected) => expected.sceneId);
    const txByScene = new Map(
      transactions()
        .filter((tx) => prunedSceneIds.includes(tx.sceneId as (typeof prunedSceneIds)[number]))
        .map((tx) => [tx.sceneId, tx]),
    );
    expect(txByScene.size).toBe(KEY_PILLARS_5_PRUNED.length);
    for (const expected of KEY_PILLARS_5_PRUNED) {
      const { sceneId, wave, era, tier } = expected;
      const tx = txByScene.get(sceneId);
      expect(tx).toMatchObject({
        type: "fabric-prune-n",
        sceneId,
        wave,
        era,
        tier,
        source: "scripts/mine-fabric.ts --prune-n 3",
      });
      for (const reasonFragment of expected.reason) expect(tx?.reason).toContain(reasonFragment);
      expect(tx?.gap).toContain("rewritten non-first-person replacement");
      expect(tx?.gap).toContain(`${era} ${wave} tier-${tier} ${sceneId}`);
    }
  });

  it("ratchets the prose baseline after removing the worst live fabric failures", () => {
    expect(proseBaseline.total).toBe(623);
    expect(proseBaseline.failed).toBe(283);
    expect(proseBaseline.passRate).toBeGreaterThanOrEqual(0.546);
    expect(proseBaseline.minScanScore).toBeGreaterThan(0);
    const worstLabels = new Set(proseBaseline.worst.map((entry) => entry.label));
    for (const { sceneId, wave, era } of KEY_PILLARS_5_PRUNED) {
      expect(worstLabels.has(`fabric:${wave}:${era}:${sceneId}`)).toBe(false);
    }
  });
});
