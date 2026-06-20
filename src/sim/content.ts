import {
  type Asset,
  AssetsFileSchema,
  type ButterflyRule,
  ButterflyRulesSchema,
  type Consequence,
  type Ending,
  EndingsFileSchema,
  type Era,
  EraEventsSchema,
  EraIndexSchema,
  type GameEvent,
  type MeterDef,
  MetersFileSchema,
  parseContent,
} from "./schema";

/**
 * The fully-validated, immutable content bundle the sim runs against. Pure data —
 * no file I/O here. A Vite-side loader (or a test) collects the raw JSON and calls
 * `buildContent`, which validates and cross-checks everything.
 */
export interface Content {
  meters: MeterDef[];
  eras: Era[];
  eventsByEra: Map<string, GameEvent[]>;
  allEvents: GameEvent[];
  butterflyRules: ButterflyRule[];
  consequences: Consequence[];
  endings: Ending[];
  assets: Asset[];
}

export interface RawContent {
  meters: unknown;
  eraIndex: unknown;
  eraEvents: Array<{ era: string; data: unknown }>;
  butterflyRules: unknown;
  endings: unknown;
  assets: unknown;
}

/** Validate raw JSON into a Content bundle, cross-checking referential integrity. */
export function buildContent(raw: RawContent): Content {
  const metersFile = parseContent(MetersFileSchema, raw.meters, "meters.json");
  const eraIndex = parseContent(EraIndexSchema, raw.eraIndex, "eras/index.json");
  const butterfly = parseContent(ButterflyRulesSchema, raw.butterflyRules, "butterfly-rules.json");
  const endingsFile = parseContent(EndingsFileSchema, raw.endings, "endings.json");
  const assetsFile = parseContent(AssetsFileSchema, raw.assets, "assets.json");

  const eras = [...eraIndex.eras].sort((a, b) => a.order - b.order);
  const eraIds = new Set(eras.map((e) => e.id));

  const eventsByEra = new Map<string, GameEvent[]>();
  const allEvents: GameEvent[] = [];
  const seenEventIds = new Set<string>();

  for (const entry of raw.eraEvents) {
    const parsed = parseContent(EraEventsSchema, entry.data, `eras/${entry.era}.json`);
    if (!eraIds.has(parsed.era)) {
      throw new Error(
        `Era events file declares era "${parsed.era}" which is not in eras/index.json`,
      );
    }
    for (const ev of parsed.events) {
      if (ev.era !== parsed.era) {
        throw new Error(
          `Event "${ev.id}" has era "${ev.era}" but lives in the "${parsed.era}" file`,
        );
      }
      if (seenEventIds.has(ev.id)) {
        throw new Error(`Duplicate event id "${ev.id}"`);
      }
      seenEventIds.add(ev.id);
      allEvents.push(ev);
    }
    eventsByEra.set(parsed.era, parsed.events);
  }

  // Every era in the index must have an event pool.
  for (const era of eras) {
    if (!eventsByEra.has(era.id)) {
      throw new Error(`Era "${era.id}" has no events file`);
    }
  }

  return {
    meters: metersFile.meters,
    eras,
    eventsByEra,
    allEvents,
    butterflyRules: butterfly.rules,
    consequences: butterfly.consequences,
    endings: endingsFile.endings,
    assets: assetsFile.assets,
  };
}
