import { readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import assetsData from "../src/data/assets.json";
import placesData from "../src/data/world/places.json";
import { buildPortraitAvailabilityReport } from "../src/sim/genai/portraitAvailability";

const arg = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};

const OUT = arg("out") ?? "src/data/saga/portrait-availability.json";
const PORTRAIT_DIR = "public/assets/generated/portraits";

interface AssetEntry {
  path: string;
  kind?: string;
}

function manifestPortraitPaths(): string[] {
  const assets = (assetsData as { assets: AssetEntry[] }).assets;
  return assets.filter((asset) => asset.kind === "portrait").map((asset) => asset.path).sort();
}

function filesystemPortraitPaths(): string[] {
  return readdirSync(PORTRAIT_DIR)
    .filter((name) => name.endsWith(".png"))
    .map((name) => join("assets/generated/portraits", name))
    .sort();
}

function rivalPlaceIds(): string[] {
  return (placesData as { places: Array<{ id: string; kind?: string; arrivalYears?: unknown }> })
    .places.filter((place) => place.kind !== "destination" && place.arrivalYears !== undefined)
    .map((place) => place.id)
    .sort();
}

const report = buildPortraitAvailabilityReport({
  manifestPaths: manifestPortraitPaths(),
  filesystemPaths: filesystemPortraitPaths(),
  rivalPlaceIds: rivalPlaceIds(),
});

writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`);
console.error(
  `Wrote ${OUT}: protagonist ${report.protagonist.summary.availableGenderKeys}/${report.protagonist.summary.demandedGenderKeys} gender-key slots available; encounter ${report.encounter.summary.availableGenderKeys}/${report.encounter.summary.demandedGenderKeys}.`,
);
