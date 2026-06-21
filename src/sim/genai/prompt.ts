import type { Place, Trope } from "../schema";

/**
 * GENAI PROMPT BUILDER (EX-4). Pure functions that turn a breadth TARGET (a cell in
 * the place × era × archetype space the gap matrix flags as thin) into a strict,
 * schema-constrained prompt for the model. The prompt embeds the engine's rules so
 * the model's output is likely to pass the validation gate (validate.ts) on the first
 * try: founded-line tokens only (never literal names), trope tags from the catalog,
 * the right place/era/archetype scoping, >=2 choices, founded_line gate. Pure +
 * deterministic — testable without any model call.
 */

export interface GenTarget {
  place?: string; // a place id, or undefined for a place-agnostic beat
  era: string; // the period id
  year: number; // the in-world year the beats should sit near
  archetypes?: string[]; // power bases this beat serves, or [] for agnostic
  count: number; // how many events to generate
}

/** The example event shape the model must emit (one entry per requested event). */
const SHAPE = `{
  "id": "ev_gen_<short_unique_slug>",
  "era": "<era>",
  "place": "<place or omit if agnostic>",
  "archetypes": ["<archetype>", ...] (omit if agnostic),
  "year": <int near the target year>,
  "title": "<evocative, 2-6 words>",
  "scene": "<2-3 sentences; use {surname}/{given_name}/{full_name}/{family_name} for the line's name>",
  "researchNote": "<one line of grounding>",
  "historicity": "real" | "extrapolated" | "personal",
  "tags": ["trope:<id-from-catalog>", ...],
  "requires": { "flags": ["founded_line"], "notFlags": [], "meters": {}, "personality": {} },
  "weight": <8-14>,
  "choices": [ { "id": "<slug>", "text": "<choice>", "effects": { ...nonzero meter deltas only... }, "personality": { ...nonzero axis deltas only... }, "setFlags": [], "outcome": "<1-2 sentences>" }, ... (>= 2 choices) ]
}

STRICT KEY SETS (using any other key fails validation):
- "effects" keys are ONLY: money, power, reputation, loyalty, health, heat (integer deltas; include only nonzero).
- "personality" keys are ONLY the 8 motivators: wealth, politics, worldview, power, tradition, honor, lineage, reach (integer deltas; include only nonzero).
- "requires.flags" MUST include "founded_line". Do not invent requires sub-keys beyond flags/notFlags/meters/personality.`;

/** Build the system instruction: the inviolable rules the model must follow. */
export function systemInstruction(): string {
  return [
    "You author events for a deterministic dynasty life-simulator.",
    "ABSOLUTE RULES (output is rejected if violated):",
    "1. NEVER write a real person's name (no Trump, Musk, Kennedy, Donald, Fred, etc.).",
    "   The player's line is referenced ONLY via the tokens {surname}, {given_name},",
    "   {full_name}, {family_name}. Other people are generic roles (your father, a rival).",
    "2. Real PLACE names are allowed and encouraged for a place-scoped beat.",
    "3. Every trope tag must be `trope:<id>` drawn from the provided catalog — invent none.",
    "4. Every event must require the flag `founded_line` and offer at least 2 choices.",
    "5. Output STRICT JSON: an array of event objects matching the given shape exactly.",
  ].join("\n");
}

/** Build the user prompt for a target, embedding the catalog + place + shape. */
export function buildPrompt(
  target: GenTarget,
  tropes: readonly Trope[],
  places: readonly Place[],
): string {
  const place = target.place ? places.find((p) => p.id === target.place) : undefined;
  const tropeLines = tropes.map((t) => `  - ${t.id}: ${t.label} — ${t.summary}`).join("\n");
  const archLine =
    target.archetypes && target.archetypes.length > 0
      ? `Power archetype(s) this beat serves: ${target.archetypes.join(", ")} (set "archetypes" accordingly).`
      : "This beat is archetype-AGNOSTIC (omit the archetypes field — it fires for any line).";
  const placeLine = place
    ? `Place: ${place.label} (id "${place.id}"). Set "place":"${place.id}". Use real, period-accurate ${place.label} detail. Sensory feel: ${place.sensoryCue}.`
    : "Place-AGNOSTIC (omit the place field — it fires for a line founded anywhere).";

  return [
    `Author ${target.count} distinct, branching events for era "${target.era}" around the year ${target.year}.`,
    placeLine,
    archLine,
    "",
    "Trope catalog (tag each event with one or more `trope:<id>` from this list ONLY):",
    tropeLines,
    "",
    "Each event MUST match this shape:",
    SHAPE,
    "",
    "Return ONLY a JSON array of event objects. No prose, no markdown fences.",
  ].join("\n");
}
