import { describe, expect, it } from "vitest";
import { buildContent } from "../content";
import { ChoiceSchema, EventSchema, MeterComparatorSchema, parseContent } from "../schema";
import { validRaw } from "./fixtures";

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
          portrait: "p",
          choices: [],
        },
        "event",
      ),
    ).toThrow(/at least one choice/);
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
});
