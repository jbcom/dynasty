import type { GameEvent, WorldEvent, WorldTimeline } from "./schema";

/**
 * WORLD-EVENT PROJECTION (FD-2.2 — unified event pool).
 *
 * The 1169 authored world-timeline entries (dated backdrop facts that historically
 * only BROADCAST FLAGS) are too many to hand-rewrite into the protagonist event
 * schema, so we PROJECT them: each WorldEvent becomes a unified, year-keyed,
 * REACTABLE GameEvent drawn from the same pool as the protagonist's life. This is
 * the mechanism that makes "the timelines ARE events" true (spec §1b) without a
 * 1169-record hand-migration — the authored timeline JSONs stay the source, the
 * projection is derived in buildContent.
 *
 * Mapping:
 *   headline → title · body → scene · "real"/"extrapolated" historicity from the
 *   entry's extrapolated flag · place from the timeline scope · bias.branch from
 *   the timeline's branch (so a Reich-variant event is likelier on the Nazi line)
 *   · setFlags + requires preserved · a default "witness it" reactable choice that
 *   carries the entry's setFlags (so a real event is something the family LIVES
 *   THROUGH and reacts to, not a silent flag broadcast).
 *
 * Pure + deterministic: same timelines → same projected events, in a stable order.
 */

/**
 * The ARCHETYPE a scope's private arc belongs to, or null if it is shared backdrop
 * (FD-3.5). CP-R-ARCH-3 folded the former literal-person scopes (musk → westcoast,
 * kennedy → eastcoast) into geographic backdrop as RIVAL-HOUSE events (tags
 * `rival-house:*`): a famous rival dynasty every line encounters as world-context,
 * the "other timelines to weave" — not archetype-locked protagonist material. So
 * every remaining scope is shared backdrop; per-event archetype scoping (where it
 * matters) now rides the event-level `archetypes` field, not the scope.
 */
export function archetypeForScope(_scope: WorldTimeline["scope"]): string | null {
  return null; // all remaining scopes are shared world backdrop
}

/** Map a timeline scope to a `place` for world-stack routing (FD-5). */
function placeForScope(scope: WorldTimeline["scope"]): string {
  switch (scope) {
    case "manhattan":
    case "eastcoast":
      return "east_coast";
    case "westcoast":
      return "west_coast";
    case "usa":
      return "usa";
    case "world":
      return "world";
    // Thematic + character scopes are not geographic — leave place unset.
    default:
      return "";
  }
}

/** Project one world-timeline entry into a unified, reactable GameEvent. */
function projectOne(tl: WorldTimeline, e: WorldEvent): GameEvent {
  const branch = tl.branch ?? "default";
  const place = placeForScope(tl.scope);
  const ownerArchetype = archetypeForScope(tl.scope);
  return {
    id: e.id,
    // World events are year-keyed across all eras; the era is derived from the
    // year at selection time, so we tag a sentinel era the selector ignores.
    era: "__world__",
    year: e.year,
    title: e.headline,
    scene: e.body,
    researchNote: e.body,
    extrapolated: e.extrapolated,
    startrekInspired: false,
    historicity: e.extrapolated ? "extrapolated" : "real",
    ...(place ? { place } : {}),
    // An archetype-owned scope (musk→technological, kennedy→political) tags
    // `archetype:<id>` so the no-leak gate excludes it from OTHER archetypes' runs.
    tags: [
      "world",
      tl.scope,
      ...(ownerArchetype ? [`archetype:${ownerArchetype}`] : []),
      ...e.tags,
    ],
    requires: e.requires ?? { flags: [], notFlags: [], meters: {}, personality: {} },
    // World events are AMBIENT BACKDROP the family occasionally lives through —
    // they must NOT swamp the protagonist's life beats (which sit at weight ~10).
    // A low base weight keeps the family arc the spine and world events the
    // punctuation; the chaos field can still surface a salient one.
    weight: 1,
    // A non-default-branch variant is likelier (×3) when that branch is active —
    // mirrors how the linking protocol only applied a branch's own variants.
    ...(branch !== "default"
      ? { bias: { branch: { [branch]: 3 } as Record<string, number>, personality: {} } }
      : {}),
    repeatable: false,
    choices: [
      {
        id: `${e.id}__witness`,
        text: "Live through it.",
        effects: {},
        personality: {},
        // The entry's broadcast flags now land via the player WITNESSING the
        // event (a reactable choice), not a silent linking broadcast.
        setFlags: e.setFlags,
        clearFlags: [],
        ripples: [],
        outcome: e.body,
      },
    ],
  };
}

/**
 * Project all world-timeline entries into one flat, year-sorted pool of unified
 * events. Sorted by (year, id) so selection + replay are deterministic regardless
 * of file/scope load order — matching the old dueWorldEvents ordering.
 */
export function projectWorldEvents(timelines: readonly WorldTimeline[]): GameEvent[] {
  const out: GameEvent[] = [];
  for (const tl of timelines) {
    for (const e of tl.events) out.push(projectOne(tl, e));
  }
  out.sort((a, b) => a.year - b.year || a.id.localeCompare(b.id));
  return out;
}
