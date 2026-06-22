import { describe, expect, it } from "vitest";
import type { Glimpse } from "../dynastyWorld";
import { applyMotivators, initMotivators, type Motivators } from "../motivators";
import { projectSaga } from "../readModel";

/** SS-13 — the pure UI read-model: GameState → SagaView (macro-act, motivators, rung, glimpses). */

const mot = (over: Partial<Motivators> = {}): Motivators => applyMotivators(initMotivators(), over);

describe("saga read model (SS-13)", () => {
  it("derives the macro-act + title from the year", () => {
    expect(projectSaga({ year: 1860, motivators: mot() }).macroAct).toBe("convergence");
    expect(projectSaga({ year: 1950, motivators: mot() }).macroActTitle).toBe("Emergence");
    expect(projectSaga({ year: 2100, motivators: mot() }).macroAct).toBe("ascension");
  });

  it("projects all 8 motivators with readable labels + the dominant pole", () => {
    const v = projectSaga({ year: 1900, motivators: mot({ worldview: -80, wealth: 20 }) });
    expect(v.motivators).toHaveLength(8);
    expect(v.motivators.find((m) => m.axis === "worldview")?.label).toMatch(/faith/);
    expect(v.dominant.axis).toBe("worldview");
    expect(v.dominant.pole).toBe("faith");
  });

  it("shows the class rung when known, null otherwise", () => {
    expect(projectSaga({ year: 1900, motivators: mot(), rung: 0 }).rung).toBe("poor");
    expect(projectSaga({ year: 1900, motivators: mot(), rung: 4 }).rung).toBe("upper");
    expect(projectSaga({ year: 1900, motivators: mot() }).rung).toBeNull();
  });

  it("passes glimpses through for the UI", () => {
    const glimpses: Glimpse[] = [
      {
        rivalId: "rival:bavaria",
        label: "bavaria",
        relation: "opposing",
        note: "rising",
        rung: 2,
        archetype: "political",
      },
    ];
    const v = projectSaga({ year: 1900, motivators: mot(), glimpses });
    expect(v.glimpses).toEqual(glimpses);
  });

  it("is pure — same input → equal view", () => {
    const input = { year: 1899, motivators: mot({ power: 50 }), rung: 2 };
    expect(projectSaga(input)).toEqual(projectSaga(input));
  });
});
