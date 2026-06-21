import { z } from "zod";

/**
 * Zod schemas for ALL game content. Every JSON file in `src/data/**` is validated
 * against these on load so malformed content fails fast (in tests and at boot)
 * rather than corrupting a deterministic run silently.
 */

/** The six meters. Money is log-scaled net worth; the rest are 0–100 (Reputation signed). */
export const METER_IDS = ["money", "power", "reputation", "loyalty", "health", "heat"] as const;
export const MeterIdSchema = z.enum(METER_IDS);
export type MeterId = z.infer<typeof MeterIdSchema>;

/** A partial map of meter → delta applied by a choice. */
export const MeterDeltaSchema = z.partialRecord(MeterIdSchema, z.number());
export type MeterDelta = z.infer<typeof MeterDeltaSchema>;

/** The four personality axes a choice can nudge (see sim/personality.ts). */
export const PERSONALITY_AXES = ["ideology", "grandiosity", "outward", "inward"] as const;
export const PersonalityAxisSchema = z.enum(PERSONALITY_AXES);
/** A partial map of personality axis → delta applied by a choice. */
export const PersonalityDeltaSchema = z.partialRecord(PersonalityAxisSchema, z.number());

/** Meter definition (data/meters.json). */
export const MeterDefSchema = z.object({
  id: MeterIdSchema,
  label: z.string().min(1),
  icon: z.string().min(1),
  scale: z.enum(["linear", "log"]),
  min: z.number(),
  max: z.number(),
  start: z.number(),
  critLow: z.number().optional(),
  critHigh: z.number().optional(),
  color: z.string().min(1),
  signed: z.boolean().default(false),
});
export type MeterDef = z.infer<typeof MeterDefSchema>;

/** A meter requirement comparator, e.g. ">=20", "<50", "==0". */
const COMPARATOR_RE = /^(>=|<=|==|!=|>|<)\s*-?\d+(\.\d+)?$/;
export const MeterComparatorSchema = z
  .string()
  .regex(COMPARATOR_RE, "comparator must look like '>=20' or '<50'");

/** Gate on whether an event is eligible to appear. */
export const RequiresSchema = z
  .object({
    flags: z.array(z.string()).default([]),
    notFlags: z.array(z.string()).default([]),
    meters: z.partialRecord(MeterIdSchema, MeterComparatorSchema).default({}),
    /** Comparators over personality axes, e.g. { grandiosity: ">=60" }. */
    personality: z.partialRecord(PersonalityAxisSchema, MeterComparatorSchema).default({}),
    minAge: z.number().int().optional(),
    maxAge: z.number().int().optional(),
  })
  .default({ flags: [], notFlags: [], meters: {}, personality: {} });
export type Requires = z.infer<typeof RequiresSchema>;

/** A ripple: a weighted, polarized nudge toward a future butterfly channel. */
export const RippleSchema = z.object({
  to: z.string().min(1),
  weight: z.number().min(0).max(1),
  polarity: z.union([z.literal(-1), z.literal(1)]),
});
export type Ripple = z.infer<typeof RippleSchema>;

/** One branch of an event. */
export const ChoiceSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  effects: MeterDeltaSchema.default({}),
  /** Optional nudge to the personality vector (ideology/grandiosity/outward/inward). */
  personality: PersonalityDeltaSchema.default({}),
  setFlags: z.array(z.string()).default([]),
  clearFlags: z.array(z.string()).default([]),
  ripples: z.array(RippleSchema).default([]),
  outcome: z.string().min(1),
  /** Optional gate so a choice only shows under certain conditions. */
  requires: RequiresSchema.optional(),
  /**
   * Optional TIMELINE HOP: a choice can short-circuit the linear era march,
   * compressing time so events happen sooner (e.g. an early-prodigy path leaps
   * to power decades early). `era` jumps to that era id; `yearAdvance` skips
   * that many in-world years. Forward-only (a backward hop is ignored), so the
   * timeline stays a compressible graph, not a fixed conveyor. Deterministic.
   */
  jumpTo: z
    .object({
      era: z.string().optional(),
      yearAdvance: z.number().int().min(0).optional(),
    })
    .optional(),
  /**
   * Optional MARKET OPERATIONS (SIM1): a choice can take a position in a market
   * so the systemic tick actually moves money for the player (without this no
   * choice sets holding and all markets are inert). `set*` overwrites; `add*`
   * adjusts. e.g. "mortgage the Plaza" = { market:"nyc_housing", addHolding:
   * 500000, setLeverage: 4 }; "go long crypto" = { market:"crypto", addHolding:
   * 100000 }; "divest" = { setHolding: 0 }.
   */
  marketOps: z
    .array(
      z.object({
        market: z.string().min(1),
        setHolding: z.number().optional(),
        addHolding: z.number().optional(),
        setLeverage: z.number().min(0).optional(),
        addLeverage: z.number().optional(),
      }),
    )
    .optional(),
  /**
   * BEGET (FD-8): how many children this choice adds to the LIVE family tree, born
   * to the current protagonist in the choice's year. The seeded `beget` names each
   * by the founding culture's convention and gives inherited+varied traits. No-op
   * on a run without a founded family. Absent = 0.
   */
  begets: z.number().int().min(0).optional(),
  /**
   * TAKE PARTNER (CP-5): if true, the protagonist takes a partner (a married-in
   * in-law whose traits blend into subsequent begets). No-op without a founded
   * family or if a partner already exists. The Epoch-0 "find a partner" beat.
   */
  takesPartner: z.boolean().optional(),
});
export type Choice = z.infer<typeof ChoiceSchema>;

/** A pivotal life event. */
export const EventSchema = z.object({
  id: z.string().min(1),
  era: z.string().min(1),
  year: z.number().int(),
  title: z.string().min(1),
  scene: z.string().min(1),
  researchNote: z.string().min(1),
  extrapolated: z.boolean().default(false),
  startrekInspired: z.boolean().default(false),
  /**
   * HISTORICITY (FD-2, unified event pool): where this event sits on the real↔
   * fictional spectrum, so the compiler can weave a coherent timeline from one
   * pool. `real` = it actually happened (migrated world-timeline facts + real
   * life beats); `extrapolated` = plausible future-extrapolation (Mars, contact);
   * `personal` = the family's private/fictional life (births, estate, invented
   * beats). Defaults to "personal" for authored protagonist events; the
   * `extrapolated` boolean above stays as a back-compat alias and is reconciled
   * to historicity at parse time (extrapolated:true ⇒ historicity defaults
   * "extrapolated"). Real events are REACTABLE like any other (choices).
   */
  historicity: z.enum(["real", "extrapolated", "personal"]).optional(),
  /** The place this event belongs to (FD-2/FD-5 world stacks); absent = anywhere. */
  place: z.string().optional(),
  /**
   * The power ARCHETYPE(s) this event serves (CP-R-ARCH). The event pool includes
   * it only when the run's archetype is in this list. EMPTY/absent = archetype-
   * AGNOSTIC: the event fires for any founded line (the common case — most life,
   * world, and family beats are not power-base-specific). A casino deal is
   * `["economic"]`; a reality-TV beat `["entertainment"]`; a tower deal usable by
   * either is `["economic","entertainment"]` — tagged for each, no duplication.
   * Optional: absent = agnostic (same as empty), so code-built events + fixtures
   * need not specify it. Parsed authored content normalizes absent → [].
   */
  archetypes: z.array(z.string()).optional(),
  tags: z.array(z.string()).default([]),
  requires: RequiresSchema,
  weight: z.number().min(0).default(10),
  /**
   * Selection BIAS (AH9): affinities that scale this event's weight so the chaos
   * field pulls realistically toward the run's character. `branch` multiplies the
   * weight when the run's active branch matches (so a Reich event is likelier on
   * the Nazi line); `personality` multiplies per axis-comparator (so a grandiose
   * run surfaces grandiose events). Absent → no bias (multiplier 1).
   */
  bias: z
    .object({
      branch: z
        .partialRecord(
          z.enum(["default", "nazi", "westcoast", "theocracy", "media", "megachurch", "oligarchy"]),
          z.number(),
        )
        .default({}),
      personality: z.partialRecord(PersonalityAxisSchema, z.number()).default({}),
    })
    .optional(),
  /** If true the event can recur; otherwise it fires at most once per run. */
  repeatable: z.boolean().default(false),
  choices: z.array(ChoiceSchema).min(1, "an event needs at least one choice"),
});
export type GameEvent = z.infer<typeof EventSchema>;

/** Era metadata (data/eras/index.json entries). */
export const EraSchema = z.object({
  id: z.string().min(1),
  // Any integer: deep-history eras (FD-6) use NEGATIVE orders so they sort before
  // the modern `origins` era without renumbering the existing chain.
  order: z.number().int(),
  title: z.string().min(1),
  yearStart: z.number().int(),
  yearEnd: z.number().int(),
  extrapolated: z.boolean().default(false),
  startrekInspired: z.boolean().default(false),
  ambientTrack: z.string().min(1),
  paletteAccent: z.string().min(1),
  /** Era ends after this many events fire, or when an age/health gate trips. */
  eventBudget: z.number().int().positive().default(8),
  /**
   * Optional gate to ENTER this era. If present and unmet when the prior era
   * ends, the run terminates instead of advancing (e.g. Eras 11-12 require the
   * scientific path — without it the game ends on Mars). Comparators like
   * requires; flags/notFlags/meters/personality.
   */
  entryRequires: RequiresSchema.optional(),
});
export type Era = z.infer<typeof EraSchema>;

export const EraIndexSchema = z.object({
  eras: z.array(EraSchema).min(1),
});
export type EraIndex = z.infer<typeof EraIndexSchema>;

/**
 * One entry in a parallel WORLD TIMELINE (Manhattan / East Coast / USA / World).
 * A year-stamped real-then-extrapolated event in the wider world. It can OUTPUT
 * flags (setFlags) when its year arrives — feeding Donald's arc — and can be
 * GATED (requires) so its branch reflects how the world actually went.
 */
export const WorldEventSchema = z.object({
  id: z.string().min(1),
  year: z.number().int(),
  headline: z.string().min(1),
  body: z.string().min(1),
  tags: z.array(z.string()).default([]),
  extrapolated: z.boolean().default(false),
  /** Flags this world event broadcasts into the shared game state when it fires. */
  setFlags: z.array(z.string()).default([]),
  /** Optional gate (on the shared flag space) for branch selection. */
  requires: RequiresSchema.optional(),
});
export type WorldEvent = z.infer<typeof WorldEventSchema>;

/** A parallel world timeline file (data/timelines/<scope>.json). */
export const WorldTimelineSchema = z.object({
  scope: z.enum([
    // Geographic scopes
    "manhattan",
    "eastcoast",
    "westcoast",
    "usa",
    "world",
    // Thematic (longitudinal) axis-scopes — cut across all geography and
    // matter most for deep-future linking (science ladder, mores/ideology endings).
    "mores",
    "religion",
    "science",
    // Character-timeline scopes — a parallel PERSON's arc (Musk, Kennedy/RFK Jr)
    // whose events broadcast flags that thread through / overwrite the backdrops
    // (e.g. the role-flip) via the linking protocol.
    "musk",
    "kennedy",
  ]),
  label: z.string().min(1),
  /**
   * The alternate-history branch this timeline variant belongs to (AH3). A
   * "default" timeline (or one omitting this field) is our-history; a variant
   * keyed to a branch (e.g. usa.nazi.json → "nazi") is loaded ONLY when that
   * branch is active, and SUPPRESSES the default variant of the same scope.
   */
  branch: z
    .enum(["default", "nazi", "westcoast", "theocracy", "media", "megachurch", "oligarchy"])
    .optional(),
  events: z.array(WorldEventSchema).min(1),
});
export type WorldTimeline = z.infer<typeof WorldTimelineSchema>;

/** A single era's event pool file (data/eras/<id>.json). */
export const EraEventsSchema = z.object({
  era: z.string().min(1),
  events: z.array(EventSchema).min(1),
});
export type EraEvents = z.infer<typeof EraEventsSchema>;

/** Cross-era butterfly rule: a flag (or ripple channel) shaping future weighting. */
export const ButterflyRuleSchema = z.object({
  id: z.string().min(1),
  /** Flag or ripple channel that triggers this rule. */
  cause: z.string().min(1),
  /** Event id (or tag) whose weight/eligibility this rule changes. */
  affects: z.string().min(1),
  affectsKind: z.enum(["event", "tag"]).default("event"),
  /** Multiplier applied to the affected event weight when the cause is present. */
  weightMultiplier: z.number().min(0).default(1),
  /** Optional hard unlock/lock. */
  unlocks: z.boolean().optional(),
  locks: z.boolean().optional(),
  /** Human-readable template for the Butterfly Log, e.g. "Because you {cause}, {effect}". */
  chainTemplate: z.string().min(1),
});
export type ButterflyRule = z.infer<typeof ButterflyRuleSchema>;

/**
 * A delayed/compounding consequence: when `cause` (a flag or ripple channel)
 * becomes active, schedule an effect to land `delayYears` later (in-world). The
 * effect applies meter + personality deltas, can set flags, and is gated by an
 * optional `requires`. This is what turns isolated choices into causal chains
 * that pay off (or detonate) much later in the life.
 */
export const ConsequenceSchema = z.object({
  id: z.string().min(1),
  cause: z.string().min(1),
  /** In-world years between the cause firing and the effect landing. */
  delayYears: z.number().int().min(0).default(0),
  /** Only land if these conditions still hold when due. */
  requires: RequiresSchema.optional(),
  effects: MeterDeltaSchema.default({}),
  personality: PersonalityDeltaSchema.default({}),
  setFlags: z.array(z.string()).default([]),
  /** Shown in the Butterfly Log when the delayed consequence lands. */
  chainTemplate: z.string().min(1),
  /** If true, can fire more than once (each fresh cause occurrence). Default once. */
  repeatable: z.boolean().default(false),
});
export type Consequence = z.infer<typeof ConsequenceSchema>;

/**
 * A data-driven ending. The run ends with the highest-priority ending whose
 * `when` conditions are all satisfied. Conditions span meters, personality,
 * flags, and era — so endings are authored content, not hardcoded.
 */
export const EndingSchema = z.object({
  id: z.string().min(1),
  /** death | coup | victory | jail | bankruptcy | assassination | ... (free-form kind for art/copy). */
  kind: z.string().min(1),
  title: z.string().min(1),
  reason: z.string().min(1),
  /** Higher wins when multiple endings qualify simultaneously. */
  priority: z.number().int().default(0),
  /** Hidden from the endings tracker until discovered (the two secret endings). */
  secret: z.boolean().default(false),
  /** Tier for tracker grouping: how good/far-reaching this ending is. */
  tier: z
    .enum(["early-good", "early-bad", "endgame-good", "endgame-bad", "apex"])
    .default("endgame-bad"),
  when: z
    .object({
      flags: z.array(z.string()).default([]),
      notFlags: z.array(z.string()).default([]),
      meters: z.partialRecord(MeterIdSchema, MeterComparatorSchema).default({}),
      /** Comparators over personality axes, e.g. { grandiosity: ">=80" }. */
      personality: z.partialRecord(PersonalityAxisSchema, MeterComparatorSchema).default({}),
      /** Only eligible at/after this era order (0-based). */
      minEraOrder: z.number().int().optional(),
      maxEraOrder: z.number().int().optional(),
      /** Only eligible at/after this age. */
      minAge: z.number().int().optional(),
      /**
       * Require the run's resolved moral pole (DE-2). Branch-relative: a "utopian"
       * pole ending in the Nazi branch is the perfected-Reich horror, not a happy
       * end. Lets one archetypal ending fork into pole-specific variants.
       */
      pole: z.enum(["utopian", "centrist", "dictatorial"]).optional(),
    })
    .default({ flags: [], notFlags: [], meters: {}, personality: {} }),
});
export type Ending = z.infer<typeof EndingSchema>;

export const EndingsFileSchema = z.object({
  endings: z.array(EndingSchema).default([]),
});
export type EndingsFile = z.infer<typeof EndingsFileSchema>;

export const ButterflyRulesSchema = z.object({
  rules: z.array(ButterflyRuleSchema).default([]),
  consequences: z.array(ConsequenceSchema).default([]),
});
export type ButterflyRules = z.infer<typeof ButterflyRulesSchema>;

export const MetersFileSchema = z.object({
  meters: z.array(MeterDefSchema).length(METER_IDS.length),
});
export type MetersFile = z.infer<typeof MetersFileSchema>;

/** Asset manifest entry — every graphic/sound must declare a license. */
export const AssetSchema = z.object({
  id: z.string().min(1),
  path: z.string().min(1),
  kind: z.enum(["icon", "portrait", "background", "texture", "audio", "sprite", "font"]),
  source: z.string().min(1),
  license: z.enum(["CC0", "CC-BY", "CC-BY-SA", "PD", "OFL", "MIT"]),
  attribution: z.string().default(""),
});
export type Asset = z.infer<typeof AssetSchema>;

export const AssetsFileSchema = z.object({
  assets: z.array(AssetSchema).default([]),
});
export type AssetsFile = z.infer<typeof AssetsFileSchema>;

/**
 * Branch-aware TERMS (alt-history consistency). Each term maps a `default`
 * value plus optional per-branch overrides keyed by BranchKey. Content
 * interpolates `{term}` tokens (e.g. "the {head_of_state} addressed the nation")
 * which resolve from the run's active branch — so "President" becomes
 * "Reichskommissar" on the Nazi route, "Supreme Pastor" under theocracy, etc.
 */
export const TermSchema = z.object({
  default: z.string().min(1),
  nazi: z.string().min(1).optional(),
  westcoast: z.string().min(1).optional(),
  theocracy: z.string().min(1).optional(),
  media: z.string().min(1).optional(),
  megachurch: z.string().min(1).optional(),
  oligarchy: z.string().min(1).optional(),
});
export type Term = z.infer<typeof TermSchema>;

export const TermsFileSchema = z.object({
  terms: z.record(z.string(), TermSchema).default({}),
});
export type TermsFile = z.infer<typeof TermsFileSchema>;

/**
 * SLOT EVENTS (alt-history consistency, AH7). Certain real events are so
 * structurally critical they're abstract SLOTS resolved per timeline, not
 * hardcoded. e.g. the slot "leader_assassination" resolves to Fred Trump's
 * assassination on the political-dynasty path, a Commissar purge on the Nazi
 * path, etc. A slot names a concrete event `id` per branch (and an optional
 * `dynasty` key, since the gears — trump/musk/kennedy — can fill the same
 * archetype differently). `default` is the our-history resolution.
 */
export const SlotResolutionSchema = z.object({
  /** Concrete event id this slot fires for the matching branch/dynasty. */
  event: z.string().min(1),
  /** Short note on what this resolution represents (authoring provenance). */
  note: z.string().default(""),
});
export type SlotResolution = z.infer<typeof SlotResolutionSchema>;

export const SlotSchema = z.object({
  /** Archetype id, e.g. "leader_assassination", "the_crash", "the_scandal". */
  id: z.string().min(1),
  /** Human-readable archetype description. */
  label: z.string().min(1),
  /** Our-history resolution (required fallback). */
  default: SlotResolutionSchema,
  /** Per-branch resolutions; a missing branch falls back to `default`. */
  nazi: SlotResolutionSchema.optional(),
  westcoast: SlotResolutionSchema.optional(),
  theocracy: SlotResolutionSchema.optional(),
  media: SlotResolutionSchema.optional(),
  megachurch: SlotResolutionSchema.optional(),
  oligarchy: SlotResolutionSchema.optional(),
  /** Per-dynasty resolutions (trump | musk | kennedy), checked before branch. */
  dynasty: z.record(z.string(), SlotResolutionSchema).default({}),
});
export type Slot = z.infer<typeof SlotSchema>;

export const SlotsFileSchema = z.object({
  slots: z.array(SlotSchema).default([]),
});
export type SlotsFile = z.infer<typeof SlotsFileSchema>;

/* ------------------------------------------------------------------------- *
 * SYSTEMIC SIMULATION LAYER (SIM1) — markets, currencies, rank ladders.
 * Living subsystems that pull the six meters between choices via a pure
 * per-year tick. All data-driven + branch-aware; see the design spec
 * docs/superpowers/specs/2026-06-20-systemic-sim-layer.md.
 * ------------------------------------------------------------------------- */

/** How a market move transmits into the six meters (most couplings are 0). */
export const MeterCouplingSchema = z.partialRecord(MeterIdSchema, z.number()).default({});

/** A market regime (boom/bust/bubble/…) with its dynamics. */
export const MarketRegimeSchema = z.object({
  id: z.string().min(1),
  /** Mean the index is pulled toward in this regime. */
  baseline: z.number().default(100),
  /** Per-step proportional drift (e.g. +0.04 boom, -0.05 bust). */
  drift: z.number().default(0),
  /** Per-step proportional shock magnitude (volatility). */
  volatility: z.number().min(0).default(0.05),
  /** Authored base dwell time (steps) before the regime is "due" to flip. */
  dwell: z.number().int().min(1).default(6),
  /** Per-step switch probabilities to other regimes by id (0..1). */
  switchTo: z.record(z.string(), z.number()).default({}),
});
export type MarketRegime = z.infer<typeof MarketRegimeSchema>;

/** Extra fields a housing market carries (region + cashflow dynamics). */
export const HousingExtraSchema = z.object({
  region: z.string().min(1),
  /** Steady cashflow per step as a fraction of holding value. */
  rentYield: z.number().default(0),
  /** 0..1 vacancy that suppresses rent yield (rises in busts). */
  vacancy: z.number().min(0).max(1).default(0),
  /** Per-step money drain from leverage (the bust killer). */
  debtService: z.number().min(0).default(0),
});
export type HousingExtra = z.infer<typeof HousingExtraSchema>;

export const MarketSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  kind: z.enum(["financial", "housing", "attention", "crypto", "state", "resource"]),
  /** Starting index value. */
  baseIndex: z.number().default(100),
  /** Mean-reversion strength toward the regime baseline (0..1). */
  meanReversionK: z.number().min(0).max(1).default(0.1),
  /** Drawdown ratio (index/peak) below which a crash flag fires. */
  crashThreshold: z.number().min(0).max(1).default(0.6),
  /** Regimes this market can occupy; first is the starting regime. */
  regimes: z.array(MarketRegimeSchema).min(1),
  /** How this market's move maps onto the meters. */
  coupling: MeterCouplingSchema,
  /** Housing-only extra fields. */
  housing: HousingExtraSchema.optional(),
});
export type Market = z.infer<typeof MarketSchema>;

export const MarketsFileSchema = z.object({
  markets: z.array(MarketSchema).default([]),
});
export type MarketsFile = z.infer<typeof MarketsFileSchema>;

/** A currency: how `money` is named/scaled, resolved by location/branch/era. */
export const CurrencySchema = z.object({
  id: z.string().min(1),
  symbol: z.string().min(1),
  name: z.string().min(1),
  /** Year window this currency is valid within its lane (inclusive). */
  fromYear: z.number().int().optional(),
  toYear: z.number().int().optional(),
  /** Branch this currency belongs to (default = our timeline). */
  branch: z
    .enum(["default", "nazi", "westcoast", "theocracy", "media", "megachurch", "oligarchy"])
    .optional(),
  /** Location flag that forces this currency when set (e.g. "on_mars"). */
  location: z.string().optional(),
  /** Multiplier applied to `money` when redenominating FROM the prior currency. */
  conversionFactor: z.number().positive().default(1),
});
export type Currency = z.infer<typeof CurrencySchema>;

export const CurrenciesFileSchema = z.object({
  currencies: z.array(CurrencySchema).default([]),
});
export type CurrenciesFile = z.infer<typeof CurrenciesFileSchema>;

/** A rank ladder (social/commercial/religious/political) the player climbs. */
export const RankLadderSchema = z.object({
  id: z.enum(["social", "commercial", "religious", "political"]),
  label: z.string().min(1),
  /** Rung labels low→high; index is the rank. Political reuses {head_of_state}. */
  rungs: z.array(z.string().min(1)).min(2),
  /** Passive per-step meter drip at any rank (e.g. high social → reputation). */
  drip: MeterCouplingSchema,
  /** Multiplier this ladder applies to matching meter GAINS (e.g. political→power). */
  amplify: MeterCouplingSchema,
  /** Meter bleed per step while below the run's peak rank (fall-from-grace). */
  fallBleed: MeterCouplingSchema,
});
export type RankLadder = z.infer<typeof RankLadderSchema>;

export const RanksFileSchema = z.object({
  ranks: z.array(RankLadderSchema).default([]),
});
export type RanksFile = z.infer<typeof RanksFileSchema>;

/**
 * FAMILY-TREE MODEL (composite-dynasties unit). One tree per playable dynasty,
 * a genealogical DAG that DRIVES content (birth-order, heir/name/slot resolution,
 * the in-game lineage view) rather than just displaying it. See the design spec
 * docs/superpowers/specs/2026-06-20-four-composite-dynasties.md.
 */
export const FamilyMemberRoleSchema = z.enum([
  "progenitor", // the earliest authored ancestor (e.g. Friedrich Drumpf, Patrick Kennedy)
  "founder-patriarch", // the house's defining founder (exactly one per tree)
  "heir-successor", // the groomed/actual heir of the next generation
  "rival-sibling", // a sibling who competes for / forfeits the inheritance
  "in-law-line", // a married-in line that adds lineage (e.g. the Bell missionaries)
  "next-gen", // the continuing generation beyond the protagonist
  "member", // any other tree member
]);
export type FamilyMemberRole = z.infer<typeof FamilyMemberRoleSchema>;

export const FamilyMemberSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  born: z.number().int(),
  died: z.number().int().optional(),
  role: FamilyMemberRoleSchema,
  /** Spouse member id (if the spouse is itself a tree member / in-law line). */
  spouse: z.string().optional(),
  /** Child member ids (the DAG edges). Every id must resolve to a member. */
  children: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  /** Which governance branch this member's influence pulls the run toward. */
  poleTilt: z.string().optional(),
});
export type FamilyMember = z.infer<typeof FamilyMemberSchema>;

export const FamilyTreeSchema = z.object({
  /** The playable dynasty this tree backs (matches DynastyKey). */
  dynasty: z.string().min(1),
  /** The power archetype the tree backs (CP-R-ARCH: 6 power bases). */
  archetype: z.enum([
    "economic",
    "political",
    "technological",
    "religious",
    "entertainment",
    "athletic",
  ]),
  /** The primary real-family spine label (trump | kennedy | musk | graham). */
  spine: z.string().min(1),
  members: z.array(FamilyMemberSchema).min(1),
});
export type FamilyTree = z.infer<typeof FamilyTreeSchema>;

export const FamilyTreesFileSchema = z.object({
  trees: z.array(FamilyTreeSchema).default([]),
});
export type FamilyTreesFile = z.infer<typeof FamilyTreesFileSchema>;

/**
 * DYNASTIC TROPE CATALOG (FD-3). The literal authored lines (Trump/Kennedy/
 * Musk/Graham) are being refactored into reusable archetypal PATTERNS — tropes —
 * that ANY founded family can embody. An event carries `trope:<id>` tags drawn
 * from this catalog so the compiler can compose a bespoke line from
 * trope-templates × world-stacks × eras × seeded RNG, and so a founded dynasty
 * is never locked to one real family's content (eliminates the no-leak hazard at
 * the root). `kind` groups tropes by lifecycle moment: rise | succession |
 * decline | schism | alliance | governance | ideological. See design spec
 * docs/superpowers/specs/2026-06-20-found-your-own-dynasty.md §1c.
 */
export const TropeKindSchema = z.enum([
  "rise",
  "succession",
  "decline",
  "schism",
  "alliance",
  "governance",
  "ideological",
]);
export type TropeKind = z.infer<typeof TropeKindSchema>;

export const TropeSchema = z.object({
  /** Stable id used in `trope:<id>` event tags (kebab-case). */
  id: z.string().min(1),
  /** Human-readable catalog name. */
  label: z.string().min(1),
  /** The lifecycle moment / structural role this trope plays. */
  kind: TropeKindSchema,
  /** One-line description (the game-bible voice; also fed to the Gemini retagger). */
  summary: z.string().min(1),
});
export type Trope = z.infer<typeof TropeSchema>;

export const TropesFileSchema = z.object({
  // Empty is allowed at the file-schema level so legacy fixtures / callers that
  // omit the catalog still load; the cross-ref gate in buildContent only enforces
  // `trope:` tags when a non-empty catalog is supplied.
  tropes: z.array(TropeSchema).default([]),
});
export type TropesFile = z.infer<typeof TropesFileSchema>;

/* ------------------------------------------------------------------------- *
 * CALLINGS (CP-2) — a founding CALLING is a durable generational LENS layered on
 * the archetype. It biases the family's inherited traits over generations
 * (traitDrift applied each beget) AND weights which tropes' events surface
 * (tropeWeights multiply effectiveWeight for matching trope-tagged events). A
 * line of Scholars drifts cunning/piety up and surfaces prophet/centrist-to-zealot
 * beats; a line of Soldiers drifts vigor up and surfaces conqueror/martyr beats.
 * Pure data; the resolver lives in sim/callings.ts. See design spec §CP-2.
 * ------------------------------------------------------------------------- */
export const CallingTrait = z.enum(["ambition", "cunning", "vigor", "piety"]);
export type CallingTraitKey = z.infer<typeof CallingTrait>;

export const CallingSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  /** One-line description of the calling's character. */
  summary: z.string().min(1),
  /** Per-beget drift added to a child's inherited traits (small, e.g. +3). */
  traitDrift: z.partialRecord(CallingTrait, z.number()).default({}),
  /** Multiplier on the selection weight of events carrying each trope id. */
  tropeWeights: z.record(z.string(), z.number()).default({}),
});
export type Calling = z.infer<typeof CallingSchema>;

export const CallingsFileSchema = z.object({
  callings: z.array(CallingSchema).default([]),
});
export type CallingsFile = z.infer<typeof CallingsFileSchema>;

/* ------------------------------------------------------------------------- *
 * PROCEDURAL EVENT TEMPLATES (FD-4) — the §1d procedural pool. An authored
 * EventTemplate is a SKELETON event whose text carries `{slot}` tokens and whose
 * numeric effects are authored RANGES; the pure seeded expander (src/sim/procgen)
 * resolves the slots from the run context and draws the deltas via the run Rng,
 * yielding a concrete, validated GameEvent. Lets a small authored base materialize
 * a vast, deterministic, combinatorial pool. See design spec §1d / §1d.1.
 * ------------------------------------------------------------------------- */

/** The slot kinds a template token can request, resolved from the run context. */
export const TemplateSlotSchema = z.enum([
  "member", // the active protagonist / a living family member name
  "rival", // a rival sibling / outside claimant name
  "place", // the run's current place label
  "year", // the resolved in-world year (as text)
  "peril", // a period+place-appropriate hazard drawn from the world-stack
  "trope", // a trope label this template embodies
  "surname", // the founded dynasty's surname
]);
export type TemplateSlot = z.infer<typeof TemplateSlotSchema>;

/** An authored numeric range; the expander draws an integer in [min,max] via Rng. */
export const RangeSchema = z
  .object({ min: z.number(), max: z.number() })
  .refine((r) => r.max >= r.min, "range max must be >= min");
export type Range = z.infer<typeof RangeSchema>;

/** A templated choice: text with `{slot}` tokens + ranged meter/personality deltas. */
export const TemplateChoiceSchema = z.object({
  id: z.string().min(1),
  /** Choice label; may contain `{slot}` tokens. */
  text: z.string().min(1),
  /** Outcome prose; may contain `{slot}` tokens. */
  outcome: z.string().min(1),
  /** Per-meter authored ranges; the expander draws each delta via the run Rng. */
  effects: z.partialRecord(MeterIdSchema, RangeSchema).default({}),
  /** Per-axis authored ranges. */
  personality: z.partialRecord(PersonalityAxisSchema, RangeSchema).default({}),
  setFlags: z.array(z.string()).default([]),
});
export type TemplateChoice = z.infer<typeof TemplateChoiceSchema>;

export const EventTemplateSchema = z.object({
  /** Template id; the generated event id is derived from this + the seed slice. */
  id: z.string().min(1),
  /** Which era's pool this template feeds (matches an era id). */
  era: z.string().min(1),
  /** Title prose with `{slot}` tokens. */
  title: z.string().min(1),
  /** Scene prose with `{slot}` tokens. */
  scene: z.string().min(1),
  /** The slot kinds this template uses (declared so expansion can validate). */
  slots: z.array(TemplateSlotSchema).default([]),
  /** Trope ids this template embodies (become trope:<id> tags on the output). */
  tropes: z.array(z.string()).default([]),
  /** Non-trope tags copied onto the generated event. */
  tags: z.array(z.string()).default([]),
  /** Base selection weight of the generated event. */
  weight: z.number().min(0).default(6),
  choices: z.array(TemplateChoiceSchema).min(1, "a template needs at least one choice"),
});
export type EventTemplate = z.infer<typeof EventTemplateSchema>;

export const EventTemplatesFileSchema = z.object({
  templates: z.array(EventTemplateSchema).default([]),
});
export type EventTemplatesFile = z.infer<typeof EventTemplatesFileSchema>;

/* ------------------------------------------------------------------------- *
 * ONOMASTICS (FD-5) — per-culture given-name pools + naming conventions, so a
 * founded dynasty's generated given names are period- and culture-accurate and
 * children are named by the culture's rule (eldest son ← paternal grandfather,
 * etc.). Generalizes the single-protagonist branch naming (sim/terms.ts AH8c/d)
 * to the found-your-own-dynasty model. Pure data; the resolver lives in
 * sim/onomastics.ts. See design spec §4.
 * ------------------------------------------------------------------------- */

/** Which relative an ordinal child is named after, per the culture's convention. */
export const NamingSourceSchema = z.enum([
  "paternalGrandfather",
  "paternalGrandmother",
  "maternalGrandfather",
  "maternalGrandmother",
  "father",
  "mother",
]);
export type NamingSource = z.infer<typeof NamingSourceSchema>;

export const NamingRulesSchema = z.object({
  eldestSon: NamingSourceSchema.optional(),
  eldestDaughter: NamingSourceSchema.optional(),
  secondSon: NamingSourceSchema.optional(),
  secondDaughter: NamingSourceSchema.optional(),
});
export type NamingRules = z.infer<typeof NamingRulesSchema>;

export const CultureSchema = z.object({
  label: z.string().min(1),
  givenMale: z.array(z.string().min(1)).min(1),
  givenFemale: z.array(z.string().min(1)).min(1),
  /** The culture's naming style (used for suffixing — e.g. junior/regnal). */
  convention: z.string().min(1),
  namingRules: NamingRulesSchema.default({}),
});
export type Culture = z.infer<typeof CultureSchema>;

export const OnomasticsFileSchema = z.object({
  cultures: z.record(z.string(), CultureSchema).default({}),
});
export type OnomasticsFile = z.infer<typeof OnomasticsFileSchema>;

/* ------------------------------------------------------------------------- *
 * START-MOMENTS (FD-6) — the "found your own dynasty" Stage-0. A start-moment is
 * a historical hinge the player founds a line at: it fixes WHEN (year) + WHERE
 * (place) + the cultural lane (culture → onomastics) + the archetype affinity,
 * seeds the progenitor, and carries the founding scene + its first reactable
 * choice. The player supplies only the SURNAME; everything else is real history.
 * The 4 preset spines become one-tap shortcuts over these. See design spec §2.
 * ------------------------------------------------------------------------- */
export const StartMomentSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  /** The founding year. */
  year: z.number().int(),
  /** Place label the line is founded in (FD-7 world-stacks will key off this). */
  place: z.string().min(1),
  /** Culture id — must resolve in onomastics.json (given-name lane + conventions). */
  culture: z.string().min(1),
  /** Which power archetype this moment leans toward. */
  archetype: z.enum(["economic", "political", "technological", "religious"]),
  /** Sex of the seeded progenitor (drives the onomastic given-name pool). */
  progenitorSex: z.enum(["male", "female"]).default("male"),
  /** Era id the founded run begins in (matches eras/index.json). */
  startEra: z.string().min(1),
  /** Deep-history exemplars start centuries back; flags UI + reach handling. */
  deepHistory: z.boolean().default(false),
  /** The founding scene prose (may carry `{slot}`/`{term}` tokens). */
  scene: z.string().min(1),
  /** One-line historical justification. */
  researchNote: z.string().min(1),
  /** The first reactable choice at founding (the line's first decision). */
  choices: z.array(ChoiceSchema).min(1, "a start-moment needs at least one founding choice"),
});
export type StartMoment = z.infer<typeof StartMomentSchema>;

export const StartMomentsFileSchema = z.object({
  moments: z.array(StartMomentSchema).default([]),
});
export type StartMomentsFile = z.infer<typeof StartMomentsFileSchema>;

/* ------------------------------------------------------------------------- *
 * WORLD STACKS (FD-7) — per-PLACE standing context (geography / politics /
 * religion / ideology) the family experiences AT a place and time. Unlike the
 * dated world-timeline events (which fire once), a world-stack is the ambient
 * STATE of a place across an era window: its governing order, dominant faith,
 * class structure, terrain/economy, and the period+place-accurate PERILS that
 * feed the procedural expander's context. A migration = changing the run's
 * `place` flag, which swaps which stack applies. See design spec §3.
 * ------------------------------------------------------------------------- */
export const WorldStackSchema = z.object({
  /** Place id (matches start-moment.place + the `place:<id>` flag). */
  place: z.string().min(1),
  /** Era id window this stack describes; absent = applies across all eras. */
  era: z.string().optional(),
  /** Human label, e.g. "Ireland under the Union". */
  label: z.string().min(1),
  /** GEOGRAPHY: terrain, ports, migration routes, economy base. */
  geography: z.string().min(1),
  /** POLITICS: governing order, franchise, machine/patronage. */
  politics: z.string().min(1),
  /** RELIGION: dominant faith(s), tolerance, revival pressure. */
  religion: z.string().min(1),
  /** IDEOLOGY: class structure, mores, mobility, prejudice axes. */
  ideology: z.string().min(1),
  /** Period+place-accurate hazards the procgen expander draws {peril} from. */
  perils: z.array(z.string().min(1)).min(1),
  /** A display place name for {place} substitution (e.g. "Ireland", "Baghdad"). */
  placeLabel: z.string().min(1),
  /**
   * AXIS INTENSITY (CP-4): how CHARGED each thematic axis is at this place×era,
   * 0..1. Scales the impact of the founder's Epoch-0 axis choices — adopting or
   * rejecting a faith lands hard where faith intensity is high (762 Baghdad, 1847
   * Catholic Ireland) and lightly on a secular frontier. Absent axes default 0.5.
   */
  axisIntensity: z
    .object({
      faith: z.number().min(0).max(1).optional(),
      ideology: z.number().min(0).max(1).optional(),
      sociology: z.number().min(0).max(1).optional(),
      tech: z.number().min(0).max(1).optional(),
    })
    .default({}),
});
export type WorldStack = z.infer<typeof WorldStackSchema>;

export const WorldStacksFileSchema = z.object({
  stacks: z.array(WorldStackSchema).default([]),
});
export type WorldStacksFile = z.infer<typeof WorldStacksFileSchema>;

/* ------------------------------------------------------------------------- *
 * EPOCH-0 AXIS CHOICES (CP-4). At founding, the player sets the line's stance on
 * each thematic axis — FAITH (adopt/reject/convert), IDEOLOGY, SOCIOLOGY, TECH —
 * and the consequence is PLACE-AND-TIME-SCALED: each option's meter/personality
 * impact is multiplied by the founding place×era stack's intensity on that axis,
 * so rejecting the Church in 1847 Catholic Ireland lands far harder than on a
 * secular frontier. Each option also sets durable flags that ripple for
 * generations. Pure data; the resolver lives in sim/axes.ts.
 * ------------------------------------------------------------------------- */
export const AxisKindSchema = z.enum(["faith", "ideology", "sociology", "tech"]);
export type AxisKind = z.infer<typeof AxisKindSchema>;

export const AxisOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  /** Prose shown for this stance (may carry `{slot}`/`{term}` tokens). */
  blurb: z.string().min(1),
  /** Durable flags this stance sets (ripple through the run). */
  setFlags: z.array(z.string()).default([]),
  /** Base meter deltas, SCALED by the place×era axis intensity at resolve time. */
  effects: MeterDeltaSchema.default({}),
  /** Base personality deltas, likewise intensity-scaled. */
  personality: PersonalityDeltaSchema.default({}),
});
export type AxisOption = z.infer<typeof AxisOptionSchema>;

export const AxisSchema = z.object({
  axis: AxisKindSchema,
  label: z.string().min(1),
  /** The question posed at founding, e.g. "What of the faith?" */
  prompt: z.string().min(1),
  options: z.array(AxisOptionSchema).min(2),
});
export type Axis = z.infer<typeof AxisSchema>;

export const AxesFileSchema = z.object({
  axes: z.array(AxisSchema).default([]),
});
export type AxesFile = z.infer<typeof AxesFileSchema>;

/** Validate arbitrary JSON against a schema, throwing a readable error on failure. */
export function parseContent<T>(schema: z.ZodType<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  • ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid content for "${label}":\n${issues}`);
  }
  return result.data;
}
