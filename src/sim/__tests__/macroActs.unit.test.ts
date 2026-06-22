import { describe, expect, it } from "vitest";
import {
  EPOCHS,
  type Epoch,
  epochForYear,
  epochImpact,
  macroActForYear,
  macroActTitle,
  vulnerableToShock,
} from "../macroActs";
import { initMotivators, type Motivators } from "../motivators";

/** SS-4 — the three macro-acts + cross-cutting epochs that hit each line per its motivators. */

const mot = (over: Partial<Motivators> = {}): Motivators => ({ ...initMotivators(), ...over });

describe("macro-acts + epochs (SS-4)", () => {
  it("bands years into Founding / Convergence / Emergence / Ascension (FS-2)", () => {
    // FS-2: the founding band anchors the spine at 1776; convergence now starts 1860.
    expect(macroActForYear(1790)).toBe("founding");
    expect(macroActForYear(1859)).toBe("founding");
    expect(macroActForYear(1860)).toBe("convergence");
    expect(macroActForYear(1899)).toBe("convergence");
    expect(macroActForYear(1900)).toBe("emergence");
    expect(macroActForYear(2040)).toBe("emergence");
    expect(macroActForYear(2041)).toBe("ascension");
    expect(macroActForYear(2300)).toBe("ascension");
    expect(macroActTitle("founding")).toBe("Founding");
    expect(macroActTitle("ascension")).toBe("Ascension");
  });

  it("epochForYear returns the latest arrived epoch", () => {
    expect(epochForYear(1700)).toBeNull(); // before the founding epoch (1776)
    expect(epochForYear(1800)?.id).toBe("founding"); // FS-2: the founding epoch
    expect(epochForYear(1870)?.id).toBe("industrial");
    expect(epochForYear(1920)?.id).toBe("great_wars");
    expect(epochForYear(2100)?.id).toBe("space");
    expect(EPOCHS.length).toBeGreaterThanOrEqual(6); // FS-2 added the founding epoch
  });

  it("the same epoch RIDES a progress line and CRUSHES a tradition line", () => {
    const industrial = EPOCHS.find((e) => e.id === "industrial") as Epoch;
    const progressive = mot({ tradition: 90 }); // tradition+ pole = progress
    const traditional = mot({ tradition: -90 });
    expect(epochImpact(industrial, progressive)).toBeGreaterThan(0.5);
    expect(epochImpact(industrial, traditional)).toBeLessThan(-0.5);
  });

  it("a war/collapse shock epoch makes a contrary-leaning line vulnerable", () => {
    const war = EPOCHS.find((e) => e.id === "great_wars") as Epoch;
    expect(war.kind).toBe("shock");
    // war rewards power+; a community-leaning (power−) line is vulnerable to it.
    expect(vulnerableToShock(war, mot({ power: -80 }))).toBe(true);
    expect(vulnerableToShock(war, mot({ power: 80 }))).toBe(false);
    // a non-shock epoch never flags vulnerability.
    const industrial = EPOCHS.find((e) => e.id === "industrial") as Epoch;
    expect(vulnerableToShock(industrial, mot({ tradition: -90 }))).toBe(false);
  });
});
