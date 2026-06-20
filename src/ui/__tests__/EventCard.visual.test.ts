import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, it } from "vitest";
import { page } from "vitest/browser";
import type { GameEvent } from "../../sim/schema";
import EventCard from "../EventCard.svelte";
import { applyBrandTokens, makeHost } from "./visualHarness";

const event: GameEvent = {
  id: "ev_commodore",
  era: "mogul",
  year: 1976,
  title: "The Commodore Hotel",
  scene:
    "A derelict hotel slumps beside Grand Central. The city is broke. A tax abatement nobody else has the nerve to ask for could turn this ruin into the Grand Hyatt — and turn your name into a brand.",
  researchNote:
    "Trump's 1976 Commodore deal, with a controversial 40-year tax abatement, launched his Manhattan career.",
  extrapolated: false,
  startrekInspired: false,
  tags: ["real_estate"],
  portrait: "young_mogul",
  requires: { flags: [], notFlags: [], meters: {} },
  weight: 10,
  repeatable: false,
  choices: [
    {
      id: "go_big",
      text: "Demand the abatement. Bet everything on it.",
      effects: { money: 200, power: 8, heat: 4 },
      personality: {},
      setFlags: [],
      clearFlags: [],
      ripples: [],
      outcome: "ok",
    },
    {
      id: "play_safe",
      text: "Take a smaller, safer slice of the deal.",
      effects: { money: 40, power: 2 },
      personality: {},
      setFlags: [],
      clearFlags: [],
      ripples: [],
      outcome: "ok",
    },
  ],
};

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

describe("EventCard visual", () => {
  it("renders the full event card", async () => {
    component = mount(EventCard, { target: host, props: { event, onchoose: () => {} } });
    await page.screenshot({ element: host.firstElementChild as Element });
  });
});
