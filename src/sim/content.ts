import {
  type Asset,
  AssetsFileSchema,
  AxesFileSchema,
  type Axis,
  type ButterflyRule,
  ButterflyRulesSchema,
  type Calling,
  CallingsFileSchema,
  type Consequence,
  CurrenciesFileSchema,
  type Currency,
  type Ending,
  EndingsFileSchema,
  type Era,
  EraEventsSchema,
  EraIndexSchema,
  type EventTemplate,
  EventTemplatesFileSchema,
  type FamilyTree,
  FamilyTreesFileSchema,
  type GameEvent,
  type Market,
  MarketsFileSchema,
  type MeterDef,
  MetersFileSchema,
  type OnomasticsFile,
  OnomasticsFileSchema,
  type Place,
  PlacesFileSchema,
  parseContent,
  type RankLadder,
  RanksFileSchema,
  type Slot,
  SlotsFileSchema,
  type StartMoment,
  StartMomentsFileSchema,
  type TermsFile,
  TermsFileSchema,
  type Trope,
  TropesFileSchema,
  type WorldStack,
  WorldStacksFileSchema,
  type WorldTimeline,
  WorldTimelineSchema,
} from "./schema";
import { projectWorldEvents } from "./worldEvents";

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
  /** Systemic markets, currencies, and rank ladders (SIM1). */
  markets: Market[];
  currencies: Currency[];
  ranks: RankLadder[];
  /** Per-dynasty family trees (preset spines + the found-your-own data model). */
  familyTrees: FamilyTree[];
  /**
   * The dynastic trope catalog (FD-3): reusable archetypal patterns any founded
   * family can embody. Events reference these via `trope:<id>` tags; the compiler
   * composes a bespoke line from trope-templates × world-stacks × eras.
   */
  tropes: Trope[];
  /**
   * Founding CALLINGS (CP-2): durable generational lenses (trait drift + trope
   * weights) layered on the archetype. Empty by default.
   */
  callings: Calling[];
  /**
   * Epoch-0 thematic AXES (CP-4): faith/ideology/sociology/tech founding choices,
   * each option place-and-time-scaled by the world-stack's axis intensity.
   */
  axes: Axis[];
  /**
   * Procedural event templates (FD-4): skeleton events with `{slot}` tokens the
   * seeded expander materializes into concrete GameEvents when the authored pool
   * thins. Empty by default (the authored pool stands alone).
   */
  templates: EventTemplate[];
  /**
   * Per-culture given-name pools + naming conventions (FD-5). Feeds the procgen
   * context + the found-your-own-dynasty naming. Keyed by culture id.
   */
  onomastics: OnomasticsFile["cultures"];
  /**
   * The "found your own dynasty" start-moments (FD-6): historical hinges a line
   * can be founded at. The 4 preset spines are one-tap shortcuts over these.
   */
  startMoments: StartMoment[];
  /**
   * Per-place STANDING context (FD-7): geography/politics/religion/ideology +
   * period perils the family experiences at a place+era. Feeds the procgen
   * ExpandContext (place label + perils); a migration swaps which stack applies.
   */
  worldStacks: WorldStack[];
  /** The places catalog (CP-R3): sensory cue → place, default culture, valid eras. */
  places: Place[];
  /**
   * World-timeline entries PROJECTED into the unified event pool (FD-2.2): the
   * dated backdrop facts as year-keyed, reactable GameEvents the player lives
   * through. Derived from worldTimelines; year-sorted + deterministic.
   */
  worldEvents: GameEvent[];
}

export interface RawContent {
  meters: unknown;
  eraIndex: unknown;
  /**
   * Era events files. `era` is the period id (validated against the index). `place`
   * + `period` (CP-R-ERA) come from the eras/<place>/<period>/ path when loaded from
   * disk; they are optional so fixtures can pass bare {era, data}. A `_shared` place
   * applies to every founding place.
   */
  eraEvents: Array<{ era: string; place?: string; period?: string; data: unknown }>;
  butterflyRules: unknown;
  endings: unknown;
  worldTimelines?: unknown[];
  assets: unknown;
  terms?: unknown;
  slots?: unknown;
  markets?: unknown;
  currencies?: unknown;
  ranks?: unknown;
  familyTrees?: unknown;
  tropes?: unknown;
  callings?: unknown;
  axes?: unknown;
  templates?: unknown;
  onomastics?: unknown;
  startMoments?: unknown;
  worldStacks?: unknown;
  places?: unknown;
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
  const marketsFile = parseContent(
    MarketsFileSchema,
    raw.markets ?? { markets: [] },
    "markets.json",
  );
  const currenciesFile = parseContent(
    CurrenciesFileSchema,
    raw.currencies ?? { currencies: [] },
    "currencies.json",
  );
  const ranksFile = parseContent(RanksFileSchema, raw.ranks ?? { ranks: [] }, "ranks.json");
  const familyTreesFile = parseContent(
    FamilyTreesFileSchema,
    raw.familyTrees ?? { trees: [] },
    "family-trees",
  );
  const tropesFile = parseContent(TropesFileSchema, raw.tropes ?? { tropes: [] }, "tropes.json");
  const tropeIds = new Set(tropesFile.tropes.map((t) => t.id));
  if (tropeIds.size !== tropesFile.tropes.length) {
    throw new Error("tropes.json has duplicate trope ids");
  }
  const callingsFile = parseContent(
    CallingsFileSchema,
    raw.callings ?? { callings: [] },
    "callings.json",
  );
  const axesFile = parseContent(AxesFileSchema, raw.axes ?? { axes: [] }, "axes.json");
  // A calling's trope-weight keys must resolve to the catalog (same guarantee as
  // events/templates), so a renamed/deleted trope can never leave a dangling weight.
  if (tropeIds.size > 0) {
    for (const c of callingsFile.callings) {
      for (const id of Object.keys(c.tropeWeights)) {
        if (!tropeIds.has(id)) {
          throw new Error(`calling "${c.id}" references unknown trope "${id}"`);
        }
      }
    }
  }
  const templatesFile = parseContent(
    EventTemplatesFileSchema,
    raw.templates ?? { templates: [] },
    "templates",
  );
  const onomasticsFile = parseContent(
    OnomasticsFileSchema,
    raw.onomastics ?? { cultures: {} },
    "onomastics.json",
  );
  const startMomentsFile = parseContent(
    StartMomentsFileSchema,
    raw.startMoments ?? { moments: [] },
    "start-moments.json",
  );
  const worldStacksFile = parseContent(
    WorldStacksFileSchema,
    raw.worldStacks ?? { stacks: [] },
    "world/stacks.json",
  );
  const placesFile = parseContent(
    PlacesFileSchema,
    raw.places ?? { places: [] },
    "world/places.json",
  );
  // Each start-moment's culture must resolve in onomastics; cross-ref vs eras is
  // done below once eraIds is built. FD-7: its place must have a world-stack so
  // the founded line always has standing context (no silent generic fallback).
  const cultureIds = new Set(Object.keys(onomasticsFile.cultures));
  const stackPlaces = new Set(worldStacksFile.stacks.map((s) => s.place));
  for (const m of startMomentsFile.moments) {
    if (cultureIds.size > 0 && !cultureIds.has(m.culture)) {
      throw new Error(`start-moment "${m.id}" references unknown culture "${m.culture}"`);
    }
    if (stackPlaces.size > 0 && !stackPlaces.has(m.place)) {
      throw new Error(`start-moment "${m.id}" place "${m.place}" has no world-stack`);
    }
  }
  // A template's trope ids must resolve to the catalog (same guarantee as events).
  if (tropeIds.size > 0) {
    for (const tpl of templatesFile.templates) {
      for (const id of tpl.tropes) {
        if (!tropeIds.has(id)) {
          throw new Error(`template "${tpl.id}" references unknown trope "${id}"`);
        }
      }
    }
  }
  // Cross-ref validate each tree: every child id resolves to a member, exactly
  // one founder-patriarch, and no cycles (the tree is a DAG progenitor→descendants).
  for (const tree of familyTreesFile.trees) {
    const ids = new Set(tree.members.map((m) => m.id));
    if (new Set(tree.members.map((m) => m.id)).size !== tree.members.length) {
      throw new Error(`family-tree "${tree.dynasty}" has duplicate member ids`);
    }
    const founders = tree.members.filter((m) => m.role === "founder-patriarch");
    if (founders.length !== 1) {
      throw new Error(
        `family-tree "${tree.dynasty}" must have exactly one founder-patriarch (has ${founders.length})`,
      );
    }
    for (const m of tree.members) {
      for (const c of m.children) {
        if (!ids.has(c)) {
          throw new Error(`family-tree "${tree.dynasty}": ${m.id} references unknown child "${c}"`);
        }
      }
      if (m.spouse && !ids.has(m.spouse)) {
        throw new Error(
          `family-tree "${tree.dynasty}": ${m.id} references unknown spouse "${m.spouse}"`,
        );
      }
    }
    // Cycle check: a parent can never be reachable from its own descendants.
    const childMap = new Map(tree.members.map((m) => [m.id, m.children]));
    for (const start of ids) {
      const seen = new Set<string>();
      const stack = [...(childMap.get(start) ?? [])];
      while (stack.length) {
        const cur = stack.pop() as string;
        if (cur === start)
          throw new Error(`family-tree "${tree.dynasty}" has a cycle at "${start}"`);
        if (seen.has(cur)) continue;
        seen.add(cur);
        stack.push(...(childMap.get(cur) ?? []));
      }
    }
  }

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
      // FD-3: any `trope:<id>` tag must reference a catalog trope (so a refactor
      // can never leave an event pointing at a deleted/renamed trope). Only
      // enforced when a catalog is supplied, so legacy fixtures stay loadable.
      if (tropeIds.size > 0) {
        for (const tag of ev.tags) {
          if (tag.startsWith("trope:")) {
            const id = tag.slice("trope:".length);
            if (!tropeIds.has(id)) {
              throw new Error(`Event "${ev.id}" references unknown trope "${id}"`);
            }
          }
        }
      }
      allEvents.push(ev);
    }
    // APPEND, don't overwrite: an era's pool is the MERGE of every file declaring it
    // (the place-arc model, EX-2, splits one era across eras/<place>/<period>/ files).
    eventsByEra.set(parsed.era, [...(eventsByEra.get(parsed.era) ?? []), ...parsed.events]);
  }

  // Every era in the index must have an event pool.
  for (const era of eras) {
    if (!eventsByEra.has(era.id)) {
      throw new Error(`Era "${era.id}" has no events file`);
    }
  }

  // FD-6: each start-moment's startEra must be a real era.
  for (const m of startMomentsFile.moments) {
    if (!eraIds.has(m.startEra)) {
      throw new Error(`start-moment "${m.id}" references unknown startEra "${m.startEra}"`);
    }
  }

  // CP-R3: every place in the catalog must cross-resolve — its defaultCulture in
  // onomastics, every validEras entry a real era, and a world-stack covering it —
  // so no offered (place × era) composition can fail to found a valid run.
  for (const p of placesFile.places) {
    if (cultureIds.size > 0 && !cultureIds.has(p.defaultCulture)) {
      throw new Error(`place "${p.id}" defaultCulture "${p.defaultCulture}" not in onomastics`);
    }
    if (stackPlaces.size > 0 && !stackPlaces.has(p.id)) {
      throw new Error(`place "${p.id}" has no world-stack`);
    }
    for (const e of p.validEras) {
      if (!eraIds.has(e)) {
        throw new Error(`place "${p.id}" validEras references unknown era "${e}"`);
      }
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
    markets: marketsFile.markets,
    currencies: currenciesFile.currencies,
    ranks: ranksFile.ranks,
    familyTrees: familyTreesFile.trees,
    tropes: tropesFile.tropes,
    callings: callingsFile.callings,
    axes: axesFile.axes,
    templates: templatesFile.templates,
    onomastics: onomasticsFile.cultures,
    startMoments: startMomentsFile.moments,
    places: placesFile.places,
    worldStacks: worldStacksFile.stacks,
    worldEvents: projectWorldEvents(worldTimelines),
  };
}
