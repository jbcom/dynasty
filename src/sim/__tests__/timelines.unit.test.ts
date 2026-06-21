import { describe, expect, it } from "vitest";
import originsJson from "../../data/eras/new-york/1885-1946-origins/events.json";
import eastcoastJson from "../../data/timelines/eastcoast.json";
import moresJson from "../../data/timelines/mores.json";
import religionJson from "../../data/timelines/religion.json";
import scienceJson from "../../data/timelines/science.json";
import usaJson from "../../data/timelines/usa.json";
import westcoastJson from "../../data/timelines/westcoast.json";
import worldJson from "../../data/timelines/world.json";
import { buildContent } from "../content";
import { type WorldTimeline, WorldTimelineSchema } from "../schema";
import { initState } from "../state";
import { applyWorldFlags, newsForYear, timelinesForBranch } from "../worldtime";
import { validRaw } from "./fixtures";

describe("branch timeline selection (AH3)", () => {
  const usaDefault: WorldTimeline = {
    scope: "usa",
    label: "USA",
    events: [
      {
        id: "u_d",
        year: 1950,
        headline: "Free Election",
        body: ".",
        tags: [],
        extrapolated: false,
        setFlags: [],
      },
    ],
  };
  const usaNazi: WorldTimeline = {
    scope: "usa",
    label: "USA (Reich)",
    branch: "nazi",
    events: [
      {
        id: "u_n",
        year: 1950,
        headline: "Reich Decree",
        body: ".",
        tags: [],
        extrapolated: false,
        setFlags: [],
      },
    ],
  };
  const science: WorldTimeline = {
    scope: "science",
    label: "Science",
    events: [
      {
        id: "s",
        year: 1950,
        headline: "Atom",
        body: ".",
        tags: [],
        extrapolated: false,
        setFlags: [],
      },
    ],
  };
  const all = [usaDefault, usaNazi, science];

  it("default branch shows the default USA events, never a branch's (CP-R-ARCH-2 event-level)", () => {
    const sel = timelinesForBranch(all, "default");
    const usa = sel.filter((t) => t.scope === "usa");
    expect(usa).toHaveLength(1);
    const ids = usa[0]?.events.map((e) => e.id) ?? [];
    expect(ids).toContain("u_d"); // our-history event present
    expect(ids).not.toContain("u_n"); // the Reich event suppressed
    expect(sel.find((t) => t.scope === "science")).toBeDefined();
  });

  it("nazi branch REPLACES the default USA events with the Reich ones (event-level swap)", () => {
    const sel = timelinesForBranch(all, "nazi");
    const usa = sel.filter((t) => t.scope === "usa");
    expect(usa).toHaveLength(1);
    const ids = usa[0]?.events.map((e) => e.id) ?? [];
    expect(ids).toContain("u_n"); // Reich event active
    expect(ids).not.toContain("u_d"); // default suppressed (complete alternate history)
    // scopes without a branch variant still fall back to default
    expect(sel.find((t) => t.scope === "science")).toBeDefined();
  });
});

describe("Nazi-branch backdrop pool (alt-history consistency, AH2/AH3 — CP-R-ARCH-2)", () => {
  // Post-collapse: branch events live in the merged per-scope file, tagged branch.
  const mergedFiles = { usa: usaJson, world: worldJson, mores: moresJson, religion: religionJson };

  for (const [scope, json] of Object.entries(mergedFiles)) {
    it(`${scope}.json carries a deep nazi-branch slice`, () => {
      const t = WorldTimelineSchema.parse(json);
      const nazi = t.events.filter((e) => e.branch === "nazi");
      expect(nazi.length, `${scope} nazi events`).toBeGreaterThanOrEqual(18);
      const ids = t.events.map((e) => e.id);
      expect(new Set(ids).size, `${scope} dup ids`).toBe(ids.length);
    });
  }

  it("the Nazi USA slice establishes the Reich order and never crowns a sitting US president", () => {
    const t = WorldTimelineSchema.parse(usaJson);
    const nazi = t.events.filter((e) => e.branch === "nazi");
    const corpus = nazi.map((e) => `${e.headline} ${e.body}`.toLowerCase()).join(" ");
    expect(corpus).toContain("reich");
    expect(corpus).toContain("commissar");
    for (const banned of ["wins the white house", "elected president", "president-elect"]) {
      expect(corpus.includes(banned), `Nazi USA affirms "${banned}"`).toBe(false);
    }
  });
});

describe("all branch backdrop pools validate uniformly (AH3 pools — CP-R-ARCH-2)", () => {
  // Post-collapse: ONE file per scope, every event tagged with its branch field.
  const pool = import.meta.glob("../../data/timelines/*.json", { eager: true }) as Record<
    string,
    { default: unknown }
  >;

  it("the four backdrop scopes each carry every alt-history branch slice", () => {
    const byScope = new Map<string, Set<string>>();
    for (const [, mod] of Object.entries(pool)) {
      const t = WorldTimelineSchema.parse(mod.default);
      const branches = byScope.get(t.scope) ?? new Set<string>();
      for (const e of t.events) branches.add(e.branch ?? "default");
      byScope.set(t.scope, branches);
    }
    for (const branch of ["nazi", "westcoast", "theocracy", "media"]) {
      for (const scope of ["usa", "world", "mores", "religion"]) {
        expect(byScope.get(scope)?.has(branch), `${scope} missing ${branch} slice`).toBe(true);
      }
    }
  });

  for (const [path, mod] of Object.entries(pool)) {
    const file = path.split("/").pop() ?? path;
    it(`${file} validates with matching scope and no dup ids`, () => {
      const scope = file.replace(".json", "");
      const t = WorldTimelineSchema.parse(mod.default);
      expect(t.scope).toBe(scope);
      const ids = t.events.map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  }
});

// Geographic + thematic timelines (post CP-R-ARCH-3: musk → westcoast,
// kennedy → eastcoast as rival-house backdrop).
const FILES: Record<string, unknown> = {
  westcoast: westcoastJson,
  eastcoast: eastcoastJson,
  mores: moresJson,
  religion: religionJson,
  science: scienceJson,
};

describe("Kennedy rival-house arc folded into eastcoast (CP-R-ARCH-3)", () => {
  it("eastcoast carries the kennedy bootlegger→dynasty arc tagged rival-house:political", () => {
    const t = WorldTimelineSchema.parse(eastcoastJson);
    const rivals = t.events.filter((e) => (e.tags ?? []).includes("rival-house:political"));
    expect(rivals.length, "kennedy rival-house events").toBeGreaterThanOrEqual(20);
    const flags = new Set(rivals.flatMap((e) => e.setFlags));
    // The arc is intact via the LEGIT flags; the swap flag (kennedy_swap) was
    // removed with the flip mechanic (FD-3.3) — dynasty is founding-fixed.
    for (const f of ["bootlegger_fortune", "political_dynasty", "kennedy_dynasty_active"]) {
      expect(flags.has(f), `eastcoast missing kennedy arc flag ${f}`).toBe(true);
    }
    expect(flags.has("kennedy_swap"), "kennedy_swap must be gone (no-leak)").toBe(false);
  });

  it("musk rival-house arc folded into westcoast tagged rival-house:technological", () => {
    const t = WorldTimelineSchema.parse(westcoastJson);
    const rivals = t.events.filter((e) => (e.tags ?? []).includes("rival-house:technological"));
    expect(rivals.length, "musk rival-house events").toBeGreaterThanOrEqual(20);
    const flags = new Set(rivals.flatMap((e) => e.setFlags));
    expect(flags.has("musk_paypal_exit") || flags.has("musk_spacex_founded")).toBe(true);
  });

  it("origins exposes the brewing→bootlegger bridge WITHOUT any swap flag", () => {
    const allChoiceFlags = new Set(
      originsJson.events.flatMap((e) => (e.choices ?? []).flatMap((c) => c.setFlags ?? [])),
    );
    expect(allChoiceFlags.has("bootlegger_fortune")).toBe(true);
    // NO-LEAK: the founding bridge no longer sets a swap flag.
    expect(allChoiceFlags.has("kennedy_swap")).toBe(false);
  });
});

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

  it("the Musk rival-house arc (folded into westcoast) gates its apartheid/Axis branch on the Nazi flags", () => {
    // Read the RAW source (not schema-parsed) so an omitted `requires` stays
    // undefined — the schema would otherwise default it to an empty object.
    const wc = westcoastJson as WorldTimeline;
    const musk = wc.events.filter((e) => (e.tags ?? []).includes("rival-house:technological"));
    // The role-flip + first-trillionaire flags exist on the main (ungated) arc.
    const ungated = new Set(musk.filter((e) => !e.requires).flatMap((e) => e.setFlags));
    for (const f of ["musk_trillionaire", "musk_presidency_eligible", "musk_takes_power"]) {
      expect(ungated.has(f)).toBe(true);
    }
    // The apartheid-scion branch only fires in an Axis-ascendant world.
    const apartheid = musk.find((e) => e.setFlags.includes("musk_apartheid_scion"));
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
