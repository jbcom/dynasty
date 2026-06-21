import { describe, expect, it } from "vitest";
import { loadSaga } from "../../data/loadSaga";
import { initMotivators } from "../../sim/motivators";
import { SagaDriver } from "../sagaDriver";

/**
 * The saga driver bridges run-state → the novel: it selects a line's act from the corpus, walks it,
 * and yields the UI frame + carried motivators. When a cell has no authored act it yields a null
 * scene so the engine falls back to its event flow (partial content never breaks play).
 */

const corpus = loadSaga();

describe("SagaDriver", () => {
  it("begins the authored Ireland/economic tier-0 act and frames its opening scene", () => {
    const d = new SagaDriver(corpus);
    d.begin({ wave: "ireland", archetype: "economic", tier: 0 }, initMotivators());
    const frame = d.frame();
    expect(frame.actTitle).toContain("Act");
    expect(frame.scene?.id).toBe("sc:ire:econ:t0:hold");
    expect(d.active).toBe(true);
  });

  it("yields a null scene for an unauthored cell (engine falls back)", () => {
    const d = new SagaDriver(corpus);
    d.begin({ wave: "nonexistent", archetype: "economic", tier: 0 }, initMotivators());
    expect(d.frame().scene).toBeNull();
    expect(d.active).toBe(false);
  });

  it("walks beat → decision → decision and carries motivators + flags", () => {
    const d = new SagaDriver(corpus);
    d.begin({ wave: "ireland", archetype: "economic", tier: 0 }, initMotivators());
    const m1 = d.pickBeat(0); // hold beat → steerage
    expect(m1?.wealth).toBeGreaterThan(0);
    expect(d.flags).toContain("counts_the_coin");
    expect(d.frame().scene?.id).toBe("sc:ire:econ:t0:steerage");
    d.pickDecision(0); // steerage → landing
    expect(d.frame().scene?.id).toBe("sc:ire:econ:t0:landing");
    d.pickDecision(0); // landing → act end
    expect(d.frame().ended).toBe(true);
    expect(d.active).toBe(false);
  });
});
