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
    // Identity tokens come from the founded line, not branch terms — an unfounded
    // compile (initState, no family) carries no surname (CP-R1).
    expect(c.terms.surname).toBeUndefined();
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
    // Institutional terms flip with the branch; identity (surname) is founded-line only.
    expect(c.terms.surname).toBeUndefined();
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

  it("the founded line drives the compiled given/full name (CP-R1)", () => {
    // The compiled identity tokens come from the run's live family protagonist +
    // founded surname, NOT a literal preset or branch term. A founded line names itself.
    const founded = (given: string, surname: string, flags: string[] = []) => {
      const base = initState(content, "seed", archetypeFromFlags(flags));
      const s = {
        ...base,
        flags: [...flags].sort(),
        year: 1950,
        founding: { momentId: "m", surname, culture: "irish_catholic", place: "ireland" },
        family: {
          protagonistId: "m0",
          nextSeq: 1,
          members: [
            {
              id: "m0",
              given,
              surname,
              sex: "male" as const,
              born: 1900,
              generation: 0,
              traits: { ambition: 50, cunning: 50, vigor: 50, piety: 50 },
              isProtagonist: true,
            },
          ],
        },
      };
      return compileTimeline(content, s, createRng("c"));
    };
    const irish = founded("Patrick", "Donnelly");
    expect(irish.terms.given_name).toBe("Patrick");
    expect(irish.terms.full_name).toBe("Patrick Donnelly");
    // A Bavarian-German founded line names itself differently from the SAME content.
    const bavarian = founded("Friedrich", "Eberhardt");
    expect(bavarian.terms.full_name).toBe("Friedrich Eberhardt");
    // The branch never overrides the founded identity (institutional terms aside).
    const nazi = founded("Síle", "Donnelly", ["axis_ascendant"]);
    expect(nazi.terms.full_name).toBe("Síle Donnelly");
  });
});
