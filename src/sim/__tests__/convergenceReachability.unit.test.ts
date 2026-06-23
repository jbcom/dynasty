import { describe, expect, it } from "vitest";
import { type ConvergenceContext, ENDINGS, resolveConvergence } from "../convergence";
import { initMotivators, MOTIVATOR_AXES, type Motivators } from "../motivators";

/**
 * CONVERGENCE-ENDING-DEPTH (reachability audit) — every authored ending must be REACHABLE: there must
 * exist some (motivators, tier, survived, hasHeir, rivalsReachedStars) the played run can plausibly hit
 * that resolves to it. resolveConvergence picks the FIRST matching lattice entry in array order, so an
 * ending can be dead either because no motivator profile clears its gate, or because an earlier entry
 * always shadows it. This sweep drives a wide profile grid through resolveConvergence and asserts the set
 * of reachable ending ids covers the whole table — flagging any dead ending so the hour-long run always
 * lands on a distinct, earned finale (not silently funneled into a few).
 */

// A wide per-axis sweep: strong-neg / mid / centrist / mid / strong-pos. The mid bands (±25..±35) matter —
// some gates sit in a window (e.g. contributed_ally needs reach≥20 but is shadowed by media_mogul's reach≥45,
// so only a reach in [20,44] reaches it). A too-coarse sweep would falsely flag such an ending dead.
const LEVELS = [-80, -35, -20, 0, 20, 30, 45, 80];

function* profiles(): Generator<Motivators> {
  // Single-axis-dominant profiles (each axis pushed to each level, others centrist) — enough to clear any
  // single-clause gate — plus a few compound profiles for two-clause gates (power+honor, wealth, etc.).
  for (const axis of MOTIVATOR_AXES) {
    for (const lvl of LEVELS) {
      const m = initMotivators();
      m[axis] = lvl;
      yield m;
    }
  }
  // Compound profiles targeting the two-clause gates explicitly.
  const compounds: Partial<Motivators>[] = [
    { power: 60, honor: -40 }, // dictator / conquest
    { power: 45, honor: -50 }, // crime-adjacent
    { power: 40, worldview: -40 }, // crime_leader
    { wealth: 70 }, // oligarch
    { reach: 60, honor: 30 }, // stellar_allies / contributed
    { power: -50, lineage: 40 }, // communard
    { worldview: -60 }, // religious_leader
    { lineage: 40 }, // earthbound_legacy
  ];
  // Hoist the centrist base out of the loop; spread each compound's overrides over it (Gemini #112).
  const base = initMotivators();
  for (const c of compounds) yield { ...base, ...c };
}

describe("CONVERGENCE-ENDING-DEPTH: every ending is reachable (reachability audit)", () => {
  it("the full ending table is covered by some plausible run state (no dead ending)", () => {
    const reachable = new Set<string>();
    const survivedOpts = [true, false];
    const heirOpts = [true, false];
    const rivalStarsOpts = [true, false];
    for (const motivators of profiles()) {
      for (const tier of [0, 1, 2, 3, 4, 5]) {
        for (const survived of survivedOpts) {
          for (const hasHeir of heirOpts) {
            for (const rivalsReachedStars of rivalStarsOpts) {
              const ctx: ConvergenceContext = {
                motivators,
                tier,
                survived,
                hasHeir,
                rivalsReachedStars,
              };
              reachable.add(resolveConvergence(ctx).id);
            }
          }
        }
      }
    }
    const all = ENDINGS.map((e) => e.id);
    const dead = all.filter((id) => !reachable.has(id));
    expect(dead, `dead (unreachable) endings: ${dead.join(", ")}`).toEqual([]);
    // Sanity: the audit actually exercised a spread (more than a couple of endings reachable).
    expect(reachable.size).toBeGreaterThanOrEqual(Math.min(8, all.length));
  });

  it("every ending carries earned-finale prose (CONVERGENCE-ENDING-DEPTH)", () => {
    for (const e of ENDINGS) {
      expect(e.prose, `${e.id} has resolution prose`).toBeTruthy();
      expect((e.prose ?? "").length, `${e.id} prose is a real sentence`).toBeGreaterThan(40);
    }
    // No two endings share the same finale prose (each fate reads distinct).
    const proses = ENDINGS.map((e) => e.prose);
    expect(new Set(proses).size).toBe(ENDINGS.length);
  });

  it("resolveConvergence is a pure total function — always returns a valid ending id", () => {
    const ids = new Set(ENDINGS.map((e) => e.id));
    for (const tier of [0, 3, 5]) {
      const e = resolveConvergence({
        motivators: initMotivators(),
        tier,
        survived: true,
        hasHeir: true,
        rivalsReachedStars: false,
      });
      expect(ids.has(e.id)).toBe(true);
    }
  });
});
