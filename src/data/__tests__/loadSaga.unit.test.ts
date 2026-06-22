import { describe, expect, it } from "vitest";
import { actsForTier, openingScene } from "../../sim/saga/player";
import { loadSaga } from "../loadSaga";

/**
 * The saga loader glob-loads + zod-validates every authored act file. Proves the real corpus loads
 * (not just the hand-fed fixture) and that the Ireland/economic tier-0 act is reachable + walkable.
 */
describe("loadSaga (real corpus)", () => {
  const corpus = loadSaga();

  it("loads at least the authored Ireland/economic act + its scenes", () => {
    expect(corpus.acts.size).toBeGreaterThanOrEqual(1);
    expect(corpus.scenes.size).toBeGreaterThanOrEqual(3);
  });

  it("the Ireland/economic tier-0 act opens on a multi-paragraph scene", () => {
    const act = actsForTier(corpus, "ireland", "economic", 0);
    expect(act?.title).toContain("Act");
    if (!act) throw new Error("no act");
    const open = openingScene(corpus, act, new Set());
    expect(open).toBeDefined();
    expect(open?.prose.length).toBeGreaterThanOrEqual(2);
  });

  it("every act's referenced scenes resolve (no dangling scene ids)", () => {
    for (const act of corpus.acts.values()) {
      for (const id of act.scenes) {
        expect(corpus.scenes.get(id), `${act.id} → ${id}`).toBeDefined();
      }
    }
  });

  it("every act's referenced scenes resolve (no dangling scene ids)", () => {
    for (const act of corpus.acts.values()) {
      for (const id of act.scenes) {
        expect(corpus.scenes.get(id), `${act.id} → ${id}`).toBeDefined();
      }
    }
  });

  it("has no ORPHAN scenes (every scene belongs to some act)", () => {
    const referenced = new Set<string>();
    for (const act of corpus.acts.values()) for (const id of act.scenes) referenced.add(id);
    const orphans = [...corpus.scenes.keys()].filter((id) => !referenced.has(id));
    expect(orphans, `orphan scenes: ${orphans.join(", ")}`).toEqual([]);
  });

  it("cross-family intersections fire: every act's midpoint threads to a sibling wave", () => {
    let threaded = 0;
    for (const act of corpus.acts.values()) {
      const midId = act.scenes.find((id) => id.endsWith(":midpoint"));
      const mid = midId ? corpus.scenes.get(midId) : undefined;
      if (mid && mid.thread.length > 0) {
        threaded++;
        // the thread points at a DIFFERENT wave that has an act at this tier.
        const ref = mid.thread[0];
        expect(ref?.wave).not.toBe(act.wave);
        expect(actsForTier(corpus, ref!.wave, "economic", ref!.atTier)).toBeDefined();
      }
    }
    // The vast majority of acts (all that have a midpoint scene) should now braid in a rival line.
    expect(threaded).toBeGreaterThan(200);
  });

  it("covers the full lattice: 7 waves × 6 archetypes × 6 tiers = 252 acts", () => {
    expect(corpus.acts.size).toBe(252);
    // every (wave, archetype) cell has all 6 reach tiers.
    const tiers = new Map<string, Set<number>>();
    for (const a of corpus.acts.values()) {
      const cell = `${a.wave}/${a.archetype}`;
      tiers.set(cell, (tiers.get(cell) ?? new Set()).add(a.tier));
    }
    expect(tiers.size).toBe(42);
    for (const [cell, t] of tiers) expect(t.size, cell).toBe(6);
  });
});
