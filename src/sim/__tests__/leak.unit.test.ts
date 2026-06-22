import { describe, expect, it } from "vitest";
import { hasPresetLeak } from "../leak";

/**
 * The preset-person leak floor (src/sim/leak.ts) is the single source of truth for "no real person".
 * These tests lock in the two hard-won false-positive fixes:
 *   - common-noun homographs of preset surnames must PASS (case-sensitivity);
 *   - culture-pool given names (Friedrich/Frederick) must PASS — only the surname/identity leaks.
 */
describe("preset-person leak floor", () => {
  it("flags real preset identities (capitalized surnames + full names + initials)", () => {
    for (const leak of [
      "the Drumpf ledger",
      "a Trump tower",
      "Elon paced the floor",
      "old Musk money", // capitalized surname Musk → leak
      "the Kennedy compound",
      "Walter Musk",
      "Joseph Kennedy arrived",
      "JFK",
    ]) {
      expect(hasPresetLeak(leak), leak).toBe(true);
    }
  });

  it("does NOT flag common-noun homographs in sensory prose (case-sensitive)", () => {
    for (const ok of [
      "the heavy musk of dray horses", // smell, not the surname
      "she played a trump card",
      "a graham cracker crumbled",
      "the air, thick and musky, hung over the wharf",
    ]) {
      expect(hasPresetLeak(ok), ok).toBe(false);
    }
  });

  it("does NOT flag pooled given names — only the surname/identity is the leak", () => {
    // "Friedrich"/"Frederick" are real Bavarian given names (onomastics.json); the line may bear them.
    for (const ok of ["Friedrich, the cooper's son", "young Frederick at the font"]) {
      expect(hasPresetLeak(ok), ok).toBe(false);
    }
    // …but the full progenitor identity still leaks via the surname.
    expect(hasPresetLeak("Friedrich Drumpf")).toBe(true);
  });

  it("accepts a parsed object, not just a string", () => {
    expect(hasPresetLeak({ prose: ["the musk of horses"] })).toBe(false);
    expect(hasPresetLeak({ prose: ["the Drumpf name"] })).toBe(true);
  });
});
