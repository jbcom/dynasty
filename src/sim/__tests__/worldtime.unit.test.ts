import { describe, expect, it } from "vitest";
import { buildContent } from "../content";
import type { WorldTimeline } from "../schema";
import { initState } from "../state";
import { applyWorldFlags, dueWorldEvents, newsForYear } from "../worldtime";
import { validRaw } from "./fixtures";

const timelines: WorldTimeline[] = [
  {
    scope: "manhattan",
    label: "Manhattan",
    events: [
      {
        id: "wm_a",
        year: 1975,
        headline: "City Nearly Broke",
        body: "Fiscal crisis.",
        tags: [],
        extrapolated: false,
        setFlags: ["nyc_fiscal_crisis"],
      },
      {
        id: "wm_b",
        year: 2001,
        headline: "Towers Fall",
        body: "9/11.",
        tags: [],
        extrapolated: false,
        setFlags: ["nyc_9_11"],
      },
    ],
  },
  {
    scope: "world",
    label: "The World",
    events: [
      {
        id: "ww_a",
        year: 1991,
        headline: "USSR Dissolves",
        body: "Cold War ends.",
        tags: [],
        extrapolated: false,
        setFlags: ["ussr_collapse"],
      },
    ],
  },
];

const content = () => buildContent(validRaw());

describe("world timelines (linking protocol)", () => {
  it("newsForYear returns the latest headline per scope at/before the year", () => {
    const news = newsForYear(timelines, 2001);
    expect(news.map((n) => n.scope).sort()).toEqual(["manhattan", "world"]);
    const manhattan = news.find((n) => n.scope === "manhattan");
    expect(manhattan?.headline).toBe("Towers Fall"); // most recent <= 2001
  });

  it("dueWorldEvents broadcasts flags for events crossing into the current year", () => {
    const s = { ...initState(content(), "seed"), year: 1976 };
    const { flags, fired } = dueWorldEvents(timelines, s, 1970);
    expect(fired.map((e) => e.id)).toContain("wm_a"); // 1975 fired
    expect(flags).toContain("nyc_fiscal_crisis");
  });

  it("does not re-fire events at/below the fromYear floor", () => {
    const s = { ...initState(content(), "seed"), year: 2002 };
    const { fired } = dueWorldEvents(timelines, s, 2001);
    expect(fired.map((e) => e.id)).not.toContain("wm_a"); // 1975 already passed
    expect(fired.map((e) => e.id)).not.toContain("wm_b"); // 2001 == floor, excluded
  });

  it("applyWorldFlags merges broadcast flags into state, purely", () => {
    const s = { ...initState(content(), "seed"), year: 1992 };
    const next = applyWorldFlags(s, 1980, timelines);
    expect(next.flags).toContain("ussr_collapse");
    expect(s.flags).not.toContain("ussr_collapse"); // original untouched
  });

  it("mutually-exclusive same-year events: the first excludes the second (nb-004 race fix)", () => {
    // Two events in the same year, each notFlags the other. Only ONE may fire —
    // requires must be evaluated against the flags accumulated this batch, not
    // the frozen incoming state (else both pass and both fire).
    const tl: WorldTimeline[] = [
      {
        scope: "religion",
        label: "Ideology",
        events: [
          {
            id: "wr_utopian",
            year: 2045,
            headline: "Commons",
            body: ".",
            tags: [],
            extrapolated: true,
            setFlags: ["utopian_currents"],
            requires: {
              flags: [],
              notFlags: ["autocratic_currents"],
              meters: {},
              personality: {},
            },
          },
          {
            id: "wr_autocratic",
            year: 2045,
            headline: "Strongman",
            body: ".",
            tags: [],
            extrapolated: true,
            setFlags: ["autocratic_currents"],
            requires: {
              flags: [],
              notFlags: ["utopian_currents"],
              meters: {},
              personality: {},
            },
          },
        ],
      },
    ];
    const s = { ...initState(content(), "seed"), year: 2046 };
    const { flags } = dueWorldEvents(tl, s, 2044);
    // Exactly one of the two mutually-exclusive currents fires, never both.
    const both = flags.includes("utopian_currents") && flags.includes("autocratic_currents");
    expect(both).toBe(false);
    expect(flags.includes("utopian_currents") || flags.includes("autocratic_currents")).toBe(true);
  });
});
