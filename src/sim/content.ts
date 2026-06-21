import {
  type Asset,
  AssetsFileSchema,
  type ButterflyRule,
  ButterflyRulesSchema,
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
  parseContent,
  type RankLadder,
  RanksFileSchema,
  type Slot,
  SlotsFileSchema,
  type TermsFile,
  TermsFileSchema,
  type Trope,
  TropesFileSchema,
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
   * Procedural event templates (FD-4): skeleton events with `{slot}` tokens the
   * seeded expander materializes into concrete GameEvents when the authored pool
   * thins. Empty by default (the authored pool stands alone).
   */
  templates: EventTemplate[];
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
  eraEvents: Array<{ era: string; data: unknown }>;
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
  templates?: unknown;
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
  const templatesFile = parseContent(
    EventTemplatesFileSchema,
    raw.templates ?? { templates: [] },
    "templates",
  );
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
    markets: marketsFile.markets,
    currencies: currenciesFile.currencies,
    ranks: ranksFile.ranks,
    familyTrees: familyTreesFile.trees,
    tropes: tropesFile.tropes,
    templates: templatesFile.templates,
    worldEvents: projectWorldEvents(worldTimelines),
  };
}
