import { describe, expect, it } from "vitest";
import butterflyJson from "../../data/butterfly-rules.json";
import endingsJson from "../../data/endings.json";
import indexJson from "../../data/eras/index.json";
import metersJson from "../../data/meters.json";
import { buildContent, type RawContent } from "../content";
import { initState } from "../state";
import { advanceTimeline } from "../timeline";

// Use the REAL authored era files so events satisfy the full schema and the
// science-ladder entryRequires gates are present.
const eraModules = import.meta.glob("../../data/eras/*.json", { eager: true }) as Record<
  string,
  { default: unknown }
>;
const eraEvents = Object.entries(eraModules)
  .filter(([p]) => !p.endsWith("index.json"))
  .map(([p, m]) => ({ era: p.split("/").pop()?.replace(".json", "") ?? "", data: m.default }));

const raw: RawContent = {
  meters: metersJson,
  eraIndex: indexJson,
  eraEvents,
  butterflyRules: butterflyJson,
  endings: endingsJson,
  assets: { assets: [] },
};
const content = buildContent(raw);

describe("science-ladder gate block never freezes (PR #8 review)", () => {
  it("a player at the Mars gate without mars_program ENDS rather than stalling", () => {
    const redplanet = content.eras.find((e) => e.order === 10);
    expect(redplanet?.entryRequires?.flags).toContain("mars_program");
    const idx = content.eras.findIndex((e) => e.order === 9);
    expect(idx).toBeGreaterThanOrEqual(0);

    const blocked = advanceTimeline(content, {
      ...initState(content, "seed"),
      eraIndex: idx,
      eraEventCount: Number.MAX_SAFE_INTEGER, // budget spent → gate is evaluated
      flags: [], // no mars_program / back_science — the gate fails
    });

    // It must NOT advance into redplanet, and it MUST have ended (no freeze).
    expect(content.eras[blocked.eraIndex]?.order).toBeLessThan(10);
    expect(blocked.end).not.toBeNull();
  });
});
