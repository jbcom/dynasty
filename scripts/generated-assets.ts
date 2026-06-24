import { existsSync, readFileSync, writeFileSync } from "node:fs";

const ASSETS_JSON = "src/data/assets.json";

interface AssetEntry {
  id: string;
  path: string;
  kind: string;
  source: string;
  license: string;
  attribution: string;
}

export interface GeneratedAssetEntry extends AssetEntry {
  license: "Generated";
}

interface AssetFile {
  assets: AssetEntry[];
}

function loadAssets(): AssetFile {
  if (!existsSync(ASSETS_JSON)) return { assets: [] };
  return JSON.parse(readFileSync(ASSETS_JSON, "utf8")) as AssetFile;
}

export function registerGeneratedAsset(entry: GeneratedAssetEntry): void {
  const file = loadAssets();
  if (file.assets.some((asset) => asset.id === entry.id)) return;
  file.assets.push(entry);
  writeFileSync(ASSETS_JSON, `${JSON.stringify(file, null, 2)}\n`);
}
