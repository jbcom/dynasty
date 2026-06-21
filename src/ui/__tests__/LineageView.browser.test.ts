import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadContent } from "../../data/loadContent";
import { applyChoice } from "../../sim/effects";
import { foundDynasty } from "../../sim/founding";
import { createRng } from "../../sim/rng";
import type { GameEvent } from "../../sim/schema";
import { initState } from "../../sim/state";
import LineageView from "../LineageView.svelte";

/**
 * FD-13 — the lineage view renders the live family tree: the house name, each
 * generation, the protagonist badge, and living/dead lifespans.
 */

const content = loadContent();

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

/** A founded run whose protagonist has begotten two heirs. */
function foundedWithHeirs() {
  const founded = foundDynasty(content, {
    momentId: "bavaria_1885",
    surname: "Vane",
    seed: "lin",
  }).state;
  const ev: GameEvent = {
    id: "ev_lin_beget",
    era: content.eras[founded.eraIndex]?.id ?? "origins",
    year: 1908,
    title: "Heirs",
    scene: "s",
    researchNote: "r",
    extrapolated: false,
    startrekInspired: false,
    tags: [],
    requires: { flags: [], notFlags: [], meters: {}, personality: {} },
    weight: 1,
    repeatable: false,
    choices: [
      {
        id: "two",
        text: "two",
        effects: {},
        personality: {},
        setFlags: [],
        clearFlags: [],
        ripples: [],
        outcome: "o",
        begets: 2,
      },
    ],
  };
  const c = { ...content, allEvents: [...content.allEvents, ev] };
  return applyChoice(c, founded, ev, "two", createRng("lin")).state;
}

describe("LineageView", () => {
  it("renders the house name and the protagonist with a 'You' badge", () => {
    const state = foundedWithHeirs();
    component = mount(LineageView, { target: host, props: { gameState: state } });
    expect(host.textContent).toContain("House of Vane");
    expect(host.textContent).toContain("You");
    expect(host.textContent).toContain("Generation 1");
  });

  it("renders begotten heirs in the next generation", () => {
    const state = foundedWithHeirs();
    component = mount(LineageView, { target: host, props: { gameState: state } });
    expect(host.textContent).toContain("Generation 2");
    // Two heirs were begotten → two members beyond the progenitor.
    expect(host.querySelectorAll(".member").length).toBe(3);
  });

  it("shows the empty state for a run with no founded line", () => {
    const plain = initState(content, "x");
    component = mount(LineageView, { target: host, props: { gameState: plain } });
    expect(host.textContent).toContain("no founded line");
  });
});
