import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { LedgerEntry } from "../../sim/state";
import ButterflyGraph from "../ButterflyGraph.svelte";
import ButterflyLog from "../ButterflyLog.svelte";

const ledger: LedgerEntry[] = [
  {
    seq: 0,
    sourceChoice: "excel",
    sourceEvent: "ev_military_school",
    year: 1959,
    ruleId: "br_discipline",
    text: "Because you mastered the academy, the Commodore deal came easier.",
  },
  {
    seq: 1,
    sourceChoice: "go_big",
    sourceEvent: "ev_first_deal",
    year: 1976,
    ruleId: "br_media",
    text: "Because you bet big, the media barons noticed you.",
  },
];

let host: HTMLElement;
// biome-ignore lint/suspicious/noExplicitAny: opaque Svelte component instance
let component: any;

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
});
afterEach(() => {
  if (component) unmount(component);
  host.remove();
});

describe("ButterflyLog", () => {
  it("lists entries most-recent first", () => {
    component = mount(ButterflyLog, { target: host, props: { ledger } });
    const items = host.querySelectorAll("li");
    expect(items).toHaveLength(2);
    expect(items[0]?.textContent).toContain("1976"); // newest first
  });

  it("shows an empty state with no ledger", () => {
    component = mount(ButterflyLog, { target: host, props: { ledger: [] } });
    expect(host.textContent).toContain("No ripples yet");
  });
});

describe("ButterflyGraph", () => {
  it("renders nodes and links for the ledger", () => {
    component = mount(ButterflyGraph, { target: host, props: { ledger } });
    expect(host.querySelectorAll("circle").length).toBeGreaterThan(0);
    expect(host.querySelectorAll("line").length).toBe(2);
  });

  it("renders an empty state with no ledger", () => {
    component = mount(ButterflyGraph, { target: host, props: { ledger: [] } });
    expect(host.textContent).toContain("empty");
  });
});
