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

/**
 * Neutral family-name suggestions for cultures whose own pool isn't authored yet — a
 * place-agnostic fallback so the surname bestowal beat (PL-3) always has options.
 */
const NEUTRAL_SURNAMES = [
  "Calloway",
  "Mercer",
  "Thornbury",
  "Aldridge",
  "Whitlock",
  "Ravensworth",
  "Penhallow",
  "Castellan",
] as const;

/**
 * SURNAME SUGGESTIONS (PL-3 diegetic bestowal). A seeded, de-duplicated selection of
 * `count` culture-appropriate family names the player may pick at the naming beat (or
 * decline, and name their own via the modal). Draws from the culture's `surnames` pool,
 * topping up from the neutral pool if the culture pool is short, so the beat always has
 * enough distinct options. Pure + seeded → same (culture, seed, count) → same offer.
 */
export function suggestSurnames(culture: Culture, rng: Rng, count = 3): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const draw = (pool: readonly string[], r: Rng) => {
    const bag = [...pool];
    // Seeded Fisher-Yates so the offered set is order-stable for a given seed.
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(r.next() * (i + 1));
      [bag[i], bag[j]] = [bag[j] as string, bag[i] as string];
    }
    for (const s of bag) {
      if (out.length >= count) break;
      if (!seen.has(s)) {
        seen.add(s);
        out.push(s);
      }
    }
  };
  draw(culture.surnames, rng.fork("surname:culture"));
  if (out.length < count) draw(NEUTRAL_SURNAMES, rng.fork("surname:neutral"));
  return out;
}

/**
 * GIVEN-NAME SUGGESTIONS (OB-3 diegetic bestowal) — the parallel of suggestSurnames for the
 * founder's first name. A seeded, de-duplicated selection of `count` culture- + sex-
 * appropriate given names the player picks from at the naming beat (or types their own).
 * Always has options (the culture pools are non-empty by schema). Pure + seeded.
 */
export function suggestGivenNames(culture: Culture, sex: Sex, rng: Rng, count = 3): string[] {
  const pool = sex === "male" ? culture.givenMale : culture.givenFemale;
  const bag = [...pool];
  const r = rng.fork(`given:${sex}`);
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(r.next() * (i + 1));
    [bag[i], bag[j]] = [bag[j] as string, bag[i] as string];
  }
  const out: string[] = [];
  const seen = new Set<string>();
  for (const s of bag) {
    if (out.length >= count) break;
    if (!seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  }
  return out;
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
