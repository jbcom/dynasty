import { describe, expect, it } from "vitest";
import { AssetsFileSchema } from "../../sim/schema";
import assetsJson from "../assets.json";

describe("assets manifest", () => {
  it("validates against the AssetsFile schema", () => {
    const result = AssetsFileSchema.safeParse(assetsJson);
    expect(result.success).toBe(true);
  });

  it("every asset declares a recognized license (free upstream, or Generated for GenAI assets)", () => {
    const parsed = AssetsFileSchema.parse(assetsJson);
    // VL-2: GenAI portraits/map carry "Generated"; all sourced upstream assets stay free-licensed.
    const allowed = new Set(["CC0", "CC-BY", "CC-BY-SA", "PD", "OFL", "MIT", "Generated"]);
    for (const a of parsed.assets) {
      expect(allowed.has(a.license)).toBe(true);
      expect(a.attribution.length).toBeGreaterThan(0);
      expect(a.path.length).toBeGreaterThan(0);
      // A sourced (non-Generated) asset must cite a real upstream free license, never "Generated".
      if (a.kind === "icon" || a.kind === "font") expect(a.license).not.toBe("Generated");
    }
  });

  it("logs the self-hosted luxury fonts as OFL assets (DE-UI)", () => {
    const parsed = AssetsFileSchema.parse(assetsJson);
    const fonts = parsed.assets.filter((a) => a.kind === "font");
    expect(fonts.length).toBeGreaterThanOrEqual(2);
    for (const f of fonts) {
      expect(f.license).toBe("OFL");
      expect(f.path).toMatch(/assets\/fonts\/.+\.woff2$/);
    }
    // The Dynasty pairing is present.
    const ids = new Set(fonts.map((f) => f.id));
    expect(ids.has("font_playfair_display")).toBe(true);
    expect(ids.has("font_eb_garamond")).toBe(true);
  });

  it("covers all six meter icons", () => {
    const parsed = AssetsFileSchema.parse(assetsJson);
    const ids = new Set(parsed.assets.map((a) => a.id));
    for (const m of ["money", "power", "reputation", "loyalty", "health", "heat"]) {
      expect(ids.has(`icon_${m}`)).toBe(true);
    }
  });

  it("VL-2: generated spine portraits are logged as 'Generated' assets", () => {
    // The visual-layer revival ([[visual-layer-revival]]) brings portraits BACK — GenAI-generated in the
    // signature style, license-logged. (Supersedes the old no-portraits rule.)
    const parsed = AssetsFileSchema.parse(assetsJson);
    const portraits = parsed.assets.filter((a) => a.kind === "portrait");
    expect(portraits.length).toBeGreaterThan(0);
    for (const p of portraits) {
      expect(p.license).toBe("Generated");
      expect(p.path).toMatch(/assets\/generated\/.+\.png$/);
    }
  });
});
