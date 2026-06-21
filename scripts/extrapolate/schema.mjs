/**
 * FD-11 — the JSON schema Gemini fills when generating events, mirroring the
 * game's EventSchema (src/sim/schema.ts) so generated output drops straight into
 * the content files. Generation is schema-FORCED here; the real zod EventSchema
 * is the authoritative validator before anything commits (this is the "propose,
 * then validate + git-review" contract).
 */

const METER = { type: "string", enum: ["money", "power", "reputation", "loyalty", "health", "heat"] };
const AXIS = { type: "string", enum: ["ideology", "grandiosity", "outward", "inward"] };

const CHOICE = {
  type: "object",
  properties: {
    id: { type: "string", description: "unique snake_case id within the event" },
    text: { type: "string", description: "the choice label the player taps" },
    effects: {
      type: "object",
      description: "meter deltas; heat is a COST (positive heat hurts)",
      properties: Object.fromEntries(
        ["money", "power", "reputation", "loyalty", "health", "heat"].map((m) => [
          m,
          { type: "number" },
        ]),
      ),
    },
    personality: {
      type: "object",
      properties: Object.fromEntries(
        ["ideology", "grandiosity", "outward", "inward"].map((a) => [a, { type: "number" }]),
      ),
    },
    setFlags: { type: "array", items: { type: "string" } },
    outcome: { type: "string", description: "the consequence text shown after choosing" },
  },
  required: ["id", "text", "outcome"],
};

/** One generated event (a subset of EventSchema — the authorable fields). */
export const EVENT_SCHEMA = {
  type: "object",
  properties: {
    id: { type: "string", description: "globally-unique snake_case id, prefix ev_gen_" },
    era: { type: "string", description: "the era id this belongs to" },
    year: { type: "integer" },
    title: { type: "string" },
    scene: { type: "string", description: "2-4 sentence event prose" },
    researchNote: { type: "string", description: "one factual/justifying sentence" },
    historicity: { type: "string", enum: ["real", "extrapolated", "personal"] },
    place: { type: "string", description: "place id, optional" },
    tags: { type: "array", items: { type: "string" }, description: "incl. trope:<id> tags" },
    weight: { type: "number" },
    choices: { type: "array", items: CHOICE, minItems: 2, maxItems: 4 },
  },
  required: ["id", "era", "year", "title", "scene", "researchNote", "historicity", "choices"],
};

/** A batch of generated events (the generation call returns this). */
export const EVENT_BATCH_SCHEMA = {
  type: "object",
  properties: { events: { type: "array", items: EVENT_SCHEMA } },
  required: ["events"],
};

/**
 * FD-3 trope-retag verdict: the trope ids the model proposes for an existing
 * event, plus a one-line rationale. Validated downstream against the canonical
 * catalog before any tag is applied.
 */
export const RETAG_SCHEMA = {
  type: "object",
  properties: {
    tropes: {
      type: "array",
      items: { type: "string" },
      description: "1-3 catalog trope ids (no trope: prefix); [] if none fit",
    },
    why: { type: "string", description: "one-line justification for the classification" },
  },
  required: ["tropes", "why"],
};

void METER;
void AXIS;
