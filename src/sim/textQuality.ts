import type { Content } from "./content";
import type { GameEvent } from "./schema";

/**
 * TEXT-QUALITY DEV CHECK (PL-13). A pure, deterministic audit of the player-facing copy in
 * every authored event — the writing is the game, so a dev gate catches the mechanical
 * defects that break immersion or leak machinery: unresolved/typo slot tokens (which render
 * literally, e.g. "{plce}"), doubled words, leftover placeholders, unbalanced braces, and
 * sloppy whitespace/punctuation. NOT a spell-checker (a real dictionary excluding the
 * foreign onomastic vocabulary is out of scope here); it targets the high-signal structural
 * defects an editor would flag on a read-through. No DOM, no network, no randomness.
 */

/** The slot tokens the terms layer can resolve; anything else renders literally to the player. */
const VALID_SLOTS = new Set(["given_name", "surname", "full_name", "family_name"]);

/** Placeholder/scaffolding words that must never reach shipped copy. */
const PLACEHOLDER_RE = /\b(TODO|TKTK|TBD|FIXME|lorem|ipsum|placeholder|xxx+)\b/i;

/**
 * Normalization passes that strip legitimate abbreviation/initial/decimal shapes before the
 * missing-space-after-punctuation check, so they don't false-positive. Each is a static
 * literal (compiled once at module load, not per audit call — review). The abbreviation
 * forms (a.m., Mr.) only normalize when properly followed by whitespace/punct/end, so a real
 * run-on like "Mr.Smith" still trips the check.
 */
const NORMALIZE_PASSES: ReadonlyArray<RegExp> = [
  /\d[.,]\d/g, // decimals: 3.14, 1,000
  /\b[A-Za-z]\.(?=[A-Za-z]\.)/g, // initial chains: H.W., Y.M.C.A.
  /\b[A-Za-z]\.(?=\s)/g, // a trailing single-letter initial: "J. Smith"
  /\b(?:a|p)\.m\.(?=\s|[.,;:!?]|$)/gi, // a.m. / p.m.
  /\b(?:Mr|Mrs|Ms|Dr|St|Jr|Sr|vs|etc|No|Inc|Co)\.(?=\s|[.,;:!?]|$)/g, // common abbreviations
];

export interface TextFinding {
  eventId: string;
  /** Which string on the event (title / scene / choice:<id> text|outcome). */
  field: string;
  kind:
    | "unknown-slot"
    | "doubled-word"
    | "placeholder"
    | "unbalanced-brace"
    | "whitespace"
    | "punctuation"
    | "empty";
  detail: string;
}

/** Every player-facing string on an event, labelled by field. */
function fieldsOf(ev: GameEvent): Array<{ field: string; text: string }> {
  const out: Array<{ field: string; text: string }> = [
    { field: "title", text: ev.title },
    { field: "scene", text: ev.scene },
  ];
  for (const c of ev.choices) {
    out.push({ field: `choice:${c.id} text`, text: c.text });
    if (c.outcome) out.push({ field: `choice:${c.id} outcome`, text: c.outcome });
  }
  return out;
}

/** Audit one string, pushing any findings for `eventId`/`field`. */
function auditText(eventId: string, field: string, text: string, out: TextFinding[]): void {
  const push = (kind: TextFinding["kind"], detail: string) =>
    out.push({ eventId, field, kind, detail });

  if (text.trim().length === 0) {
    push("empty", "blank player-facing copy");
    return;
  }

  // Slot tokens: strip the {{ }} literal escapes first, then every {token} must be a valid
  // slot. An unknown/typo token (e.g. {plce}, {calling}) would render literally to the player.
  const stripped = text.replace(/\{\{|\}\}/g, "");
  // Match ANY {…} slot-like pattern (incl. typos with non-word chars like {some-slot}) so
  // they report as unknown-slot, not mistaken for an unbalanced brace (review).
  for (const m of stripped.matchAll(/\{([^{}]*)\}/g)) {
    const tok = m[1] ?? "";
    if (!VALID_SLOTS.has(tok)) push("unknown-slot", `{${tok}} is not a resolvable slot`);
  }
  // A lone { or } that isn't part of a {…} token or an escape is unbalanced.
  const noTokens = stripped.replace(/\{[^{}]*\}/g, "");
  if (noTokens.includes("{") || noTokens.includes("}")) {
    push("unbalanced-brace", "stray { or } in copy");
  }

  if (PLACEHOLDER_RE.test(text)) push("placeholder", "scaffolding/placeholder word in copy");

  // Doubled words ("the the"), case-insensitive, word-boundary anchored. Skip legitimate
  // repeats like "had had" is rare enough to be worth a flag for a human to confirm.
  const doubled = /\b(\w+)\s+\1\b/i.exec(text);
  if (doubled) push("doubled-word", `repeated word "${doubled[1]}"`);

  if (/ {2,}/.test(text)) push("whitespace", "double space");
  if (text !== text.trim()) push("whitespace", "leading/trailing whitespace");
  if (/\s[,.;:!?]/.test(text)) push("punctuation", "space before punctuation");
  // A comma/period glued to a letter is usually a missing-space typo — but legitimate
  // abbreviation/initial/decimal shapes are normalized out first (NORMALIZE_PASSES, hoisted
  // to module scope) so the check fires only on real "word,word" run-ons.
  let normalized = text;
  for (const pass of NORMALIZE_PASSES) normalized = normalized.replace(pass, "");
  if (/[,;:][A-Za-z]/.test(normalized) || /\.[A-Za-z]{2,}/.test(normalized)) {
    push("punctuation", "missing space after punctuation");
  }
}

/**
 * Audit every authored event's player-facing copy. Returns all findings (empty = clean).
 * `content.allEvents` is the full corpus (authored + procedural templates are excluded —
 * they're assembled at runtime and validated separately).
 */
export function auditTextQuality(content: Content): TextFinding[] {
  const findings: TextFinding[] = [];
  for (const ev of content.allEvents) {
    for (const { field, text } of fieldsOf(ev)) {
      auditText(ev.id, field, text, findings);
    }
  }
  return findings;
}
