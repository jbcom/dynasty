import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import currenciesJson from "../../data/currencies.json";
import marketsJson from "../../data/markets.json";
import ranksJson from "../../data/ranks.json";
import { validRaw } from "../../sim/__tests__/fixtures";
import { buildContent } from "../../sim/content";
import { initState } from "../../sim/state";
import MarketsView from "../MarketsView.svelte";
import { applyBrandTokens, makeHost } from "./visualHarness";

const content = buildContent({
  ...validRaw(),
  markets: marketsJson,
  currencies: currenciesJson,
  ranks: ranksJson,
});

let host: HTMLElement;
// biome-ignore lint/suspicious/noExplicitAny: opaque Svelte component instance
let component: any;

beforeEach(() => {
  applyBrandTokens();
  host = makeHost();
});
afterEach(() => {
  if (component) unmount(component);
  host.remove();
});

describe("MarketsView (SIM1 UI)", () => {
  it("renders the live markets, rank ladders, and the active currency", () => {
    component = mount(MarketsView, {
      target: host,
      props: { content, gameState: initState(content, "seed") },
    });
    expect(host.textContent).toContain("Markets");
    expect(host.textContent).toContain("Real Estate"); // a market label
    expect(host.textContent).toContain("Standing"); // rank section
    expect(host.textContent).toContain("US Dollar"); // default currency
  });

  it("relabels net worth in the branch currency (Reichsmark on the Nazi branch)", () => {
    const nazi = { ...initState(content, "seed"), flags: ["axis_ascendant"], year: 1950 };
    component = mount(MarketsView, { target: host, props: { content, gameState: nazi } });
    expect(host.textContent).toContain("Reichsmark");
    expect(host.textContent).toContain("ℛℳ");
  });

  it("shows a position badge when the player holds a market", () => {
    const base = initState(content, "seed");
    const held = {
      ...base,
      markets: {
        ...base.markets,
        nyc_housing: {
          index: 100,
          peakIndex: 100,
          regime: "carry",
          regimeAge: 0,
          holding: 500,
          leverage: 3,
        },
      },
    };
    component = mount(MarketsView, { target: host, props: { content, gameState: held } });
    expect(host.textContent).toContain("LONG");
    expect(host.textContent).toContain("3×");
  });
});
