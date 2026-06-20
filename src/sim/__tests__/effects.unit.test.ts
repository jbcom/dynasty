import { describe, expect, it } from "vitest";
import { buildContent } from "../content";
import { applyChoice, autoPlaythrough, replay } from "../effects";
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
