import { describe, expect, it } from "vitest";
import { humanizeFlag, isHiddenFlag, visibleFlagLabels } from "../flagLabel";

/**
 * PL-10 — the Dossier shows a CHARACTER record, not a debug dump. Structural, lifecycle,
 * and prologue-machinery flags are hidden; the dissolved preset-family keys must never
 * surface (0-leak invariant); the rest read as humanized prose.
 */

describe("PL-10 flag presentation", () => {
  it("hides structural + lifecycle machinery", () => {
    for (const f of [
      "founded_line",
      "named",
      "partnered",
      "raised_heirs",
      "place:american_midwest",
      "culture:irish_catholic",
      "archetype:economic",
      "founded:composed:west_coast:origins",
      "mkt_crash_crypto",
    ]) {
      expect(isHiddenFlag(f), f).toBe(true);
    }
  });

  it("hides prologue / preset-family keys (the 0-leak invariant in the UI)", () => {
    for (const f of [
      "trump_prologue",
      "kennedy_dynasty_active",
      "musk_dynasty_active",
      "trump_science_lineage",
      "religious_prologue",
    ]) {
      expect(isHiddenFlag(f), f).toBe(true);
    }
  });

  it("shows + humanizes narratively meaningful flags", () => {
    expect(isHiddenFlag("married_up")).toBe(false);
    expect(humanizeFlag("married_up")).toBe("Married up");
    expect(humanizeFlag("roaring_twenties")).toBe("Roaring twenties");
  });

  it("visibleFlagLabels filters, humanizes, de-dupes and sorts", () => {
    const labels = visibleFlagLabels([
      "place:west_coast", // hidden
      "trump_prologue", // hidden (leak)
      "named", // hidden
      "married_up", // → Married up
      "klondike_fortune", // → Klondike fortune
      "klondike_fortune", // dup
    ]);
    expect(labels).toEqual(["Klondike fortune", "Married up"]);
    // No preset-family name leaks through.
    expect(labels.join(" ")).not.toMatch(/trump|kennedy|musk/i);
  });
});
