import { describe, expect, it } from "vitest";
import currenciesJson from "../../data/currencies.json";
import marketsJson from "../../data/markets.json";
import ranksJson from "../../data/ranks.json";
import { buildContent } from "../content";
import { createRng } from "../rng";
import { CurrenciesFileSchema, MarketsFileSchema, RanksFileSchema } from "../schema";
import { initMarkets, initRanks, initState } from "../state";
import { resolveCurrency, systemicTick } from "../systemic";
import { validRaw } from "./fixtures";

describe("real systemic data files (SIM1 task-013)", () => {
  it("markets.json validates with regimes + couplings", () => {
    const m = MarketsFileSchema.parse(marketsJson);
    expect(m.markets.length).toBeGreaterThanOrEqual(5);
    for (const market of m.markets) {
      expect(market.regimes.length).toBeGreaterThan(0);
      // Every regime's switchTo references a real regime in the same market.
      const ids = new Set(market.regimes.map((r) => r.id));
      for (const r of market.regimes) {
        for (const to of Object.keys(r.switchTo)) {
          expect(ids.has(to), `${market.id}.${r.id} → unknown regime ${to}`).toBe(true);
        }
      }
    }
    // The attention + crypto markets the spec calls for exist.
    const kinds = new Set(m.markets.map((x) => x.kind));
    expect(kinds.has("attention")).toBe(true);
    expect(kinds.has("housing")).toBe(true);
  });

  it("currencies.json validates and carries the branch + redenomination catalog", () => {
    const c = CurrenciesFileSchema.parse(currenciesJson);
    const byId = Object.fromEntries(c.currencies.map((x) => [x.id, x]));
    expect(byId.usd).toBeDefined();
    expect(byId.reichsmark?.branch).toBe("nazi");
    expect(byId.zar?.location).toBe("in_south_africa");
    // The Rentenmark redenomination (÷ 1e12) is the Weimar wipe.
    expect(byId.rentenmark?.conversionFactor).toBeLessThan(1e-6);
  });

  it("ranks.json validates the four interwoven ladders", () => {
    const r = RanksFileSchema.parse(ranksJson);
    expect(r.ranks.map((x) => x.id).sort()).toEqual([
      "commercial",
      "political",
      "religious",
      "social",
    ]);
    // The political ladder tops out at head of state.
    const political = r.ranks.find((x) => x.id === "political");
    expect(political?.rungs.at(-1)).toBe("head of state");
  });

  it("the real systemic data drives a deterministic tick end-to-end", () => {
    const content = buildContent({
      ...validRaw(),
      markets: marketsJson,
      currencies: currenciesJson,
      ranks: ranksJson,
    });
    const s = initState(content, "real");
    const a = systemicTick(content, s, createRng("t"));
    const b = systemicTick(content, s, createRng("t"));
    expect(a.state.markets).toEqual(b.state.markets);
    expect(Object.keys(a.state.markets).length).toBe(content.markets.length);
  });
});

// A minimal systemic config to exercise the schemas + init without data files.
const rawWithSystemic = () => ({
  ...validRaw(),
  markets: {
    markets: [
      {
        id: "us_equities",
        label: "US Equities",
        kind: "financial",
        baseIndex: 100,
        regimes: [
          { id: "stable", baseline: 100, drift: 0, volatility: 0.04, dwell: 6 },
          { id: "boom", baseline: 160, drift: 0.05, volatility: 0.06, dwell: 5 },
        ],
        coupling: { money: 1 },
      },
      {
        id: "nyc_housing",
        label: "NYC Housing",
        kind: "housing",
        baseIndex: 100,
        regimes: [{ id: "carry", baseline: 110, drift: 0.01, volatility: 0.03, dwell: 8 }],
        coupling: { money: 1, power: 0.2, loyalty: 0.1 },
        housing: { region: "outer_boroughs", rentYield: 0.05, vacancy: 0.05, debtService: 0.02 },
      },
    ],
  },
  currencies: {
    currencies: [
      { id: "usd", symbol: "$", name: "US Dollar" },
      {
        id: "reichsmark",
        symbol: "ℛℳ",
        name: "Reichsmark",
        branch: "nazi",
        conversionFactor: 0.25,
      },
    ],
  },
  ranks: {
    ranks: [
      {
        id: "commercial",
        label: "Commercial",
        rungs: ["nobody", "operator", "mogul", "baron"],
        drip: {},
        amplify: { money: 1.1 },
        fallBleed: { reputation: -1 },
      },
    ],
  },
});

describe("systemic-sim schemas + state (SIM1 task-011)", () => {
  it("validates markets/currencies/ranks schemas", () => {
    const c = rawWithSystemic();
    expect(MarketsFileSchema.parse(c.markets).markets).toHaveLength(2);
    expect(CurrenciesFileSchema.parse(c.currencies).currencies[1]?.branch).toBe("nazi");
    expect(RanksFileSchema.parse(c.ranks).ranks[0]?.rungs.length).toBe(4);
  });

  it("buildContent carries the systemic config", () => {
    const content = buildContent(rawWithSystemic());
    expect(content.markets.map((m) => m.id)).toEqual(["us_equities", "nyc_housing"]);
    expect(content.currencies.length).toBe(2);
    expect(content.ranks[0]?.id).toBe("commercial");
  });

  it("initState seeds market + rank live state from the config", () => {
    const content = buildContent(rawWithSystemic());
    const s = initState(content, "seed");
    expect(s.currencyId).toBe("usd");
    expect(s.markets.us_equities).toEqual({
      index: 100,
      peakIndex: 100,
      regime: "stable",
      regimeAge: 0,
      holding: 0,
      leverage: 1,
    });
    expect(s.markets.nyc_housing?.regime).toBe("carry");
    expect(s.ranks.commercial).toEqual({ rung: 0, peak: 0 });
  });

  it("init helpers are deterministic (replay-safe — same content → identical seed state)", () => {
    const content = buildContent(rawWithSystemic());
    expect(initMarkets(content)).toEqual(initMarkets(content));
    expect(initRanks(content)).toEqual(initRanks(content));
  });

  it("an empty systemic config is valid (markets optional)", () => {
    const content = buildContent(validRaw());
    expect(content.markets).toEqual([]);
    expect(initState(content, "s").markets).toEqual({});
  });
});

describe("systemicTick (SIM1 task-012)", () => {
  const content = () => buildContent(rawWithSystemic());

  it("walks every market index and is deterministic for a given (state, rng)", () => {
    const c = content();
    const s = initState(c, "seed");
    const a = systemicTick(c, s, createRng("tick"));
    const b = systemicTick(c, s, createRng("tick"));
    expect(a.state.markets).toEqual(b.state.markets); // pure + deterministic
    // The index moved (regimes have drift/volatility/mean-reversion).
    expect(a.state.markets.us_equities?.index).not.toBe(s.markets.us_equities?.index);
  });

  it("housing carry adds money when the player holds, debt service bites when leveraged", () => {
    const c = content();
    const base = initState(c, "seed");
    const held = {
      ...base,
      markets: {
        ...base.markets,
        nyc_housing: {
          index: 100,
          peakIndex: 100,
          regime: "carry",
          regimeAge: 0,
          holding: 1000,
          leverage: 1,
        },
      },
    };
    const r = systemicTick(c, held, createRng("carry"));
    // rentYield 0.05 * (1-0.05) - debtService 0.02 = positive carry on 1000 held.
    expect(r.state.meters.money).toBeGreaterThan(held.meters.money);
  });

  it("resolves currency by branch and fires a redenomination flag on change", () => {
    const c = content();
    // A Nazi-branch state resolves to reichsmark and redenominates money.
    const naziState = { ...initState(c, "seed"), flags: ["axis_ascendant"] };
    expect(resolveCurrency(c, naziState).id).toBe("reichsmark");
    const r = systemicTick(c, naziState, createRng("cur"));
    expect(r.flags).toContain("currency_changed_reichsmark");
    expect(r.state.currencyId).toBe("reichsmark");
  });

  it("a fall-from-grace rank (below peak) bleeds reputation", () => {
    const c = content();
    const base = initState(c, "seed");
    const fallen = {
      ...base,
      ranks: { ...base.ranks, commercial: { rung: 1, peak: 3 } },
    };
    const r = systemicTick(c, fallen, createRng("fall"));
    expect(r.state.meters.reputation).toBeLessThan(fallen.meters.reputation);
  });
});
