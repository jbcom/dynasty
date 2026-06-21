import { buildContent, type Content, type RawContent } from "../sim/content";

/**
 * Load and validate all game content from `src/data` via Vite's glob import.
 * The glob is eager so content is bundled at build time (no async fetch on a
 * mobile cold start). buildContent throws on any schema or cross-reference
 * failure, so the app fails loudly rather than silently serving partial data.
 */
const metersGlob = import.meta.glob("./meters.json", { eager: true });
const indexGlob = import.meta.glob("./eras/index.json", { eager: true });
const erasGlob = import.meta.glob("./eras/*.json", { eager: true });
const butterflyGlob = import.meta.glob("./butterfly-rules.json", { eager: true });
const endingsGlob = import.meta.glob("./endings.json", { eager: true });
const timelinesGlob = import.meta.glob("./timelines/*.json", { eager: true });
const assetsGlob = import.meta.glob("./assets.json", { eager: true });
const termsGlob = import.meta.glob("./terms.json", { eager: true });
const slotsGlob = import.meta.glob("./slots.json", { eager: true });
const marketsGlob = import.meta.glob("./markets.json", { eager: true });
const currenciesGlob = import.meta.glob("./currencies.json", { eager: true });
const ranksGlob = import.meta.glob("./ranks.json", { eager: true });
const familyTreesGlob = import.meta.glob("./family-trees/*.json", { eager: true });
const tropesGlob = import.meta.glob("./tropes.json", { eager: true });
const templatesGlob = import.meta.glob("./templates/*.json", { eager: true });
const onomasticsGlob = import.meta.glob("./onomastics.json", { eager: true });
const startMomentsGlob = import.meta.glob("./origins/start-moments.json", { eager: true });
const worldStacksGlob = import.meta.glob("./world/stacks.json", { eager: true });

function firstValue<T>(glob: Record<string, unknown>): T | null {
  const entry = Object.values(glob)[0] as { default?: T } | undefined;
  return entry?.default ?? null;
}

function collectEraEvents(): Array<{ era: string; data: unknown }> {
  return Object.entries(erasGlob)
    .filter(([path]) => !path.endsWith("index.json"))
    .map(([path, mod]) => {
      const id = path.split("/").pop()?.replace(".json", "") ?? "";
      return { era: id, data: (mod as { default: unknown }).default };
    });
}

export function loadContent(): Content {
  const eraEvents = collectEraEvents();

  const raw: RawContent = {
    meters: firstValue(metersGlob),
    eraIndex: firstValue(indexGlob),
    eraEvents,
    butterflyRules: firstValue(butterflyGlob) ?? { rules: [] },
    endings: firstValue(endingsGlob) ?? { endings: [] },
    worldTimelines: Object.values(timelinesGlob).map((m) => (m as { default: unknown }).default),
    assets: firstValue(assetsGlob) ?? { assets: [] },
    terms: firstValue(termsGlob) ?? { terms: {} },
    slots: firstValue(slotsGlob) ?? { slots: [] },
    markets: firstValue(marketsGlob) ?? { markets: [] },
    currencies: firstValue(currenciesGlob) ?? { currencies: [] },
    ranks: firstValue(ranksGlob) ?? { ranks: [] },
    familyTrees: {
      trees: Object.values(familyTreesGlob).map((m) => (m as { default: unknown }).default),
    },
    tropes: firstValue(tropesGlob) ?? { tropes: [] },
    templates: {
      templates: Object.values(templatesGlob).flatMap(
        (m) => (m as { default: { templates?: unknown[] } }).default.templates ?? [],
      ),
    },
    onomastics: firstValue(onomasticsGlob) ?? { cultures: {} },
    startMoments: firstValue(startMomentsGlob) ?? { moments: [] },
    worldStacks: firstValue(worldStacksGlob) ?? { stacks: [] },
  };
  return buildContent(raw);
}
