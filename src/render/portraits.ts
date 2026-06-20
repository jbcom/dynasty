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

/**
 * Layer stack pairing a cartoonified real photo over a brand backdrop. The
 * source photo is public-domain / CC0; `scripts/cartoonify.mjs` posterizes +
 * inks it into a stylized cartoon at build time, so shipped art is a derived
 * caricature (our own work) anchored to a genuinely free source. EVERY portrait
 * uses a cartoon derivative — there are no procedural placeholder portraits.
 */
function cartoon(file: string): PortraitLayer[] {
  return [
    { src: null, z: 0, variant: "bg" },
    { src: `portraits/${file}.cartoon.png`, z: 1 },
  ];
}

/**
 * Known portrait ids across the life arc; each maps to a cartoon derivative.
 * Speculative future stages (emperor/survivor/unifier/martian) reuse the
 * elder/recent cartoons — aged, era-tinted by accent.
 */
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
  mogul: { id: "mogul", label: "Mogul", accent: "var(--mmm-gold)", layers: cartoon("mogul_2008") },
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
  exile: {
    id: "exile",
    label: "Exile",
    accent: "var(--mmm-meter-heat)",
    layers: cartoon("recent_2024"),
  },
  emperor: {
    id: "emperor",
    label: "Emperor",
    accent: "var(--mmm-gold-bright)",
    layers: cartoon("president_2025"),
  },
  survivor: {
    id: "survivor",
    label: "Survivor",
    accent: "var(--mmm-meter-heat)",
    layers: cartoon("elder_2017"),
  },
  unifier: {
    id: "unifier",
    label: "Unifier",
    accent: "var(--mmm-startrek)",
    layers: cartoon("elder_2017"),
  },
  martian: {
    id: "martian",
    label: "Martian Patriarch",
    accent: "var(--mmm-meter-heat)",
    layers: cartoon("recent_2024"),
  },
};

const FALLBACK: PortraitDef = {
  id: "unknown",
  label: "Unknown",
  accent: "var(--mmm-text-dim)",
  layers: cartoon("president_2025"),
};

/** Resolve a portrait id to its definition, never throwing (falls back). */
export function resolvePortrait(id: string): PortraitDef {
  return PORTRAITS[id] ?? FALLBACK;
}
