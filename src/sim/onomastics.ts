import type { Rng } from "./rng";
import type { Culture, NamingSource, OnomasticsFile } from "./schema";

/**
 * FD-5 — the PURE onomastics resolver (design spec §4). Given a culture's name
 * pools + naming convention, it picks period/culture-accurate given names and
 * names a child by the culture's rule (eldest son ← paternal grandfather, etc.).
 * Generalizes the single-protagonist branch naming (sim/terms.ts) to any founded
 * line. Seeded + pure so generated names replay identically.
 */

export type Sex = "male" | "female";

/** The kin a child can be named after, supplied by the caller from the tree. */
export interface KinNames {
  paternalGrandfather?: string;
  paternalGrandmother?: string;
  maternalGrandfather?: string;
  maternalGrandmother?: string;
  father?: string;
  mother?: string;
}

/** Birth order + sex of the child being named. */
export interface ChildSlot {
  sex: Sex;
  /** 1 = eldest of that sex, 2 = second, etc. */
  ordinal: number;
}

/** Look up a culture by id; throws if absent (content is validated, so this is a guard). */
export function getCulture(file: OnomasticsFile, id: string): Culture {
  const c = file.cultures[id];
  if (!c) throw new Error(`onomastics: unknown culture "${id}"`);
  return c;
}

/** A seeded given-name pick from the culture's pool for the given sex. */
export function pickGivenName(culture: Culture, sex: Sex, rng: Rng): string {
  const pool = sex === "male" ? culture.givenMale : culture.givenFemale;
  return rng.pick(pool);
}

/** Which naming source applies to this child slot under the culture's rules. */
function sourceFor(culture: Culture, slot: ChildSlot): NamingSource | undefined {
  const r = culture.namingRules;
  if (slot.sex === "male") {
    if (slot.ordinal <= 1) return r.eldestSon;
    if (slot.ordinal === 2) return r.secondSon;
    return undefined;
  }
  if (slot.ordinal <= 1) return r.eldestDaughter;
  if (slot.ordinal === 2) return r.secondDaughter;
  return undefined;
}

/**
 * Name a child by the culture's convention: resolve the named-after relative for
 * this birth-order slot and, if known, reuse that given name (the dynastic
 * naming pattern); otherwise fall back to a seeded pick from the pool. Returns
 * the resolved relative source too, so callers can apply regnal/junior suffixing.
 */
export function nameChild(
  culture: Culture,
  slot: ChildSlot,
  kin: KinNames,
  rng: Rng,
): { name: string; source: NamingSource | null } {
  const source = sourceFor(culture, slot);
  if (source) {
    const inherited = kin[source];
    if (inherited) return { name: inherited, source };
  }
  return { name: pickGivenName(culture, slot.sex, rng), source: null };
}

/**
 * The full given name with any convention suffix. `junior_suffix` cultures append
 * " Jr." then Roman numerals; `patronymic_christian_name` / regnal styles use
 * Roman numerals from the second bearer; `patronymic_nasab` (Arabic) uses NO
 * regnal numeral — repeated given names are distinguished by the nasab (ibn/bint)
 * chain, not by numbering — so the bare given name is returned. `generation` is
 * how many prior bearers of this exact name precede the child.
 */
export function applySuffix(culture: Culture, name: string, generation: number): string {
  if (generation <= 0) return name;
  if (culture.convention === "patronymic_nasab") return name;
  if (culture.convention === "junior_suffix") {
    return generation === 1 ? `${name} Jr.` : `${name} ${toRoman(generation + 1)}`;
  }
  // patronymic / regnal styles use Roman numerals from the second bearer.
  return `${name} ${toRoman(generation + 1)}`;
}

/** Small Roman-numeral formatter (sufficient for dynastic generations). */
function toRoman(n: number): string {
  const table: Array<[number, string]> = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let out = "";
  let rem = n;
  for (const [value, sym] of table) {
    while (rem >= value) {
      out += sym;
      rem -= value;
    }
  }
  return out;
}
