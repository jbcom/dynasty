/**
 * Portrait registry. Maps a portrait id (referenced by events) to its layered
 * art. Until real caricature assets land (Phase E), every portrait resolves to a
 * procedural placeholder so the compositing pipeline is fully exercised and the
 * UI never shows a broken image.
 */
export interface PortraitLayer {
  /** Asset path (resolved against /assets), or null for a generated layer. */
  src: string | null;
  /** z-order; lower draws first. */
  z: number;
  /** Optional CSS class for procedural styling of generated layers. */
  variant?: string;
}

export interface PortraitDef {
  id: string;
  label: string;
  /** Accent used by the procedural placeholder + frame. */
  accent: string;
  layers: PortraitLayer[];
}

const PLACEHOLDER_LAYERS: PortraitLayer[] = [
  { src: null, z: 0, variant: "bg" },
  { src: null, z: 1, variant: "silhouette" },
];

/** Known portrait ids across the life arc; each gets art in Phase E. */
export const PORTRAITS: Record<string, PortraitDef> = {
  infant: { id: "infant", label: "Infant", accent: "var(--mmm-meter-loyalty)", layers: PLACEHOLDER_LAYERS },
  cadet: { id: "cadet", label: "Cadet", accent: "var(--mmm-meter-power)", layers: PLACEHOLDER_LAYERS },
  young_mogul: { id: "young_mogul", label: "Young Mogul", accent: "var(--mmm-gold)", layers: PLACEHOLDER_LAYERS },
  mogul: { id: "mogul", label: "Mogul", accent: "var(--mmm-gold)", layers: PLACEHOLDER_LAYERS },
  celebrity: { id: "celebrity", label: "Celebrity", accent: "var(--mmm-meter-reputation)", layers: PLACEHOLDER_LAYERS },
  candidate: { id: "candidate", label: "Candidate", accent: "var(--mmm-red)", layers: PLACEHOLDER_LAYERS },
  president: { id: "president", label: "President", accent: "var(--mmm-red)", layers: PLACEHOLDER_LAYERS },
  exile: { id: "exile", label: "Exile", accent: "var(--mmm-meter-heat)", layers: PLACEHOLDER_LAYERS },
  emperor: { id: "emperor", label: "Emperor", accent: "var(--mmm-gold-bright)", layers: PLACEHOLDER_LAYERS },
  survivor: { id: "survivor", label: "Survivor", accent: "var(--mmm-meter-heat)", layers: PLACEHOLDER_LAYERS },
  unifier: { id: "unifier", label: "Unifier", accent: "var(--mmm-startrek)", layers: PLACEHOLDER_LAYERS },
  martian: { id: "martian", label: "Martian Patriarch", accent: "var(--mmm-meter-heat)", layers: PLACEHOLDER_LAYERS },
};

const FALLBACK: PortraitDef = {
  id: "unknown",
  label: "Unknown",
  accent: "var(--mmm-text-dim)",
  layers: PLACEHOLDER_LAYERS,
};

/** Resolve a portrait id to its definition, never throwing (falls back). */
export function resolvePortrait(id: string): PortraitDef {
  return PORTRAITS[id] ?? FALLBACK;
}
