/**
 * VD-6/7 — load a dossier's path-voice BRIEF (generated offline by scripts/genai-dossiers.ts, keyed kind×era
 * via dossierBriefKey). Bundled JSON map, like the scene corpus — no API at runtime (sim purity). Returns
 * undefined for an unauthored key, so the BriefPanel shows its pending/quiet state and the dossier still reads.
 */
import briefs from "../../data/dossierBriefs.json" with { type: "json" };

const MAP = briefs as Record<string, string[]>;

/** The brief paragraphs for a dossier brief key, or undefined if not generated yet. */
export function loadDossierBrief(briefKey: string): string[] | undefined {
  return MAP[briefKey];
}
