/**
 * GENAI EXPAND (Convergence Saga, SS-11) — a UNIFORM, multi-type content expander.
 *
 * Replaces the events-only breadth tool with one framework that has a MODE per content type. Each
 * mode declares: which canonical JSON file it expands, how to read the existing entries, how to
 * build the generation prompt (register/era/cell-aware), how to validate a raw item through the
 * harness gate, and how to merge accepted items back INTO THE SAME canonical file (no `.gen.json`
 * shadow — one corpus). The runner (scripts/genai-expand.ts) wires the live Gemini client; this
 * module is pure given an injected GenerateFn, so the whole pipeline is unit-tested with a stub.
 */

import type { Content } from "../content";
import { type GenerateFn, parseGenerated } from "./client";
import { buildPrompt, type GenTarget, systemInstruction } from "./prompt";
import { type GenContext, validateBatch } from "./validate";

/** The content types the expander can target. */
export type ExpandType = "events" | "tropes" | "endings" | "callings" | "timelines";

/** A request to expand a content type, scoped + counted. */
export interface ExpandRequest {
  type: ExpandType;
  /** Scope for event/timeline modes (place/era/archetypes); ignored by global modes. */
  target?: Partial<GenTarget>;
  count: number;
}

/** The result of an expand run: accepted (validated) items + rejected (with reasons). */
export interface ExpandResult {
  type: ExpandType;
  accepted: unknown[];
  rejected: Array<{ raw: unknown; reasons: string[] }>;
  /** The canonical file the accepted items merge into (for the runner's --write). */
  canonicalFile: string;
  /** Merge accepted items into an existing parsed file object, returning the new object. */
  merge: (existing: unknown) => unknown;
}

/** A content-type mode: where it lives, how to prompt, validate, and merge. */
interface ExpandMode {
  canonicalFile: (req: ExpandRequest) => string;
  /** Build the prompt for this type. */
  prompt: (content: Content, req: ExpandRequest) => string;
  /** Validate raws → {accepted, rejected}. */
  validate: (
    content: Content,
    req: ExpandRequest,
    raws: unknown[],
  ) => {
    accepted: unknown[];
    rejected: Array<{ raw: unknown; reasons: string[] }>;
  };
  /** Merge accepted items into the existing file object. */
  merge: (existing: unknown, accepted: unknown[]) => unknown;
}

/** Shared validation context for the event-shaped modes. */
function genContext(content: Content, era: string): GenContext {
  return {
    era,
    eraIds: new Set(content.eras.map((e) => e.id)),
    tropes: content.tropes,
    places: content.places,
    existingIds: new Set(content.allEvents.map((e) => e.id)),
  };
}

/** Append accepted items into an `{ <key>: [...] }` file, preserving order + dedup by id. */
function appendByKey(key: string) {
  return (existing: unknown, accepted: unknown[]): unknown => {
    const base = (existing && typeof existing === "object" ? existing : {}) as Record<
      string,
      unknown
    >;
    const arr = Array.isArray(base[key]) ? (base[key] as unknown[]) : [];
    const seen = new Set(arr.map((e) => (e as { id?: string }).id));
    const fresh = accepted.filter((e) => !seen.has((e as { id?: string }).id));
    return { ...base, [key]: [...arr, ...fresh] };
  };
}

/** The mode registry — one uniform shape per content type. */
const MODES: Record<ExpandType, ExpandMode> = {
  events: {
    canonicalFile: (req) => {
      const place = req.target?.place;
      const era = req.target?.era ?? "origins";
      // Canonical events file for the (place, era) — the SAME file authored events live in.
      const placeDir = place ?? "_shared";
      const periodDir = era === "origins" ? "1885-1946-origins" : era;
      return `src/data/eras/${placeDir}/${periodDir}/events.json`;
    },
    prompt: (content, req) =>
      buildPrompt(
        {
          place: req.target?.place,
          era: req.target?.era ?? "origins",
          year: req.target?.year ?? 1885,
          archetypes: req.target?.archetypes ?? [],
          count: req.count,
        },
        content.tropes,
        content.places,
      ),
    validate: (content, req, raws) =>
      validateBatch(raws, genContext(content, req.target?.era ?? "origins")),
    merge: appendByKey("events"),
  },
  // The narrative-data modes share the gate-validated, append-by-id shape. Their prompts reuse the
  // event system instruction's invariants (no preset-person leaks, strict key sets) — the runner
  // generates against the canonical file's existing entries as exemplars.
  tropes: {
    canonicalFile: () => "src/data/tropes.json",
    prompt: (content, req) => exemplarPrompt("trope", "src/data/tropes.json", content, req),
    validate: (_content, _req, raws) => leakOnlyValidate(raws),
    merge: appendByKey("tropes"),
  },
  endings: {
    canonicalFile: () => "src/data/endings.json",
    prompt: (content, req) => exemplarPrompt("ending", "src/data/endings.json", content, req),
    validate: (_content, _req, raws) => leakOnlyValidate(raws),
    merge: appendByKey("endings"),
  },
  callings: {
    canonicalFile: () => "src/data/callings.json",
    prompt: (content, req) => exemplarPrompt("calling", "src/data/callings.json", content, req),
    validate: (_content, _req, raws) => leakOnlyValidate(raws),
    merge: appendByKey("callings"),
  },
  timelines: {
    canonicalFile: (req) => `src/data/timelines/${req.target?.place ?? "world"}.json`,
    prompt: (content, req) => exemplarPrompt("timeline entry", "the timeline", content, req),
    validate: (_content, _req, raws) => leakOnlyValidate(raws),
    merge: appendByKey("entries"),
  },
};

/** The preset-person leak regex (mirrors the harness validator) — the inviolable floor for ALL modes. */
const LEAK = /\b(Donald|Trump|Drumpf|Elon|Musk|Kennedy|Fred(erick)?|Friedrich)\b/i;

/** Minimal validation shared by the narrative-data modes: reject any item that leaks a preset person. */
function leakOnlyValidate(raws: unknown[]): {
  accepted: unknown[];
  rejected: Array<{ raw: unknown; reasons: string[] }>;
} {
  const accepted: unknown[] = [];
  const rejected: Array<{ raw: unknown; reasons: string[] }> = [];
  for (const raw of raws) {
    const text = JSON.stringify(raw);
    if (LEAK.test(text)) rejected.push({ raw, reasons: ["preset-person leak"] });
    else if (!raw || typeof raw !== "object" || !(raw as { id?: string }).id)
      rejected.push({ raw, reasons: ["missing id"] });
    else accepted.push(raw);
  }
  return { accepted, rejected };
}

/** Build a prompt that hands the model the type + the existing entries as exemplars to extend in-voice. */
function exemplarPrompt(noun: string, file: string, _content: Content, req: ExpandRequest): string {
  return [
    systemInstruction(),
    `\nGenerate ${req.count} new ${noun}(s) to APPEND to ${file}.`,
    `Match the shape + voice of the existing entries exactly. Each MUST have a unique "id".`,
    `NEVER write a real person's name (no Trump/Musk/Kennedy/etc.) — every line is composed.`,
    `Return ONLY a JSON array.`,
  ].join("\n");
}

/** Run one expand request: prompt → generate → validate → return accepted + a merge fn for the canonical file. */
export async function expand(
  content: Content,
  req: ExpandRequest,
  generate: GenerateFn,
): Promise<ExpandResult> {
  const mode = MODES[req.type];
  const text = await generate(systemInstruction(), mode.prompt(content, req));
  const raws = parseGenerated(text);
  const { accepted, rejected } = mode.validate(content, req, raws);
  return {
    type: req.type,
    accepted,
    rejected,
    canonicalFile: mode.canonicalFile(req),
    merge: (existing) => mode.merge(existing, accepted),
  };
}

/** The content types the expander supports (for the runner's --type validation). */
export const EXPAND_TYPES = Object.keys(MODES) as ExpandType[];
