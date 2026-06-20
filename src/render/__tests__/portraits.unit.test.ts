import { describe, expect, it } from "vitest";
import { PORTRAITS, resolvePortrait } from "../portraits";

describe("portrait registry", () => {
  it("covers the whole life arc", () => {
    for (const id of ["infant", "young_mogul", "president", "emperor", "martian"]) {
      expect(PORTRAITS[id]).toBeDefined();
    }
  });

  it("resolvePortrait returns the matching def", () => {
    expect(resolvePortrait("president").label).toBe("President");
  });

  it("falls back gracefully for an unknown id", () => {
    const p = resolvePortrait("does_not_exist");
    expect(p.id).toBe("unknown");
    expect(p.layers.length).toBeGreaterThan(0);
  });

  it("every portrait has at least one layer", () => {
    for (const def of Object.values(PORTRAITS)) {
      expect(def.layers.length).toBeGreaterThan(0);
    }
  });
});
