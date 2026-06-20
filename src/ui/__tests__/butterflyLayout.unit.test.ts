import { describe, expect, it } from "vitest";
import type { LedgerEntry } from "../../sim/state";
import { layoutButterfly } from "../butterflyLayout";

const entry = (over: Partial<LedgerEntry>): LedgerEntry => ({
  seq: 0,
  sourceChoice: "excel",
  sourceEvent: "ev_military_school",
  year: 1959,
  text: "Because you mastered the academy, the deal came easier.",
  ruleId: "br_discipline",
  ...over,
});

describe("layoutButterfly", () => {
  it("returns empty layout for no ledger", () => {
    const l = layoutButterfly([]);
    expect(l.nodes).toHaveLength(0);
    expect(l.links).toHaveLength(0);
  });

  it("creates a cause and effect node plus a link per entry", () => {
    const l = layoutButterfly([entry({})]);
    expect(l.nodes).toHaveLength(2);
    expect(l.nodes.map((n) => n.kind).sort()).toEqual(["cause", "effect"]);
    expect(l.links).toHaveLength(1);
  });

  it("dedupes shared cause/effect nodes across entries", () => {
    const l = layoutButterfly([
      entry({ seq: 0 }),
      entry({ seq: 1, ruleId: "br_other" }), // same cause, new effect
    ]);
    // 1 cause + 2 effects = 3 nodes, 2 links
    expect(l.nodes).toHaveLength(3);
    expect(l.links).toHaveLength(2);
  });

  it("assigns finite coordinates to every node", () => {
    const l = layoutButterfly([entry({ seq: 0 }), entry({ seq: 1, ruleId: "r2" })], 400, 400);
    for (const n of l.nodes) {
      expect(Number.isFinite(n.x)).toBe(true);
      expect(Number.isFinite(n.y)).toBe(true);
    }
  });

  it("is deterministic across runs", () => {
    const ledger = [entry({ seq: 0 }), entry({ seq: 1, ruleId: "r2" })];
    const a = layoutButterfly(ledger);
    const b = layoutButterfly(ledger);
    expect(a.nodes.map((n) => [n.x, n.y])).toEqual(b.nodes.map((n) => [n.x, n.y]));
  });
});
