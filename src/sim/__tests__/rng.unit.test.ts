import { describe, expect, it } from "vitest";
import { createRng } from "../rng";

describe("createRng", () => {
  it("is deterministic: same seed yields the same sequence", () => {
    const a = createRng("trump-1946");
    const b = createRng("trump-1946");
    const seqA = Array.from({ length: 10 }, () => a.next());
    const seqB = Array.from({ length: 10 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it("different seeds yield different sequences", () => {
    const a = createRng("seed-a");
    const b = createRng("seed-b");
    expect(a.next()).not.toBe(b.next());
  });

  it("next() stays in [0, 1)", () => {
    const r = createRng("range");
    for (let i = 0; i < 1000; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("int() is inclusive on both ends and deterministic", () => {
    const r = createRng("ints");
    const vals = Array.from({ length: 500 }, () => r.int(1, 6));
    expect(Math.min(...vals)).toBe(1);
    expect(Math.max(...vals)).toBe(6);
    expect(vals.every((v) => Number.isInteger(v))).toBe(true);
  });

  it("int() throws when max < min", () => {
    const r = createRng("bad");
    expect(() => r.int(5, 1)).toThrow();
  });

  it("float() stays within [min, max)", () => {
    const r = createRng("floats");
    for (let i = 0; i < 200; i++) {
      const v = r.float(-2, 2);
      expect(v).toBeGreaterThanOrEqual(-2);
      expect(v).toBeLessThan(2);
    }
  });

  it("chance() clamps probability and is reproducible", () => {
    expect(createRng("c").chance(2)).toBe(true); // p>1 → always true
    expect(createRng("c").chance(-1)).toBe(false); // p<0 → always false
    const a = Array.from({ length: 50 }, (_, i) => createRng(`x${i}`).chance(0.5));
    const b = Array.from({ length: 50 }, (_, i) => createRng(`x${i}`).chance(0.5));
    expect(a).toEqual(b);
  });

  it("pick() returns an element and throws on empty", () => {
    const r = createRng("pick");
    expect(["a", "b", "c"]).toContain(r.pick(["a", "b", "c"]));
    expect(() => r.pick([])).toThrow();
  });

  it("weightedIndex() respects weights and ignores zero/negative", () => {
    const r = createRng("weights");
    const counts = [0, 0, 0];
    for (let i = 0; i < 3000; i++) {
      const idx = r.weightedIndex([0, 1, 3]);
      counts[idx] = (counts[idx] ?? 0) + 1;
    }
    expect(counts[0]).toBe(0); // weight 0 never chosen
    expect(counts[2] ?? 0).toBeGreaterThan(counts[1] ?? 0); // weight 3 > weight 1
  });

  it("weightedIndex() throws when empty or all-zero", () => {
    const r = createRng("wz");
    expect(() => r.weightedIndex([])).toThrow();
    expect(() => r.weightedIndex([0, 0, -1])).toThrow();
  });

  it("fork() produces an independent but deterministic stream", () => {
    const parent1 = createRng("root");
    const parent2 = createRng("root");
    const c1 = parent1.fork("butterfly").next();
    const c2 = parent2.fork("butterfly").next();
    expect(c1).toBe(c2); // deterministic across identical roots
    const other = createRng("root").fork("events").next();
    expect(other).not.toBe(c1); // different label → different stream
  });
});
