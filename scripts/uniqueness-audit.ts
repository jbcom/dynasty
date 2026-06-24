/**
 * CONTENT-UNIQUENESS-AUDIT — report the structural sameness of the saga corpus ([[craft-spines-not-generator]]).
 * Prints the distinct-fingerprint ratio + the largest skeleton cluster, so the "every act reads the same shape"
 * problem is a tracked number the eventual rewrite must move toward 1.0.
 *
 *   pnpm vite-node scripts/uniqueness-audit.ts
 */

import { uniquenessReport } from "../src/sim/saga/uniquenessMetric";

function main(): void {
  const r = uniquenessReport();
  if (r.files === 0) {
    console.error("No lineage corpus files found.");
    return;
  }
  console.error(`Lineage files: ${r.files}`);
  console.error(
    `Distinct structural fingerprints: ${r.distinctFingerprints} ` +
      `(ratio ${r.distinctRatio.toFixed(3)} — 1.0 = every run structurally unique).`,
  );
  console.error(`Largest skeleton cluster: ${r.largestCluster} files share ONE shape.`);
  console.error("Top clusters (count × fingerprint):");
  for (const c of r.clusters.slice(0, 5)) {
    console.error(`  ${c.count}×  ${c.fingerprint}`);
  }
  if (r.distinctRatio < 0.5) {
    console.error(
      "\nVERDICT: structural sameness is SEVERE — the acts are stamped from one skeleton. The rewrite must " +
        "vary the scene SHAPE (sense order, beat/decision layout, scene count) per act-type, not just the prose.",
    );
  }
}

main();
