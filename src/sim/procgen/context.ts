import type { Content } from "../content";
import type { Rng } from "../rng";
import type { Era, FamilyMember, FamilyTree } from "../schema";
import type { GameState } from "../state";
import { resolveStack } from "../worldStacks";
import type { ExpandContext } from "./expand";

/**
 * FD-4.2 — build the ExpandContext the template expander substitutes from, using
 * the data that exists TODAY: the active dynasty's family tree (member / rival /
 * surname) + the era window (year) + a per-dynasty place + era-generic perils.
 * The richer place/peril sourcing arrives with the world-stacks (FD-7) and
 * onomastics (FD-5); this builder is the seam those will plug into. Pure + seeded.
 */

/** Last token of a full name → the family surname (e.g. "Fred Trump" → "Trump"). */
function surnameOf(member: FamilyMember): string {
  const parts = member.name.trim().split(/\s+/);
  return parts[parts.length - 1] ?? member.name;
}

/** The reference spine tree for an archetype (FD-3.5: trees keyed by archetype). */
function treeForArchetype(content: Content, archetype: string): FamilyTree | undefined {
  return content.familyTrees.find((t) => t.archetype === archetype);
}

/** A per-archetype default place label until the world-stacks (FD-7) supply it. */
const PLACE_FALLBACK: Record<string, string> = {
  economic: "New York",
  political: "Boston",
  technological: "the frontier",
  religious: "the heartland",
};

/** Era-generic hazards until the world-stacks (FD-7) supply period+place perils. */
const PERILS_FALLBACK = [
  "a financial reckoning",
  "a public scandal",
  "a rival's gambit",
  "a succession crisis",
  "a turn in the market",
];

/**
 * Build the ExpandContext for a procedural event in `era`. `member` is the groomed
 * heir (or the founder if none yet), `rival` a rival-sibling (or the member if the
 * line has none), `surname` the founder's surname, `year` a seeded draw within the
 * era window (never before the run's time floor). Deterministic for a given rng.
 */
export function buildExpandContext(
  content: Content,
  state: GameState,
  era: Era,
  rng: Rng,
): ExpandContext {
  // The archetype's reference spine (FD-3.5: trees are keyed by archetype). A
  // founded line's OWN tree (FD-8) will supersede this; until then the archetype
  // spine seeds member/rival names and the founding metadata supplies the surname.
  const tree = treeForArchetype(content, state.archetype);
  const members = tree?.members ?? [];
  const founder = members.find((m) => m.role === "founder-patriarch");
  const heir = members.find((m) => m.role === "heir-successor");
  const rivalMember = members.find((m) => m.role === "rival-sibling");

  const member = (heir ?? founder)?.name ?? "the heir";
  const rival = rivalMember?.name ?? member;
  // A founded line uses its chosen surname; otherwise the spine's founder surname.
  const surname = state.founding?.surname ?? (founder ? surnameOf(founder) : "the family");

  // Year: a seeded draw within the era window, floored at the run's last event
  // year so procedural events never travel back in time.
  const lo = Math.max(era.yearStart, state.lastEventYear);
  const hi = Math.max(lo, era.yearEnd);
  const year = rng.fork("year").int(lo, hi);

  // FD-7: the place's STANDING context supplies the display place name + the
  // period+place-accurate perils. A founded line's place comes from its
  // start-moment; the stack is matched by place (+ era when authored). Falls back
  // to the per-archetype place + generic perils when no stack covers the place.
  const placeId = state.founding?.place ?? "";
  const stack = resolveStack(content.worldStacks, placeId, era.id);
  const place = stack?.placeLabel ?? PLACE_FALLBACK[state.archetype] ?? "home";
  const perils = stack?.perils ?? PERILS_FALLBACK;

  return {
    member,
    rival,
    place,
    year,
    perils,
    tropeLabel: "",
    surname,
    era: era.id,
  };
}
