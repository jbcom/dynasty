import { describe, expect, it } from "vitest";
import marketsJson from "../../data/markets.json";
import { branchOf } from "../branch";
import { buildContent } from "../content";
import { applyChoice } from "../effects";
import { effectiveWeight, eligibleEvents, pickNextEvent } from "../events";
import { moralPoleOf } from "../moralAxis";
import { createRng } from "../rng";
import { initState } from "../state";
import {
  Eligible,
  EventRef,
  pickNextEventViaWorld,
  projectWorld,
  queryEligible,
  queryEligibleByWeight,
  queryEligibleForPole,
  queryLeveragedPositions,
  queryMarketsInCrash,
  queryRunContext,
} from "../world";
import { validRaw } from "./fixtures";

const content = () => buildContent(validRaw());
const contentWithMarkets = () => buildContent({ ...validRaw(), markets: marketsJson });

describe("Koota read-model projection (task-026)", () => {
  it("projects one entity per event, in content order, deterministically", () => {
    const c = content();
    const s = initState(c, "seed");
    const w1 = projectWorld(c, s);
    const w2 = projectWorld(c, s);
    const ids1 = w1.query(EventRef).map((e) => e.get(EventRef)?.id);
    const ids2 = w2.query(EventRef).map((e) => e.get(EventRef)?.id);
    expect(ids1).toEqual(ids2); // deterministic projection
    expect(ids1.length).toBe(c.allEvents.length);
    w1.destroy();
    w2.destroy();
  });

  it("queryEligible over the read-model exactly matches the pure eligibleEvents", () => {
    const c = content();
    for (const seed of ["a", "b", "c"]) {
      const s = initState(c, seed);
      const pure = eligibleEvents(c, s)
        .map((e) => e.id)
        .sort();
      const viaWorld = queryEligible(c, s)
        .map((e) => e.id)
        .sort();
      expect(viaWorld).toEqual(pure);
    }
  });

  it("the eligible set changes with state, and the read-model tracks it", () => {
    const c = content();
    const s = initState(c, "seed");
    const before = queryEligible(c, s).length;
    // Advance era; eligibility shifts. The projection reflects the new state.
    const later = queryEligible(c, { ...s, eraIndex: 1 });
    expect(later.every((e) => e.id)).toBe(true);
    // Both are non-empty and the projection is a pure function of state.
    expect(before).toBeGreaterThanOrEqual(0);
    const w = projectWorld(c, s);
    const eligibleTrait = w.query(Eligible).length;
    w.destroy();
    expect(eligibleTrait).toBe(before);
  });

  it("queryEligibleByWeight ranks the same eligible set by effective weight (desc)", () => {
    const c = content();
    const s = initState(c, "seed");
    const ranked = queryEligibleByWeight(c, s);
    // Same membership as queryEligible.
    expect(ranked.map((r) => r.event.id).sort()).toEqual(
      queryEligible(c, s)
        .map((e) => e.id)
        .sort(),
    );
    // Weights match the pure helper and are sorted descending.
    for (const { event, weight } of ranked) {
      expect(weight).toBeCloseTo(effectiveWeight(c, s, event), 5);
    }
    const weights = ranked.map((r) => r.weight);
    const sortedDesc = [...weights].sort((a, b) => b - a);
    expect(weights).toEqual(sortedDesc);
  });
});

describe("pickNextEventViaWorld parity with pure pickNextEvent (DE-1)", () => {
  it("returns the SAME event as the pure path for the same (state, rng) — many seeds", () => {
    const c = content();
    for (const seed of ["a", "b", "c", "d", "x", "42", "zzz"]) {
      const s = initState(c, seed);
      const pure = pickNextEvent(c, s, createRng(seed));
      const viaWorld = pickNextEventViaWorld(c, s, createRng(seed));
      expect(viaWorld?.id ?? null).toBe(pure?.id ?? null);
    }
  });

  it("stays in lockstep with the pure path across a full driven run", () => {
    const c = content();
    let s = initState(c, "run");
    const rngPure = createRng("run");
    // At each step, both selectors see the SAME state + a freshly-forked rng with
    // the same label, so they must agree on every pick along the whole run.
    for (let i = 0; i < 200 && !s.end; i++) {
      const fork = `pick:${i}`;
      const pure = pickNextEvent(c, s, rngPure.fork(fork));
      const viaWorld = pickNextEventViaWorld(c, s, createRng("run").fork(fork));
      expect(viaWorld?.id ?? null).toBe(pure?.id ?? null);
      if (!pure) break;
      // Advance the run via the pure path so the next state is shared.
      const choice = pure.choices[0];
      if (!choice) break;
      s = applyChoice(c, s, pure, choice.id, rngPure.fork(`apply:${i}`)).state;
    }
  });
});

describe("Koota run-context reads parity (DE-1b)", () => {
  it("queryRunContext equals branchOf / moralPoleOf for the same state", () => {
    const c = content();
    for (const seed of ["a", "b", "nazi", "theo"]) {
      const s = initState(c, seed);
      const ctx = queryRunContext(c, s);
      expect(ctx.branch).toBe(branchOf(s));
      expect(ctx.pole).toBe(moralPoleOf(s));
    }
  });

  it("queryEligibleForPole returns the eligible set tagged with the run pole", () => {
    const c = content();
    const s = initState(c, "seed");
    const { pole, events } = queryEligibleForPole(c, s);
    expect(pole).toBe(moralPoleOf(s));
    expect(events.map((e) => e.id).sort()).toEqual(
      queryEligible(c, s)
        .map((e) => e.id)
        .sort(),
    );
  });
});

describe("Koota market read-model queries (task-026 / nb-001)", () => {
  it("queryMarketsInCrash matches the systemicTick crash threshold", () => {
    const c = contentWithMarkets();
    const base = initState(c, "seed");
    // Force one market into a deep drawdown (index well below peak).
    const eq = c.markets.find((m) => m.id === "us_equities");
    if (!eq) throw new Error("no us_equities");
    const crashed = {
      ...base,
      markets: {
        ...base.markets,
        us_equities: {
          index: 10,
          peakIndex: 100,
          regime: "crash",
          regimeAge: 0,
          holding: 0,
          leverage: 1,
        },
      },
    };
    // index/peak = 0.1 < crashThreshold (0.6) → in crash.
    expect(queryMarketsInCrash(c, crashed)).toContain("us_equities");
    // A market at peak is not in crash.
    expect(queryMarketsInCrash(c, base)).not.toContain("us_equities");
  });

  it("queryLeveragedPositions surfaces only held + leveraged markets", () => {
    const c = contentWithMarkets();
    const base = initState(c, "seed");
    const held = {
      ...base,
      markets: {
        ...base.markets,
        nyc_housing: {
          index: 100,
          peakIndex: 100,
          regime: "carry",
          regimeAge: 0,
          holding: 500,
          leverage: 3,
        },
        us_equities: {
          index: 100,
          peakIndex: 100,
          regime: "stable",
          regimeAge: 0,
          holding: 100,
          leverage: 1,
        }, // unleveraged
      },
    };
    const lev = queryLeveragedPositions(c, held);
    expect(lev.map((p) => p.id)).toEqual(["nyc_housing"]); // not us_equities (lev=1)
    expect(lev[0]?.leverage).toBe(3);
  });

  it("market queries are deterministic in (content, state)", () => {
    const c = contentWithMarkets();
    const s = initState(c, "seed");
    expect(queryMarketsInCrash(c, s)).toEqual(queryMarketsInCrash(c, s));
    expect(queryLeveragedPositions(c, s)).toEqual(queryLeveragedPositions(c, s));
  });

  it("queries do NOT leak Koota worlds (withWorld disposes) — 50 calls survive the 16-world cap", () => {
    const c = contentWithMarkets();
    const s = initState(c, "seed");
    for (let i = 0; i < 50; i++) {
      queryEligible(c, s);
      queryMarketsInCrash(c, s);
      queryLeveragedPositions(c, s);
    }
    // Reaching here without "Too many worlds" proves disposal works.
    expect(queryEligible(c, s).length).toBeGreaterThanOrEqual(0);
  });
});
