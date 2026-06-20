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
  type Slot,
  SlotsFileSchema,
  type TermsFile,
  TermsFileSchema,
  type WorldTimeline,
  WorldTimelineSchema,
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
  worldTimelines: WorldTimeline[];
  assets: Asset[];
  /** Branch-aware terms/titles for `{token}` interpolation (alt-history). */
  terms: TermsFile["terms"];
  /** Archetypal slot events resolved per branch/dynasty at compile time (AH7). */
  slots: Slot[];
}

export interface RawContent {
  meters: unknown;
  eraIndex: unknown;
  eraEvents: Array<{ era: string; data: unknown }>;
  butterflyRules: unknown;
  endings: unknown;
  worldTimelines?: unknown[];
  assets: unknown;
  terms?: unknown;
  slots?: unknown;
}

/** Validate raw JSON into a Content bundle, cross-checking referential integrity. */
export function buildContent(raw: RawContent): Content {
  const metersFile = parseContent(MetersFileSchema, raw.meters, "meters.json");
  const eraIndex = parseContent(EraIndexSchema, raw.eraIndex, "eras/index.json");
  const butterfly = parseContent(ButterflyRulesSchema, raw.butterflyRules, "butterfly-rules.json");
  const endingsFile = parseContent(EndingsFileSchema, raw.endings, "endings.json");
  const worldTimelines = (raw.worldTimelines ?? []).map((t, i) =>
    parseContent(WorldTimelineSchema, t, `timelines[${i}]`),
  );
  const assetsFile = parseContent(AssetsFileSchema, raw.assets, "assets.json");
  const termsFile = parseContent(TermsFileSchema, raw.terms ?? { terms: {} }, "terms.json");
  const slotsFile = parseContent(SlotsFileSchema, raw.slots ?? { slots: [] }, "slots.json");

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
    worldTimelines,
    assets: assetsFile.assets,
    terms: termsFile.terms,
    slots: slotsFile.slots,
  };
}
