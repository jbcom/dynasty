import { describe, expect, it } from "vitest";
import originsJson from "../../data/eras/origins.json";
import kennedyJson from "../../data/timelines/kennedy.json";
import moresJson from "../../data/timelines/mores.json";
import moresNaziJson from "../../data/timelines/mores.nazi.json";
import muskJson from "../../data/timelines/musk.json";
import religionJson from "../../data/timelines/religion.json";
import religionNaziJson from "../../data/timelines/religion.nazi.json";
import scienceJson from "../../data/timelines/science.json";
import usaNaziJson from "../../data/timelines/usa.nazi.json";
import westcoastJson from "../../data/timelines/westcoast.json";
import worldNaziJson from "../../data/timelines/world.nazi.json";
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

  it("default branch uses the default variant and ignores branch-specific ones", () => {
    const sel = timelinesForBranch(all, "default");
    expect(sel.find((t) => t.scope === "usa")?.label).toBe("USA");
    expect(sel.find((t) => t.scope === "science")).toBeDefined();
    expect(sel.some((t) => t.branch === "nazi")).toBe(false);
  });

  it("nazi branch swaps in the nazi USA variant and suppresses the default", () => {
    const sel = timelinesForBranch(all, "nazi");
    const usa = sel.filter((t) => t.scope === "usa");
    expect(usa).toHaveLength(1);
    expect(usa[0]?.label).toBe("USA (Reich)");
    // scopes without a branch variant still fall back to default
    expect(sel.find((t) => t.scope === "science")).toBeDefined();
  });
});

describe("Nazi-branch backdrop pool (alt-history consistency, AH2/AH3)", () => {
  const naziFiles = {
    usa: usaNaziJson,
    world: worldNaziJson,
    mores: moresNaziJson,
    religion: religionNaziJson,
  };

  for (const [scope, json] of Object.entries(naziFiles)) {
    it(`${scope}.nazi.json validates as scope=${scope} branch=nazi`, () => {
      const t = WorldTimelineSchema.parse(json);
      expect(t.scope).toBe(scope);
      expect(t.branch).toBe("nazi");
      expect(t.events.length).toBeGreaterThanOrEqual(30);
      const ids = t.events.map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  }

  it("the Nazi USA timeline establishes the Reich order and never crowns a sitting US president", () => {
    const t = WorldTimelineSchema.parse(usaNaziJson);
    const corpus = t.events.map((e) => `${e.headline} ${e.body}`.toLowerCase()).join(" ");
    // It MUST establish the Reich administration (the head of state is a
    // Reichskommissar, not a President).
    expect(corpus).toContain("reich");
    expect(corpus).toContain("commissar");
    // No event should AFFIRM a U.S. president winning/taking office during the
    // occupation. (Phrases like "no presidential assassinations" are consistency-
    // affirming and fine; we ban the affirmative installation phrases only.)
    for (const banned of ["wins the white house", "elected president", "president-elect"]) {
      expect(corpus.includes(banned), `Nazi USA affirms "${banned}"`).toBe(false);
    }
  });
});

describe("all branch backdrop pools validate uniformly (AH3 pools)", () => {
  // Every per-branch timeline variant in the repo, validated as a set.
  const pool = import.meta.glob("../../data/timelines/*.*.json", { eager: true }) as Record<
    string,
    { default: unknown }
  >;

  it("finds the expected branch pools (nazi/westcoast/theocracy/media × 4 scopes)", () => {
    const names = Object.keys(pool).map((p) => p.split("/").pop());
    for (const branch of ["nazi", "westcoast", "theocracy", "media"]) {
      for (const scope of ["usa", "world", "mores", "religion"]) {
        expect(names, `missing ${scope}.${branch}.json`).toContain(`${scope}.${branch}.json`);
      }
    }
  });

  for (const [path, mod] of Object.entries(pool)) {
    const file = path.split("/").pop() ?? path;
    it(`${file} validates with matching scope+branch and no dup ids`, () => {
      const [scope, branch] = file.replace(".json", "").split(".");
      const t = WorldTimelineSchema.parse(mod.default);
      expect(t.scope).toBe(scope);
      expect(t.branch).toBe(branch);
      expect(t.events.length).toBeGreaterThanOrEqual(18);
      const ids = t.events.map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  }
});

// Geographic + thematic + character timelines.
const FILES: Record<string, unknown> = {
  westcoast: westcoastJson,
  mores: moresJson,
  religion: religionJson,
  science: scienceJson,
  musk: muskJson,
  kennedy: kennedyJson,
};

describe("Kennedy protagonist timeline — bootlegger→dynasty arc (no-leak)", () => {
  it("kennedy.json validates as scope=kennedy with the bootlegger→dynasty arc", () => {
    const t = WorldTimelineSchema.parse(kennedyJson);
    expect(t.scope).toBe("kennedy");
    expect(t.events.length).toBeGreaterThanOrEqual(20);
    const flags = new Set(t.events.flatMap((e) => e.setFlags));
    // The arc is intact via the LEGIT flags; the swap flag (kennedy_swap) was
    // removed with the flip mechanic (FD-3.3) — dynasty is founding-fixed.
    for (const f of ["bootlegger_fortune", "political_dynasty", "kennedy_dynasty_active"]) {
      expect(flags.has(f), `kennedy.json missing arc flag ${f}`).toBe(true);
    }
    expect(flags.has("kennedy_swap"), "kennedy_swap must be gone (no-leak)").toBe(false);
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
