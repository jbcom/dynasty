import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, it } from "vitest";
import { page } from "vitest/browser";
import type { LedgerEntry } from "../../sim/state";
import ButterflyGraph from "../ButterflyGraph.svelte";
import { applyBrandTokens, makeHost } from "./visualHarness";

const ledger: LedgerEntry[] = [
  {
    seq: 0,
    sourceChoice: "excel",
    sourceEvent: "ev_military_school",
    year: 1959,
    ruleId: "discipline",
    text: "x",
  },
  {
    seq: 1,
    sourceChoice: "go_big",
    sourceEvent: "ev_first_deal",
    year: 1976,
    ruleId: "media",
    text: "y",
  },
  {
    seq: 2,
    sourceChoice: "go_big",
    sourceEvent: "ev_casino",
    year: 1990,
    ruleId: "debt",
    text: "z",
  },
];

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

describe("ButterflyGraph visual", () => {
  it("renders the force-DAG", async () => {
    component = mount(ButterflyGraph, { target: host, props: { ledger } });
    await page.screenshot({ element: host.firstElementChild as Element });
  });
});
