/**
 * NARRATIVE ACTS SCHEMA (Narrative Acts model) — the NOVEL data model that replaces the flat
 * event-fragment content for played story. Grounded in Suzerain (multi-paragraph sensory scenes
 * that frame a choice) + ink (knots=scenes, weave=beats that mostly gather/some divert, threads=
 * cross-family intersections, state-conditional prose). Pure zod + TS types; validated on load.
 */

import { z } from "zod";

/** The sensory frame of a scene — the lens its prose builds the moment through. */
export const SenseSchema = z.enum(["sound", "sight", "touch", "taste", "smell"]);
export type Sense = z.infer<typeof SenseSchema>;

/** A motivator delta a choice applies (the 8 axes; partial). Kept loose here; validated vs MOTIVATOR_AXES on load. */
export const MotivatorShiftSchema = z.record(z.string(), z.number());

/**
 * A BEAT inside a scene — one node of an ink-style WEAVE. Most beats' choices GATHER (rejoin the
 * scene's main fall-forward flow — flavor + a motivator nudge); a few DIVERT to another scene.
 */
export const BeatSchema = z.object({
  prose: z.array(z.string().min(1)).min(1),
  choice: z
    .object({
      text: z.string().min(1),
      motivatorShift: MotivatorShiftSchema.default({}),
      setFlags: z.array(z.string()).default([]),
      /** rejoin the main flow (flavor) — the common case. */
      gather: z.boolean().default(true),
      /** OR fork to another scene (a genuine branch). */
      divertTo: z.string().optional(),
    })
    .optional(),
});
export type Beat = z.infer<typeof BeatSchema>;

/** The terminal DECISION of a scene — tiered (a fate-fork vs a lighter secondary choice). */
export const DecisionSchema = z.object({
  tier: z.enum(["major", "secondary"]).default("secondary"),
  prompt: z.string().min(1),
  options: z
    .array(
      z.object({
        text: z.string().min(1),
        motivatorShift: MotivatorShiftSchema.default({}),
        setFlags: z.array(z.string()).default([]),
        divertTo: z.string().optional(),
      }),
    )
    .min(2),
});
export type Decision = z.infer<typeof DecisionSchema>;

/** A cross-family INTERSECTION (ink thread): braid another wave's line into this scene when paths cross. */
export const ThreadRefSchema = z.object({
  wave: z.string().min(1),
  atTier: z.number().int().min(0).max(5),
});
export type ThreadRef = z.infer<typeof ThreadRefSchema>;

/** A SCENE (≈ ink knot): multi-paragraph sensory prose, an optional weave of beats, an optional decision. */
export const SceneSchema = z.object({
  id: z.string().min(1),
  sense: SenseSchema,
  /** MULTI-PARAGRAPH novel prose. Tokens {surname}/{given_name}/{full_name}/{family_name} resolve. */
  prose: z.array(z.string().min(1)).min(1),
  beats: z.array(BeatSchema).default([]),
  decision: DecisionSchema.optional(),
  thread: z.array(ThreadRefSchema).default([]),
  requires: z
    .object({
      flags: z.array(z.string()).default([]),
      notFlags: z.array(z.string()).default([]),
    })
    .default({ flags: [], notFlags: [] }),
  /** Default fall-through when no beat/decision diverts. */
  next: z.string().optional(),
});
export type Scene = z.infer<typeof SceneSchema>;

/** An ACT CHAPTER — one generation's life, a titled sequence of scenes, within a macro-act. */
export const ActChapterSchema = z.object({
  id: z.string().min(1),
  wave: z.string().min(1),
  archetype: z.string().min(1),
  tier: z.number().int().min(0).max(5),
  macroAct: z.enum(["convergence", "emergence", "ascension"]),
  title: z.string().min(1),
  scenes: z.array(z.string().min(1)).min(1),
});
export type ActChapter = z.infer<typeof ActChapterSchema>;

/** Optional CODEX lore (Suzerain briefs) — never required to read. */
export const CodexEntrySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
});
export type CodexEntry = z.infer<typeof CodexEntrySchema>;

/** A per-wave act file: the act chapters + the scenes they reference. */
export const SagaFileSchema = z.object({
  acts: z.array(ActChapterSchema).default([]),
  scenes: z.array(SceneSchema).default([]),
});
export type SagaFile = z.infer<typeof SagaFileSchema>;
