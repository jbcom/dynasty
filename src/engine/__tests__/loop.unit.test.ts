import { describe, expect, it } from "vitest";
import { loadContent } from "../../data/loadContent";
import { validRaw } from "../../sim/__tests__/fixtures";
import { buildContent } from "../../sim/content";
import { foundByComposition } from "../../sim/founding";
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

  it("PF-7: a founded run surfaces rival-line GLIMPSES + the player rung, deterministically", () => {
    const real = loadContent();
    const comp = {
      place: "ireland",
      era: "origins",
      culture: "irish_catholic",
      year: 1885,
      archetype: "economic" as const,
      gender: "male" as const,
      surname: "Glimpser",
      seed: "pf7",
      originId: "composed:ireland:origins",
    };
    const mk = () =>
      new Game(real, comp.seed, foundByComposition(real, comp).state, comp.archetype);
    const g = mk();
    // The convergence world is live: the view exposes glimpses (rivals near the player's vantage) +
    // the player's rung. A founder is rung 0; glimpses are rival lines, never the player's own wave.
    expect(g.view.rung).toBe(0);
    expect(Array.isArray(g.view.glimpses)).toBe(true);
    for (const gl of g.view.glimpses) {
      expect(gl.label).not.toBe("ireland"); // never the player's own line
      expect(["opposing", "contributing", "neutral"]).toContain(gl.relation);
    }
    // Deterministic: same seed → same glimpses (replay-safe).
    expect(JSON.stringify(mk().view.glimpses)).toBe(JSON.stringify(g.view.glimpses));
  });

  it("PF-7: an in-progress run has no convergence ending; a finished run resolves one", () => {
    const real = loadContent();
    const comp = {
      place: "ireland",
      era: "origins",
      culture: "irish_catholic",
      year: 1885,
      archetype: "economic" as const,
      gender: "male" as const,
      surname: "Ender",
      seed: "pf7-end",
      originId: "composed:ireland:origins",
    };
    const g = new Game(real, comp.seed, foundByComposition(real, comp).state, comp.archetype);
    expect(g.view.convergence).toBeNull(); // still playing
    // Drive to an end, then the dynastic framing resolves.
    let guard = 0;
    while (!g.finished && guard < 2000) {
      const v = g.view;
      if (v.saga.scene) {
        if (v.saga.scene.decision) {
          if (v.saga.scene.beats.length) g.pickBeat(0);
          g.pickDecision(0);
        } else if (v.saga.scene.beats.length) g.pickBeat(0);
        else break;
      } else if (v.currentEvent) {
        const c = v.currentEvent.choices[0];
        if (!c) break;
        g.choose(c.id);
      } else break;
      guard++;
    }
    expect(g.finished).toBe(true);
    expect(g.view.convergence).not.toBeNull();
    expect(["stars", "contributed", "earthbound", "extinguished"]).toContain(
      g.view.convergence?.destination,
    );
  });
});
