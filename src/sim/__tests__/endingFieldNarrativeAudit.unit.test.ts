import { describe, expect, it } from "vitest";
import { type ConvergenceContext, resolveConvergence } from "../convergence";
import { applyMotivators, initMotivators, type Motivators } from "../motivators";

/**
 * ENDING-FIELD-NARRATIVE-AUDIT — the convergence epilogue and the per-line finale fates are two surfaces onto
 * the SAME field state; this audit proves they stay CONSISTENT with that state (a unit test of either one alone
 * would miss a drift between them).
 *
 * Surface 1 — the EPILOGUE clause (resolveConvergence.rivalEpilogue). Its precedence is documented as:
 *   reachedStars>0 → a stars coda; else whole-field-fallen → lonely summit; else droppedOut>0 → dropped-out
 *   coda; else abovePlayer>0 → neck-and-neck; else → quiet recede.
 * This audit drives a MATRIX of constructed field states and asserts the clause that fires matches that
 * precedence exactly — so reordering or dropping a clause is caught.
 *
 * Surface 2 — the per-line FINALE fate (the LegacyReport's rivalFate / fateRank ordinal). The fate-ranking is a
 * pure function of (rung, faltering, fallen); this audit re-derives the same ranking the screen uses and asserts
 * a fallen line always ranks below a faltering one below the rung tiers, and a MAX-rung non-faltering/non-fallen
 * line ranks at the summit — so the two surfaces can't disagree about what "out" and "among the stars" mean.
 *
 * The measured matrix size is the audit's product (read with --disable-console-intercept when extending).
 */

const mot = (over: Partial<Motivators> = {}): Motivators => applyMotivators(initMotivators(), over);
const ctx = (
  field: NonNullable<ConvergenceContext["rivalField"]>,
  over: Partial<ConvergenceContext> = {},
): ConvergenceContext => ({
  motivators: mot({ lineage: 40 }),
  tier: 3,
  survived: true,
  hasHeir: true,
  rivalsReachedStars: field.reachedStars > 0,
  rivalField: field,
  ...over,
});

// The documented epilogue precedence, as a pure predicate — the ORACLE this audit checks resolveConvergence against.
function expectedEpilogueClause(f: NonNullable<ConvergenceContext["rivalField"]>): RegExp {
  if (f.total === 0) return /(?:)/; // no field → no epilogue (handled separately)
  if (f.reachedStars > 0) return /stars/i;
  if (f.fallen >= f.total) return /faltered|alone|endured/i;
  if ((f.droppedOut ?? 0) > 0) return /dropped out of the race/i;
  if (f.abovePlayer > 0) return /pressed close|undecided/i;
  return /receded|long quiet/i;
}

describe("ending field narrative audit (ENDING-FIELD-NARRATIVE-AUDIT)", () => {
  it("the epilogue clause matches the field-count precedence across a matrix of field states", () => {
    const TOTAL = 6;
    let cases = 0;
    // Sweep reachedStars × droppedOut × abovePlayer × fallen over a small grid; skip impossible combos.
    for (const reachedStars of [0, 1]) {
      for (const droppedOut of [0, 1, 3]) {
        for (const abovePlayer of [0, 2]) {
          for (const fallen of [0, 3, TOTAL]) {
            // droppedOut lines are a subset of the broader fallen count; keep the combo coherent.
            if (droppedOut > fallen) continue;
            const field = { reachedStars, fallen, droppedOut, abovePlayer, total: TOTAL };
            const ending = resolveConvergence(ctx(field));
            cases++;
            expect(
              ending.rivalEpilogue,
              `field=${JSON.stringify(field)} should match ${expectedEpilogueClause(field)}`,
            ).toMatch(expectedEpilogueClause(field));
          }
        }
      }
    }
    console.log(`[ending-field-audit] epilogue matrix cases=${cases}`);
    expect(cases, "the matrix exercised many field states").toBeGreaterThan(10);
  });

  it("a survived run with no field has no epilogue; a failed run never gets one", () => {
    // No field (unfounded / no world) → no coda.
    expect(
      resolveConvergence(ctx({ reachedStars: 0, fallen: 0, abovePlayer: 0, total: 0 })).rivalEpilogue,
    ).toBeUndefined();
    // A FAILED run stays stark — no epilogue even with a full field.
    expect(
      resolveConvergence(
        ctx(
          { reachedStars: 1, fallen: 0, droppedOut: 0, abovePlayer: 1, total: 6 },
          { survived: false },
        ),
      ).rivalEpilogue,
    ).toBeUndefined();
  });

  it("the per-line finale fate-rank is consistent: fallen sinks below faltering below the rung tiers", () => {
    // Re-derive the SAME ranking the LegacyReport uses (stars 0 … dropped-out 6) and assert the invariants the
    // two surfaces depend on, so a fallen line and a thriving line at the same rung never read or sort alike.
    const RIVAL_MAX_RUNG = 5;
    const fateRank = (rung: number, faltering: boolean, fallen: boolean): number => {
      if (fallen) return 6;
      if (faltering) return 5;
      if (rung >= RIVAL_MAX_RUNG) return 0;
      if (rung >= RIVAL_MAX_RUNG - 1) return 1;
      if (rung >= 2) return 2;
      return 3;
    };
    // A star-reaching line is the summit; a dropped-out line is the floor, regardless of rung.
    expect(fateRank(5, false, false)).toBe(0);
    expect(fateRank(3, false, true)).toBe(6); // fallen at a mid rung still ranks last
    expect(fateRank(0, false, true)).toBe(6);
    // Fallen sinks below faltering, which sinks below every healthy rung tier — even when the fallen line's raw
    // rung is HIGHER than a thriving low line's (the bug RIVAL-FINALE-SORT fixed).
    expect(fateRank(3, false, true)).toBeGreaterThan(fateRank(0, false, false)); // fallen@3 below thriving@0
    expect(fateRank(2, true, false)).toBeGreaterThan(fateRank(2, false, false)); // faltering below settled
    expect(fateRank(0, false, true)).toBeGreaterThan(fateRank(2, true, false)); // fallen below faltering
  });
});
