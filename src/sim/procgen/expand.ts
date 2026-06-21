import type { PersonalityAxis } from "../personality";
import type { Rng } from "../rng";
import type {
  Choice,
  EventTemplate,
  GameEvent,
  MeterDelta,
  MeterId,
  Range,
  TemplateChoice,
  TemplateSlot,
} from "../schema";

/**
 * FD-4 — the PURE seeded template expander (design spec §1d.1). `expandTemplate`
 * is a pure function of (template, ctx, rng): it resolves the template's `{slot}`
 * tokens from the run context and draws its ranged meter/personality deltas via
 * the run Rng, returning a concrete GameEvent. Deterministic — the same seed +
 * history reconstructs the same generated events on replay, so no persistence is
 * needed (unlike Gemini Mode B). No DOM, no Math.random — sim-pure.
 */

/**
 * The run context the expander substitutes slots from. Built by the caller from
 * the live state + content (family tree, world-stacks, onomastics). Kept as plain
 * resolved strings/values so the expander stays a pure, data-only transform.
 */
export interface ExpandContext {
  /** The active protagonist / focal living family member name. */
  member: string;
  /** A rival sibling / outside-claimant name (falls back to member if none). */
  rival: string;
  /** The run's current place label. */
  place: string;
  /** The in-world year the generated event is stamped at. */
  year: number;
  /** Period+place-appropriate hazards to draw from (seeded pick). */
  perils: readonly string[];
  /** The trope label(s) this template embodies, for {trope} substitution. */
  tropeLabel: string;
  /** The founded dynasty's surname. */
  surname: string;
  /** The era id the generated event belongs to. */
  era: string;
}

/** Resolve one slot token to a concrete string from the context (seeded). */
function resolveSlot(slot: TemplateSlot, ctx: ExpandContext, rng: Rng): string {
  switch (slot) {
    case "member":
      return ctx.member;
    case "rival":
      return ctx.rival;
    case "place":
      return ctx.place;
    case "year":
      return String(ctx.year);
    case "surname":
      return ctx.surname;
    case "trope":
      return ctx.tropeLabel;
    case "peril":
      return ctx.perils.length > 0 ? rng.pick(ctx.perils) : "ruin";
  }
}

const SLOT_RE = /\{(\w+)\}/g;

/**
 * Substitute every `{slot}` token in `text`. Each distinct slot is resolved ONCE
 * per call (so the same token reads consistently within one string) using a forked
 * Rng keyed by the field label — keeping draws independent + replay-stable.
 */
function fill(text: string, ctx: ExpandContext, rng: Rng): string {
  const resolved = new Map<string, string>();
  return text.replace(SLOT_RE, (whole, name: string) => {
    const slot = name as TemplateSlot;
    if (!isSlot(slot)) return whole; // leave unknown tokens untouched
    let value = resolved.get(slot);
    if (value === undefined) {
      value = resolveSlot(slot, ctx, rng.fork(`slot:${slot}`));
      resolved.set(slot, value);
    }
    return value;
  });
}

const SLOT_NAMES = new Set<TemplateSlot>([
  "member",
  "rival",
  "place",
  "year",
  "peril",
  "trope",
  "surname",
]);
function isSlot(s: string): s is TemplateSlot {
  return SLOT_NAMES.has(s as TemplateSlot);
}

/** Draw an integer in [min,max] from an authored range via a labeled forked Rng. */
function drawRange(range: Range, rng: Rng): number {
  return rng.int(Math.round(range.min), Math.round(range.max));
}

/** Expand a templated choice into a concrete Choice (slots filled, deltas drawn). */
function expandChoice(tc: TemplateChoice, ctx: ExpandContext, rng: Rng): Choice {
  const effects: MeterDelta = {};
  for (const [meter, range] of Object.entries(tc.effects) as [MeterId, Range][]) {
    effects[meter] = drawRange(range, rng.fork(`eff:${meter}`));
  }
  const personality: Partial<Record<PersonalityAxis, number>> = {};
  for (const [axis, range] of Object.entries(tc.personality) as [PersonalityAxis, Range][]) {
    personality[axis] = drawRange(range, rng.fork(`pers:${axis}`));
  }
  return {
    id: tc.id,
    text: fill(tc.text, ctx, rng.fork(`text:${tc.id}`)),
    effects,
    personality,
    setFlags: [...tc.setFlags],
    clearFlags: [],
    ripples: [],
    outcome: fill(tc.outcome, ctx, rng.fork(`outcome:${tc.id}`)),
  };
}

/**
 * Expand a template into a concrete, deterministic GameEvent for the run context.
 * The generated id embeds a short seed slice so distinct expansions of the same
 * template (different ctx/era cells) get distinct ids — the content pool's dup-id
 * invariant still holds. Pure: same (template, ctx, rng-seed) → identical event.
 */
export function expandTemplate(template: EventTemplate, ctx: ExpandContext, rng: Rng): GameEvent {
  const tropeTags = template.tropes.map((t) => `trope:${t}`);
  const idSlice = idStamp(rng.fork("id"));
  return {
    id: `ev_proc_${template.id}_${ctx.year}_${idSlice}`,
    era: ctx.era,
    year: ctx.year,
    title: fill(template.title, ctx, rng.fork("title")),
    scene: fill(template.scene, ctx, rng.fork("scene")),
    researchNote: `Procedurally generated from template ${template.id}.`,
    extrapolated: true,
    startrekInspired: false,
    historicity: "personal",
    place: ctx.place,
    tags: [...template.tags, ...tropeTags, "procedural"],
    requires: { flags: [], notFlags: [], meters: {}, personality: {} },
    weight: template.weight,
    repeatable: false,
    choices: template.choices.map((tc, i) => expandChoice(tc, ctx, rng.fork(`choice:${i}`))),
  };
}

/** A short deterministic alphanumeric stamp for unique generated ids. */
function idStamp(rng: Rng): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += alphabet[rng.int(0, alphabet.length - 1)];
  return s;
}
