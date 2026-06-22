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

  // NOTE: the "no orphan scenes" integrity assertion lands with the post-sweep prune commit
  // (scripts/prune-saga-orphans.ts), once the full-lattice GenAI sweep has finished writing.
});
