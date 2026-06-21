import { buildContent, type Content, type RawContent } from "../sim/content";

/**
 * Load and validate all game content from `src/data` via Vite's glob import.
 * The glob is eager so content is bundled at build time (no async fetch on a
 * mobile cold start). buildContent throws on any schema or cross-reference
 * failure, so the app fails loudly rather than silently serving partial data.
 */
const metersGlob = import.meta.glob("./meters.json", { eager: true });
const indexGlob = import.meta.glob("./eras/index.json", { eager: true });
// Eras live under eras/<place>/<period>/*.json (CP-R-ERA): geography → time. The
// recursive glob picks up every place's period dirs; place + period derive from the
// path, the era id from each file's own `era` field. index.json is excluded.
const erasGlob = import.meta.glob("./eras/**/*.json", { eager: true });
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
const callingsGlob = import.meta.glob("./callings.json", { eager: true });
const axesGlob = import.meta.glob("./axes.json", { eager: true });
const templatesGlob = import.meta.glob("./templates/*.json", { eager: true });
const onomasticsGlob = import.meta.glob("./onomastics.json", { eager: true });
const startMomentsGlob = import.meta.glob("./origins/start-moments.json", { eager: true });
const worldStacksGlob = import.meta.glob("./world/stacks.json", { eager: true });
const placesGlob = import.meta.glob("./world/places.json", { eager: true });

function firstValue<T>(glob: Record<string, unknown>): T | null {
  const entry = Object.values(glob)[0] as { default?: T } | undefined;
  return entry?.default ?? null;
}

/**
 * Collect every era events file under eras/<place>/<period>/*.json. The era id is
 * the file's own `era` field (validated against the index registry downstream); the
 * `place` and `period` come from the path: ".../eras/<place>/<period>/<file>.json".
 * A `_shared` place applies to every founding place. index.json is excluded.
 */
function collectEraEvents(): Array<{ era: string; place: string; period: string; data: unknown }> {
  return Object.entries(erasGlob)
    .filter(([path]) => !path.endsWith("index.json"))
    .map(([path, mod]) => {
      // ./eras/<place>/<period>/<file>.json → segments after the "eras" anchor.
      const segs = path.split("/");
      const erasIdx = segs.lastIndexOf("eras");
      const place = segs[erasIdx + 1] ?? "";
      const period = segs[erasIdx + 2] ?? "";
      const data = (mod as { default: { era?: string } }).default;
      return { era: data.era ?? period, place, period, data };
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
    callings: firstValue(callingsGlob) ?? { callings: [] },
    axes: firstValue(axesGlob) ?? { axes: [] },
    templates: {
      templates: Object.values(templatesGlob).flatMap(
        (m) => (m as { default: { templates?: unknown[] } }).default.templates ?? [],
      ),
    },
    onomastics: firstValue(onomasticsGlob) ?? { cultures: {} },
    startMoments: firstValue(startMomentsGlob) ?? { moments: [] },
    worldStacks: firstValue(worldStacksGlob) ?? { stacks: [] },
    places: firstValue(placesGlob) ?? { places: [] },
  };
  return buildContent(raw);
}
