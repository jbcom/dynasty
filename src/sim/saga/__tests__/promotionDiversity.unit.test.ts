import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { loadSaga } from "../../../data/loadSaga";
import promotionMap from "../../../data/saga/fabric/promotion-diversity.json" with { type: "json" };
import {
  buildPromotionDiversityMap,
  type FabricPromotionTransaction,
  keeperScoreFromSource,
  type PromotionDiversityMap,
} from "../promotionDiversity";

const EXPECTED_PROMOTIONS = [
  {
    sceneId: "act:ireland:economic:poor:t0:turn",
    sourceEra: "convergence",
    wave: "ireland",
    tier: 0,
    keeperScore: 0.855,
    spineTarget: "spine:g3:gildedage:keeper_ireland_coal",
  },
  {
    sceneId: "act:ireland:athletic:poor:t3:rising",
    sourceEra: "emergence",
    wave: "ireland",
    tier: 3,
    keeperScore: 0.841,
    spineTarget: "spine:g4:progressive:keeper_ireland_ward_champion",
  },
  {
    sceneId: "act:ireland:religious:poor:t5:midpoint",
    sourceEra: "ascension",
    wave: "ireland",
    tier: 5,
    keeperScore: 0.82,
    spineTarget: "spine:g9:interstellar:keeper_ireland_receiver",
  },
] as const;

function transactions(): FabricPromotionTransaction[] {
  return readFileSync("src/data/saga/fabric/transactions.ndjson", "utf8")
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line) as FabricPromotionTransaction);
}

describe("KEY-PILLARS-6 promotion diversity map", () => {
  it("builds a deterministic read-only map from promotion transactions", () => {
    expect(keeperScoreFromSource("src/data/saga/fabric/keepers.json keeperScore 0.841")).toBe(
      0.841,
    );

    const report = buildPromotionDiversityMap([
      {
        type: "fabric-prune-n",
        sceneId: "act:ignored",
      },
      {
        ts: "2026-06-25T00:00:00Z",
        type: "fabric-promote-keeper",
        sceneId: "act:ireland:economic:poor:t0:turn",
        promotedTo: "spine:g3:gildedage:keeper_ireland_coal",
        wave: "ireland",
        era: "convergence",
        tier: 0,
        source: "src/data/saga/fabric/keepers.json keeperScore 0.855",
      },
      {
        ts: "2026-06-25T00:10:00Z",
        type: "fabric-promote-keeper",
        sceneId: "act:ireland:athletic:poor:t3:rising",
        promotedTo: "spine:g4:progressive:keeper_ireland_ward_champion",
        wave: "ireland",
        era: "emergence",
        tier: 3,
        source: "src/data/saga/fabric/keepers.json keeperScore 0.841",
      },
    ]);

    expect(report).toMatchObject({
      promotedCount: 2,
      bySourceEra: { convergence: 1, emergence: 1 },
      byWave: { ireland: 2 },
      byTier: { "0": 1, "3": 1 },
      nextDiversification: {
        sourceEraGaps: ["ascension"],
        overrepresentedWaves: ["ireland"],
      },
    });
    expect(report.nextDiversification.guidance).toContain("ascension");
    expect(report.nextDiversification.guidance).toContain("outside ireland");
  });

  it("matches the live transaction log and names the next diversity pressure", () => {
    const report = promotionMap as PromotionDiversityMap;
    expect(report).toEqual(buildPromotionDiversityMap(transactions()));
    expect(report.promotedCount).toBe(3);
    expect(report.bySourceEra).toEqual({ convergence: 1, emergence: 1, ascension: 1 });
    expect(report.byWave).toEqual({ ireland: 3 });
    expect(report.byTier).toEqual({ "0": 1, "3": 1, "5": 1 });
    expect(report.nextDiversification.sourceEraGaps).toEqual([]);
    expect(report.nextDiversification.overrepresentedWaves).toEqual(["ireland"]);
    expect(report.nextDiversification.guidance).toContain("non-ireland");
    expect(
      report.promotions.map(({ transactionTs: _transactionTs, ...promotion }) => promotion),
    ).toEqual(EXPECTED_PROMOTIONS);

    const corpus = loadSaga();
    for (const promotion of report.promotions) {
      expect(
        corpus.scenes.has(promotion.spineTarget),
        `${promotion.spineTarget} exists in the spine`,
      ).toBe(true);
    }
  });
});
