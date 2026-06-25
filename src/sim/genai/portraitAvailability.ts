import { ARCHETYPES } from "../slots";
import {
  compositePortraitKey,
  ERA_BAND_ORDER,
  type EraBand,
  encounterPortraitKey,
  type PortraitFacets,
  rivalEncounterFacets,
} from "./portrait";
import type { LifeStage, PortraitArchetype, PortraitGender, RungTier } from "./portraitFacets";

export const PORTRAIT_AVAILABILITY_LIFE_STAGES = [
  "infant",
  "child",
  "youth",
  "adult",
  "elder",
] as const satisfies readonly LifeStage[];
export const PORTRAIT_AVAILABILITY_TIERS = [
  "low",
  "mid",
  "high",
] as const satisfies readonly RungTier[];
export const PORTRAIT_AVAILABILITY_GENDERS = [
  "male",
  "female",
] as const satisfies readonly PortraitGender[];
export const PORTRAIT_AVAILABILITY_ARCHETYPES = [
  ...ARCHETYPES,
  "crime",
] as const satisfies readonly PortraitArchetype[];

export type ProtagonistPortraitSurface = "spine-live" | "opening";
export type EncounterPortraitSurface = "encounter";

export interface PortraitInventoryInput {
  manifestPaths: readonly string[];
  filesystemPaths: readonly string[];
  rivalPlaceIds: readonly string[];
  source?: Partial<PortraitAvailabilityReport["source"]>;
}

export interface GenderKeyAvailability {
  gender: PortraitGender;
  key: string;
  path: string;
  fileExists: boolean;
  manifestLogged: boolean;
  available: boolean;
}

export interface ProtagonistPortraitAvailabilityRow {
  surface: ProtagonistPortraitSurface;
  eraBand: EraBand;
  lifeStage: LifeStage;
  archetype: PortraitArchetype;
  rungTier: RungTier;
  availableGenderKeys: PortraitGender[];
  missingGenderKeys: PortraitGender[];
  unloggedFileGenderKeys: PortraitGender[];
  manifestOnlyGenderKeys: PortraitGender[];
}

export interface EncounterPortraitAvailabilityRow {
  surface: EncounterPortraitSurface;
  eraBand: EraBand;
  lifeStage: "adult";
  role: string;
  rivalPlaceId: string;
  demandedGender: PortraitGender;
  availableGenderKeys: PortraitGender[];
  missingGenderKeys: PortraitGender[];
  unloggedFileGenderKeys: PortraitGender[];
  manifestOnlyGenderKeys: PortraitGender[];
}

type ProtagonistRowWithKeys = ProtagonistPortraitAvailabilityRow & {
  genderKeys: GenderKeyAvailability[];
};
type EncounterRowWithKeys = EncounterPortraitAvailabilityRow & {
  genderKey: GenderKeyAvailability;
};

export interface CoverageCounts {
  rows: number;
  demandedGenderKeys: number;
  availableGenderKeys: number;
  missingGenderKeys: number;
  unloggedFileGenderKeys: number;
  manifestOnlyGenderKeys: number;
  fullGenderRows: number;
  partialGenderRows: number;
  emptyRows: number;
}

export interface ProtagonistCoverageSummary extends CoverageCounts {
  bySurface: Array<{ surface: ProtagonistPortraitSurface } & CoverageCounts>;
  byEraLifeStage: Array<{ eraBand: EraBand; lifeStage: LifeStage } & CoverageCounts>;
  byLifeStage: Array<{ lifeStage: LifeStage } & CoverageCounts>;
}

export interface EncounterCoverageSummary extends CoverageCounts {
  roles: number;
  byGender: Array<{ gender: PortraitGender } & CoverageCounts>;
}

export interface PortraitAvailabilityReport {
  generated: "KEY-PILLARS-8 portrait and gender availability map";
  source: {
    manifest: string;
    filesystem: string;
    protagonistDemand: string;
    encounterDemand: string;
  };
  requiredGenderKeys: PortraitGender[];
  assetInventory: {
    manifestPortraitFiles: number;
    filesystemPortraitFiles: number;
    filesystemOnly: string[];
    manifestOnly: string[];
  };
  protagonist: {
    summary: ProtagonistCoverageSummary;
    rows: ProtagonistPortraitAvailabilityRow[];
    openingRows: ProtagonistPortraitAvailabilityRow[];
  };
  encounter: {
    summary: EncounterCoverageSummary;
    rows: EncounterPortraitAvailabilityRow[];
  };
  gaps: {
    protagonistMissingRows: number;
    protagonistMissingSamples: string[];
    encounterMissingRows: number;
    encounterMissingSamples: string[];
    inventoryMismatches: string[];
    guidance: string[];
  };
}

const DEFAULT_SOURCE = {
  manifest: "src/data/assets.json kind=portrait",
  filesystem: "public/assets/generated/portraits/*.png",
  protagonistDemand:
    "PlayScreen compositePortraitKey(lifeStageForAge × eraBandForYear × archetype × rungTierForState × portraitGenderForState); OpeningScreen fixed founding/economic/low life-stage demand",
  encounterDemand: "RivalDossier encounterPortraitKey(rivalEncounterFacets(rivalId, eraBand))",
} satisfies PortraitAvailabilityReport["source"];

function portraitPathForKey(key: string): string {
  return `assets/generated/portraits/${key.replace(/:/g, "_")}.png`;
}

function keyStatus(
  key: string,
  gender: PortraitGender,
  manifestPaths: ReadonlySet<string>,
  filesystemPaths: ReadonlySet<string>,
): GenderKeyAvailability {
  const path = portraitPathForKey(key);
  const fileExists = filesystemPaths.has(path);
  const manifestLogged = manifestPaths.has(path);
  return {
    gender,
    key,
    path,
    fileExists,
    manifestLogged,
    available: fileExists && manifestLogged,
  };
}

function genderRowsForFacets(
  facets: Omit<PortraitFacets, "gender">,
  manifestPaths: ReadonlySet<string>,
  filesystemPaths: ReadonlySet<string>,
): GenderKeyAvailability[] {
  return PORTRAIT_AVAILABILITY_GENDERS.map((gender) =>
    keyStatus(compositePortraitKey({ ...facets, gender }), gender, manifestPaths, filesystemPaths),
  );
}

function rowFromGenderKeys(
  surface: ProtagonistPortraitSurface,
  facets: Omit<PortraitFacets, "gender">,
  genderKeys: GenderKeyAvailability[],
): ProtagonistRowWithKeys {
  return {
    surface,
    eraBand: facets.eraBand,
    lifeStage: facets.lifeStage,
    archetype: facets.archetype,
    rungTier: facets.rungTier,
    availableGenderKeys: genderKeys.filter((k) => k.available).map((k) => k.gender),
    missingGenderKeys: genderKeys.filter((k) => !k.available).map((k) => k.gender),
    unloggedFileGenderKeys: genderKeys
      .filter((k) => k.fileExists && !k.manifestLogged)
      .map((k) => k.gender),
    manifestOnlyGenderKeys: genderKeys
      .filter((k) => k.manifestLogged && !k.fileExists)
      .map((k) => k.gender),
    genderKeys,
  };
}

function protagonistLiveRows(
  manifestPaths: ReadonlySet<string>,
  filesystemPaths: ReadonlySet<string>,
): ProtagonistRowWithKeys[] {
  const rows: ProtagonistRowWithKeys[] = [];
  for (const eraBand of ERA_BAND_ORDER) {
    for (const lifeStage of PORTRAIT_AVAILABILITY_LIFE_STAGES) {
      for (const archetype of PORTRAIT_AVAILABILITY_ARCHETYPES) {
        for (const rungTier of PORTRAIT_AVAILABILITY_TIERS) {
          const facets = { lifeStage, eraBand, archetype, rungTier };
          rows.push(
            rowFromGenderKeys(
              "spine-live",
              facets,
              genderRowsForFacets(facets, manifestPaths, filesystemPaths),
            ),
          );
        }
      }
    }
  }
  return rows;
}

function openingRows(
  manifestPaths: ReadonlySet<string>,
  filesystemPaths: ReadonlySet<string>,
): ProtagonistRowWithKeys[] {
  return (["infant", "child", "youth"] as const satisfies readonly LifeStage[]).map((lifeStage) => {
    const facets = {
      lifeStage,
      eraBand: "founding_1700s" as const,
      archetype: "economic" as const,
      rungTier: "low" as const,
    };
    return rowFromGenderKeys(
      "opening",
      facets,
      genderRowsForFacets(facets, manifestPaths, filesystemPaths),
    );
  });
}

function encounterRows(
  manifestPaths: ReadonlySet<string>,
  filesystemPaths: ReadonlySet<string>,
  rivalPlaceIds: readonly string[],
): EncounterRowWithKeys[] {
  const rows: EncounterRowWithKeys[] = [];
  for (const rivalPlaceId of [...rivalPlaceIds].sort()) {
    for (const eraBand of ERA_BAND_ORDER) {
      const facets = rivalEncounterFacets(`rival:${rivalPlaceId}`, eraBand);
      const genderKey = keyStatus(
        encounterPortraitKey(facets),
        facets.gender,
        manifestPaths,
        filesystemPaths,
      );
      rows.push({
        surface: "encounter",
        eraBand,
        lifeStage: "adult",
        role: facets.role,
        rivalPlaceId,
        demandedGender: facets.gender,
        availableGenderKeys: genderKey.available ? [facets.gender] : [],
        missingGenderKeys: genderKey.available ? [] : [facets.gender],
        unloggedFileGenderKeys:
          genderKey.fileExists && !genderKey.manifestLogged ? [facets.gender] : [],
        manifestOnlyGenderKeys:
          genderKey.manifestLogged && !genderKey.fileExists ? [facets.gender] : [],
        genderKey,
      });
    }
  }
  return rows;
}

function emptyCounts(): CoverageCounts {
  return {
    rows: 0,
    demandedGenderKeys: 0,
    availableGenderKeys: 0,
    missingGenderKeys: 0,
    unloggedFileGenderKeys: 0,
    manifestOnlyGenderKeys: 0,
    fullGenderRows: 0,
    partialGenderRows: 0,
    emptyRows: 0,
  };
}

function addCounts(counts: CoverageCounts, row: { genderKeys: GenderKeyAvailability[] }): void {
  counts.rows += 1;
  counts.demandedGenderKeys += row.genderKeys.length;
  const available = row.genderKeys.filter((k) => k.available).length;
  const missing = row.genderKeys.length - available;
  counts.availableGenderKeys += available;
  counts.missingGenderKeys += missing;
  counts.unloggedFileGenderKeys += row.genderKeys.filter(
    (k) => k.fileExists && !k.manifestLogged,
  ).length;
  counts.manifestOnlyGenderKeys += row.genderKeys.filter(
    (k) => k.manifestLogged && !k.fileExists,
  ).length;
  if (available === row.genderKeys.length) counts.fullGenderRows += 1;
  else if (available === 0) counts.emptyRows += 1;
  else counts.partialGenderRows += 1;
}

function summarizeProtagonistRows(
  rows: readonly ProtagonistRowWithKeys[],
): ProtagonistCoverageSummary {
  const summary: ProtagonistCoverageSummary = {
    ...emptyCounts(),
    bySurface: [],
    byEraLifeStage: [],
    byLifeStage: [],
  };
  const bySurface = new Map<ProtagonistPortraitSurface, CoverageCounts>();
  const byEraLifeStage = new Map<
    string,
    { eraBand: EraBand; lifeStage: LifeStage } & CoverageCounts
  >();
  const byLifeStage = new Map<LifeStage, CoverageCounts>();

  for (const row of rows) {
    addCounts(summary, row);
    const surface = bySurface.get(row.surface) ?? emptyCounts();
    addCounts(surface, row);
    bySurface.set(row.surface, surface);

    const eraLifeKey = `${row.eraBand}:${row.lifeStage}`;
    const eraLife = byEraLifeStage.get(eraLifeKey) ?? {
      eraBand: row.eraBand,
      lifeStage: row.lifeStage,
      ...emptyCounts(),
    };
    addCounts(eraLife, row);
    byEraLifeStage.set(eraLifeKey, eraLife);

    const life = byLifeStage.get(row.lifeStage) ?? emptyCounts();
    addCounts(life, row);
    byLifeStage.set(row.lifeStage, life);
  }

  summary.bySurface = [...bySurface.entries()].map(([surface, counts]) => ({
    surface,
    ...counts,
  }));
  summary.byEraLifeStage = [...byEraLifeStage.values()];
  summary.byLifeStage = [...byLifeStage.entries()].map(([lifeStage, counts]) => ({
    lifeStage,
    ...counts,
  }));
  return summary;
}

function summarizeEncounterRows(rows: readonly EncounterRowWithKeys[]): EncounterCoverageSummary {
  const summary: EncounterCoverageSummary = {
    ...emptyCounts(),
    roles: new Set(rows.map((row) => row.role)).size,
    byGender: [],
  };
  const byGender = new Map<PortraitGender, CoverageCounts>();
  for (const row of rows) {
    const normalized = { genderKeys: [row.genderKey] };
    addCounts(summary, normalized);
    const gender = byGender.get(row.demandedGender) ?? emptyCounts();
    addCounts(gender, normalized);
    byGender.set(row.demandedGender, gender);
  }
  summary.byGender = [...byGender.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([gender, counts]) => ({ gender, ...counts }));
  return summary;
}

function keyLabel(row: ProtagonistRowWithKeys | EncounterRowWithKeys): string {
  if (row.surface === "encounter") {
    return `${row.surface}:${row.eraBand}:${row.role}:${row.demandedGender}`;
  }
  return `${row.surface}:${row.eraBand}:${row.lifeStage}:${row.archetype}:${row.rungTier}`;
}

function stripProtagonistKeys(row: ProtagonistRowWithKeys): ProtagonistPortraitAvailabilityRow {
  const { genderKeys: _genderKeys, ...compact } = row;
  return compact;
}

function stripEncounterKey(row: EncounterRowWithKeys): EncounterPortraitAvailabilityRow {
  const { genderKey: _genderKey, ...compact } = row;
  return compact;
}

function guidance(
  protagonistSummary: ProtagonistCoverageSummary,
  encounterSummary: EncounterCoverageSummary,
  inventoryMismatches: readonly string[],
): string[] {
  const out: string[] = [];
  const adult = protagonistSummary.byLifeStage.find((row) => row.lifeStage === "adult");
  if (adult?.missingGenderKeys === 0) {
    out.push(
      "Adult protagonist matrix is fully available across era, archetype, rung tier, and both genders.",
    );
  }
  const nonAdultMissing = protagonistSummary.byLifeStage
    .filter((row) => row.lifeStage !== "adult")
    .reduce((sum, row) => sum + row.missingGenderKeys, 0);
  if (nonAdultMissing > 0) {
    out.push(
      "Non-adult protagonist portraits remain the largest visual gap; generate child/youth/elder rows before adding more age-sensitive spine scenes.",
    );
  }
  if (encounterSummary.missingGenderKeys === 0) {
    out.push(
      "Encounter rival-head portraits are available for every current rival role and era band.",
    );
  }
  if (inventoryMismatches.length > 0) {
    out.push(
      "Asset manifest and generated portrait files are out of sync; reconcile before generating new keys.",
    );
  }
  return out;
}

export function buildPortraitAvailabilityReport({
  manifestPaths,
  filesystemPaths,
  rivalPlaceIds,
  source,
}: PortraitInventoryInput): PortraitAvailabilityReport {
  const manifestSet = new Set(manifestPaths.filter((p) => p.includes("generated/portraits/")));
  const filesystemSet = new Set(filesystemPaths.filter((p) => p.includes("generated/portraits/")));
  const spineRows = protagonistLiveRows(manifestSet, filesystemSet);
  const opening = openingRows(manifestSet, filesystemSet);
  const protagonistRows = [...spineRows, ...opening];
  const encounters = encounterRows(manifestSet, filesystemSet, rivalPlaceIds);
  const filesystemOnly = [...filesystemSet].filter((path) => !manifestSet.has(path)).sort();
  const manifestOnly = [...manifestSet].filter((path) => !filesystemSet.has(path)).sort();
  const protagonistSummary = summarizeProtagonistRows(protagonistRows);
  const encounterSummary = summarizeEncounterRows(encounters);
  const protagonistMissing = protagonistRows
    .filter((row) => row.missingGenderKeys.length > 0)
    .map(keyLabel);
  const encounterMissing = encounters
    .filter((row) => row.missingGenderKeys.length > 0)
    .map(keyLabel);
  const inventoryMismatches = [
    ...filesystemOnly.map((path) => `filesystem-only:${path}`),
    ...manifestOnly.map((path) => `manifest-only:${path}`),
  ];

  return {
    generated: "KEY-PILLARS-8 portrait and gender availability map",
    source: { ...DEFAULT_SOURCE, ...source },
    requiredGenderKeys: [...PORTRAIT_AVAILABILITY_GENDERS],
    assetInventory: {
      manifestPortraitFiles: manifestSet.size,
      filesystemPortraitFiles: filesystemSet.size,
      filesystemOnly,
      manifestOnly,
    },
    protagonist: {
      summary: protagonistSummary,
      rows: protagonistRows.map(stripProtagonistKeys),
      openingRows: opening.map(stripProtagonistKeys),
    },
    encounter: {
      summary: encounterSummary,
      rows: encounters.map(stripEncounterKey),
    },
    gaps: {
      protagonistMissingRows: protagonistMissing.length,
      protagonistMissingSamples: protagonistMissing.slice(0, 24),
      encounterMissingRows: encounterMissing.length,
      encounterMissingSamples: encounterMissing.slice(0, 24),
      inventoryMismatches,
      guidance: guidance(protagonistSummary, encounterSummary, inventoryMismatches),
    },
  };
}
