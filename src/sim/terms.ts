import type { BranchKey } from "./branch";
import type { Term, TermsFile } from "./schema";

/**
 * BIRTH-ORDER GIVEN-NAME RESOLUTION (AH8c × AH8d).
 *
 * Real history: Donald is the FOURTH of five, an heir only because the firstborn
 * (Fred Jr.) rebelled and died — the "accidental heir". The de-4a Era-0 lever
 * lets the player set the family's child configuration; when the protagonist is
 * the FIRST son / only child, the patriarch's name passes to him directly (the
 * groomed dynastic heir) → he becomes "Friedrich III" rather than "Donald",
 * EVEN on branches whose default given name is Donald. This is the naming half
 * of the inheritance dynamic the sibling-count flags drive.
 *
 * Precedence: the firstborn/only-child override wins over the branch default;
 * otherwise the branch term applies (Friedrich on the proud-tradition German
 * lines, Donald elsewhere).
 */
const PATRIARCH_GIVEN = "Friedrich";

/** Does this run's Era-0 birth-order make the protagonist the name-bearing heir? */
export function isNamedHeir(flags: readonly string[]): boolean {
  return flags.includes("firstborn_heir") || flags.includes("only_child");
}

/** The protagonist's given name for a run: birth-order override, else branch term. */
export function resolveGivenName(
  terms: TermsFile["terms"],
  branch: BranchKey,
  flags: readonly string[],
): string {
  if (isNamedHeir(flags)) return PATRIARCH_GIVEN;
  const term = terms.given_name;
  return term ? resolveTerm(term, branch) : "Donald";
}

/** The protagonist's full name: "<given> <surname>", with the dynastic suffix
 *  when the patriarch's name passed to a named heir (Friedrich → "Friedrich <S> III"). */
export function resolveFullName(
  terms: TermsFile["terms"],
  branch: BranchKey,
  flags: readonly string[],
): string {
  const given = resolveGivenName(terms, branch, flags);
  const surnameTerm = terms.surname;
  const surname = surnameTerm ? resolveTerm(surnameTerm, branch) : "Trump";
  // A named heir who carries the patriarch's given name is the third of that name.
  const suffix = isNamedHeir(flags) && given === PATRIARCH_GIVEN ? " III" : "";
  return `${given} ${surname}${suffix}`;
}

/**
 * Branch-aware TERM resolution (alt-history consistency, AH1).
 *
 * Content authors write `{term}` tokens in player-facing strings — e.g.
 * "the {head_of_state} addressed {the_nation}". At render time the token
 * resolves against the run's active branch, so the same authored line reads
 * "the President addressed the United States" on the default line and
 * "the Reichskommissar addressed the American Reichskommissariat" on the Nazi
 * route. Pure and deterministic.
 */

/** Resolve one term to its branch-specific value, falling back to `default`. */
export function resolveTerm(term: Term, branch: BranchKey): string {
  if (branch === "default") return term.default;
  return term[branch] ?? term.default;
}

/**
 * Interpolate every `{token}` in `text` using the terms table for `branch`.
 * Unknown tokens are left verbatim (so non-term braces handled elsewhere are
 * untouched). `{{` and `}}` are escapes for literal braces. Single left-to-right
 * pass, so there is no sentinel-collision hazard.
 */
export function applyTerms(text: string, terms: TermsFile["terms"], branch: BranchKey): string {
  if (!text.includes("{")) return text;
  return text.replace(/\{\{|\}\}|\{(\w+)\}/g, (whole, key: string | undefined) => {
    if (whole === "{{") return "{";
    if (whole === "}}") return "}";
    const term = key ? terms[key] : undefined;
    return term ? resolveTerm(term, branch) : whole;
  });
}
