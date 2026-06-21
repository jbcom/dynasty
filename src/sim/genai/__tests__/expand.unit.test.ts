import { describe, expect, it } from "vitest";
import { loadContent } from "../../../data/loadContent";
import type { GenerateFn } from "../client";
import { EXPAND_TYPES, expand } from "../expand";

/** SS-11 — the uniform GenAI expander: per-type modes, canonical-file targeting, leak-gated, mergeable. Stubbed GenerateFn. */

const content = loadContent();

/** A stub generator that returns whatever JSON array we hand it. */
const stub =
  (items: unknown[]): GenerateFn =>
  async () =>
    JSON.stringify(items);

describe("genai expand (SS-11)", () => {
  it("registers a mode for every content type", () => {
    expect(EXPAND_TYPES).toContain("events");
    expect(EXPAND_TYPES).toContain("tropes");
    expect(EXPAND_TYPES).toContain("endings");
    expect(EXPAND_TYPES.length).toBeGreaterThanOrEqual(5);
  });

  it("events mode targets the canonical events.json for the (place, era) — no .gen.json", async () => {
    const res = await expand(
      content,
      { type: "events", target: { place: "ireland", era: "origins" }, count: 1 },
      stub([
        {
          id: "ev_gen_test_one",
          era: "origins",
          place: "ireland",
          year: 1885,
          title: "A Test Beat",
          scene: "The {surname} line faces a choice in the grey rain.",
          researchNote: "test",
          historicity: "personal",
          tags: ["trope:tenant-and-landlord"],
          requires: { flags: ["founded_line"], notFlags: [], meters: {}, personality: {} },
          weight: 10,
          choices: [
            {
              id: "a",
              text: "Endure.",
              effects: { health: 1 },
              personality: {},
              setFlags: [],
              outcome: "ok",
            },
            {
              id: "b",
              text: "Resist.",
              effects: { heat: 1 },
              personality: {},
              setFlags: [],
              outcome: "ok",
            },
          ],
        },
      ]),
    );
    expect(res.canonicalFile).toBe("src/data/eras/ireland/1885-1946-origins/events.json");
    expect(res.canonicalFile).not.toMatch(/\.gen\.json$/);
    expect(res.accepted.length).toBe(1);
  });

  it("rejects any generated item that leaks a preset person (all modes)", async () => {
    const res = await expand(
      content,
      { type: "tropes", count: 2 },
      stub([
        { id: "trope_clean", label: "The Clean Climber", summary: "a composed line" },
        { id: "trope_leak", label: "The Trump Way", summary: "Donald did this" },
      ]),
    );
    expect(res.accepted.map((e) => (e as { id: string }).id)).toEqual(["trope_clean"]);
    expect(res.rejected.length).toBe(1);
    expect(res.rejected[0]?.reasons).toContain("preset-person leak");
  });

  it("merge() appends accepted items into the canonical file object, dedup by id", async () => {
    const res = await expand(
      content,
      { type: "endings", count: 1 },
      stub([{ id: "end_new_convergence", title: "A New Horizon" }]),
    );
    const existing = { endings: [{ id: "end_existing", title: "Old" }] };
    const merged = res.merge(existing) as { endings: Array<{ id: string }> };
    expect(merged.endings.map((e) => e.id)).toEqual(["end_existing", "end_new_convergence"]);
    // dedup: merging an id already present adds nothing.
    const merged2 = res.merge(merged) as { endings: unknown[] };
    expect(merged2.endings.length).toBe(merged.endings.length);
  });
});
