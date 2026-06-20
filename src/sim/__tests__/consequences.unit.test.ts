import { describe, expect, it } from "vitest";
import { landDueConsequences, scheduleConsequences } from "../butterfly";
import { buildContent, type RawContent } from "../content";
import { initState } from "../state";
import { validRaw } from "./fixtures";

/** Fixture content with one delayed consequence: setting "casino_empire" → a debt bomb 4y later. */
function rawWithConsequence(): RawContent {
  const raw = validRaw();
  raw.butterflyRules = {
    rules: [],
    consequences: [
      {
        id: "cq_debt_bomb",
        cause: "casino_empire",
        delayYears: 4,
        effects: { money: -500, heat: 12 },
        personality: { grandiosity: 5 },
        setFlags: ["overleveraged"],
        chainTemplate: "The casino debt you took on came due.",
        repeatable: false,
      },
    ],
  };
  return raw;
}

const choice = (over: Record<string, unknown> = {}) => ({
  id: "go_big",
  text: "Bet it all.",
  effects: {},
  personality: {},
  setFlags: ["casino_empire"],
  clearFlags: [],
  ripples: [],
  outcome: "ok",
  ...over,
});

describe("delayed consequences", () => {
  it("schedules a consequence when its cause flag is set", () => {
    const c = buildContent(rawWithConsequence());
    const s = { ...initState(c, "seed"), year: 1988 };
    const pending = scheduleConsequences(c, s, choice() as never);
    expect(pending).toHaveLength(1);
    expect(pending[0]?.consequenceId).toBe("cq_debt_bomb");
    expect(pending[0]?.dueYear).toBe(1992); // 1988 + 4
  });

  it("does not land before the due year", () => {
    const c = buildContent(rawWithConsequence());
    const s = { ...initState(c, "seed"), year: 1990, pending: [{ consequenceId: "cq_debt_bomb", dueYear: 1992 }] };
    const { state, newLedger } = landDueConsequences(c, s);
    expect(newLedger).toHaveLength(0);
    expect(state.pending).toHaveLength(1);
  });

  it("lands the effect (meters, personality, flag, ledger) when due", () => {
    const c = buildContent(rawWithConsequence());
    const s = {
      ...initState(c, "seed"),
      year: 1993,
      meters: { ...initState(c, "seed").meters, money: 1000, heat: 0 },
      pending: [{ consequenceId: "cq_debt_bomb", dueYear: 1992 }],
    };
    const { state, newLedger } = landDueConsequences(c, s);
    expect(state.meters.money).toBe(500); // 1000 - 500
    expect(state.meters.heat).toBe(12);
    expect(state.personality.grandiosity).toBe(15); // 10 start + 5
    expect(state.flags).toContain("overleveraged");
    expect(state.firedConsequences).toContain("cq_debt_bomb");
    expect(state.pending).toHaveLength(0);
    expect(newLedger).toHaveLength(1);
    expect(newLedger[0]?.text).toContain("debt");
  });

  it("is a no-op when there is nothing pending", () => {
    const c = buildContent(rawWithConsequence());
    const s = initState(c, "seed");
    const { state, newLedger } = landDueConsequences(c, s);
    expect(newLedger).toHaveLength(0);
    expect(state).toBe(s); // unchanged reference
  });
});
