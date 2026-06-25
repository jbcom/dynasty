import { describe, expect, it } from "vitest";
import availabilityReport from "../../../data/saga/portrait-availability.json";
import { compositePortraitKey } from "../portrait";
import {
  buildPortraitAvailabilityReport,
  type PortraitAvailabilityReport,
  type ProtagonistPortraitAvailabilityRow,
} from "../portraitAvailability";

function pathForKey(key: string): string {
  return `assets/generated/portraits/${key.replace(/:/g, "_")}.png`;
}

function liveReport(): PortraitAvailabilityReport {
  return availabilityReport as PortraitAvailabilityReport;
}

function protagonistRow(
  report: PortraitAvailabilityReport,
  match: Partial<ProtagonistPortraitAvailabilityRow>,
): ProtagonistPortraitAvailabilityRow {
  const row = report.protagonist.rows.find((candidate) =>
    Object.entries(match).every(
      ([key, value]) => candidate[key as keyof typeof candidate] === value,
    ),
  );
  if (!row) throw new Error(`Missing protagonist portrait row ${JSON.stringify(match)}`);
  return row;
}

describe("KEY-PILLARS-8 portrait availability map", () => {
  it("treats a gender key as available only when the PNG exists and the asset manifest logs it", () => {
    const maleKey = compositePortraitKey({
      lifeStage: "adult",
      eraBand: "digital_modern",
      archetype: "economic",
      rungTier: "high",
      gender: "male",
    });
    const femaleKey = compositePortraitKey({
      lifeStage: "adult",
      eraBand: "digital_modern",
      archetype: "economic",
      rungTier: "high",
      gender: "female",
    });
    const childMaleKey = compositePortraitKey({
      lifeStage: "child",
      eraBand: "digital_modern",
      archetype: "economic",
      rungTier: "high",
      gender: "male",
    });

    const report = buildPortraitAvailabilityReport({
      manifestPaths: [pathForKey(maleKey), pathForKey(femaleKey)],
      filesystemPaths: [pathForKey(maleKey), pathForKey(childMaleKey)],
      rivalPlaceIds: ["italian"],
    });

    const adultRow = protagonistRow(report, {
      surface: "spine-live",
      eraBand: "digital_modern",
      lifeStage: "adult",
      archetype: "economic",
      rungTier: "high",
    });
    expect(adultRow.availableGenderKeys).toEqual(["male"]);
    expect(adultRow.missingGenderKeys).toEqual(["female"]);
    expect(adultRow.manifestOnlyGenderKeys).toEqual(["female"]);
    expect(report.assetInventory.filesystemOnly).toContain(pathForKey(childMaleKey));
    expect(report.assetInventory.manifestOnly).toContain(pathForKey(femaleKey));
    expect(report.gaps.inventoryMismatches).toEqual(
      expect.arrayContaining([
        `filesystem-only:${pathForKey(childMaleKey)}`,
        `manifest-only:${pathForKey(femaleKey)}`,
      ]),
    );
  });

  it("checks in the live protagonist and encounter portrait-gender coverage baseline", () => {
    const report = liveReport();
    expect(report.generated).toBe("KEY-PILLARS-8 portrait and gender availability map");
    expect(report.requiredGenderKeys).toEqual(["male", "female"]);
    expect(report.assetInventory).toMatchObject({
      manifestPortraitFiles: 402,
      filesystemPortraitFiles: 402,
      filesystemOnly: [],
      manifestOnly: [],
    });

    expect(report.protagonist.summary.rows).toBe(843);
    expect(report.protagonist.summary.demandedGenderKeys).toBe(1686);
    expect(report.protagonist.summary.availableGenderKeys).toBe(352);
    expect(report.protagonist.summary.missingGenderKeys).toBe(1334);
    expect(report.protagonist.summary.bySurface).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          surface: "spine-live",
          rows: 840,
          availableGenderKeys: 346,
          missingGenderKeys: 1334,
        }),
        expect.objectContaining({
          surface: "opening",
          rows: 3,
          availableGenderKeys: 6,
          missingGenderKeys: 0,
        }),
      ]),
    );

    const adult = report.protagonist.summary.byLifeStage.find((row) => row.lifeStage === "adult");
    const child = report.protagonist.summary.byLifeStage.find((row) => row.lifeStage === "child");
    expect(adult).toMatchObject({
      rows: 168,
      demandedGenderKeys: 336,
      availableGenderKeys: 336,
      missingGenderKeys: 0,
    });
    expect(child).toMatchObject({
      demandedGenderKeys: 338,
      availableGenderKeys: 4,
      missingGenderKeys: 334,
    });

    expect(
      protagonistRow(report, {
        surface: "spine-live",
        eraBand: "stellar",
        lifeStage: "adult",
        archetype: "crime",
        rungTier: "high",
      }).availableGenderKeys,
    ).toEqual(["male", "female"]);
    expect(
      protagonistRow(report, {
        surface: "spine-live",
        eraBand: "stellar",
        lifeStage: "child",
        archetype: "athletic",
        rungTier: "high",
      }).missingGenderKeys,
    ).toEqual(["male", "female"]);

    expect(report.encounter.summary).toMatchObject({
      rows: 56,
      roles: 7,
      demandedGenderKeys: 56,
      availableGenderKeys: 56,
      missingGenderKeys: 0,
    });
    expect(report.encounter.summary.byGender).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ gender: "female", availableGenderKeys: 16 }),
        expect.objectContaining({ gender: "male", availableGenderKeys: 40 }),
      ]),
    );
    expect(report.gaps).toMatchObject({
      protagonistMissingRows: 667,
      encounterMissingRows: 0,
      inventoryMismatches: [],
    });
    expect(report.gaps.guidance).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/Adult protagonist matrix is fully available/i),
        expect.stringMatching(/Non-adult protagonist portraits remain the largest visual gap/i),
        expect.stringMatching(/Encounter rival-head portraits are available/i),
      ]),
    );
  });
});
