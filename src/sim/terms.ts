import type { BranchKey } from "./branch";
import type { Term, TermsFile } from "./schema";

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
