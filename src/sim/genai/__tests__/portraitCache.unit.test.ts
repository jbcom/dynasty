import { describe, expect, it, vi } from "vitest";
import { memoryPortraitCache, type PortraitCache, resolvePortrait } from "../portraitCache";

/**
 * EI-8e — the on-demand generate-and-cache layer. Cache-first, ONE generation per missing key, store-then-
 * serve; nulls (no image) are not cached so they can be retried. Offline tooling, deterministic per key.
 */

const bytes = (n: number) => new Uint8Array([n]);

describe("EI-8e resolvePortrait", () => {
  it("serves a cache HIT without generating", async () => {
    const cache = memoryPortraitCache({ "portrait:adult:midcentury:economic:high:m": bytes(7) });
    const generate = vi.fn();
    const r = await resolvePortrait(
      "portrait:adult:midcentury:economic:high:m",
      "prompt",
      cache,
      generate,
    );
    expect(r.cached).toBe(true);
    expect(r.bytes).toEqual(bytes(7));
    expect(generate).not.toHaveBeenCalled();
  });

  it("generates ONCE on a miss, stores under the key, then serves from cache", async () => {
    const cache = memoryPortraitCache();
    const generate = vi.fn().mockResolvedValue(bytes(42));
    const k = "portrait:youth:founding_1700s:religious:low:f";

    const first = await resolvePortrait(k, "prompt", cache, generate);
    expect(first.cached).toBe(false);
    expect(first.bytes).toEqual(bytes(42));
    expect(generate).toHaveBeenCalledTimes(1);

    // Second resolve of the SAME key is a hit — no second generation (never blanket/again).
    const second = await resolvePortrait(k, "prompt", cache, generate);
    expect(second.cached).toBe(true);
    expect(second.bytes).toEqual(bytes(42));
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it("does NOT cache a null (no-image) result, so it can be retried later", async () => {
    const cache = memoryPortraitCache();
    const generate = vi
      .fn()
      .mockResolvedValueOnce(null) // first attempt: model produced no image
      .mockResolvedValueOnce(bytes(9)); // retry: succeeds
    const k = "portrait:elder:stellar:crime:high:m";

    const miss = await resolvePortrait(k, "p", cache, generate);
    expect(miss.bytes).toBeNull();
    expect(await cache.has(k)).toBe(false); // null not cached

    const retry = await resolvePortrait(k, "p", cache, generate);
    expect(retry.bytes).toEqual(bytes(9));
    expect(generate).toHaveBeenCalledTimes(2);
  });

  it("generates at most ONE per distinct key (no blanket sweep)", async () => {
    const cache: PortraitCache = memoryPortraitCache();
    const generate = vi.fn().mockImplementation((p: string) => Promise.resolve(bytes(p.length)));
    const keys = ["a", "b", "c", "a", "b"]; // 3 distinct
    for (const k of keys) await resolvePortrait(k, `prompt-${k}`, cache, generate);
    expect(generate).toHaveBeenCalledTimes(3);
  });
});
