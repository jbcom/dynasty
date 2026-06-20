import { describe, expect, it } from "vitest";
import { AssetsFileSchema } from "../../sim/schema";
import assetsJson from "../assets.json";

describe("assets manifest", () => {
  it("validates against the AssetsFile schema", () => {
    const result = AssetsFileSchema.safeParse(assetsJson);
    expect(result.success).toBe(true);
  });

  it("every asset declares a recognized free license", () => {
    const parsed = AssetsFileSchema.parse(assetsJson);
    const allowed = new Set(["CC0", "CC-BY", "CC-BY-SA", "PD", "OFL", "MIT"]);
    for (const a of parsed.assets) {
      expect(allowed.has(a.license)).toBe(true);
      expect(a.attribution.length).toBeGreaterThan(0);
      expect(a.path.length).toBeGreaterThan(0);
    }
  });

  it("covers all six meter icons and the whole portrait arc", () => {
    const parsed = AssetsFileSchema.parse(assetsJson);
    const ids = new Set(parsed.assets.map((a) => a.id));
    for (const m of ["money", "power", "reputation", "loyalty", "health", "heat"]) {
      expect(ids.has(`icon_${m}`)).toBe(true);
    }
    for (const p of ["infant", "president", "emperor", "martian"]) {
      expect(ids.has(`portrait_${p}`)).toBe(true);
    }
  });
});
