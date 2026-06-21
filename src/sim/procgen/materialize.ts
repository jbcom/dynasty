import type { Content } from "../content";
import type { Rng } from "../rng";
import type { Era, EventTemplate, GameEvent } from "../schema";
import type { GameState } from "../state";
import { buildExpandContext } from "./context";
import { expandTemplate } from "./expand";

/**
 * FD-4.2 — LAZY BOUNDED materialization (design spec §1d). When the authored pool
 * thins for the current era, the selector asks here for up to `cap` procedural
 * events. Each is expanded from an era-matched template with a context built from
 * the live run, keyed by a forked Rng so the same seed + history reconstructs the
 * identical procedural events on replay. Bounded by `cap` so a 1000-year run never
 * realizes more than the chaos field needs at once.
 */

/** Templates that feed a given era's pool. */
function templatesForEra(content: Content, eraId: string): EventTemplate[] {
  return (content.templates ?? []).filter((t) => t.era === eraId);
}

/**
 * Materialize up to `cap` procedural events for `era`. Returns [] when there are
 * no templates for the era (the authored pool simply stands alone). The trope
 * label of each event is taken from the catalog so {trope} substitution reads
 * naturally. Deterministic for a given (state, era, rng, cap).
 */
export function materializeProcedural(
  content: Content,
  state: GameState,
  era: Era,
  rng: Rng,
  cap: number,
): GameEvent[] {
  const templates = templatesForEra(content, era.id);
  if (templates.length === 0 || cap <= 0) return [];

  const out: GameEvent[] = [];
  const n = Math.min(cap, templates.length);
  // Deterministic selection: shuffle template indices via the seeded rng, take n.
  const order = seededOrder(templates.length, rng.fork("order"));
  for (let i = 0; i < n; i++) {
    const template = templates[order[i] as number] as EventTemplate;
    const ctxRng = rng.fork(`ctx:${template.id}:${i}`);
    const ctx = buildExpandContext(content, state, era, ctxRng);
    // Resolve a human label for the template's first trope (for {trope} tokens).
    const tropeLabel = labelForTrope(content, template.tropes[0]);
    out.push(
      expandTemplate(template, { ...ctx, tropeLabel }, rng.fork(`expand:${template.id}:${i}`)),
    );
  }
  return out;
}

/** Catalog label for a trope id (falls back to the id, then to a generic noun). */
function labelForTrope(content: Content, tropeId: string | undefined): string {
  if (!tropeId) return "the family's fate";
  return content.tropes.find((t) => t.id === tropeId)?.label ?? tropeId;
}

/** A deterministic permutation of [0..n) via Fisher–Yates with a seeded Rng. */
function seededOrder(n: number, rng: Rng): number[] {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = rng.int(0, i);
    const tmp = a[i] as number;
    a[i] = a[j] as number;
    a[j] = tmp;
  }
  return a;
}
