import { describe, expect, it } from "vitest";

/**
 * ERA LAYOUT CONTRACT (CP-R-ERA): eras live under eras/<place>/<period>/*.json —
 * geography first, then time period — loaded via a recursive glob. The era id is the
 * file's own `era` field; the PLACE and PERIOD come from the path. This test pins the
 * directory contract so a regression back to flat `eras/<id>.json` is caught.
 */

const eraModules = import.meta.glob("../eras/**/*.json", { eager: true }) as Record<
  string,
  { default: { era?: string; events?: unknown[] } }
>;

/** Parse a content era path into { place, period }. Null for index.json. */
function partsOf(path: string): { place: string; period: string } | null {
  if (path.endsWith("index.json")) return null;
  const segs = path.split("/");
  const i = segs.lastIndexOf("eras");
  return { place: segs[i + 1] ?? "", period: segs[i + 2] ?? "" };
}

describe("era layout — place/period directory contract (CP-R-ERA)", () => {
  const entries = Object.entries(eraModules).filter(([p]) => partsOf(p));

  it("every era events file sits in eras/<place>/<period>/, not flat", () => {
    for (const [path] of entries) {
      const parts = partsOf(path);
      expect(parts, path).not.toBeNull();
      // place + period must be non-empty path segments (no flat eras/<id>.json).
      expect(parts?.place.length, `place segment for ${path}`).toBeGreaterThan(0);
      expect(parts?.period.length, `period segment for ${path}`).toBeGreaterThan(0);
    }
  });

  it("each period dir is named <startYear>-<endYear>-<slug> and matches its events' era id", () => {
    for (const [path, mod] of entries) {
      const period = partsOf(path)?.period ?? "";
      // e.g. 1946-1964-boyhood, 0762-0833-caliphate.
      expect(period, path).toMatch(/^\d{4}-\d{4}-[a-z]+$/);
      const slug = period.split("-").slice(2).join("-");
      // The file's era id is the period slug.
      expect(mod.default.era, `era id for ${path}`).toBe(slug);
    }
  });

  it("deep-history + origin live under a real place; the future arc lives under _shared", () => {
    const byEra = new Map<string, string>();
    for (const [path, mod] of entries) {
      if (mod.default.era) byEra.set(mod.default.era, partsOf(path)?.place ?? "");
    }
    // Caliphate is Baghdad-specific deep history.
    expect(byEra.get("caliphate")).toBe("baghdad");
    // The literal US life-arc moved under new-york.
    expect(byEra.get("boyhood")).toBe("new-york");
    expect(byEra.get("mogul")).toBe("new-york");
    // The planetary future is place-agnostic.
    expect(byEra.get("redplanet")).toBe("_shared");
    expect(byEra.get("interstellar")).toBe("_shared");
  });
});
