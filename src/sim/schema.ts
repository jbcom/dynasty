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
  order: z.number().int().nonnegative(),
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
  /** The power archetype (economic | political | technological | religious). */
  archetype: z.enum(["economic", "political", "technological", "religious"]),
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
