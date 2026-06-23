/**
 * EI-8e — the ON-DEMAND generate-and-cache layer for portraits. The demand matrix is large (≈1680 protagonist
 * keys plus encounter figures — see the spec), so portraits are NEVER blanket-generated: a caller asks for a
 * composite key, the cache serves a hit, or ONE generation runs, is stored under the key, and served
 * thereafter. Spec: docs/superpowers/specs/2026-06-23-emergent-infancy-onboarding-design.md §"EI-8 — the
 * portrait-demand MATRIX".
 *
 * This is OFFLINE asset tooling — it runs in the generation runner, never at sim runtime (sim purity holds:
 * the sim only ever references a key/path, never calls a generator). The orchestration here is pure given its
 * injected cache + generator, and deterministic: the same key → at most one generation → a stable asset.
 */

import type { GenerateImageFn } from "./client";

/**
 * A portrait asset store keyed by composite portrait key. Async so a real backing store (filesystem, blob
 * store) can implement it; an in-memory Map suffices for tests + the dev runner.
 */
export interface PortraitCache {
  has(key: string): Promise<boolean>;
  get(key: string): Promise<Uint8Array | null>;
  put(key: string, bytes: Uint8Array): Promise<void>;
}

/** The outcome of a resolve: the asset bytes (or null if generation produced none) + whether it was a cache hit. */
export interface PortraitResolution {
  key: string;
  bytes: Uint8Array | null;
  cached: boolean;
}

/**
 * Resolve a portrait by key: cache-first, generate-on-miss, store-then-serve. Exactly ONE generation runs per
 * missing key — never a blanket sweep. A generator that returns null (no image) is NOT cached (so a transient
 * miss can be retried later), and the null is surfaced so the caller can fall back. Pure given (cache, generate).
 */
export async function resolvePortrait(
  key: string,
  prompt: string,
  cache: PortraitCache,
  generate: GenerateImageFn,
): Promise<PortraitResolution> {
  if (await cache.has(key)) {
    return { key, bytes: await cache.get(key), cached: true };
  }
  const bytes = await generate(prompt);
  if (bytes) await cache.put(key, bytes);
  return { key, bytes, cached: false };
}

/** A simple in-memory PortraitCache (tests + the dev runner). A real runner backs this with the asset dir. */
export function memoryPortraitCache(seed: Record<string, Uint8Array> = {}): PortraitCache {
  const store = new Map<string, Uint8Array>(Object.entries(seed));
  return {
    has: (key) => Promise.resolve(store.has(key)),
    get: (key) => Promise.resolve(store.get(key) ?? null),
    put: (key, bytes) => {
      store.set(key, bytes);
      return Promise.resolve();
    },
  };
}
