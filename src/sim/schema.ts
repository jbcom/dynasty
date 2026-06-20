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
  tags: z.array(z.string()).default([]),
  portrait: z.string().min(1),
  requires: RequiresSchema,
  weight: z.number().min(0).default(10),
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
    // Character-timeline scope — a parallel PERSON's arc (Elon Musk) whose
    // events broadcast flags that can flip Donald between the political-king and
    // commercial-tycoon roles via the linking protocol.
    "musk",
  ]),
  label: z.string().min(1),
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
  kind: z.enum(["icon", "portrait", "background", "texture", "audio", "sprite"]),
  source: z.string().min(1),
  license: z.enum(["CC0", "CC-BY", "CC-BY-SA", "PD", "OFL", "MIT"]),
  attribution: z.string().default(""),
});
export type Asset = z.infer<typeof AssetSchema>;

export const AssetsFileSchema = z.object({
  assets: z.array(AssetSchema).default([]),
});
export type AssetsFile = z.infer<typeof AssetsFileSchema>;

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
