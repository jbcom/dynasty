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

/** Procedural fallback layers (used only when a portrait has no art). */
const PLACEHOLDER_LAYERS: PortraitLayer[] = [
  { src: null, z: 0, variant: "bg" },
  { src: null, z: 1, variant: "silhouette" },
];

/** Build the standard layer stack for an authored caricature portrait. */
function art(id: string): PortraitLayer[] {
  return [{ src: `portraits/${id}.svg`, z: 1 }];
}

/**
 * Layer stack pairing a cartoonified real photo over the procedural backdrop.
 * The source photo is public-domain / CC0; `scripts/cartoonify.mjs` posterizes
 * + inks it into a stylized cartoon at build time, so shipped art is a derived
 * caricature anchored to a genuinely free source. The gold frame ties it to brand.
 */
function cartoon(file: string): PortraitLayer[] {
  return [
    { src: null, z: 0, variant: "bg" },
    { src: `portraits/${file}.cartoon.png`, z: 1 },
  ];
}

/** Known portrait ids across the life arc; each maps to an authored SVG caricature. */
export const PORTRAITS: Record<string, PortraitDef> = {
  infant: {
    id: "infant",
    label: "Infant",
    accent: "var(--mmm-meter-loyalty)",
    layers: cartoon("child_1948"),
  },
  cadet: {
    id: "cadet",
    label: "Cadet",
    accent: "var(--mmm-meter-power)",
    layers: cartoon("nyma_grad"),
  },
  young_mogul: {
    id: "young_mogul",
    label: "Young Mogul",
    accent: "var(--mmm-gold)",
    layers: cartoon("central_park"),
  },
  mogul: { id: "mogul", label: "Mogul", accent: "var(--mmm-gold)", layers: art("mogul") },
  celebrity: {
    id: "celebrity",
    label: "Celebrity",
    accent: "var(--mmm-meter-reputation)",
    layers: cartoon("celebrity_2014"),
  },
  candidate: {
    id: "candidate",
    label: "Candidate",
    accent: "var(--mmm-red)",
    layers: cartoon("candidate_2015"),
  },
  president: {
    id: "president",
    label: "President",
    accent: "var(--mmm-red)",
    layers: cartoon("president_2025"),
  },
  exile: { id: "exile", label: "Exile", accent: "var(--mmm-meter-heat)", layers: art("exile") },
  emperor: {
    id: "emperor",
    label: "Emperor",
    accent: "var(--mmm-gold-bright)",
    layers: art("emperor"),
  },
  survivor: {
    id: "survivor",
    label: "Survivor",
    accent: "var(--mmm-meter-heat)",
    layers: art("survivor"),
  },
  unifier: {
    id: "unifier",
    label: "Unifier",
    accent: "var(--mmm-startrek)",
    layers: art("unifier"),
  },
  martian: {
    id: "martian",
    label: "Martian Patriarch",
    accent: "var(--mmm-meter-heat)",
    layers: art("martian"),
  },
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
