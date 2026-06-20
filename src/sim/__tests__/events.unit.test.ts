import { describe, expect, it } from "vitest";
import { buildContent } from "../content";
import {
  effectiveWeight,
  eligibleEvents,
  evalComparator,
  historicityOf,
  meetsRequires,
  pickNextEvent,
} from "../events";
import { createRng } from "../rng";
import type { GameEvent } from "../schema";
import { initState } from "../state";
import { validRaw } from "./fixtures";

const content = () => buildContent(validRaw());

describe("historicityOf (FD-2 unified event pool)", () => {
  const ev = (over: Partial<GameEvent>): GameEvent =>
    ({
      id: "e",
      era: "boyhood",
      year: 1950,
      title: "t",
      scene: "s",
      researchNote: "r",
      extrapolated: false,
      startrekInspired: false,
      tags: [],
      requires: { flags: [], notFlags: [], meters: {}, personality: {} },
      weight: 10,
      repeatable: false,
      choices: [],
      ...over,
    }) as GameEvent;

  it("uses explicit historicity when authored", () => {
    expect(historicityOf(ev({ historicity: "real" }))).toBe("real");
    expect(historicityOf(ev({ historicity: "personal" }))).toBe("personal");
  });

  it("reconciles the legacy extrapolated boolean when historicity is absent", () => {
    expect(historicityOf(ev({ extrapolated: true }))).toBe("extrapolated");
  });

  it("defaults to personal for an ordinary authored protagonist beat", () => {
    expect(historicityOf(ev({}))).toBe("personal");
  });
});

describe("evalComparator", () => {
  it("handles every operator", () => {
    expect(evalComparator(">=20", 20)).toBe(true);
    expect(evalComparator(">=20", 19)).toBe(false);
    expect(evalComparator("<50", 49)).toBe(true);
    expect(evalComparator("== 0", 0)).toBe(true);
    expect(evalComparator("!=5", 5)).toBe(false);
    expect(evalComparator(">100", 101)).toBe(true);
    expect(evalComparator("<=-10", -10)).toBe(true);
  });

  it("throws on a malformed comparator", () => {
    expect(() => evalComparator("~5", 5)).toThrow();
  });
});

describe("meetsRequires", () => {
  it("checks flags, notFlags, meters, and age", () => {
    const s = initState(content(), "seed");
    s.flags = ["disciplined"];
    s.meters.money = 600;
    s.age = 30;
    expect(
      meetsRequires(s, {
        flags: ["disciplined"],
        notFlags: ["bankrupt"],
        meters: { money: ">=500" },
        minAge: 18,
      }),
    ).toBe(true);
    expect(meetsRequires(s, { flags: ["missing"], notFlags: [], meters: {} })).toBe(false);
    expect(meetsRequires(s, { flags: [], notFlags: ["disciplined"], meters: {} })).toBe(false);
    expect(meetsRequires(s, { flags: [], notFlags: [], meters: { money: ">=10000" } })).toBe(false);
    expect(meetsRequires(s, { flags: [], notFlags: [], meters: {}, minAge: 99 })).toBe(false);
  });
});

describe("eligibleEvents", () => {
  it("returns only current-era events whose requires are met", () => {
    const c = content();
    const s = initState(c, "seed");
    // boyhood era: ev_born has no requires; ev_military_school needs loud_baby.
    const elig = eligibleEvents(c, s).map((e) => e.id);
    expect(elig).toContain("ev_born");
    expect(elig).not.toContain("ev_military_school");
    expect(elig).not.toContain("ev_first_deal"); // different era
  });

  it("excludes already-fired non-repeatable events", () => {
    const c = content();
    const s = initState(c, "seed");
    s.firedEvents = ["ev_born"];
    expect(eligibleEvents(c, s).map((e) => e.id)).not.toContain("ev_born");
  });

  it("never returns an event earlier than the chronological floor (no time travel)", () => {
    const c = content();
    const s = initState(c, "seed");
    s.flags = ["loud_baby"]; // makes ev_military_school (1959) eligible
    s.lastEventYear = 1959;
    const ids = eligibleEvents(c, s).map((e) => e.id);
    // ev_born is 1946 < 1959 floor → excluded; the 1959 school event remains.
    expect(ids).not.toContain("ev_born");
    expect(ids).toContain("ev_military_school");
  });

  it("relaxes the floor when nothing at/after it remains (era still progresses)", () => {
    const c = content();
    const s = initState(c, "seed");
    // Floor far in the future with no qualifying events — must fall back, not stall.
    s.lastEventYear = 3000;
    expect(eligibleEvents(c, s).length).toBeGreaterThan(0);
  });
});

describe("effectiveWeight", () => {
  it("applies a butterfly rule multiplier when the cause flag is active", () => {
    const c = content();
    const s = initState(c, "seed");
    s.eraIndex = 1; // mogul era
    s.meters.money = 600;
    const deal = c.eventsByEra.get("mogul")?.[0];
    if (!deal) throw new Error("no deal event");
    const base = effectiveWeight(c, { ...s, flags: [] }, deal);
    const boosted = effectiveWeight(c, { ...s, flags: ["disciplined"] }, deal);
    expect(boosted).toBeCloseTo(base * 1.5, 5);
  });

  it("amplifies weight by ripple pressure on a matching tag", () => {
    const c = content();
    const s = initState(c, "seed");
    const born = c.eventsByEra.get("boyhood")?.[0];
    if (!born) throw new Error("no born event");
    const tagged = { ...born, tags: ["chaos"] };
    const withPressure = { ...s, ripples: { chaos: 0.5 } };
    expect(effectiveWeight(c, withPressure, tagged)).toBeCloseTo(born.weight * 1.5, 5);
  });

  it("applies branch bias only on the matching branch (AH9)", () => {
    const c = content();
    const s = initState(c, "seed");
    const born = c.eventsByEra.get("boyhood")?.[0];
    if (!born) throw new Error("no born event");
    const biased = { ...born, bias: { branch: { nazi: 3 }, personality: {} } };
    // Default branch: no match → unchanged.
    expect(effectiveWeight(c, { ...s, flags: [] }, biased)).toBeCloseTo(born.weight, 5);
    // Nazi branch: ×3.
    expect(effectiveWeight(c, { ...s, flags: ["axis_ascendant"] }, biased)).toBeCloseTo(
      born.weight * 3,
      5,
    );
  });

  it("applies personality bias scaled by the axis value (AH9)", () => {
    const c = content();
    const s = initState(c, "seed");
    const born = c.eventsByEra.get("boyhood")?.[0];
    if (!born) throw new Error("no born event");
    // sensitivity 1 on grandiosity: weight ×(1 + 1*(axis/100)).
    const biased = { ...born, bias: { branch: {}, personality: { grandiosity: 1 } } };
    const grandiose = { ...s, personality: { ...s.personality, grandiosity: 80 } };
    expect(effectiveWeight(c, grandiose, biased)).toBeCloseTo(born.weight * 1.8, 5);
    const humble = { ...s, personality: { ...s.personality, grandiosity: -50 } };
    expect(effectiveWeight(c, humble, biased)).toBeCloseTo(born.weight * 0.5, 5);
  });
});

describe("pickNextEvent", () => {
  it("is deterministic for a given seed", () => {
    const c = content();
    const s = initState(c, "seed");
    const a = pickNextEvent(c, s, createRng("pick-1"));
    const b = pickNextEvent(c, s, createRng("pick-1"));
    expect(a?.id).toBe(b?.id);
  });

  it("returns null when the era is exhausted", () => {
    const c = content();
    const s = initState(c, "seed");
    s.firedEvents = ["ev_born", "ev_military_school"];
    expect(pickNextEvent(c, s, createRng("x"))).toBeNull();
  });

  it("only ever returns an eligible event", () => {
    const c = content();
    const s = initState(c, "seed");
    for (let i = 0; i < 50; i++) {
      const ev = pickNextEvent(c, s, createRng(`s${i}`));
      expect(ev?.id).toBe("ev_born"); // only eligible boyhood event at start
    }
  });
});
