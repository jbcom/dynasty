import { hasPresetLeak } from "../leak";
import { EventSchema, type GameEvent, type Place, type Trope } from "../schema";
import { ARCHETYPES } from "../slots";

/**
 * GENAI VALIDATION GATE (EX-4). Generated content NEVER lands unmodified — it must
 * pass this gate first. The same invariants the harness audit enforces on the live
 * timeline are enforced here at the source, so a GenAI breadth run can only add
 * content that is schema-valid, leak-free, trope-cataloged, and correctly scoped to
 * its place/era/archetype. Pure + deterministic: no model, no network — just the
 * structural + content rules. This is what makes "Gemini does the heavy lifting"
 * safe (the spec's Mode B), because nothing it produces bypasses the engine's rules.
 */

/** The catalog/world context the gate validates a generated event against. */
export interface GenContext {
  /** The era id the generated event must declare. */
  era: string;
  /** Valid era ids (from the period registry) — the event's era must be one. */
  eraIds: ReadonlySet<string>;
  /** The trope catalog — every `trope:<id>` tag must resolve here. */
  tropes: readonly Trope[];
  /** The places catalog — a place-scoped event's `place` must be a real place id. */
  places: readonly Place[];
  /** Event ids already in the corpus — a generated id must be new (no collisions). */
  existingIds: ReadonlySet<string>;
}

export interface GenVerdict {
  /** The parsed event, when accepted. */
  event?: GameEvent;
  accepted: boolean;
  /** Why it was rejected (empty when accepted). */
  reasons: string[];
}

/** Every player-facing string on an event (title + scene + each choice's text/outcome). */
function renderedStrings(ev: GameEvent): string[] {
  return [ev.title, ev.scene, ...ev.choices.flatMap((c) => [c.text, c.outcome])];
}

/**
 * Validate one generated event (raw, unparsed) against the gate. Returns the parsed
 * event when every rule passes, else the list of reasons it was rejected. The caller
 * lands ONLY accepted events — rejected ones are dropped (and logged for a re-prompt).
 */
export function validateGenerated(raw: unknown, ctx: GenContext): GenVerdict {
  const reasons: string[] = [];

  const parsed = EventSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      accepted: false,
      reasons: [`schema: ${parsed.error.issues[0]?.message ?? "invalid"}`],
    };
  }
  const ev = parsed.data;

  // Id must be new (no collision with the existing corpus).
  if (ctx.existingIds.has(ev.id)) reasons.push(`duplicate event id "${ev.id}"`);

  // Era must match the requested era + be a real era.
  if (ev.era !== ctx.era) reasons.push(`era "${ev.era}" != requested "${ctx.era}"`);
  if (!ctx.eraIds.has(ev.era)) reasons.push(`era "${ev.era}" not in the period registry`);

  // No preset-person literal in any rendered string (the leak gate at the source).
  for (const s of renderedStrings(ev)) {
    if (hasPresetLeak(s)) {
      reasons.push(`preset-person literal in rendered copy: "${s.slice(0, 80)}"`);
      break;
    }
  }

  // Every trope:<id> tag must resolve to the catalog (the cross-ref gate).
  const tropeIds = new Set(ctx.tropes.map((t) => t.id));
  for (const tag of ev.tags) {
    if (tag.startsWith("trope:")) {
      const id = tag.slice("trope:".length);
      if (!tropeIds.has(id)) reasons.push(`unknown trope "${id}"`);
    }
  }

  // archetypes (if set) must all be real power bases.
  for (const a of ev.archetypes ?? []) {
    if (!(ARCHETYPES as readonly string[]).includes(a)) reasons.push(`unknown archetype "${a}"`);
  }

  // A place-scoped event's place must be a real catalog place id.
  if (ev.place) {
    const placeIds = new Set(ctx.places.map((p) => p.id));
    if (!placeIds.has(ev.place)) reasons.push(`unknown place "${ev.place}"`);
  }

  // Branch-density floor: a generated beat must offer a real choice (>= 2), so it
  // never lands a corridor; and must carry founded_line so it only fires in a run.
  if (ev.choices.length < 2) reasons.push("fewer than 2 choices (a corridor beat)");
  if (!ev.requires.flags.includes("founded_line")) {
    reasons.push("missing founded_line gate (would fire outside a founded run)");
  }

  return reasons.length === 0
    ? { event: ev, accepted: true, reasons: [] }
    : { accepted: false, reasons };
}

/** Validate a batch; return the accepted events + the rejected (raw, reasons) for re-prompting. */
export function validateBatch(
  raws: readonly unknown[],
  ctx: GenContext,
): { accepted: GameEvent[]; rejected: Array<{ raw: unknown; reasons: string[] }> } {
  const accepted: GameEvent[] = [];
  const rejected: Array<{ raw: unknown; reasons: string[] }> = [];
  const seen = new Set(ctx.existingIds);
  for (const raw of raws) {
    // Thread the accumulating id set so two generated events can't collide either.
    const verdict = validateGenerated(raw, { ...ctx, existingIds: seen });
    if (verdict.accepted && verdict.event) {
      accepted.push(verdict.event);
      seen.add(verdict.event.id);
    } else {
      rejected.push({ raw, reasons: verdict.reasons });
    }
  }
  return { accepted, rejected };
}
