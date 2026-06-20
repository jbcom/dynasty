import { describe, expect, it } from "vitest";
import { validRaw } from "../../sim/__tests__/fixtures";
import { buildContent } from "../../sim/content";
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
});
