/**
 * Clock facade. The sim is turn-based and pure, so it never reads wall-clock
 * time; the UI layer (animations, audio scheduling) does. Routing all time
 * reads through this facade keeps `performance.now()` out of `src/sim/**` (the
 * commit gate bans it there) and makes time mockable in tests.
 */
export interface Clock {
  /** Monotonic milliseconds since an arbitrary origin. */
  now(): number;
}

/** Real clock backed by performance.now (browser) or Date.now (fallback). */
export function systemClock(): Clock {
  const hasPerf = typeof performance !== "undefined" && typeof performance.now === "function";
  return {
    now: hasPerf ? () => performance.now() : () => Date.now(),
  };
}

/** Deterministic clock for tests — advance it manually. */
export function fixedClock(start = 0): Clock & { advance(ms: number): void } {
  let t = start;
  return {
    now: () => t,
    advance(ms: number) {
      t += ms;
    },
  };
}
