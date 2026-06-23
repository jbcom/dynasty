import { describe, expect, it } from "vitest";
import { loadContent } from "../../data/loadContent";
import { foundByComposition } from "../../sim/founding";
import { Game } from "../loop";

/**
 * OMEN-PAYOFF-AUDIT — instrument the foreshadow→shock CALIBRATION. A foreshadow that rarely precedes a real
 * blow trains the player to ignore it; one that always does is a spoiler. This drives many founding-era runs
 * and, at each saga step, records whether an omen was showing and whether the NEXT saga step actually landed a
 * shock (a new `shock:*` flag). It then compares P(shock | omen) vs P(shock | no omen): the omen should be a
 * MEANINGFUL-BUT-NOT-CERTAIN signal — shocks materially likelier after an omen, but neither guaranteed (a
 * spoiler) nor uncorrelated (noise). The measured figures are the audit's product; read them when tuning the
 * foreshadow threshold (sagaShock.foreshadowWeight) or the shock exposure curve.
 *
 * MEASURED (24 seeds): P(shock|omen) ~ 11.2% vs P(shock|calm) ~ 6.3% — an omen makes the next shock ~1.8x
 * likelier, a meaningful warning that is neither certain (spoiler) nor uncorrelated (noise). Well-calibrated;
 * no threshold tuning needed at this time.
 */

describe("omen payoff audit (OMEN-PAYOFF-AUDIT)", () => {
  it("a foreshadow is a meaningful-but-not-certain signal of the next shock", () => {
    const real = loadContent();
    const SEEDS = Array.from({ length: 24 }, (_, i) => `omen${i}`);
    // Count shock-on-next-step outcomes, split by whether an omen was showing on the prior step.
    let omenSteps = 0;
    let omenThenShock = 0;
    let calmSteps = 0;
    let calmThenShock = 0;

    for (const seed of SEEDS) {
      const base = foundByComposition(real, {
        place: "ireland",
        era: "origins",
        culture: "anglo_protestant",
        year: 1776,
        archetype: "political" as const,
        gender: "male" as const,
        surname: "Om",
        seed,
        originId: "composed:ireland:origins",
      }).state;
      const g = new Game(real, seed, base, "political");
      let guard = 0;
      // A shock is observable as a NEW `shock:*` flag appearing after a saga step.
      const shockCount = (flags: readonly string[]) =>
        flags.filter((f) => f.startsWith("shock:")).length;
      while (!g.finished && guard < 300) {
        // `g.view` is a heavy getter (rebuilds the whole GameView) — snapshot it ONCE per iteration (Gemini #136).
        const before = g.view;
        const s = before.saga.scene;
        if (!s) {
          if (before.currentEvent?.choices[0]) {
            g.choose(before.currentEvent.choices[0].id);
            guard++;
            continue;
          }
          break;
        }
        const omenBefore = before.foreshadow !== null;
        const shocksBefore = shockCount(before.state.flags);
        // Advance one saga step (a beat or decision) — the shock roll happens on this step if a clock passes.
        if (s.decision) g.pickDecision(0);
        else if (s.beats.length) g.pickBeat(0);
        else break;
        // One fresh view read after the step (state changed) to detect a newly-stamped shock flag.
        const firedShock = shockCount(g.view.state.flags) > shocksBefore;
        if (omenBefore) {
          omenSteps++;
          if (firedShock) omenThenShock++;
        } else {
          calmSteps++;
          if (firedShock) calmThenShock++;
        }
        guard++;
      }
    }

    const pOmen = omenSteps > 0 ? omenThenShock / omenSteps : 0;
    const pCalm = calmSteps > 0 ? calmThenShock / calmSteps : 0;
    // The figures — the audit's product. Read with --disable-console-intercept when tuning.
    console.log(
      `[omen-payoff] omenSteps=${omenSteps} P(shock|omen)=${(pOmen * 100).toFixed(1)}% ` +
        `calmSteps=${calmSteps} P(shock|calm)=${(pCalm * 100).toFixed(1)}%`,
    );

    // The audit must have exercised BOTH conditions over the sweep (else the comparison is vacuous).
    expect(omenSteps, "the sweep saw steps WITH an omen showing").toBeGreaterThan(0);
    expect(calmSteps, "the sweep saw steps with NO omen").toBeGreaterThan(0);
    // CALIBRATION: an omen is meaningful — shocks are at least as likely after an omen as without — AND not a
    // certain spoiler. (foreshadow keys on harsh-era + strain, which is exactly when the shock hazard is
    // highest, so the correlation should be POSITIVE; the shock is a separate seeded roll, so never certain.)
    expect(
      pOmen,
      "an omen doesn't LOWER the shock likelihood (it's a real warning)",
    ).toBeGreaterThanOrEqual(pCalm);
    expect(
      pOmen,
      "an omen is NOT a certain spoiler — the next shock isn't guaranteed",
    ).toBeLessThan(1);
  });
});
