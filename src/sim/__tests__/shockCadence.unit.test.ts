import { describe, expect, it } from "vitest";
import { macroActForYear } from "../macroActs";
import { createRng } from "../rng";
import { rollSagaRecovery, rollSagaShock, shockMeterFlag } from "../sagaShock";
import type { FamilyState, LiveMember } from "../state";

/**
 * SHOCK-CADENCE-AUDIT — instrument the WV-3 shock + recovery cadence across the saga's macro-acts, so the felt
 * rhythm is MEASURED, not assumed. Too sparse and the run has no tension; too dense and the loss beats become
 * noise. These tests sample representative years per macro-act over many seeds and assert the cadence stays in a
 * sane band, and that the founding era is meaningfully harsher than the interstellar future (the era-weighting
 * the design intends). A regression guard: if a future tuning starves or floods a phase, this fails loudly.
 *
 * The figures (printed via the labels below) are the audit's product — read them when tuning BASE_SHOCK_CHANCE
 * or the macro-act medicine curve.
 */

const member = (id: string, born: number, isProtagonist = false): LiveMember => ({
  id,
  given: id,
  surname: "Test",
  sex: "male",
  born,
  generation: isProtagonist ? 2 : 3,
  traits: { ambition: 50, cunning: 50, vigor: 50, piety: 50 },
  isProtagonist,
});

// A typical mid-saga family: a protagonist + two living collateral members the shock can strike.
const family = (): FamilyState => ({
  protagonistId: "p",
  nextSeq: 4,
  members: [member("p", 1700, true), member("c1", 1725), member("c2", 1728)],
});

// One representative year inside each macro-act band (founding < 1860, convergence 1860–99,
// emergence 1900–2040, ascension > 2040), plus the per-act tick count we sample.
const SAMPLE_YEARS: ReadonlyArray<{ act: string; year: number }> = [
  { act: "founding", year: 1800 },
  { act: "convergence", year: 1880 },
  { act: "emergence", year: 1970 },
  { act: "ascension", year: 2300 },
];

const SEEDS = 400;

/** The fraction of seeded ticks that fire a shock at a given year — the per-act hazard the player feels. */
function shockRate(year: number): number {
  const act = macroActForYear(year);
  let fired = 0;
  for (let i = 0; i < SEEDS; i++) {
    const shock = rollSagaShock(
      family(),
      year,
      act,
      createRng(`cad${i}`).fork(`sagashock:${year}`),
    );
    if (shock.kind !== "none") fired++;
  }
  return fired / SEEDS;
}

describe("shock cadence audit (SHOCK-CADENCE-AUDIT)", () => {
  it("every macro-act fires SOME shocks but is never flooded (0 < rate < 1)", () => {
    for (const { act, year } of SAMPLE_YEARS) {
      const rate = shockRate(year);
      // Print the measured cadence — this is the audit's figure, read when tuning.
      console.log(`[cadence] ${act} (${year}): shock rate ${(rate * 100).toFixed(1)}%`);
      expect(rate, `${act} is starved — no tension`).toBeGreaterThan(0);
      expect(
        rate,
        `${act} is flooded — every tick a disaster, the beats become noise`,
      ).toBeLessThan(1);
    }
  });

  it("the founding era is meaningfully HARSHER than the interstellar future (era-weighting holds)", () => {
    const founding = shockRate(1800);
    const ascension = shockRate(2300);
    // Founding exposure (~1.0) far exceeds the medicine-rich future (floored ~0.15) — a real gap, not noise.
    expect(founding).toBeGreaterThan(ascension * 1.5);
  });

  it("the hazard declines MONOTONICALLY across the acts (founding ≥ convergence ≥ emergence ≥ ascension)", () => {
    const rates = SAMPLE_YEARS.map(({ year }) => shockRate(year));
    for (let i = 1; i < rates.length; i++) {
      const prev = rates[i - 1] ?? 0;
      const cur = rates[i] ?? 0;
      // Each later act is no harsher than the one before (the medicine curve only improves over time).
      expect(
        cur,
        `act ${i} is harsher than act ${i - 1} — medicine should only improve`,
      ).toBeLessThanOrEqual(prev + 1e-9);
    }
  });

  it("recoveries actually rebound outstanding blows at a measurable rate (the comeback half of the cadence)", () => {
    // With one outstanding meter blow, sweep seeds and measure how often a quiet tick grants a rebound.
    const outstanding = new Set([shockMeterFlag("money")]);
    let rebounded = 0;
    for (let i = 0; i < SEEDS; i++) {
      const r = rollSagaRecovery(outstanding, 1900, createRng(`rec${i}`).fork("sagarecover:1900"));
      if (r) rebounded++;
    }
    const rate = rebounded / SEEDS;
    console.log(`[cadence] recovery rate (1 outstanding blow): ${(rate * 100).toFixed(1)}%`);
    // The two-act blow→recover shape needs recoveries to actually fire — neither never nor always.
    expect(rate).toBeGreaterThan(0.2);
    expect(rate).toBeLessThan(0.9);
  });
});
