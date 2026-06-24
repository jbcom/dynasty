/**
 * Library-backed prose-quality audit for the one-dynasty spine and mined legacy fabric.
 *
 *   pnpm prose:audit
 *   pnpm prose:audit -- --fail
 */

import { readFileSync } from "node:fs";
import { auditProseQuality } from "../src/sim/proseQuality";

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
  const failed = reports.filter((r) => !r.pass);
  const worst = [...reports]
    .sort(
      (a, b) =>
        a.scanScore - b.scanScore ||
        a.clarityScore - b.clarityScore ||
        b.findings.length - a.findings.length,
    )
    .slice(0, 12)
    .map((r) => ({
      label: r.label,
      pass: r.pass,
      scanScore: r.scanScore,
      clarityScore: r.clarityScore,
      consistencyScore: r.consistencyScore,
      fleschReadingEase: r.fleschReadingEase,
      fleschKincaidGrade: r.fleschKincaidGrade,
      averageSentenceWords: r.averageSentenceWords,
      maxSentenceWords: r.maxSentenceWords,
      findings: r.findings,
    }));

  console.log(
    JSON.stringify(
      {
        generated: "prose-quality-audit",
        total: reports.length,
        failed: failed.length,
        passRate: Number(((reports.length - failed.length) / reports.length).toFixed(3)),
        worst,
      },
      null,
      2,
    ),
  );

  if (arg("fail") && failed.length > 0) process.exitCode = 1;
}

main();
