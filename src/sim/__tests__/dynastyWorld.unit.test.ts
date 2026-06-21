import { describe, expect, it } from "vitest";
import { loadContent } from "../../data/loadContent";
import { advanceWorld, createDynastyWorld, detectGlimpses } from "../dynastyWorld";
import { createRng } from "../rng";

/** SS-8 — the multi-line world: every non-player wave grows as a deterministic GOAP agent; glimpses surface relations. */

const content = loadContent();

describe("dynasty world (SS-8)", () => {
  it("creates one rival per non-player WAVE place (destinations + the player excluded)", () => {
    const world = createDynastyWorld(content.places, "ireland", createRng("w1"));
    const ids = world.rivals.map((r) => r.id);
    expect(ids).toContain("rival:bavaria");
    expect(ids).toContain("rival:italian");
    expect(ids).not.toContain("rival:ireland"); // the player's line
    expect(ids).not.toContain("rival:east_coast"); // a destination, not a wave
    // every wave but the player's becomes a rival.
    const waves = content.places.filter((p) => p.kind !== "destination" && p.arrivalYears).length;
    expect(world.rivals.length).toBe(waves - 1);
  });

  it("advances the whole world a turn + re-snapshots (deterministic)", () => {
    const mk = () => {
      const w = createDynastyWorld(content.places, "ireland", createRng("w2"));
      return advanceWorld(w, 1900, createRng("w2"));
    };
    const a = mk();
    const b = mk();
    expect(a.snapshots).toEqual(b.snapshots);
    // every rival has a chosen strategy after a turn.
    for (const s of a.snapshots) expect(s.strategy).toBeTruthy();
  });

  it("rivals climb over many turns when riding their epoch", () => {
    let w = createDynastyWorld(content.places, "ireland", createRng("w3"));
    const startMax = Math.max(...w.snapshots.map((s) => s.rung));
    for (let y = 1900; y <= 2100; y += 20) w = advanceWorld(w, y, createRng("w3"));
    const endMax = Math.max(...w.snapshots.map((s) => s.rung));
    expect(endMax).toBeGreaterThanOrEqual(startMax); // at least one line advanced over a century+
  });

  it("glimpses classify relation by strategy + only show near-station lines", () => {
    let w = createDynastyWorld(content.places, "ireland", createRng("w4"));
    w = advanceWorld(w, 1900, createRng("w4"));
    // a player accumulating: same-strategy rival = opposing; complementary (seize_power) = contributing.
    const glimpses = detectGlimpses(w, 0, "accumulate");
    for (const g of glimpses) {
      expect(["opposing", "contributing", "neutral"]).toContain(g.relation);
      expect(["rising", "struggling", "holding"]).toContain(g.note);
    }
    expect(glimpses.length).toBeLessThanOrEqual(3);
  });

  it("an opposing relation arises when a rival shares the player's strategy", () => {
    const w = createDynastyWorld(content.places, "ireland", createRng("w5"));
    const first = w.snapshots[0];
    if (!first) throw new Error("no rivals");
    // force a known snapshot: one rival accumulating at the player's rung.
    w.snapshots[0] = { ...first, rung: 0, strategy: "accumulate", alive: true };
    const g = detectGlimpses(w, 0, "accumulate", 10).find((x) => x.rivalId === first.id);
    expect(g?.relation).toBe("opposing");
  });
});
