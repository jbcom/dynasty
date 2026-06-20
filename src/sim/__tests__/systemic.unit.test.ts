import { describe, expect, it } from "vitest";
import { buildContent } from "../content";
import { CurrenciesFileSchema, MarketsFileSchema, RanksFileSchema } from "../schema";
import { initMarkets, initRanks, initState } from "../state";
import { validRaw } from "./fixtures";

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
