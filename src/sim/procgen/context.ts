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

/**
 * Names from the run's LIVE family tree (CP-R1), if founded: the protagonist as
 * `member`, a sibling (same parent) or the partner as `rival`, and the founded
 * surname. Returns undefined for a not-yet-founded state so the caller falls back
 * to the archetype reference spine. Deterministic: members are in birth order.
 */
function liveContextFor(
  state: GameState,
): { member: string; rival: string; surname: string } | undefined {
  const fam = state.family;
  if (!fam) return undefined;
  const me = fam.members.find((m) => m.id === fam.protagonistId);
  if (!me) return undefined;
  const member = `${me.given} ${me.surname}`;
  // A rival is the protagonist's sibling (same parent, different member); failing
  // that the married-in partner; failing that the protagonist themself.
  const sibling = fam.members.find(
    (m) => m.id !== me.id && m.parentId !== undefined && m.parentId === me.parentId,
  );
  const partner = fam.partnerId ? fam.members.find((m) => m.id === fam.partnerId) : undefined;
  const rivalMember = sibling ?? partner;
  const rival = rivalMember ? `${rivalMember.given} ${rivalMember.surname}` : member;
  const surname = state.founding?.surname ?? me.surname;
  return { member, rival, surname };
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
  // A founded run's LIVE family tree (FD-8) is the single source of names — the
  // protagonist is `member`, a living sibling (or the partner) is `rival`, and the
  // surname is the founded line's own (CP-R1: no literal-preset spine for founded
  // runs). Only a not-yet-founded state falls back to the archetype reference spine.
  const live = liveContextFor(state);
  let member: string;
  let rival: string;
  let surname: string;
  if (live) {
    ({ member, rival, surname } = live);
  } else {
    const tree = treeForArchetype(content, state.archetype);
    const members = tree?.members ?? [];
    const founder = members.find((m) => m.role === "founder-patriarch");
    const heir = members.find((m) => m.role === "heir-successor");
    const rivalMember = members.find((m) => m.role === "rival-sibling");
    member = (heir ?? founder)?.name ?? "the heir";
    rival = rivalMember?.name ?? member;
    surname = state.founding?.surname ?? (founder ? surnameOf(founder) : "the family");
  }

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
