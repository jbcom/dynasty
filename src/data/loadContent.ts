import { buildContent, type Content, type RawContent } from "../sim/content";
import { validRaw } from "../sim/__tests__/fixtures";

/**
 * Load and validate all game content from `src/data` via Vite's glob import.
 * Until the real era JSON lands (Phase F), this falls back to the fixture
 * bundle so the app is playable end-to-end. The glob is eager so content is
 * bundled at build time (no async fetch on a mobile cold start).
 */
const metersGlob = import.meta.glob("./meters.json", { eager: true });
const indexGlob = import.meta.glob("./eras/index.json", { eager: true });
const erasGlob = import.meta.glob("./eras/*.json", { eager: true });
const butterflyGlob = import.meta.glob("./butterfly-rules.json", { eager: true });
const assetsGlob = import.meta.glob("./assets.json", { eager: true });

function firstValue<T>(glob: Record<string, unknown>): T | null {
  const entry = Object.values(glob)[0] as { default?: T } | undefined;
  return entry?.default ?? null;
}

function hasRealContent(): boolean {
  return firstValue(metersGlob) !== null && firstValue(indexGlob) !== null;
}

export function loadContent(): Content {
  if (!hasRealContent()) {
    // Pre-Phase-F fallback: the fixture content keeps the shell playable.
    return buildContent(validRaw());
  }

  const eraEvents = Object.entries(erasGlob)
    .filter(([path]) => !path.endsWith("index.json"))
    .map(([path, mod]) => {
      const id = path.split("/").pop()?.replace(".json", "") ?? "";
      return { era: id, data: (mod as { default: unknown }).default };
    });

  const raw: RawContent = {
    meters: firstValue(metersGlob),
    eraIndex: firstValue(indexGlob),
    eraEvents,
    butterflyRules: firstValue(butterflyGlob) ?? { rules: [] },
    assets: firstValue(assetsGlob) ?? { assets: [] },
  };
  return buildContent(raw);
}
