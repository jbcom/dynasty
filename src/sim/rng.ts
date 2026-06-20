import seedrandom from "seedrandom";

/**
 * Deterministic RNG facade. The ONLY source of randomness allowed in the pure
 * sim (`Math.random` is banned by the commit gate in `src/sim/**`). Wrapping
 * seedrandom behind this interface means every random draw is reproducible from
 * the run seed — which is what makes butterfly chains and playthroughs verifiable.
 */
export interface Rng {
  /** Uniform float in [0, 1). */
  next(): number;
  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number;
  /** Float in [min, max). */
  float(min: number, max: number): number;
  /** True with probability `p` (clamped to [0, 1]). */
  chance(p: number): boolean;
  /** Pick one element; throws on empty array. */
  pick<T>(items: readonly T[]): T;
  /**
   * Pick an index from `weights` proportional to each weight. Negative weights
   * are treated as 0. Throws if the array is empty or all weights are 0.
   */
  weightedIndex(weights: readonly number[]): number;
  /** Derive a child RNG with an independent, deterministic stream. */
  fork(label: string): Rng;
}

function makeRng(prng: seedrandom.PRNG, seed: string): Rng {
  const rng: Rng = {
    next: () => prng(),
    int(min, max) {
      if (max < min) throw new Error(`int(min,max): max ${max} < min ${min}`);
      return min + Math.floor(prng() * (max - min + 1));
    },
    float(min, max) {
      return min + prng() * (max - min);
    },
    chance(p) {
      const clamped = p < 0 ? 0 : p > 1 ? 1 : p;
      return prng() < clamped;
    },
    pick(items) {
      if (items.length === 0) throw new Error("pick(): empty array");
      const idx = Math.floor(prng() * items.length);
      // idx is always in range; the assertion satisfies noUncheckedIndexedAccess.
      return items[idx] as (typeof items)[number];
    },
    weightedIndex(weights) {
      if (weights.length === 0) throw new Error("weightedIndex(): empty array");
      let total = 0;
      for (const w of weights) total += w > 0 ? w : 0;
      if (total <= 0) throw new Error("weightedIndex(): all weights are zero");
      let roll = prng() * total;
      for (let i = 0; i < weights.length; i++) {
        const w = weights[i] ?? 0;
        if (w <= 0) continue;
        roll -= w;
        if (roll < 0) return i;
      }
      // Floating-point edge: return the last positive-weight index.
      for (let i = weights.length - 1; i >= 0; i--) {
        if ((weights[i] ?? 0) > 0) return i;
      }
      throw new Error("weightedIndex(): unreachable");
    },
    fork(label) {
      return createRng(`${seed}::${label}`);
    },
  };
  return rng;
}

/** Create a deterministic RNG from a seed string. Same seed → same stream. */
export function createRng(seed: string): Rng {
  // state:true keeps the generator pure/serializable; we don't mutate globals.
  const prng = seedrandom(seed, { state: false });
  return makeRng(prng, seed);
}
