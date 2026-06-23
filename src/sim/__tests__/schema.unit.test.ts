import { describe, expect, it } from "vitest";
import { buildContent } from "../content";
import {
  AssetSchema,
  ChoiceSchema,
  EraEventsSchema,
  EventSchema,
  MeterComparatorSchema,
  parseContent,
  TropeSchema,
} from "../schema";
import { validRaw } from "./fixtures";

/** Attach a tag to the first authored event of a raw fixture (FD-3 gate tests). */
function tagFirstEvent(raw: ReturnType<typeof validRaw>, tag: string) {
  const entry = raw.eraEvents[0];
  if (!entry) throw new Error("fixture has no era events");
  const ev = (entry.data as { events: Array<{ tags: string[] }> }).events[0];
  if (!ev) throw new Error("fixture era has no events");
  ev.tags = [...(ev.tags ?? []), tag];
}

describe("schema validation", () => {
  it("accepts a valid content bundle and cross-checks references", () => {
    const content = buildContent(validRaw());
    expect(content.meters).toHaveLength(6);
    expect(content.eras.map((e) => e.id)).toEqual(["boyhood", "mogul"]);
    expect(content.allEvents).toHaveLength(3);
    expect(content.eventsByEra.get("boyhood")).toHaveLength(2);
  });

  it("applies defaults for optional choice fields", () => {
    const choice = parseContent(ChoiceSchema, { id: "c", text: "t", outcome: "o" }, "choice");
    expect(choice.effects).toEqual({});
    expect(choice.setFlags).toEqual([]);
    expect(choice.ripples).toEqual([]);
  });

  it("rejects an event with no choices", () => {
    expect(() =>
      parseContent(
        EventSchema,
        {
          id: "x",
          era: "e",
          year: 2000,
          title: "t",
          scene: "s",
          researchNote: "r",
          choices: [],
        },
        "event",
      ),
    ).toThrow(/at least one choice/);
  });

  it("allows an EMPTY era event pool (FS-SCHEMA-EMPTY-ERA — a spine-driven era has no event cards)", () => {
    // A spine-driven era (the founding `origins`) legitimately declares no event-card pool; the schema
    // must accept events:[] without forcing a placeholder event.
    const r = EraEventsSchema.safeParse({ era: "origins", events: [] });
    expect(r.success).toBe(true);
    // A populated pool still validates the same way.
    const populated = EraEventsSchema.safeParse({
      era: "boyhood",
      events: [
        {
          id: "x",
          era: "boyhood",
          year: 1950,
          title: "t",
          scene: "s",
          researchNote: "r",
          choices: [{ id: "c", text: "t", outcome: "o" }],
        },
      ],
    });
    expect(populated.success).toBe(true);
  });

  it("validates meter comparators", () => {
    expect(MeterComparatorSchema.safeParse(">=20").success).toBe(true);
    expect(MeterComparatorSchema.safeParse("< 50").success).toBe(true);
    expect(MeterComparatorSchema.safeParse("~20").success).toBe(false);
    expect(MeterComparatorSchema.safeParse("twenty").success).toBe(false);
  });

  it("rejects ripple weight outside [0,1]", () => {
    const raw = validRaw();
    const boyhood = raw.eraEvents[0]?.data as {
      events: Array<{ choices: Array<{ ripples?: unknown }> }>;
    };
    const firstChoice = boyhood.events[1]?.choices[0];
    if (firstChoice) {
      firstChoice.ripples = [{ to: "x", weight: 5, polarity: 1 }];
    }
    expect(() => buildContent(raw)).toThrow();
  });

  it("rejects an era events file for an unknown era", () => {
    const raw = validRaw();
    const entry = raw.eraEvents[0];
    if (entry) {
      const data = entry.data as { era: string; events: Array<{ era: string }> };
      data.era = "nonexistent";
      // Keep events consistent with the file's era so we hit the index check.
      for (const ev of data.events) ev.era = "nonexistent";
    }
    expect(() => buildContent(raw)).toThrow(/not in eras\/index\.json/);
  });

  it("rejects duplicate event ids", () => {
    const raw = validRaw();
    const mogul = raw.eraEvents[1]?.data as { events: Array<{ id: string }> };
    const mogulEvent = mogul.events[0];
    if (mogulEvent) mogulEvent.id = "ev_born"; // collide with boyhood
    expect(() => buildContent(raw)).toThrow(/Duplicate event id/);
  });

  it("rejects an era in the index with no events file", () => {
    const raw = validRaw();
    raw.eraEvents = raw.eraEvents.filter((e) => e.era !== "mogul");
    expect(() => buildContent(raw)).toThrow(/has no events file/);
  });

  it("rejects an event whose era field mismatches its file", () => {
    const raw = validRaw();
    const boyhood = raw.eraEvents[0]?.data as {
      events: Array<{ era: string }>;
    };
    const ev = boyhood.events[0];
    if (ev) ev.era = "mogul";
    expect(() => buildContent(raw)).toThrow(/lives in the/);
  });

  it("requires exactly six meters", () => {
    const raw = validRaw();
    const meters = raw.meters as { meters: unknown[] };
    meters.meters = meters.meters.slice(0, 5);
    expect(() => buildContent(raw)).toThrow();
  });

  it("AssetSchema accepts 'font' as a valid kind (de-ui-a)", () => {
    // Validates the schema extension allowing self-hosted font assets to be
    // license-logged in assets.json alongside images and audio.
    const result = AssetSchema.safeParse({
      id: "font_playfair_display",
      path: "assets/fonts/playfair-display-normal-700-latin.woff2",
      kind: "font",
      source: "https://fonts.google.com/specimen/Playfair+Display",
      license: "OFL",
      attribution: "Playfair Display by Claus Eggers Sørensen",
    });
    expect(result.success).toBe(true);
  });
});

describe("FD-3 trope catalog + cross-ref gate", () => {
  it("TropeSchema accepts a well-formed trope and rejects a bad kind", () => {
    expect(TropeSchema.safeParse({ id: "x", label: "X", kind: "rise", summary: "s" }).success).toBe(
      true,
    );
    expect(
      TropeSchema.safeParse({ id: "x", label: "X", kind: "not-a-kind", summary: "s" }).success,
    ).toBe(false);
  });

  it("buildContent enforces that a trope:<id> tag references a catalog trope", () => {
    const raw = validRaw();
    raw.tropes = { tropes: [{ id: "rise-x", label: "Rise X", kind: "rise", summary: "s" }] };
    tagFirstEvent(raw, "trope:rise-x");
    expect(() => buildContent(raw)).not.toThrow();
  });

  it("buildContent rejects a trope:<id> tag that is not in the catalog", () => {
    const raw = validRaw();
    raw.tropes = { tropes: [{ id: "rise-x", label: "Rise X", kind: "rise", summary: "s" }] };
    tagFirstEvent(raw, "trope:ghost");
    expect(() => buildContent(raw)).toThrow(/unknown trope/);
  });

  it("the gate is inert when no catalog is supplied (legacy fixtures stay loadable)", () => {
    const raw = validRaw();
    tagFirstEvent(raw, "trope:anything-goes");
    expect(() => buildContent(raw)).not.toThrow();
  });

  it("buildContent rejects duplicate trope ids in the catalog", () => {
    const raw = validRaw();
    raw.tropes = {
      tropes: [
        { id: "dup", label: "A", kind: "rise", summary: "s" },
        { id: "dup", label: "B", kind: "decline", summary: "s" },
      ],
    };
    expect(() => buildContent(raw)).toThrow(/duplicate trope ids/);
  });
});
