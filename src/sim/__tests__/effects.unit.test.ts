import { describe, expect, it } from "vitest";
import { loadContent } from "../../data/loadContent";
import { buildContent } from "../content";
import { applyChoice, autoPlaythrough, replay } from "../effects";
import { foundByComposition } from "../founding";
import { dealComposition } from "../places";
import { createRng } from "../rng";
import type { GameEvent } from "../schema";
import { initState } from "../state";
import { validRaw } from "./fixtures";

const content = () => buildContent(validRaw());
const ev = (c: ReturnType<typeof content>, id: string): GameEvent => {
  const found = c.allEvents.find((e) => e.id === id);
  if (!found) throw new Error(`no event ${id}`);
  return found;
};

describe("applyChoice", () => {
  it("applies effects, flags, history, and marks the event fired", () => {
    const c = content();
    const s = initState(c, "seed");
    const { state } = applyChoice(c, s, ev(c, "ev_born"), "cry_loud", createRng("seed"));
    expect(state.meters.reputation).toBe(2);
    expect(state.flags).toContain("loud_baby");
    expect(state.firedEvents).toContain("ev_born");
    expect(state.history).toEqual([{ eventId: "ev_born", choiceId: "cry_loud", year: 1946 }]);
  });

  it("emits ledger entries for triggered butterfly chains", () => {
    const c = content();
    let s = initState(c, "seed");
    s = applyChoice(c, s, ev(c, "ev_born"), "cry_loud", createRng("seed")).state;
    const t = applyChoice(c, s, ev(c, "ev_military_school"), "excel", createRng("seed"));
    expect(t.newLedger.length).toBeGreaterThan(0);
    expect(t.state.ledger.map((l) => l.ruleId)).toContain("br_discipline");
  });

  it("advances the timeline and rolls into the next era when the budget is spent", () => {
    const c = content(); // boyhood eventBudget = 2
    let s = initState(c, "seed");
    s = applyChoice(c, s, ev(c, "ev_born"), "cry_loud", createRng("a")).state;
    expect(s.eraIndex).toBe(0);
    s = applyChoice(c, s, ev(c, "ev_military_school"), "excel", createRng("b")).state;
    expect(s.eraIndex).toBe(1); // rolled into mogul era
    expect(s.year).toBe(1964); // mogul yearStart
  });

  it("throws when applying a choice to a finished run", () => {
    const c = content();
    const s = { ...initState(c, "seed"), end: { kind: "death" as const, year: 1950, reason: "x" } };
    expect(() => applyChoice(c, s, ev(c, "ev_born"), "cry_loud", createRng("s"))).toThrow();
  });

  it("throws on an unknown choice id", () => {
    const c = content();
    const s = initState(c, "seed");
    expect(() => applyChoice(c, s, ev(c, "ev_born"), "nope", createRng("s"))).toThrow(/no choice/);
  });

  it("ends the run immediately when a choice drops health to zero", () => {
    const c = content();
    const s = initState(c, "seed");
    const lethal: GameEvent = {
      ...ev(c, "ev_born"),
      choices: [
        {
          id: "die",
          text: "Stop breathing.",
          effects: { health: -100 },
          personality: {},
          setFlags: [],
          clearFlags: [],
          ripples: [],
          outcome: "Lights out.",
        },
      ],
    };
    const { state } = applyChoice(c, s, lethal, "die", createRng("s"));
    expect(state.end?.kind).toBe("death");
  });
});

describe("deterministic replay", () => {
  it("reconstructs the exact same state from seed + history", () => {
    const c = content();
    let s = initState(c, "run-42");
    s = applyChoice(c, s, ev(c, "ev_born"), "cry_loud", createRng("run-42")).state;
    s = applyChoice(c, s, ev(c, "ev_military_school"), "excel", createRng("run-42")).state;

    const reconstructed = replay(
      c,
      "run-42",
      [
        { eventId: "ev_born", choiceId: "cry_loud" },
        { eventId: "ev_military_school", choiceId: "excel" },
      ],
      initState,
      createRng,
    );
    expect(reconstructed).toEqual(s);
  });

  it("replays identically twice (no hidden nondeterminism)", () => {
    const c = content();
    const hist = [
      { eventId: "ev_born", choiceId: "cry_loud" },
      { eventId: "ev_military_school", choiceId: "excel" },
    ];
    const a = replay(c, "x", hist, initState, createRng);
    const b = replay(c, "x", hist, initState, createRng);
    expect(a).toEqual(b);
  });
});

describe("autoPlaythrough", () => {
  it("runs to completion and is deterministic per seed", () => {
    const c = content();
    const a = autoPlaythrough(c, "auto-1", initState, createRng);
    const b = autoPlaythrough(c, "auto-1", initState, createRng);
    expect(a).toEqual(b);
    // With a 2-era fixture and budgets of 2/1, the run clears all eras → victory.
    expect(a.end?.kind).toBe("victory");
  });
});

describe("market operations (SIM1 nb-006)", () => {
  it("a choice's marketOps take/adjust a position so the market is no longer inert", () => {
    const raw = validRaw();
    // Add a market + attach a marketOp to the first boyhood choice.
    const withMarket = {
      ...raw,
      markets: {
        markets: [
          {
            id: "nyc_housing",
            label: "Real Estate",
            kind: "housing",
            baseIndex: 100,
            regimes: [{ id: "carry", baseline: 110, drift: 0.02, volatility: 0.03, dwell: 8 }],
            coupling: { money: 1 },
            housing: { region: "outer_boroughs", rentYield: 0.05, vacancy: 0, debtService: 0 },
          },
        ],
      },
    };
    const c = buildContent(withMarket);
    const firstEra = c.eras[0];
    if (!firstEra) throw new Error("no era");
    const boy = (c.eventsByEra.get(firstEra.id) ?? [])[0];
    if (!boy) throw new Error("no event");
    const choice = boy.choices[0];
    if (!choice) throw new Error("no choice");
    const event: GameEvent = {
      ...boy,
      choices: [
        { ...choice, marketOps: [{ market: "nyc_housing", addHolding: 500000, setLeverage: 4 }] },
        ...boy.choices.slice(1),
      ],
    };
    const before = initState(c, "seed");
    expect(before.markets.nyc_housing?.holding).toBe(0); // inert at start
    const after = applyChoice(c, before, event, choice.id, createRng("m")).state;
    expect(after.markets.nyc_housing?.holding).toBe(500000);
    expect(after.markets.nyc_housing?.leverage).toBe(4);
  });
});

describe("life-stage beget normalizes the birth year (NA-11 regression guard)", () => {
  // The succession beats (ev_cp_take_partner=1908, ev_cp_raise_heirs=1912) carry an authored
  // origins-era year. They fire EVERY generation, so applyChoice must normalize their year to NOW —
  // else begetYear() stamps each new generation's children decades in the past, they age out
  // instantly, and the line goes extinct within a generation (the millennium-run regression).
  it("a life-stage beget stamps children with the CURRENT year, not the authored 1912", () => {
    const content = loadContent();
    const comp = dealComposition(content.places, content.eras, "2", "Calloway");
    let state = foundByComposition(content, comp).state;
    // Fast-forward the run clock well past the authored 1908/1912 of the succession beats.
    state = {
      ...state,
      year: 1978,
      age: 1978 - state.birthYear,
      lastEventYear: 1978,
      flags: state.flags.filter((f) => f !== "raised_heirs").concat("partnered"),
    };
    const heirsEv = content.lifeStageEvents.find((e) => e.id === "ev_cp_raise_heirs");
    if (!heirsEv) throw new Error("no ev_cp_raise_heirs in lifeStageEvents");
    const before = state.family?.members ?? [];
    const next = applyChoice(content, state, heirsEv, "careful_pair", createRng("2")).state;
    const newKids = (next.family?.members ?? []).filter(
      (m) => !before.some((o) => o.id === m.id),
    );
    expect(newKids.length).toBeGreaterThan(0);
    for (const k of newKids) expect(k.born, `child ${k.id} born`).toBeGreaterThanOrEqual(1978);
  });
});
