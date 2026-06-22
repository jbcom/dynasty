import { describe, expect, it } from "vitest";
import { createRng } from "../../rng";
import {
  type BraidCandidate,
  type BraidContext,
  candidatesFromSnapshots,
  type RivalLike,
  selectBraid,
} from "../braidSelect";

/**
 * WV-2 braid selector — pure, seeded emergent crossing selection. Verifies: era-gating (later dynasties
 * only enter past their year), setting-matched bias weighting, the seeded fire/which rolls (deterministic
 * per seed), the borrowed vignette, and null when nothing plausibly matches.
 */

const destAtMarket = { kind: "destination" as const, at: 1, setting: "market" };

function candidate(over: Partial<BraidCandidate> = {}): BraidCandidate {
  return {
    wave: "ashkenazi_jewish",
    tier: 0,
    activeFromYear: 1880,
    sources: [
      { kind: "source", at: 0, setting: "market", vignette: "A peddler hawks tin and thread." },
    ],
    bias: { place: 1, archetype: 0.5, cls: 1 },
    relation: "contributing",
    ...over,
  };
}

function ctx(over: Partial<BraidContext> = {}): BraidContext {
  return { year: 1890, tier: 0, destinations: [destAtMarket], baseChance: 1, ...over };
}

describe("selectBraid (WV-2)", () => {
  it("weaves a crossing borrowing the partner's source vignette when a setting-matched candidate fires", () => {
    const m = selectBraid(ctx(), [candidate()], createRng("seed").fork("braid"));
    expect(m).not.toBeNull();
    expect(m?.thread.wave).toBe("ashkenazi_jewish");
    expect(m?.thread.crossing).toBe("A peddler hawks tin and thread."); // BORROWED, not bespoke
    expect(m?.thread.relation).toBe("contributing");
    expect(m?.thread.atTier).toBe(0);
  });

  it("ERA-GATES: a line not yet active (activeFromYear in the future) cannot cross", () => {
    const future = candidate({ wave: "later_wave", activeFromYear: 1950 });
    expect(selectBraid(ctx({ year: 1890 }), [future], createRng("s").fork("b"))).toBeNull();
    // …but once the year passes its activeFromYear it enters the pool.
    expect(selectBraid(ctx({ year: 1960 }), [future], createRng("s").fork("b"))).not.toBeNull();
  });

  it("returns null when no source matches the destination's setting (no plausible meeting)", () => {
    const wrongSetting = candidate({
      sources: [{ kind: "source", at: 0, setting: "battlefield", vignette: "x" }],
    });
    expect(selectBraid(ctx(), [wrongSetting], createRng("s").fork("b"))).toBeNull();
  });

  it("returns null when the seeded gate declines (crossings are special, not every move)", () => {
    // baseChance 0 → the fire gate always declines.
    expect(selectBraid(ctx({ baseChance: 0 }), [candidate()], createRng("s").fork("b"))).toBeNull();
  });

  it("is DETERMINISTIC — same seed + inputs yields the same match", () => {
    const a = selectBraid(ctx(), [candidate()], createRng("seed").fork("braid"));
    const b = selectBraid(ctx(), [candidate()], createRng("seed").fork("braid"));
    expect(a).toEqual(b);
  });

  it("bias-weights toward the higher-overlap candidate across many seeds", () => {
    const near = candidate({ wave: "near", bias: { place: 1, archetype: 1, cls: 1 } });
    const far = candidate({ wave: "far", bias: { place: 0, archetype: 0, cls: 0 } });
    let nearWins = 0;
    for (let i = 0; i < 200; i++) {
      const m = selectBraid(ctx(), [near, far], createRng(`seed-${i}`).fork("braid"));
      if (m?.thread.wave === "near") nearWins++;
    }
    // The high-overlap candidate should win the clear majority (its weight dwarfs far's floor).
    expect(nearWins).toBeGreaterThan(140);
  });

  it("only crosses at the shared tier (a candidate at a different tier is skipped)", () => {
    const otherTier = candidate({ tier: 3 });
    expect(selectBraid(ctx({ tier: 0 }), [otherTier], createRng("s").fork("b"))).toBeNull();
  });

  it("REPLAY-SAFE: the match is invariant to candidate ORDER (stable option sort)", () => {
    // The pick must not depend on world.snapshots iteration order (which can differ fresh-vs-restored).
    const a = candidate({ wave: "alpha", bias: { place: 1, archetype: 1, cls: 1 } });
    const b = candidate({ wave: "bravo", bias: { place: 1, archetype: 1, cls: 1 } });
    const c = candidate({ wave: "charlie", bias: { place: 1, archetype: 1, cls: 1 } });
    const forward = selectBraid(ctx(), [a, b, c], createRng("seed").fork("braid"));
    const shuffled = selectBraid(ctx(), [c, a, b], createRng("seed").fork("braid"));
    expect(shuffled?.thread.wave).toBe(forward?.thread.wave); // same pick regardless of input order
  });

  it("a source slot WITHOUT a vignette is not a valid match (can't weave empty prose)", () => {
    const noVignette = candidate({
      sources: [{ kind: "source", at: 0, setting: "market" }], // vignette omitted
    });
    expect(selectBraid(ctx(), [noVignette], createRng("s").fork("b"))).toBeNull();
  });
});

describe("candidatesFromSnapshots (WV-2 adapter)", () => {
  const rival = (over: Partial<RivalLike> = {}): RivalLike => ({
    id: "ashkenazi_jewish",
    placeId: "ny",
    archetype: "economic",
    strategy: "accumulate",
    alive: true,
    ...over,
  });
  const market = [
    { kind: "source" as const, at: 0, setting: "market", vignette: "A peddler hawks wares." },
  ];

  it("maps live rivals to candidates with place/archetype bias + a strategy-derived relation", () => {
    const cands = candidatesFromSnapshots(
      [rival()],
      { placeId: "ny", archetype: "economic", cls: "poor", tier: 0 },
      "accumulate",
      () => market,
    );
    expect(cands).toHaveLength(1);
    expect(cands[0]?.bias.place).toBe(1); // same placeId
    expect(cands[0]?.bias.archetype).toBe(1); // same power base
    expect(cands[0]?.relation).toBe("opposing"); // same strategy as the player
    expect(cands[0]?.sources).toEqual(market);
  });

  it("drops dead rivals and lowers bias for a different place/archetype", () => {
    const cands = candidatesFromSnapshots(
      [rival({ alive: false }), rival({ id: "far", placeId: "sf", archetype: "political" })],
      { placeId: "ny", archetype: "economic", cls: "poor", tier: 0 },
      "accumulate",
      () => market,
    );
    expect(cands).toHaveLength(1); // dead one dropped
    expect(cands[0]?.bias.place).toBe(0); // different place
    expect(cands[0]?.bias.archetype).toBe(0.4); // different power base
  });

  it("threads through selectBraid end-to-end (live rival → woven borrowed crossing)", () => {
    const cands = candidatesFromSnapshots(
      [rival()],
      { placeId: "ny", archetype: "economic", cls: "poor", tier: 0 },
      "spread_belief", // complementary-ish → not opposing
      () => market,
    );
    const m = selectBraid(
      {
        year: 1890,
        tier: 0,
        destinations: [{ kind: "destination", at: 1, setting: "market" }],
        baseChance: 1,
      },
      cands,
      createRng("seed").fork("braid"),
    );
    expect(m?.thread.wave).toBe("ashkenazi_jewish");
    expect(m?.thread.crossing).toBe("A peddler hawks wares."); // borrowed vignette
  });
});
