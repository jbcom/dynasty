import { describe, expect, it } from "vitest";
import moresJson from "../../data/timelines/mores.json";
import muskJson from "../../data/timelines/musk.json";
import religionJson from "../../data/timelines/religion.json";
import scienceJson from "../../data/timelines/science.json";
import westcoastJson from "../../data/timelines/westcoast.json";
import { buildContent } from "../content";
import { type WorldTimeline, WorldTimelineSchema } from "../schema";
import { initState } from "../state";
import { applyWorldFlags, newsForYear } from "../worldtime";
import { validRaw } from "./fixtures";

// Geographic + thematic + character timelines.
const FILES: Record<string, unknown> = {
  westcoast: westcoastJson,
  mores: moresJson,
  religion: religionJson,
  science: scienceJson,
  musk: muskJson,
};

describe("world & thematic timelines (data + linking protocol)", () => {
  for (const [scope, json] of Object.entries(FILES)) {
    it(`${scope}.json validates against the schema`, () => {
      const t = WorldTimelineSchema.parse(json);
      expect(t.scope).toBe(scope);
      expect(t.events.length).toBeGreaterThanOrEqual(20);
      // No duplicate event ids within a file.
      const ids = t.events.map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
      // Years are integers; flags are real strings.
      for (const e of t.events) {
        expect(Number.isInteger(e.year)).toBe(true);
        for (const f of e.setFlags) expect(f.length).toBeGreaterThan(0);
      }
    });
  }

  it("the Musk character-timeline gates its apartheid/Axis branch on the Era-0 Nazi flags", () => {
    // Validates against the schema...
    expect(WorldTimelineSchema.parse(muskJson).scope).toBe("musk");
    // ...then asserts structure on the authored JSON (a gated event omits
    // `requires` in source; the schema leaves it optional, so read source here).
    const musk = muskJson as WorldTimeline;
    // The role-flip + first-trillionaire flags exist on the main (ungated) arc.
    const ungated = new Set(musk.events.filter((e) => !e.requires).flatMap((e) => e.setFlags));
    for (const f of ["musk_trillionaire", "musk_presidency_eligible", "musk_takes_power"]) {
      expect(ungated.has(f)).toBe(true);
    }
    // The apartheid-scion branch only fires in an Axis-ascendant world.
    const apartheid = musk.events.find((e) => e.setFlags.includes("musk_apartheid_scion"));
    expect(apartheid?.requires?.flags).toContain("axis_ascendant");
  });

  it("science.json broadcasts the four science-ladder gate flags into state", () => {
    const science = WorldTimelineSchema.parse(scienceJson) as WorldTimeline;
    const gates = ["mars_program", "back_science", "extrasolar_flight", "contact_made"];
    // Each ladder gate must be set by some event in the science timeline.
    const allFlags = new Set(science.events.flatMap((e) => e.setFlags));
    for (const g of gates) expect(allFlags.has(g)).toBe(true);

    // Linking protocol: advancing the in-world year past every event broadcasts
    // those flags into the shared game state (so the era gates can read them).
    const maxYear = Math.max(...science.events.map((e) => e.year));
    const s = { ...initState(buildContent(validRaw()), "seed"), year: maxYear };
    const next = applyWorldFlags(s, 0, [science]);
    for (const g of gates) expect(next.flags).toContain(g);
  });

  it("newsForYear surfaces a headline per thematic scope at a late year", () => {
    const timelines = [moresJson, religionJson, scienceJson].map((j) =>
      WorldTimelineSchema.parse(j),
    );
    const news = newsForYear(timelines, 2026);
    expect(news.map((n) => n.scope).sort()).toEqual(["mores", "religion", "science"]);
  });
});
