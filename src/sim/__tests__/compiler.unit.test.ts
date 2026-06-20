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
        dynasty: { trump: { event: "ev_fred" } },
      },
    ],
  },
});

const compile = (flags: string[], year = 1950) => {
  const s = { ...initState(content, "seed"), flags: [...flags].sort(), year };
  return compileTimeline(content, s, createRng("c"));
};

describe("timeline compiler (AH3 gears-in-a-clock, task-008)", () => {
  it("compiles the default timeline for a vanilla Era-0", () => {
    const c = compile([]);
    expect(c.branch).toBe("default");
    expect(c.dynasty).toBe("trump");
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

  it("the Kennedy dynasty changes the gear (and its slot resolution)", () => {
    const c = compile(["kennedy_swap"]);
    expect(c.dynasty).toBe("kennedy");
    // No kennedy dynasty override on this slot → falls back to default event.
    expect(c.slots.leader_assassination).toBe("ev_jfk");
  });

  it("is deterministic: same Era-0 state → identical compiled bundle", () => {
    expect(compile(["axis_ascendant"])).toEqual(compile(["axis_ascendant"]));
  });
});
