/**
 * GA-NEWS (GN-1) — GenAI period "Dispatches" for the NewsTicker. A pure prompt builder + a deterministic key
 * for era-voiced world headlines that react to the run's situation. Like the dossier briefs + scene corpus,
 * the headlines are GENERATED OFFLINE and cached as a JSON map, loaded at runtime — no API at sim runtime
 * (sim purity). Layered ALONGSIDE the authored timeline news (newsForYear), not replacing it.
 *
 * Pure + deterministic: no DOM, no Date, no Math.random. The same (eraBand, mood) → the same key → the same
 * cached dispatch set.
 */

import type { EraBand } from "../genai/portrait";

/** A coarse "state of the line" mood the dispatch reacts to — keeps the key space tiny (era × 3 moods). */
export type NewsMood = "rising" | "steady" | "falling";

/** The era register a dispatch is written in (period-true headlines). */
const ERA_REGISTER: Record<EraBand, string> = {
  founding_1700s: "the late-1700s American founding — broadsheets and pamphlets",
  federal_1800s: "the early-19th-century republic — penny presses and gazettes",
  industrial_late1800s: "the Gilded Age — the great metropolitan dailies",
  early_1900s: "the early 20th century — wire services and tabloids",
  midcentury: "the mid-20th century — radio bulletins and broadsheet front pages",
  digital_modern: "the digital present — feeds, chyrons, push alerts",
  near_future: "the near future — networked dispatches and ambient briefings",
  stellar: "the post-scarcity star age — system-wide relays across the colonized stars",
};

/** How the mood colors the dispatches (what the world is saying about a line on this trajectory). */
const MOOD_LENS: Record<NewsMood, string> = {
  rising: "a name on the way up — notice, envy, the first whispers of a power to reckon with",
  steady: "a line holding its place — the ordinary churn of the age around it",
  falling: "a name slipping — rivals circling, the press scenting weakness",
};

/** The deterministic key for a GenAI dispatch set — keyed era × mood (run-independent; offline-cached). */
export function newsDispatchKey(eraBand: EraBand, mood: NewsMood): string {
  return `news:${eraBand}:${mood}`;
}

/** The system instruction for the dispatch generator — terse period headlines, leak-safe. */
export function newsDispatchSystem(): string {
  return [
    "You write SHORT period news HEADLINES for a dynasty life-sim — the wider world reacting to a family line.",
    "Output EXACTLY 3 headlines, ONE PER LINE — no numbering, no bullets, no body text, no markdown, no JSON,",
    "no array brackets or quotes. Just the three headline lines, nothing else.",
    "RULES: never a real person's name; refer to the line only as {family_name}. Period-true to the era's press.",
    "Each headline is a single punchy line (a newspaper banner / a chyron), not a sentence of prose.",
  ].join("\n");
}

/**
 * Build the dispatch prompt (GN-1): the era's press register + the mood lens. Pure. The run's exact numbers
 * live in the dossier/HUD; these dispatches are the period FLAVOR of the world reacting to the line.
 */
export function buildNewsDispatchPrompt(eraBand: EraBand, mood: NewsMood): string {
  return [
    `Write 3 period news headlines for ${ERA_REGISTER[eraBand]}.`,
    `The mood toward the {family_name} line: ${MOOD_LENS[mood]}.`,
    "Each a single banner line, period-true, referring to the line only as {family_name}. Headlines only.",
  ].join(" ");
}

/** Map a coarse standing signal (the line's rung trend) to a dispatch mood. Pure. */
export function moodForTrend(trend: "rising" | "steady" | "falling"): NewsMood {
  return trend;
}

/**
 * Derive the dispatch mood from the run's rank ladders (GA-NEWS): the press reacts to the line's trajectory.
 * Below its peak on any ladder → "falling" (fallen from grace); climbing (top rung ≥ 2, at peak) → "rising";
 * else "steady". Pure — reads the highest current rung + whether it has slipped from its peak.
 */
export function moodForRanks(ranks: Record<string, { rung: number; peak: number }>): NewsMood {
  let topRung = 0;
  let topPeak = 0;
  let belowPeak = false;
  for (const r of Object.values(ranks)) {
    if (r.rung > topRung) topRung = r.rung;
    if (r.peak > topPeak) topPeak = r.peak;
    if (r.rung < r.peak) belowPeak = true;
  }
  if (belowPeak && topRung < topPeak) return "falling";
  if (topRung >= 2) return "rising";
  return "steady";
}
