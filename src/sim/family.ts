import { applySuffix, type ChildSlot, type KinNames, nameChild } from "./onomastics";
import type { Rng } from "./rng";
import type { Culture } from "./schema";
import type { FamilyState, LiveMember } from "./state";

/**
 * FD-8 — the LIVE family tree + pure seeded BIRTH mechanics. A founded run grows
 * its own lineage: the progenitor is seeded at founding, and `beget` adds children
 * to a living member, naming them by the culture's onomastic convention (FD-5) and
 * giving them inherited-plus-varied traits. Pure + seeded — the same (family,
 * parent, year, rng) reconstructs the identical child on replay, so the whole tree
 * is deterministic from seed + history.
 */

const TRAIT_KEYS = ["ambition", "cunning", "vigor", "piety"] as const;
type TraitKey = (typeof TRAIT_KEYS)[number];

function clamp(n: number): number {
  return n < 0 ? 0 : n > 100 ? 100 : n;
}

/** Seed the live family with the founding progenitor (generation 0, protagonist). */
export function seedFamily(progenitor: {
  given: string;
  surname: string;
  sex: "male" | "female";
  born: number;
  traits?: Partial<LiveMember["traits"]>;
}): FamilyState {
  const member: LiveMember = {
    id: "m0",
    given: progenitor.given,
    surname: progenitor.surname,
    sex: progenitor.sex,
    born: progenitor.born,
    generation: 0,
    traits: {
      ambition: progenitor.traits?.ambition ?? 50,
      cunning: progenitor.traits?.cunning ?? 50,
      vigor: progenitor.traits?.vigor ?? 50,
      piety: progenitor.traits?.piety ?? 50,
    },
    isProtagonist: true,
  };
  return { members: [member], protagonistId: "m0", nextSeq: 1 };
}

/** Find a member by id (throws — callers pass ids they just read from the tree). */
export function memberById(family: FamilyState, id: string): LiveMember {
  const m = family.members.find((x) => x.id === id);
  if (!m) throw new Error(`family: unknown member "${id}"`);
  return m;
}

/** Living children of a member, in birth order (by member seq embedded in id). */
export function childrenOf(family: FamilyState, parentId: string): LiveMember[] {
  return family.members.filter((m) => m.parentId === parentId);
}

/** Inherit a trait from the parent with a seeded ±variance drift, clamped to 0..100. */
function inheritTrait(parentValue: number, rng: Rng): number {
  // ±20 drift around the parent's value — children resemble but diverge from parents.
  return clamp(parentValue + rng.int(-20, 20));
}

/**
 * Beget a child of `parentId`, born in `year`. The child's sex is a seeded coin;
 * its given name follows the culture's naming convention (eldest son ← paternal
 * grandfather, etc.) resolved against the supplied kin names, with a regnal/junior
 * suffix when the name repeats down the line; its traits inherit-and-vary from the
 * parent. Returns the new FamilyState and the minted child. Pure + seeded.
 */
export function beget(
  family: FamilyState,
  parentId: string,
  year: number,
  culture: Culture,
  kin: KinNames,
  rng: Rng,
): { family: FamilyState; child: LiveMember } {
  const parent = memberById(family, parentId);
  const sex: LiveMember["sex"] = rng.fork("sex").chance(0.5) ? "male" : "female";
  // Birth-order ordinal among same-sex siblings (drives the naming rule).
  const sameSexSiblings = childrenOf(family, parentId).filter((c) => c.sex === sex).length;
  const slot: ChildSlot = { sex, ordinal: sameSexSiblings + 1 };

  const named = nameChild(culture, slot, kin, rng.fork("name"));
  // Count prior bearers of this exact given name in the line for the suffix.
  const priorBearers = family.members.filter((m) => m.given === named.name).length;
  const given = applySuffix(culture, named.name, priorBearers);

  const traits = {} as LiveMember["traits"];
  for (const k of TRAIT_KEYS as readonly TraitKey[]) {
    traits[k] = inheritTrait(parent.traits[k], rng.fork(`trait:${k}`));
  }

  const child: LiveMember = {
    id: `m${family.nextSeq}`,
    given,
    surname: parent.surname,
    sex,
    born: year,
    parentId,
    generation: parent.generation + 1,
    traits,
    isProtagonist: false,
  };

  return {
    family: {
      ...family,
      members: [...family.members, child],
      nextSeq: family.nextSeq + 1,
    },
    child,
  };
}

/** Build the KinNames for naming a child of `parentId` (grandparents + parents). */
export function kinFor(family: FamilyState, parentId: string): KinNames {
  const parent = memberById(family, parentId);
  const grandparent = parent.parentId ? memberById(family, parent.parentId) : undefined;
  // The live tree records a SINGLE lineage parent per member, so only that
  // parent's lineage has a known grandparent — populate the matching lineage slot
  // and leave the opposite lineage's grandparent slots undefined. (Mapping the one
  // grandparent into BOTH lineages would name two different-rule siblings after the
  // same ancestor and mis-resolve maternal-lineage conventions.)
  const grandIsPaternal = parent.sex === "male";
  return {
    father: parent.sex === "male" ? parent.given : undefined,
    mother: parent.sex === "female" ? parent.given : undefined,
    paternalGrandfather:
      grandIsPaternal && grandparent?.sex === "male" ? grandparent.given : undefined,
    paternalGrandmother:
      grandIsPaternal && grandparent?.sex === "female" ? grandparent.given : undefined,
    maternalGrandfather:
      !grandIsPaternal && grandparent?.sex === "male" ? grandparent.given : undefined,
    maternalGrandmother:
      !grandIsPaternal && grandparent?.sex === "female" ? grandparent.given : undefined,
  };
}
