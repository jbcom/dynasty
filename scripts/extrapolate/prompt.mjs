/**
 * FD-11 — Gemini dev-bulk extrapolation: the GAME BIBLE system prompt + the
 * per-request context builder. Authored so Gemini generates events that match the
 * game's tone, schema, and dynastic-trope grammar (spec
 * docs/superpowers/specs/2026-06-20-found-your-own-dynasty.md §1c/1d/1e).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The dynastic trope catalog, read from the single source of truth
 * (src/data/tropes.json) so the dev-toolkit prompts never drift from what the sim
 * validates against. Returns the parsed trope objects.
 */
export function loadTropes() {
  const path = join("src/data/tropes.json");
  return JSON.parse(readFileSync(path, "utf8")).tropes;
}

const TROPES = loadTropes();
/** "id — summary" lines for prompt embedding (the retagger needs the meanings). */
const TROPE_LINES = TROPES.map((t) => `  ${t.id} (${t.kind}): ${t.summary}`).join("\n");
const TROPE_IDS = TROPES.map((t) => t.id).join(", ");

/** The standing system instruction — the game's voice + the hard rules. */
export const SYSTEM_PROMPT = `
You are a master narrative designer for "Dynasty", a deterministic, satirical,
historically-grounded life-simulator about FOUNDING AND STEERING A FAMILY DYNASTY
across generations — from a real historical hinge (the Irish Famine, the Bavarian
emigration, post-apartheid South Africa, the Gold Rush) all the way to the stars.

VOICE: literate, acidic, morally interrogating dark satire. Period- and
place-accurate. Real history is the SETTING; the player's family reacts to it.
Never gratuitous; always coherent.

DYNASTIC TROPES (events should embody one or more, tagged trope:<id>). The
CANONICAL CATALOG (id (kind): meaning) — use ONLY these ids:
${TROPE_LINES}

HARD RULES (a generated event is REJECTED if it breaks any):
- historicity is "real" (it actually happened), "extrapolated" (plausible
  future/alt extrapolation), or "personal" (the family's private life).
- A "real" event must be historically accurate for its year+place.
- Meter effects use ONLY: money, power, reputation, loyalty, health, heat
  (heat = scrutiny/danger; positive heat is a COST). Personality axes are ONLY:
  ideology, grandiosity, outward, inward.
- Every event presents 3-4 meaningful CHOICES (NEVER fewer than 3), each a real tradeoff (never an
  all-upside free lunch; heat counts as a cost).
- Stay in the family's lane: do NOT introduce another dynasty's named people.
- No anachronisms; the year must sit within the event's era bounds.
`.trim();

/**
 * Build the per-request user prompt: what gap to fill + the last N events as
 * coherence context (the "back-query the last 10-25 events" the design calls for).
 */
export function buildGenerationPrompt({ gap, recentEvents, count }) {
  const ctx = recentEvents
    .map((e, i) => `${i + 1}. [${e.year}] ${e.title} — ${e.scene.slice(0, 160)}`)
    .join("\n");
  return [
    `Generate ${count} new events to fill this gap in the timeline:`,
    `  era: ${gap.era}   year range: ${gap.yearStart}-${gap.yearEnd}`,
    gap.place ? `  place: ${gap.place}` : "",
    gap.tropes?.length ? `  tropes to lean into: ${gap.tropes.join(", ")}` : "",
    "",
    "The last events that occurred (keep continuity with these — references,",
    "consequences, escalation; do NOT contradict or duplicate them):",
    ctx || "(none — this is near the start of the line)",
    "",
    `Return ${count} events as JSON matching the provided schema. Each event's`,
    `year must fall in ${gap.yearStart}-${gap.yearEnd}. Vary the tropes + tone.`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * FD-3 trope-retag job: ask Gemini to classify an EXISTING event by which
 * dynastic trope(s) it embodies, proposing `trope:<id>` tags from the canonical
 * catalog. This is the "trope-retagging" dev-toolkit job (spec §1e) — it lets the
 * refactor from literal lines (Trump/Kennedy/…) to reusable trope influences
 * proceed at scale instead of by hand. Output is PROPOSED for git review.
 */
export function buildRetagPrompt({ event }) {
  return [
    "Classify this existing Dynasty event by which DYNASTIC TROPE(S) it embodies.",
    "Propose 1-3 trope ids from the canonical catalog (no more — pick the truest).",
    "A trope fits if the event enacts that archetypal pattern (a rise, a succession,",
    "a schism, a scandal-fall, etc.), NOT merely if a keyword appears.",
    "If NONE genuinely fit, return an empty list — do not force a tag.",
    "",
    `Canonical catalog (use ONLY these ids): ${TROPE_IDS}`,
    "",
    `Event:\n${JSON.stringify(
      { id: event.id, title: event.title, scene: event.scene, tags: event.tags },
      null,
      2,
    )}`,
  ].join("\n");
}

/**
 * The critique prompt (gemini-pro pass): score a generated event for coherence,
 * tone, schema-fit, non-duplication. Returns a JSON verdict {score, keep, why}.
 */
export function buildCritiquePrompt({ event, recentEvents }) {
  const ctx = recentEvents.map((e) => `[${e.year}] ${e.title}`).join("; ");
  return [
    "Quality-check this generated Dynasty event against the bible + its context.",
    "Score 0-100 on: historical/period coherence, tone match, choice tradeoff",
    "quality, and NON-duplication vs the recent events. keep=true only if >=70 and",
    "it adds something the recent events do not.",
    "",
    `Recent events: ${ctx}`,
    "",
    `Event under review:\n${JSON.stringify(event, null, 2)}`,
  ].join("\n");
}
