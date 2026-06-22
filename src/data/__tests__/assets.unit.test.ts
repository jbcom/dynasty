import { existsSync } from "node:fs";
import { join } from "node:path";
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

  it("portraits are AUTHORED caricature SVG, not the purged procedural ones (RB-8)", () => {
    // The earlier PROCEDURAL portraits were purged (commit bd9a3e2, "purge procedural portraits") —
    // they distracted. RB-8 rebuilds them as the directive's own decision (89b24a7) required: real,
    // hand-authored CC0 caricature SVG mounted as a faint behind-the-prose backdrop, not generated
    // distractions. So portraits exist again, but under a stricter contract.
    const parsed = AssetsFileSchema.parse(assetsJson);
    const portraits = parsed.assets.filter((a) => a.kind === "portrait");
    expect(portraits.length).toBeGreaterThan(0);
    for (const p of portraits) {
      // Authored SVG (the repo idiom), CC0 (project-original), license-logged.
      expect(p.path).toMatch(/^assets\/portrait\/.+\.svg$/);
      expect(p.license).toBe("CC0");
      expect(p.attribution.length).toBeGreaterThan(0);
    }
    // The six power-base archetypes each have a base portrait + a rival silhouette.
    const ids = new Set(portraits.map((p) => p.id));
    for (const a of [
      "economic",
      "political",
      "technological",
      "religious",
      "entertainment",
      "athletic",
    ]) {
      expect(ids.has(`portrait_base_${a}`)).toBe(true);
      expect(ids.has(`portrait_silhouette_${a}`)).toBe(true);
    }
  });

  it("every portrait file the manifest logs actually exists under public/ (the manifest is the gate)", () => {
    const parsed = AssetsFileSchema.parse(assetsJson);
    // assets.json paths are relative to public/ (e.g. "assets/portrait/base/economic.svg").
    const publicDir = join(import.meta.dirname, "../../../public");
    for (const p of parsed.assets.filter((a) => a.kind === "portrait")) {
      expect(existsSync(join(publicDir, p.path)), `missing portrait file: ${p.path}`).toBe(true);
    }
  });
});
