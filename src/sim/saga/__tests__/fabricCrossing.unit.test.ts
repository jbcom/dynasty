import { describe, expect, it } from "vitest";
import { loadSaga } from "../../../data/loadSaga";
import keeperReport from "../../../data/saga/fabric/keepers.json" with { type: "json" };
import { fabricVignette } from "../fabricCrossing";
import { resolveThreads } from "../player";
import { SceneSchema } from "../schema";

/**
 * CORPUS-MINE-INTERSECTIONS — the mined fabric (FS-4) is now READ at runtime: a cross-dynasty crossing
 * borrows the curated, highest-scored vignette for the rival wave+tier instead of a generic placeholder.
 * These tests pin: every recurring family resolves a real vignette; the pick is deterministic; an unknown
 * wave returns null (caller keeps its fallback); and resolveThreads actually USES the fabric vignette as the
 * crossing prose when the thread ref carries no bespoke crossing.
 */

const FAMILIES = ["italian", "ireland", "ashkenazi_jewish", "chinese", "bavaria", "scandinavian"];
const KEEPERS = (
  keeperReport as {
    keepers: Array<{ wave: string; tier: number; keeperScore: number; vignettes: string[] }>;
  }
).keepers;

function topKeeperFor(wave: string, tier: number): (typeof KEEPERS)[number] | undefined {
  return KEEPERS.filter((keeper) => keeper.wave === wave && keeper.tier === tier).sort(
    (a, b) => b.keeperScore - a.keeperScore,
  )[0];
}

describe("fabricVignette (mined-fabric crossing prose)", () => {
  it("returns a real, non-empty vignette for every recurring family", () => {
    for (const wave of FAMILIES) {
      const v = fabricVignette(wave, 3);
      expect(v, wave).toBeTruthy();
      expect((v ?? "").length, wave).toBeGreaterThan(20);
    }
  });

  it("is deterministic — same (wave, tier) → identical vignette", () => {
    expect(fabricVignette("italian", 4)).toBe(fabricVignette("italian", 4));
    expect(fabricVignette("chinese", 2)).toBe(fabricVignette("chinese", 2));
  });

  it("KEY-PILLARS-1g: promotes the keeper-ranked vignette for live crossings", () => {
    const keeper = topKeeperFor("ireland", 0);

    expect(keeper, "keeper report should cover the Ireland tier-0 crossing").toBeTruthy();
    expect(fabricVignette("ireland", 0)).toBe(keeper?.vignettes[0]);
  });

  it("returns null for a wave the corpus never covered (caller keeps its generic fallback)", () => {
    expect(fabricVignette("not-a-wave", 3)).toBeNull();
  });

  it("CORPUS-MINE-INTERSECTIONS: resolveThreads weaves the fabric vignette as the crossing prose", () => {
    const corpus = loadSaga();
    // Find a wave+tier that has BOTH a corpus act (so a thread resolves) and a fabric vignette.
    let wave: string | null = null;
    let tier = 0;
    for (const act of corpus.acts.values()) {
      if (FAMILIES.includes(act.wave) && fabricVignette(act.wave, act.tier)) {
        wave = act.wave;
        tier = act.tier;
        break;
      }
    }
    expect(wave, "a family act with fabric exists").toBeTruthy();
    const scene = SceneSchema.parse({
      id: "sc:x:open",
      sense: "sight",
      prose: ["A crossing approaches."],
      // a thread ref with NO bespoke crossing → resolveThreads must fall to the fabric vignette.
      thread: [{ wave: wave as string, atTier: tier }],
    });
    const threads = resolveThreads(corpus, scene);
    expect(threads.length).toBe(1);
    const t = threads[0];
    // The crossing prose equals the mined fabric vignette (not the generic "The path of a … line crosses").
    expect(t?.crossing).toBe(fabricVignette(wave as string, tier));
    expect(t?.crossing).not.toMatch(/^The path of a .* line crosses yours\.$/);
  });
});
