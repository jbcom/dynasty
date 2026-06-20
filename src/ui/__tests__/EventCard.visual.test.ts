import { page } from "vitest/browser";
import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, it } from "vitest";
import type { GameEvent } from "../../sim/schema";
import EventCard from "../EventCard.svelte";

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
    { id: "go_big", text: "Demand the abatement. Bet everything on it.", effects: { money: 200, power: 8, heat: 4 }, setFlags: [], clearFlags: [], ripples: [], outcome: "ok" },
    { id: "play_safe", text: "Take a smaller, safer slice of the deal.", effects: { money: 40, power: 2 }, setFlags: [], clearFlags: [], ripples: [], outcome: "ok" },
  ],
};

let host: HTMLElement;
// biome-ignore lint/suspicious/noExplicitAny: opaque Svelte component instance
let component: any;

beforeEach(() => {
  const s = document.documentElement.style;
  s.setProperty("--mmm-surface", "#16264f");
  s.setProperty("--mmm-navy", "#0a1633");
  s.setProperty("--mmm-navy-light", "#16264f");
  s.setProperty("--mmm-gold", "#d4af37");
  s.setProperty("--mmm-gold-deep", "#a8841f");
  s.setProperty("--mmm-text", "#f5f0e1");
  s.setProperty("--mmm-text-dim", "#b9c2da");
  s.setProperty("--mmm-radius", "8px");
  s.setProperty("--mmm-radius-lg", "12px");
  s.setProperty("--mmm-pad", "16px");
  s.setProperty("--mmm-font-display", "Georgia, serif");
  document.body.style.background = "#0a1633";
  host = document.createElement("div");
  document.body.appendChild(host);
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
