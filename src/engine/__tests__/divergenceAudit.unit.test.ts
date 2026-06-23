import { describe, expect, it } from "vitest";
import { loadContent } from "../../data/loadContent";
import { foundByComposition } from "../../sim/founding";
import { Game } from "../loop";

/**
 * WV-3 DIVERGENCE AUDIT (build-order step 1, spec 2026-06-22-wv3-emergent-variability-design) — the
 * anti-Suzerain measurement: drive the SAME founding composition under M seeds, play each to its end the
 * SAME way (always take the first succession-bearing decision / first beat / first event choice), and
 * quantify how much the existing emergent layers (seeded markets, the rival GOAP world, crossings, family
 * mortality) already spread the outcomes. The spread tells us whether to BUILD the missing lever (the
 * spec's prior: a seeded disease/mortality hazard) or merely TUNE what exists — decided from the figure,
 * not a guess. This test is the instrument; it asserts the run is reproducible per-seed (determinism) and
 * surfaces the spread metrics for inspection.
 */

interface Outcome {
  seed: string;
  endKind: string;
  endYear: number;
  gensReached: number;
  familyAlive: number;
  familyTotal: number;
  money: number;
  convergence: string;
  steps: number;
}

const COMP = {
  place: "ireland",
  era: "origins",
  culture: "anglo_protestant",
  year: 1776,
  archetype: "political" as const,
  gender: "male" as const,
  surname: "Audit",
  originId: "composed:ireland:origins",
  lifeSeeds: {
    firstJob: "printers_devil" as const,
    bestFriend: "an_ambitious_rival" as const,
    lifePartner: "marry_for_love" as const,
  },
};

/** Play one founded run to its end with a FIXED policy (first succession / first beat / first event). */
function playOut(content: ReturnType<typeof loadContent>, seed: string): Outcome {
  const g = new Game(
    content,
    seed,
    foundByComposition(content, { ...COMP, seed }).state,
    COMP.archetype,
  );
  const gens = new Set<string>();
  let steps = 0;
  while (!g.finished && steps < 20000) {
    const v = g.view;
    const s = v.saga.scene;
    const m = s?.id.match(/spine:(g\d)/);
    if (m?.[1]) gens.add(m[1]);
    if (s) {
      if (s.decision) {
        const i = s.decision.options.findIndex((o) => o.succession?.takesPartner);
        g.pickDecision(i >= 0 ? i : 0);
      } else if (s.beats.length) g.pickBeat(0);
      else break;
    } else if (v.currentEvent?.choices[0]) {
      g.choose(v.currentEvent.choices[0].id);
    } else break;
    steps++;
  }
  const st = g.view.state;
  const members = st.family?.members ?? [];
  return {
    seed,
    endKind: st.end?.kind ?? "unfinished",
    endYear: st.year,
    gensReached: gens.size,
    familyAlive: members.filter((mm) => mm.died === undefined || mm.died > st.year).length,
    familyTotal: members.length,
    money: Math.round(st.meters.money),
    convergence: g.view.convergence?.destination ?? "none",
    steps,
  };
}

describe("WV-3 divergence audit (anti-Suzerain instrument)", () => {
  const content = loadContent();
  const SEEDS = ["a", "b", "c", "d", "e", "f", "g", "h"];

  it("is bit-reproducible per seed (variability is SEEDED, not random)", () => {
    const a = playOut(content, "repro");
    const b = playOut(content, "repro");
    expect(a).toEqual(b);
  });

  it("measures + reports the outcome spread across seeds (the divergence figure)", () => {
    const outcomes = SEEDS.map((s) => playOut(content, s));
    const spread = {
      endKinds: new Set(outcomes.map((o) => o.endKind)).size,
      endYearRange:
        Math.max(...outcomes.map((o) => o.endYear)) - Math.min(...outcomes.map((o) => o.endYear)),
      gensRange:
        Math.max(...outcomes.map((o) => o.gensReached)) -
        Math.min(...outcomes.map((o) => o.gensReached)),
      moneyDistinct: new Set(outcomes.map((o) => o.money)).size,
      convergences: new Set(outcomes.map((o) => o.convergence)).size,
      familyAliveDistinct: new Set(outcomes.map((o) => o.familyAlive)).size,
    };
    const report = `WV3-DIVERGENCE over ${SEEDS.length} seeds: ${JSON.stringify(spread)} | ${outcomes
      .map(
        (o) => `${o.seed}:${o.endKind}@${o.endYear}/g${o.gensReached}/$${o.money}/${o.convergence}`,
      )
      .join("  ")}`;

    // The run completes for every seed (no hang / stuck state — also exercises the extinction guard).
    for (const o of outcomes) expect(o.endKind, report).not.toBe("unfinished");
    // A fully-succeeded line reaches the APEX ending across all seeds (the g9-succession fix the audit
    // surfaced — previously every seed wrongly extinguished at g9).
    for (const o of outcomes) expect(o.endKind, report).toBe("apex");
    // WV-3-MORTALITY now diverges the saga path: the seeded disruption shocks (family deaths + meter blows)
    // vary the runs in EVENTS — money is no longer flat across seeds (it was a single value before the
    // lever), and the family-alive count spreads. The Suzerain trap is broken on the founded saga path while
    // each seed stays bit-reproducible (the determinism test above). The `report` logs the full figure.
    expect(spread.moneyDistinct, report).toBeGreaterThan(1);
    expect(spread.familyAliveDistinct, report).toBeGreaterThan(1);
  });
});
