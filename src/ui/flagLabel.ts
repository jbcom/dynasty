/**
 * DOSSIER FLAG PRESENTATION (PL-10). Run flags are an internal vocabulary — structural
 * markers (`place:…`, `founded:…`), lifecycle bookkeeping (`emerged`, `named`, `partnered`),
 * and prologue activation keys retained as machine names (`kennedy_dynasty_active`,
 * `trump_prologue`). Dumping them raw into the player-facing Dossier leaked implementation
 * (and even the dissolved preset-family names) into the UI. This module decides which flags
 * are worth SHOWING and renders the rest as readable prose. Pure + dependency-free.
 */

/** Structural prefixes that are pure machinery — never shown to the player. */
const HIDDEN_PREFIXES = ["place:", "culture:", "archetype:", "founded:", "heir_", "mkt_"];

/** Exact internal lifecycle/bookkeeping flags that carry no narrative meaning for the player. */
const HIDDEN_EXACT = new Set([
  "founded_line",
  "emerged",
  "gender_revealed",
  "named",
  "calling_chosen",
  "partnered",
  "raised_heirs",
  "succession_occurred",
  "deep_history_line",
]);

/**
 * Substrings that mark a flag as INTERNAL prologue/activation vocabulary — including the
 * dissolved preset-family keys (`trump_*`, `kennedy_*`, `musk_*`) which must NEVER surface
 * in the player UI (the 0-leak invariant). A flag containing any of these is hidden.
 */
const HIDDEN_SUBSTRINGS = ["prologue", "dynasty_active", "dynasty_capital", "_lineage"];
const PRESET_KEYS = ["trump", "kennedy", "musk", "drumpf"];

/** Whether a flag is internal machinery that should not appear in the Dossier. */
export function isHiddenFlag(flag: string): boolean {
  if (HIDDEN_EXACT.has(flag)) return true;
  if (HIDDEN_PREFIXES.some((p) => flag.startsWith(p))) return true;
  if (HIDDEN_SUBSTRINGS.some((s) => flag.includes(s))) return true;
  // Preset-family keys are leak-hygiene critical — match on a leading token so a real
  // word that merely contains the substring isn't over-filtered.
  const head = flag.split(/[_:]/)[0] ?? "";
  if (PRESET_KEYS.includes(head)) return true;
  return false;
}

/** Humanize a flag id into readable copy: `married_up` → "Married up", `wwi` → "Wwi". */
export function humanizeFlag(flag: string): string {
  const words = flag.replace(/[_:]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** The player-facing, humanized, de-duplicated, sorted flag labels for a run's flags. */
export function visibleFlagLabels(flags: readonly string[]): string[] {
  const labels = new Set<string>();
  for (const f of flags) {
    if (isHiddenFlag(f)) continue;
    labels.add(humanizeFlag(f));
  }
  // Default sort (not localeCompare) — locale-independent + deterministic across
  // environments, so the Dossier order is stable in tests + on every device (review).
  return [...labels].sort();
}
