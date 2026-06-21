import { z } from "zod";
import seedWordsData from "../data/seed-words.json";

/**
 * DIEGETIC SEED COMPOSER (PL-3). The run seed is not typed by the player — it is
 * COMPOSED from three pre-place "consciousness" choices, one word from each lane
 * (first quality → second nature → first image). The joined phrase IS the seed and is
 * never shown. Each word carries a fragment of evocative, place-agnostic prose so the
 * player authors the seed by feeling, not by picking from a word list. Pure: the same
 * three picks always compose the same seed, so the downstream deterministic deal +
 * replay are unchanged.
 */

const WordSchema = z.object({
  word: z
    .string()
    .min(1)
    .regex(/^[a-z]+$/, "seed words are lowercase a-z so the composed seed is a clean slug"),
  fragment: z.string().min(1),
});

const LaneSchema = z.object({
  prompt: z.string().min(1),
  words: z.array(WordSchema).min(2),
});

const SeedWordsSchema = z.object({
  lanes: z.object({
    first: LaneSchema,
    second: LaneSchema,
    third: LaneSchema,
  }),
});

export type SeedWord = z.infer<typeof WordSchema>;
export type SeedLane = z.infer<typeof LaneSchema>;
export type SeedLaneKey = "first" | "second" | "third";

/** The validated word pools, parsed once at module load (fails loud on a bad pool). */
const POOLS = SeedWordsSchema.parse(seedWordsData).lanes;

/** The lane order the consciousness phase presents (adjective → adjective → noun). */
export const SEED_LANES: readonly SeedLaneKey[] = ["first", "second", "third"];

/** The lane (prompt + word choices) for one step of the consciousness phase. */
export function seedLane(key: SeedLaneKey): SeedLane {
  return POOLS[key];
}

/**
 * Compose the run seed from the three chosen words (in lane order). The result is a
 * lowercase, hyphen-joined slug — a stable, opaque seed the player never sees. Throws
 * if the wrong number of words is supplied (a programming error, not user input).
 */
export function composeSeed(words: readonly string[]): string {
  if (words.length !== SEED_LANES.length) {
    throw new Error(`composeSeed expects ${SEED_LANES.length} words, got ${words.length}`);
  }
  return words.join("-");
}

/** The total number of distinct authorable seeds (the size of the seed space). */
export function seedSpaceSize(): number {
  return SEED_LANES.reduce((n, k) => n * POOLS[k].words.length, 1);
}
