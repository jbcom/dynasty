import { describe, expect, it } from "vitest";
import { loadContent } from "../../data/loadContent";
import { foundByComposition } from "../../sim/founding";
import { Game } from "../loop";

/**
 * FORESHADOW-AUDIT — instrument the foreshadow VALENCE layer (RECOVERY-FORESHADOW-TONE). The omen now reads in
 * two registers: DREAD (a loss looms — a harsh era with kin/strain ahead) and HOPE (a rebound is near — the
 * line carries an outstanding blown meter, so a recovery roll is pending). This drives many founding-era runs
 * and, at each saga step, records which tone (if any) the omen showed AND whether the line was actually carrying
 * an outstanding `shock_meter:` strain at that moment.
 *
 * The invariants under test:
 *  - the hope omen actually FIRES across the sweep (a strain layer that never surfaces hope would be a dead
 *    feature — the bug this audit guards against);
 *  - a hope omen appears IFF the line carries outstanding strain (the predicate is exact, not approximate), so
 *    P(strain | hope) == 1 and a hope omen never shows on an unstrained line;
 *  - both tones occur over the sweep (else the valence split is vacuous).
 *
 * The measured figures (hope-omen rate, dread-omen rate) are the audit's product — read them with
 * --disable-console-intercept when tuning the foreshadow thresholds.
 */

describe("foreshadow tone audit (FORESHADOW-AUDIT)", () => {
  it("the hope omen fires across runs and appears exactly when the line carries outstanding strain", () => {
    const real = loadContent();
    const SEEDS = Array.from({ length: 24 }, (_, i) => `fst${i}`);
    let hopeOmens = 0;
    let dreadOmens = 0;
    let omenSteps = 0;
    // Soundness counters: a hope omen must coincide with outstanding strain; never on an unstrained line.
    let hopeWithStrain = 0;
    let hopeWithoutStrain = 0;

    const hasStrain = (flags: readonly string[]) => flags.some((f) => f.startsWith("shock_meter:"));

    for (const seed of SEEDS) {
      const base = foundByComposition(real, {
        place: "ireland",
        era: "origins",
        culture: "anglo_protestant",
        year: 1776,
        archetype: "political" as const,
        gender: "male" as const,
        surname: "Fa",
        seed,
        originId: "composed:ireland:origins",
      }).state;
      const g = new Game(real, seed, base, "political");
      let guard = 0;
      while (!g.finished && guard < 300) {
        // `g.view` is a heavy getter — snapshot once per iteration (matching OMEN-PAYOFF-AUDIT).
        const view = g.view;
        const s = view.saga.scene;
        if (!s) {
          if (view.currentEvent?.choices[0]) {
            g.choose(view.currentEvent.choices[0].id);
            guard++;
            continue;
          }
          break;
        }
        const omen = view.foreshadow;
        if (omen) {
          omenSteps++;
          const strained = hasStrain(view.state.flags);
          if (omen.tone === "hope") {
            hopeOmens++;
            if (strained) hopeWithStrain++;
            else hopeWithoutStrain++;
          } else {
            dreadOmens++;
          }
        }
        if (s.decision) g.pickDecision(0);
        else if (s.beats.length) g.pickBeat(0);
        else break;
        guard++;
      }
    }

    const pHope = omenSteps > 0 ? hopeOmens / omenSteps : 0;
    const pDread = omenSteps > 0 ? dreadOmens / omenSteps : 0;
    console.log(
      `[foreshadow-tone] omenSteps=${omenSteps} hope=${hopeOmens} (${(pHope * 100).toFixed(1)}%) ` +
        `dread=${dreadOmens} (${(pDread * 100).toFixed(1)}%) ` +
        `hopeWithStrain=${hopeWithStrain} hopeWithoutStrain=${hopeWithoutStrain}`,
    );

    // The hope omen is a LIVE feature — it actually surfaces across the founding-era sweep (not a dead path).
    expect(hopeOmens, "a hope omen fires across the sweep").toBeGreaterThan(0);
    // SOUNDNESS: a hope omen appears ONLY on a strained line — never on an unstrained one (the predicate is exact).
    expect(hopeWithoutStrain, "a hope omen never shows on an unstrained line").toBe(0);
    expect(hopeWithStrain, "every hope omen coincides with outstanding strain").toBe(hopeOmens);
    // Both tones occur over the sweep (else the valence split would be vacuous).
    expect(dreadOmens, "a dread omen also fires over the sweep").toBeGreaterThan(0);
  });
});
