import { describe, expect, it } from "vitest";
import { validRaw } from "../../sim/__tests__/fixtures";
import { buildContent } from "../../sim/content";
import { createRng } from "../../sim/rng";
import { initState } from "../../sim/state";
import { pickNextEventViaWorld } from "../../sim/world";
import { Game } from "../loop";

const content = () => buildContent(validRaw());

describe("Game loop", () => {
  it("presents a first event on a new run", () => {
    const g = new Game(content(), "seed");
    expect(g.view.currentEvent?.id).toBe("ev_born");
    expect(g.finished).toBe(false);
  });

  it("notifies subscribers immediately and on each choice", () => {
    const g = new Game(content(), "seed");
    const seen: Array<string | null> = [];
    g.subscribe((v) => seen.push(v.currentEvent?.id ?? null));
    g.choose("cry_loud");
    expect(seen[0]).toBe("ev_born"); // immediate
    expect(seen.length).toBeGreaterThan(1); // after choose
  });

  it("drives a full run to an end state", () => {
    const g = new Game(content(), "seed");
    let guard = 0;
    while (!g.finished && guard < 100) {
      const ev = g.view.currentEvent;
      if (!ev) break;
      const choice = ev.choices[0];
      if (!choice) break;
      g.choose(choice.id);
      guard++;
    }
    expect(g.finished).toBe(true);
    expect(g.view.state.end?.kind).toBe("victory");
  });

  it("is deterministic: same seed → same currentEvent sequence", () => {
    const run = (seed: string): Array<string | null> => {
      const g = new Game(content(), seed);
      const ids: Array<string | null> = [g.view.currentEvent?.id ?? null];
      let guard = 0;
      while (!g.finished && guard < 100) {
        const ev = g.view.currentEvent;
        const choice = ev?.choices[0];
        if (!ev || !choice) break;
        g.choose(choice.id);
        ids.push(g.view.currentEvent?.id ?? null);
        guard++;
      }
      return ids;
    };
    expect(run("abc")).toEqual(run("abc"));
  });

  it("throws when choosing after the run ends", () => {
    const g = new Game(content(), "seed");
    let guard = 0;
    while (!g.finished && guard < 100) {
      const choice = g.view.currentEvent?.choices[0];
      if (!choice) break;
      g.choose(choice.id);
      guard++;
    }
    expect(() => g.choose("anything")).toThrow();
  });

  it("can restore from a prior state snapshot", () => {
    const g1 = new Game(content(), "seed");
    g1.choose("cry_loud");
    const snapshot = g1.view.state;
    const g2 = new Game(content(), "seed", snapshot);
    expect(g2.view.state.flags).toContain("loud_baby");
    expect(g2.view.state.history).toHaveLength(1);
  });

  it("DE-1a: Game.pick() routes through pickNextEventViaWorld — first event matches direct world query", () => {
    // The engine's pick() now calls pickNextEventViaWorld. Verify the first
    // event the Game presents equals what pickNextEventViaWorld returns for
    // the same (content, state, rng) — the canonical parity check at the
    // engine-layer call site.
    const c = content();
    for (const seed of ["abc", "def", "xyz", "42"]) {
      const g = new Game(c, seed);
      const state = initState(c, seed);
      const label = `pick:${state.history.length}:${state.eraIndex}:${state.eraEventCount}`;
      const viaWorld = pickNextEventViaWorld(c, state, createRng(seed).fork(label));
      expect(g.view.currentEvent?.id ?? null).toBe(viaWorld?.id ?? null);
    }
  });
});
