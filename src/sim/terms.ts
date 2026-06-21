import { formatBirthDate } from "./birthDate";
import type { BranchKey } from "./branch";
import type { Term, TermsFile } from "./schema";
import type { GameState } from "./state";

/**
 * FOUNDED-LINE IDENTITY RESOLUTION (CP-R1).
 *
 * The protagonist's identity is NOT a literal preset (no "Donald"/"Trump" — see
 * the literal-layer dissolution). It comes from the run's LIVE FAMILY TREE: the
 * current protagonist member's given name + the founded surname. Content authors
 * write `{given_name}` / `{full_name}` / `{surname}` / `{family_name}` tokens; at
 * render time they resolve to whatever the player's founded line is actually
 * called, on every (place × culture) origin. There is no literal fallback — every
 * run is founded, so the founded line is the single source of truth for the name.
 *
 * The static branch terms table (terms.json) still owns INSTITUTIONAL tokens
 * (head_of_state, the_nation, …) which are branch-relative, not identity. Only the
 * four IDENTITY tokens are overridden from the founded line.
 */

/** The four identity tokens resolved from the founded line, not the branch terms. */
const IDENTITY_TOKENS = ["given_name", "surname", "full_name", "family_name"] as const;

/** The current protagonist's given name + founded surname, or undefined if not yet founded. */
function foundedIdentity(state: GameState): { given: string; surname: string } | undefined {
  const fam = state.family;
  if (!fam) return undefined;
  const me = fam.members.find((m) => m.id === fam.protagonistId);
  if (!me) return undefined;
  return { given: me.given, surname: me.surname };
}

/**
 * Build the per-run terms table: the static branch-resolved terms for every token,
 * with the four IDENTITY tokens overridden by the run's founded line. This is the
 * single seam the UI + read-model resolve player-facing names through, so a founded
 * Irish-Catholic or Abbasid line renders its OWN name everywhere, not a preset.
 */
export function runTerms(
  terms: TermsFile["terms"],
  branch: BranchKey,
  state: GameState,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, term] of Object.entries(terms)) {
    out[key] = resolveTerm(term, branch);
  }
  const id = foundedIdentity(state);
  if (id) {
    out.given_name = id.given;
    out.surname = id.surname;
    out.full_name = `${id.given} ${id.surname}`;
    out.family_name = `${id.surname}s`;
  }
  // The doctor's-notes birth date (OB-4) for the Epoch-0 birth beat — "September 6, 1885".
  if (state.birthDate) {
    out.birth_date = formatBirthDate(state.birthDate, state.birthYear);
  }
  return out;
}

/** The identity-token keys that the founded line overrides (for callers that filter). */
export { IDENTITY_TOKENS };

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
 * Interpolate every `{token}` in `text` using a RESOLVED terms table (a flat
 * `token → value` map, as produced by `runTerms` — branch-resolved with the
 * founded-line identity overrides already applied). Unknown tokens are left
 * verbatim (so non-term braces handled elsewhere are untouched). `{{` and `}}`
 * are escapes for literal braces. Single left-to-right pass, so there is no
 * sentinel-collision hazard.
 */
export function applyTerms(text: string, resolved: Record<string, string>): string {
  if (!text.includes("{")) return text;
  return text.replace(/\{\{|\}\}|\{(\w+)\}/g, (whole, key: string | undefined) => {
    if (whole === "{{") return "{";
    if (whole === "}}") return "}";
    const value = key ? resolved[key] : undefined;
    return value ?? whole;
  });
}
