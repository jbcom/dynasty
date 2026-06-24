/**
 * Library-backed prose-quality audit for the one-dynasty spine and mined legacy fabric.
 *
 *   pnpm prose:audit
 *   pnpm prose:audit -- --fail
 */

import { readFileSync, writeFileSync } from "node:fs";
import { auditProseQuality } from "../src/sim/proseQuality";
import {
  compareProseQualityToBaseline,
  summarizeProseQualityReports,
  type ProseQualitySummary,
} from "../src/sim/proseQualityRatchet";

interface SpineScene {
  id: string;
  prose: string[];
  beats?: Array<{ prose?: string[]; choice?: { text?: string } }>;
  decision?: { prompt?: string; options?: Array<{ text?: string }> };
}

interface SpineFile {
  scenes: SpineScene[];
}

interface FabricIndex {
  fabric: Record<
    string,
    Record<string, Array<{ sceneId: string; score: number; vignettes?: string[] }>>
  >;
}

function arg(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function argValue(name: string, fallback: string): string {
  const index = process.argv.indexOf(`--${name}`);
  if (index < 0) return fallback;
  const value = process.argv[index + 1];
  return value && !value.startsWith("--") ? value : fallback;
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function sceneParts(scene: SpineScene): string[] {
  return [
    ...scene.prose,
    ...(scene.beats ?? []).flatMap((b) => [...(b.prose ?? []), b.choice?.text ?? ""]),
    scene.decision?.prompt ?? "",
    ...((scene.decision?.options ?? []).map((o) => o.text ?? "")),
  ].filter(Boolean);
}

function main(): void {
  const baselinePath = argValue("baseline", "src/data/saga/prose-quality-baseline.json");
  const spine = readJson<SpineFile>("src/data/saga/spine.act.json");
  const fabric = readJson<FabricIndex>("src/data/saga/fabric/index.json");
  const targets: Array<{ label: string; parts: string[] }> = spine.scenes.map((scene) => ({
    label: `spine:${scene.id}`,
    parts: sceneParts(scene),
  }));

  for (const [wave, byEra] of Object.entries(fabric.fabric)) {
    for (const [era, entries] of Object.entries(byEra)) {
      for (const entry of entries) {
        if ((entry.vignettes ?? []).length === 0) continue;
        targets.push({
          label: `fabric:${wave}:${era}:${entry.sceneId}`,
          parts: entry.vignettes ?? [],
        });
      }
    }
  }

  const reports = targets.map((target) => auditProseQuality(target.label, target.parts));
  const summary = summarizeProseQualityReports(reports);
  const ratchet = arg("ratchet")
    ? {
        baselinePath,
        ...compareProseQualityToBaseline(summary, readJson<ProseQualitySummary>(baselinePath)),
      }
    : undefined;

  const output = ratchet ? { ...summary, ratchet } : summary;
  const json = JSON.stringify(output, null, 2);

  if (arg("write-baseline")) writeFileSync(baselinePath, `${JSON.stringify(summary, null, 2)}\n`);

  console.log(json);

  if (arg("fail") && summary.failed > 0) process.exitCode = 1;
  if (ratchet && !ratchet.pass) process.exitCode = 1;
}

main();
