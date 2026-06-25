import { writeFileSync } from "node:fs";
import promotionMap from "../src/data/saga/fabric/promotion-diversity.json";
import spineData from "../src/data/saga/spine.act.json";
import {
  buildVisualReliefCadenceReport,
  type PromotedEncounterAnchor,
} from "../src/sim/saga/visualReliefCadence";

const arg = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};

const OUT = arg("out") ?? "src/data/saga/visual-relief-cadence.json";

interface PromotionDiversityData {
  promotions: Array<{
    spineTarget: string;
    wave?: string;
    sourceEra?: string;
    keeperScore?: number;
  }>;
}

function promotedEncounterAnchors(): PromotedEncounterAnchor[] {
  return (promotionMap as PromotionDiversityData).promotions
    .map((promotion) => ({
      sceneId: promotion.spineTarget,
      wave: promotion.wave,
      sourceEra: promotion.sourceEra,
      keeperScore: promotion.keeperScore,
    }))
    .sort((a, b) => a.sceneId.localeCompare(b.sceneId));
}

const report = buildVisualReliefCadenceReport({
  saga: spineData,
  promotedEncounterAnchors: promotedEncounterAnchors(),
});

writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`);
console.error(
  `Wrote ${OUT}: ${report.summary.stretchesNeedingRelief} stretch(es) need relief; next target ${report.gaps.nextReliefTarget?.sceneId ?? "none"}.`,
);
