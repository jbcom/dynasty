import { describe, expect, it } from "vitest";
import { loadContent } from "../../data/loadContent";
import { foundByComposition } from "../../sim/founding";
import { dealComposition } from "../../sim/places";
import { GameStore } from "../gameStore.svelte";

/**
 * GameStore dev-harness fast-forward (CP-R7): the saga-aware devFastForward must advance a FOUNDED line
 * through its spine acts (currentEvent is usually null for a founded run — it plays SAGA scenes), picking
 * a succession-bearing close option so generations actually advance, and run all the way to the end.
 */

// In-memory storage stub (the store autosaves after each step).
function memStorage() {
  const mem: Record<string, string> = {};
  return {
    get: async (k: string) => mem[k] ?? null,
    set: async (k: string, v: string) => {
      mem[k] = v;
    },
    remove: async (k: string) => {
      delete mem[k];
    },
  };
}

function foundedStore() {
  const content = loadContent();
  const comp = dealComposition(content.places, content.eras, "ff-seed", "Vane");
  const founded = foundByComposition(content, comp).state;
  return new GameStore(content, "ff-seed", memStorage() as never, founded, founded.archetype);
}

describe("GameStore devFastForward (saga-aware)", () => {
  it("advances a founded spine line forward (the clock + act move)", async () => {
    const store = foundedStore();
    const startYear = store.view.state.year;
    await store.devFastForward(100);
    expect(store.view.state.year).toBeGreaterThan(startYear);
  });

  it("runs the founded spine all the way to the end (finished)", async () => {
    const store = foundedStore();
    for (let i = 0; i < 30 && !store.finished; i++) {
      await store.devFastForward(100);
    }
    expect(store.finished).toBe(true);
    expect(store.view.state.end).not.toBeNull();
  });
});
