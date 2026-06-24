/**
 * PLAYTIME-DEPTH-AUDIT — estimate the playtime of a single founding-spine lineage run and compare it to the
 * hour+ goal ([[hour-long-depth]] / [[convergence-pivot]]). A lineage plays ONE class-keyed corpus file
 * (a wave × archetype × class) = 6 acts (reach tiers 0..5), founding → the stars. This sums the authored
 * SCENES (prose words → read time at a normal pace) + the decision BEATS (deliberation), reports a per-path
 * estimate, and flags the thinnest paths. Pure measurement over the shipped corpus — no content rewrite.
 *
 *   pnpm vite-node scripts/playtime-depth.ts
 *
 * Also exercised by src/sim/saga/__tests__/playtimeDepth.unit.test.ts as a durable floor (the corpus must
 * keep enough depth for the hour+ run; a thinning regression fails the test).
 */

import { lineageRuns } from "../src/sim/saga/playtimeDepth";

function main(): void {
  const rows = lineageRuns();
  if (rows.length === 0) {
    console.error("No lineage corpus files found.");
    return;
  }

  const med = rows[Math.floor(rows.length / 2)];
  const thinnest = rows[0];
  const fattest = rows[rows.length - 1];
  console.error(`Lineage corpus files: ${rows.length} (each = one full founding→stars run of 6 acts).`);
  console.error(
    `Per-run playtime estimate (read @220wpm + decision deliberation): median ~${med?.minutes.toFixed(0)} min,` +
      ` range ${thinnest?.minutes.toFixed(0)}–${fattest?.minutes.toFixed(0)} min.`,
  );
  console.error(
    `Thinnest path: ${thinnest?.name} — ${thinnest?.scenes} scenes / ${thinnest?.words} words / ` +
      `${thinnest?.decisions} decisions → ~${thinnest?.minutes.toFixed(0)} min.`,
  );
  console.error(
    `(NB: this is the AUTHORED SCENE depth alone — the emergence opening, the inter-era surfaces ` +
      `(Field/Map/Dossier/News/Markets), and the finale add further time on top.)`,
  );
}

main();
