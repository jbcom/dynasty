import { describe, expect, it } from "vitest";
import triggersJson from "../../../data/saga/triggers.json" with { type: "json" };
import { TriggerTableSchema } from "../schema";
import {
  type CastFamily,
  conditionMet,
  crossingsOf,
  evaluateTriggers,
  initCast,
  recordCrossing,
  type SpineState,
  type TriggerRule,
} from "../triggerLattice";

/**
 * FS-5: the deterministic-trigger lattice. Compound conditions on spine state activate whole family
 * branches; the recurring cast carries memory so later crossings can require earlier ones. These tests
 * pin: compound all-of matching, prior-crossing memory, priority ordering, and replay determinism.
 */

const baseState = (over: Partial<SpineState> = {}): SpineState => ({
  archetype: "economic",
  leanings: { power: 0, wealth: 0 },
  meters: { money: 100 },
  place: "new-york",
  year: 1880,
  era: "convergence",
  flags: new Set<string>(),
  crossings: {},
  ...over,
});

describe("trigger lattice (FS-5)", () => {
  it("a compound condition fires only when ALL clauses hold", () => {
    const cond = {
      archetype: "economic",
      leanings: { power: { min: 40 } },
      meters: { money: { min: 1000 } },
      place: "new-york",
      eras: ["convergence"],
    };
    // All hold → fires.
    expect(
      conditionMet(
        cond,
        baseState({ leanings: { power: 60 }, meters: { money: 5000 } }),
        "italian",
      ),
    ).toBe(true);
    // money too low → no.
    expect(
      conditionMet(cond, baseState({ leanings: { power: 60 }, meters: { money: 200 } }), "italian"),
    ).toBe(false);
    // wrong place → no.
    expect(
      conditionMet(
        cond,
        baseState({ leanings: { power: 60 }, meters: { money: 5000 }, place: "boston" }),
        "italian",
      ),
    ).toBe(false);
  });

  it("flags and notFlags gate correctly", () => {
    const cond = { flags: ["met_dockmaster"], notFlags: ["betrayed_italians"] };
    expect(conditionMet(cond, baseState({ flags: new Set(["met_dockmaster"]) }), "italian")).toBe(
      true,
    );
    expect(conditionMet(cond, baseState({ flags: new Set() }), "italian")).toBe(false);
    expect(
      conditionMet(
        cond,
        baseState({ flags: new Set(["met_dockmaster", "betrayed_italians"]) }),
        "italian",
      ),
    ).toBe(false);
  });

  it("MEMORY: a prior-crossing-gated branch fires only after the family was met before", () => {
    const cond = { priorCrossing: { min: 1 } };
    expect(conditionMet(cond, baseState({ crossings: {} }), "irish")).toBe(false); // never met
    expect(conditionMet(cond, baseState({ crossings: { irish: 2 } }), "irish")).toBe(true); // met before
  });

  it("evaluateTriggers returns matches highest-priority first, deterministically", () => {
    const rules: TriggerRule[] = [
      { family: "italian", branch: "rise", priority: 1, condition: { eras: ["convergence"] } },
      { family: "irish", branch: "docks", priority: 5, condition: { eras: ["convergence"] } },
      { family: "chinese", branch: "rail", priority: 5, condition: { place: "boston" } }, // won't match
    ];
    const fired = evaluateTriggers(rules, baseState());
    expect(fired.map((b) => `${b.family}:${b.branch}`)).toEqual(["irish:docks", "italian:rise"]);
  });

  it("`once` rules don't re-fire once in the fired set", () => {
    const rules: TriggerRule[] = [
      { family: "irish", branch: "docks", once: true, condition: { eras: ["convergence"] } },
    ];
    expect(evaluateTriggers(rules, baseState())).toHaveLength(1);
    expect(evaluateTriggers(rules, baseState(), new Set(["irish:docks"]))).toHaveLength(0);
  });

  it("is REPLAY-DETERMINISTIC — same rules + state → identical activation order", () => {
    const rules: TriggerRule[] = [
      { family: "italian", branch: "a", priority: 2, condition: {} },
      { family: "irish", branch: "b", priority: 2, condition: {} },
      { family: "bavaria", branch: "c", priority: 2, condition: {} },
    ];
    const s = baseState();
    expect(evaluateTriggers(rules, s)).toEqual(evaluateTriggers(rules, s));
  });

  it("the recurring cast records crossings + projects them into the state vector (memory)", () => {
    let cast: CastFamily[] = initCast([
      { id: "irish", surname: "Donnelly" },
      { id: "italian", surname: "Ferraro" },
    ]);
    expect(crossingsOf(cast)).toEqual({ irish: 0, italian: 0 });
    cast = recordCrossing(cast, "irish", "docks");
    cast = recordCrossing(cast, "irish", "docks"); // idempotent — same branch not double-counted
    cast = recordCrossing(cast, "irish", "tammany");
    expect(crossingsOf(cast)).toEqual({ irish: 2, italian: 0 });
    // Now an irish branch gated on priorCrossing≥1 would fire.
    expect(
      conditionMet(
        { priorCrossing: { min: 1 } },
        baseState({ crossings: crossingsOf(cast) }),
        "irish",
      ),
    ).toBe(true);
  });

  it("FS-5b: the real triggers.json validates + fires the right branches by era + memory", () => {
    const table = TriggerTableSchema.parse(triggersJson);
    expect(table.cast.length).toBe(7); // one recurring family per wave
    expect(table.rules.length).toBeGreaterThan(7);

    // 1845 convergence, never-met: the Irish famine-docks ARRIVAL fires; the memory-gated return does NOT.
    const arrival = evaluateTriggers(
      table.rules,
      baseState({ year: 1850, era: "convergence", crossings: {} }),
    ).map((b) => `${b.family}:${b.branch}`);
    expect(arrival).toContain("ireland:arrival_famine_docks");
    expect(arrival).not.toContain("ireland:machine_politics_return");

    // 1925 emergence, HAVING met the Irish before: the memory-gated return now fires.
    const later = evaluateTriggers(
      table.rules,
      baseState({ year: 1925, era: "emergence", crossings: { ireland: 1 } }),
    ).map((b) => `${b.family}:${b.branch}`);
    expect(later).toContain("ireland:machine_politics_return");
    expect(later).not.toContain("ireland:arrival_famine_docks"); // arrival is era-gated to convergence

    // The Chinese arrival is gated to the railroad-West window (1863-1882), not the East-Coast 1880s waves.
    const railroad = evaluateTriggers(
      table.rules,
      baseState({ year: 1870, era: "convergence", crossings: {} }),
    ).map((b) => `${b.family}:${b.branch}`);
    expect(railroad).toContain("chinese:arrival_railroad_west");
  });

  it("SPINE-WEAVE-PAYOFF: a signature interstitial flag surfaces its matched family branch downstream", () => {
    const table = TriggerTableSchema.parse(triggersJson);

    // A media-shaping founder (g6 broadcast interstitial) surfaces the narrative-industry family thread in
    // the emergence era WITHOUT a prior crossing — the early choice echoes forward.
    const withoutFlag = evaluateTriggers(
      table.rules,
      baseState({ year: 1950, era: "emergence", crossings: {}, flags: new Set() }),
    ).map((b) => `${b.family}:${b.branch}`);
    expect(withoutFlag).not.toContain("ashkenazi_jewish:founding_of_hollywood");

    const withFlag = evaluateTriggers(
      table.rules,
      baseState({
        year: 1950,
        era: "emergence",
        crossings: {},
        flags: new Set(["g6_shaped_the_narrative"]),
      }),
    ).map((b) => `${b.family}:${b.branch}`);
    expect(withFlag).toContain("ashkenazi_jewish:founding_of_hollywood");

    // The Gilded-Age influence flag surfaces the syndicate-power family thread in its window — flag + era
    // + year gated so it cannot mis-fire outside the 1920-1960 syndicate era.
    const syndicate = evaluateTriggers(
      table.rules,
      baseState({
        year: 1935,
        era: "emergence",
        crossings: {},
        leanings: {},
        flags: new Set(["g3_bought_the_influence"]),
      }),
    ).map((b) => `${b.family}:${b.branch}`);
    expect(syndicate).toContain("italian:syndicate_crossroads");

    // …but the same flag does NOT fire the syndicate thread outside its year window.
    const tooEarly = evaluateTriggers(
      table.rules,
      baseState({
        year: 1905,
        era: "emergence",
        crossings: {},
        leanings: {},
        flags: new Set(["g3_bought_the_influence"]),
      }),
    ).map((b) => `${b.family}:${b.branch}`);
    expect(tooEarly).not.toContain("italian:syndicate_crossroads");
  });
});
