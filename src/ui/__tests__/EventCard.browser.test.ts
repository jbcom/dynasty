import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi, vitest } from "vitest";
import { page } from "vitest/browser";
import type { GameEvent } from "../../sim/schema";
import EventCard from "../EventCard.svelte";

const baseEvent: GameEvent = {
  id: "ev_test",
  era: "boyhood",
  year: 1959,
  title: "New York Military Academy",
  scene: "Your father has had enough of your antics.",
  researchNote: "Trump attended NYMA from 1959.",
  extrapolated: false,
  startrekInspired: false,
  tags: [],
  portrait: "cadet",
  requires: { flags: [], notFlags: [], meters: {}, personality: {} },
  weight: 10,
  repeatable: false,
  choices: [
    {
      id: "excel",
      text: "Win every drill.",
      effects: { power: 5 },
      personality: {},
      setFlags: [],
      clearFlags: [],
      ripples: [],
      outcome: "ok",
    },
    {
      id: "rebel",
      text: "Rebel against the brass.",
      effects: { reputation: 4, heat: 3 },
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
  host = document.createElement("div");
  document.body.appendChild(host);
});
afterEach(() => {
  if (component) unmount(component);
  host.remove();
});

describe("EventCard", () => {
  it("renders title, year, scene, and choices (no research-note panel — woven in)", () => {
    component = mount(EventCard, { target: host, props: { event: baseEvent, onchoose: () => {} } });
    expect(host.textContent).toContain("New York Military Academy");
    expect(host.textContent).toContain("1959");
    expect(host.textContent).toContain("antics");
    // Research note + extrapolated badge are intentionally NOT surfaced (immersion).
    expect(host.textContent).not.toContain("Research note");
    expect(host.textContent).not.toContain("Extrapolated");
    expect(host.querySelectorAll("button")).toHaveLength(2);
  });

  it("invokes onchoose with the chosen choice id", async () => {
    const onchoose = vi.fn();
    component = mount(EventCard, { target: host, props: { event: baseEvent, onchoose } });
    const buttons = host.querySelectorAll("button");
    await page.elementLocator(buttons[1] as Element).click();
    // choose() awaits the (async) haptics bridge before calling onchoose, so
    // poll briefly for the call rather than asserting synchronously.
    await vitest.waitFor(() => expect(onchoose).toHaveBeenCalledWith("rebel"));
  });

  it("does not fire choices when busy", async () => {
    const onchoose = vi.fn();
    component = mount(EventCard, {
      target: host,
      props: { event: baseEvent, onchoose, busy: true },
    });
    const button = host.querySelector("button");
    expect(button?.disabled).toBe(true);
  });
});
