import { describe, expect, it } from "vitest";
import currenciesJson from "../../data/currencies.json";
import termsJson from "../../data/terms.json";
import { compileTimeline } from "../compiler";
import { buildContent } from "../content";
import { createRng } from "../rng";
import { initState } from "../state";
import { validRaw } from "./fixtures";

// Content with the real terms + currencies + a couple of branch timeline variants
// so the compiler has pools to select from.
const content = buildContent({
  ...validRaw(),
  terms: termsJson,
  currencies: currenciesJson,
  worldTimelines: [
    { scope: "usa", label: "USA", events: [{ id: "u", year: 1950, headline: "h", body: "b" }] },
    {
      scope: "usa",
      label: "USA (Reich)",
      branch: "nazi",
      events: [{ id: "un", year: 1950, headline: "h", body: "b" }],
    },
  ],
  slots: {
    slots: [
      {
        id: "leader_assassination",
        label: "leader",
        default: { event: "ev_jfk" },
        nazi: { event: "wun_purge" },
        dynasty: {
          economic: { event: "ev_fred" },
          technological: { event: "wk_musk_near_bankruptcy", note: "tech near-death" },
        },
      },
    ],
  },
});

/** Map the prologue activation flags to the run's archetype (mirrors compiler). */
function archetypeFromFlags(
  flags: string[],
): "economic" | "political" | "technological" | "religious" {
  if (flags.includes("kennedy_dynasty_active")) return "political";
  if (flags.includes("musk_dynasty_active")) return "technological";
  if (flags.includes("religious_dynasty_active")) return "religious";
  return "economic";
}

const compile = (flags: string[], year = 1950) => {
  const archetype = archetypeFromFlags(flags);
  const s = { ...initState(content, "seed", archetype), flags: [...flags].sort(), year };
  return compileTimeline(content, s, createRng("c"));
};

describe("timeline compiler (AH3 gears-in-a-clock, task-008)", () => {
  it("compiles the default timeline for a vanilla Era-0", () => {
    const c = compile([]);
    expect(c.branch).toBe("default");
    expect(c.archetype).toBe("economic");
    expect(c.terms.head_of_state).toBe("President");
    expect(c.terms.surname).toBe("Trump");
    expect(c.currency.id).toBe("usd");
    // The default USA variant is selected, not the nazi one.
    const usa = c.timelines.find((t) => t.scope === "usa");
    expect(usa?.branch).toBe("default");
    // Trump dynasty fills the leader-assassination slot with Fred.
    expect(c.slots.leader_assassination).toBe("ev_fred");
  });

  it("compiles a coherent Nazi timeline (titles, currency, USA variant, slot all flip)", () => {
    const c = compile(["axis_ascendant"]);
    expect(c.branch).toBe("nazi");
    expect(c.terms.head_of_state).toBe("Reichskommissar");
    expect(c.terms.surname).toBe("Drumpf");
    expect(c.currency.id).toBe("reichsmark");
    const usa = c.timelines.find((t) => t.scope === "usa");
    expect(usa?.branch).toBe("nazi"); // nazi USA variant suppresses default
    // dynasty(trump) still wins the slot over the nazi branch resolution
    expect(c.slots.leader_assassination).toBe("ev_fred");
  });

  it("the political archetype changes the gear (and its slot resolution)", () => {
    const c = compile(["kennedy_dynasty_active"]);
    expect(c.archetype).toBe("political");
    // No political archetype override on this slot → falls back to default event.
    expect(c.slots.leader_assassination).toBe("ev_jfk");
  });

  it("the technological archetype activates via musk_dynasty_active flag + resolves its slot", () => {
    const c = compile(["musk_dynasty_active"]);
    expect(c.archetype).toBe("technological");
    expect(c.branch).toBe("default"); // branch is unaffected by archetype choice
    // The technological archetype has a slots.json override for leader_assassination.
    expect(c.slots.leader_assassination).toBe("wk_musk_near_bankruptcy");
  });

  it("the political archetype activates via kennedy_dynasty_active flag (prologue path)", () => {
    // The activation flag sets the archetype at founding. NO-LEAK: this is the ONLY
    // way to enter the political archetype — the mid-run swap signal was retired (FD-3).
    const c = compile(["kennedy_dynasty_active"]);
    expect(c.archetype).toBe("political");
    expect(c.branch).toBe("default");
  });

  it("is deterministic: same Era-0 state → identical compiled bundle", () => {
    expect(compile(["axis_ascendant"])).toEqual(compile(["axis_ascendant"]));
  });

  it("birth-order lever (AH8d) drives the compiled given/full name", () => {
    // Fourth child on the default line → the accidental heir, still Donald.
    expect(compile(["fourth_child"]).terms.given_name).toBe("Donald");
    expect(compile(["fourth_child"]).terms.full_name).toBe("Donald Trump");
    // Firstborn heir → carries the patriarch's name even on the default branch.
    expect(compile(["firstborn_heir"]).terms.given_name).toBe("Friedrich");
    expect(compile(["firstborn_heir"]).terms.full_name).toBe("Friedrich Trump III");
    // Firstborn on the Nazi line: Friedrich Drumpf III (surname flips too).
    expect(compile(["axis_ascendant", "firstborn_heir"]).terms.full_name).toBe(
      "Friedrich Drumpf III",
    );
  });
});
