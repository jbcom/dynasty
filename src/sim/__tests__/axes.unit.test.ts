import { describe, expect, it } from "vitest";
import { loadContent } from "../../data/loadContent";
import { axisByKind, axisIntensityFor, axisOptionById, resolveAxisChoice } from "../axes";
import { foundDynasty } from "../founding";
import { resolveStack } from "../worldStacks";

/**
 * CP-4 — Epoch-0 thematic axes: the catalog loads + cross-ref validates; an axis
 * choice's impact is scaled by the founding place×era axis intensity (the SAME
 * stance lands harder where the axis is charged); founding applies + records it.
 */

const content = loadContent();

describe("CP-4 axes content", () => {
  it("loads the four thematic axes with options", () => {
    const kinds = new Set(content.axes.map((a) => a.axis));
    expect(kinds).toEqual(new Set(["faith", "ideology", "sociology", "tech"]));
    for (const a of content.axes) expect(a.options.length).toBeGreaterThanOrEqual(2);
  });

  it("axisIntensityFor reads the stack, defaulting to 0.5", () => {
    const baghdad = resolveStack(content.worldStacks, "baghdad", "caliphate");
    expect(axisIntensityFor(baghdad, "faith")).toBeGreaterThan(0.8);
    const westCoast = resolveStack(content.worldStacks, "west_coast", "origins");
    expect(axisIntensityFor(westCoast, "faith")).toBeLessThan(0.5);
    expect(axisIntensityFor(undefined, "faith")).toBe(0.5);
  });
});

describe("CP-4 resolveAxisChoice scaling", () => {
  it("scales deltas by intensity (same option, different magnitude)", () => {
    const faith = axisByKind(content.axes, "faith");
    if (!faith) throw new Error("no faith axis");
    const reject = axisOptionById(faith, "reject");
    if (!reject) throw new Error("no reject option");

    const hot = resolveAxisChoice(reject, 0.9);
    const cold = resolveAxisChoice(reject, 0.2);
    // The reject option carries a reputation hit + heat; both scale with intensity.
    expect(Math.abs(hot.effects.reputation ?? 0)).toBeGreaterThan(
      Math.abs(cold.effects.reputation ?? 0),
    );
    expect(hot.effects.heat ?? 0).toBeGreaterThan(cold.effects.heat ?? 0);
    // Flags are NOT scaled — a stance is a stance.
    expect(hot.setFlags).toEqual(cold.setFlags);
    expect(hot.setFlags).toContain("faith_rejected");
  });
});

describe("CP-4 axis choices wired into founding", () => {
  it("rejecting the faith lands harder in a high-faith place than a low-faith one", () => {
    // Same stance (reject faith), two places of very different faith intensity.
    const baghdad = foundDynasty(content, {
      momentId: "abbasid_baghdad_762",
      surname: "X",
      seed: "axis",
      axisChoices: { faith: "reject" },
    }).state;
    const frontier = foundDynasty(content, {
      momentId: "gold_rush_1849",
      surname: "X",
      seed: "axis",
      axisChoices: { faith: "reject" },
    }).state;

    // Both set the durable flag.
    expect(baghdad.flags).toContain("faith_rejected");
    expect(frontier.flags).toContain("faith_rejected");
    expect(baghdad.founding?.axisChoices?.faith).toBe("reject");

    // Reputation drops further (more negative) in high-faith Baghdad than on the
    // secular gold-rush frontier — the place-and-time scaling.
    expect(baghdad.meters.reputation).toBeLessThan(frontier.meters.reputation);
  });

  it("no axis choices = no axis flags/deltas (pure baseline)", () => {
    const plain = foundDynasty(content, {
      momentId: "gold_rush_1849",
      surname: "X",
      seed: "axis",
    }).state;
    expect(plain.flags.some((f) => f.startsWith("faith_"))).toBe(false);
  });
});
