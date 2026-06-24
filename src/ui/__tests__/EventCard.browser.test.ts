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

  it("KP-1: renders choices inside the prose flow, not as a detached button stack", () => {
    component = mount(EventCard, { target: host, props: { event: baseEvent, onchoose: () => {} } });
    const prose = host.querySelector<HTMLElement>('[data-testid="event-prose"]');
    const choices = host.querySelector<HTMLElement>('[data-testid="event-choices"]');
    const firstButton = host.querySelector<HTMLElement>('[data-testid="event-choices"] button');

    expect(choices?.parentElement).toBe(prose);
    expect(getComputedStyle(choices as HTMLElement).display).toBe("inline");
    expect(getComputedStyle(firstButton as HTMLElement).display).toBe("inline-flex");
    expect(getComputedStyle(firstButton as HTMLElement).borderTopWidth).toBe("0px");
  });

  it("shows the run's current year (prop) over the beat's nominal year — epoch0 in another era", () => {
    // A generic life-stage epoch0 beat carries a nominal default year (1885) but is injected
    // into whatever era the run is in. On a caliphate (762) run the card must show 762, not 1885.
    component = mount(EventCard, {
      target: host,
      props: { event: { ...baseEvent, year: 1885 }, year: 762, onchoose: () => {} },
    });
    expect(host.textContent).toContain("762");
    expect(host.textContent).not.toContain("1885");
  });

  it("falls back to the beat's own year when no run year is passed", () => {
    component = mount(EventCard, { target: host, props: { event: baseEvent, onchoose: () => {} } });
    expect(host.textContent).toContain("1959");
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

  it("applies the branch-aware term transform to title, scene, and choices", () => {
    const termEvent: GameEvent = {
      ...baseEvent,
      title: "The {head_of_state} Visits",
      scene: "All of {the_nation} watched.",
      choices: [
        {
          id: "salute",
          text: "Salute the {head_of_state}.",
          effects: {},
          personality: {},
          setFlags: [],
          clearFlags: [],
          ripples: [],
          outcome: "ok",
        },
      ],
    };
    // A Nazi-branch transform (manual, to keep the test self-contained).
    const term = (t: string) =>
      t.replace(/\{head_of_state\}/g, "Reichskommissar").replace(/\{the_nation\}/g, "the Reich");
    component = mount(EventCard, {
      target: host,
      props: { event: termEvent, onchoose: () => {}, term },
    });
    expect(host.textContent).toContain("The Reichskommissar Visits");
    expect(host.textContent).toContain("All of the Reich watched");
    expect(host.textContent).toContain("Salute the Reichskommissar");
    expect(host.textContent).not.toContain("{head_of_state}");
  });
});
