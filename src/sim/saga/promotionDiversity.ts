export const PROMOTION_DIVERSITY_ERAS = ["convergence", "emergence", "ascension"] as const;

export interface FabricPromotionTransaction {
  ts?: string;
  type?: string;
  sceneId?: string;
  promotedTo?: string;
  wave?: string;
  era?: string;
  tier?: number;
  source?: string;
  [key: string]: unknown;
}

export interface PromotionDiversityRecord {
  transactionTs: string;
  sceneId: string;
  sourceEra: string;
  wave: string;
  tier: number;
  keeperScore: number;
  spineTarget: string;
}

export interface PromotionDiversityMap {
  generated: "KEY-PILLARS-6 fabric keeper promotion diversity map";
  source: string;
  requiredSourceEras: string[];
  promotedCount: number;
  bySourceEra: Record<string, number>;
  byWave: Record<string, number>;
  byTier: Record<string, number>;
  nextDiversification: {
    sourceEraGaps: string[];
    overrepresentedWaves: string[];
    guidance: string;
  };
  promotions: PromotionDiversityRecord[];
}

const SOURCE = "src/data/saga/fabric/transactions.ndjson type=fabric-promote-keeper";
const ERA_RANK = new Map<string, number>(
  PROMOTION_DIVERSITY_ERAS.map((era, index) => [era, index]),
);

function round(n: number, places = 3): number {
  const mult = 10 ** places;
  return Math.round(n * mult) / mult;
}

export function keeperScoreFromSource(source: string): number | null {
  const match = /\bkeeperScore\s+(\d+(?:\.\d+)?)/.exec(source);
  if (!match) return null;
  const rawScore = match[1];
  if (!rawScore) return null;
  return round(Number(rawScore));
}

function requireString(value: string | undefined, field: string, sceneId = "unknown"): string {
  if (!value) throw new Error(`fabric-promote-keeper ${sceneId} is missing ${field}`);
  return value;
}

function requireTier(value: number | undefined, sceneId: string): number {
  if (typeof value !== "number" || !Number.isInteger(value))
    throw new Error(`fabric-promote-keeper ${sceneId} is missing integer tier`);
  return value;
}

function promotionRecord(tx: FabricPromotionTransaction): PromotionDiversityRecord {
  const sceneId = requireString(tx.sceneId, "sceneId");
  const source = requireString(tx.source, "source", sceneId);
  const keeperScore = keeperScoreFromSource(source);
  if (keeperScore === null)
    throw new Error(`fabric-promote-keeper ${sceneId} source is missing keeperScore`);
  return {
    transactionTs: requireString(tx.ts, "ts", sceneId),
    sceneId,
    sourceEra: requireString(tx.era, "era", sceneId),
    wave: requireString(tx.wave, "wave", sceneId),
    tier: requireTier(tx.tier, sceneId),
    keeperScore,
    spineTarget: requireString(tx.promotedTo, "promotedTo", sceneId),
  };
}

function increment(counts: Record<string, number>, key: string): void {
  counts[key] = (counts[key] ?? 0) + 1;
}

function comparePromotions(a: PromotionDiversityRecord, b: PromotionDiversityRecord): number {
  return (
    (ERA_RANK.get(a.sourceEra) ?? 99) - (ERA_RANK.get(b.sourceEra) ?? 99) ||
    a.wave.localeCompare(b.wave) ||
    a.tier - b.tier ||
    a.sceneId.localeCompare(b.sceneId)
  );
}

function guidance(sourceEraGaps: string[], overrepresentedWaves: string[]): string {
  if (sourceEraGaps.length > 0 && overrepresentedWaves.length > 0) {
    return `Prefer ${sourceEraGaps.join("/")} source-era keepers outside ${overrepresentedWaves.join(
      "/",
    )} before repeating the current promotion pattern.`;
  }
  if (sourceEraGaps.length > 0) {
    return `Prefer ${sourceEraGaps.join("/")} source-era keepers before repeating covered era bands.`;
  }
  if (overrepresentedWaves.length > 0) {
    return `Era cadence covers convergence, emergence, and ascension; next promotion should prefer a non-${overrepresentedWaves.join(
      "/non-",
    )} keeper before another repeated source wave.`;
  }
  return "Era and wave cadence is currently balanced; choose the next keeper by weakest spine need and strongest keeperScore.";
}

export function buildPromotionDiversityMap(
  transactions: FabricPromotionTransaction[],
  source = SOURCE,
): PromotionDiversityMap {
  const promotions = transactions
    .filter((tx) => tx.type === "fabric-promote-keeper")
    .map(promotionRecord)
    .sort(comparePromotions);

  const bySourceEra: Record<string, number> = {};
  const byWave: Record<string, number> = {};
  const byTier: Record<string, number> = {};
  for (const promotion of promotions) {
    increment(bySourceEra, promotion.sourceEra);
    increment(byWave, promotion.wave);
    increment(byTier, String(promotion.tier));
  }

  const sourceEraGaps = PROMOTION_DIVERSITY_ERAS.filter((era) => !bySourceEra[era]);
  const overrepresentedWaves = Object.entries(byWave)
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([wave]) => wave);

  return {
    generated: "KEY-PILLARS-6 fabric keeper promotion diversity map",
    source,
    requiredSourceEras: [...PROMOTION_DIVERSITY_ERAS],
    promotedCount: promotions.length,
    bySourceEra,
    byWave,
    byTier,
    nextDiversification: {
      sourceEraGaps,
      overrepresentedWaves,
      guidance: guidance(sourceEraGaps, overrepresentedWaves),
    },
    promotions,
  };
}
