/**
 * Form-factor detection. Combines the Capacitor Device profile (on native) with
 * viewport measurement (everywhere) so the UI can present medium-native surfaces:
 * a compact button stack on phones, but richer diegetic framing (newspaper / TV
 * broadcast / wide dossier) on tablets and unfolded foldables.
 */
export type FormFactor = "phone" | "tablet" | "foldable";
export type Orientation = "portrait" | "landscape";

/** Standard foldable viewport media queries (supported variably by engine/device). */
export const FOLDABLE_MEDIA_QUERIES = [
  "(horizontal-viewport-segments: 2)",
  "(vertical-viewport-segments: 2)",
  "(spanning: single-fold-vertical)",
  "(spanning: single-fold-horizontal)",
] as const;

export interface FormFactorInfo {
  factor: FormFactor;
  width: number;
  height: number;
  orientation: Orientation;
  /** Number of viewport segments (2 indicates a hinge/split viewport when exposed). */
  viewportSegments: number;
  /** Native-device tablet hint (Capacitor), persisted across runtime resizes. */
  isTabletDevice: boolean;
  /** Landscape + wide enough for side-by-side diegetic panels. */
  wide: boolean;
}

/** Classify from raw viewport dimensions (pure — testable without a device). */
export function classify(
  width: number,
  height: number,
  isTabletDevice = false,
  viewportSegments = 1,
): FormFactorInfo {
  const longest = Math.max(width, height);
  const shortest = Math.min(width, height);
  const aspect = longest / Math.max(1, shortest);
  const orientation: Orientation = width >= height ? "landscape" : "portrait";

  // A foldable unfolds to a near-square, large display (aspect < 1.4, big min side).
  const foldableByAspect = shortest >= 580 && aspect < 1.4;
  const foldableBySegments = viewportSegments > 1;
  const foldable = foldableByAspect || foldableBySegments;
  const tablet = isTabletDevice || foldable || shortest >= 700 || (shortest >= 600 && longest >= 960);

  const factor: FormFactor = foldable ? "foldable" : tablet ? "tablet" : "phone";
  // Wide mode is intentionally conservative for phones (including phone-landscape):
  // two-pane surfaces need enough BOTH-WAYS room to keep choices and tabs readable.
  const wide = factor !== "phone" && (orientation === "landscape" || width >= 900 || shortest >= 650);
  return { factor, width, height, orientation, viewportSegments, isTabletDevice, wide };
}

/** Measure the current viewport (browser). */
export function currentViewport(): { width: number; height: number } {
  if (typeof window === "undefined") return { width: 412, height: 915 };
  const vv = window.visualViewport;
  if (vv) {
    return {
      width: Math.max(1, Math.round(vv.width)),
      height: Math.max(1, Math.round(vv.height)),
    };
  }
  return { width: window.innerWidth, height: window.innerHeight };
}

/** Best-effort foldable viewport segment detection via standards-based media queries. */
export function detectViewportSegments(): number {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return 1;
  return FOLDABLE_MEDIA_QUERIES.some((q) => window.matchMedia(q).matches) ? 2 : 1;
}

/**
 * Resolve the form factor, consulting the Capacitor Device plugin on native for
 * a more reliable tablet signal. Lazy-imported + guarded so web/test builds are
 * unaffected. Returns a viewport-only classification synchronously via classify().
 */
export async function detectFormFactor(): Promise<FormFactorInfo> {
  const { width, height } = currentViewport();
  const viewportSegments = detectViewportSegments();
  let isTabletDevice = false;
  try {
    const { Device } = await import("@capacitor/device");
    const info = await Device.getInfo();
    // Capacitor doesn't expose "tablet" directly; infer from the larger min side
    // on native tablets, which the viewport check already captures. Kept as a hook.
    isTabletDevice = info.platform !== "web" && Math.min(width, height) >= 600;
  } catch {
    // Plugin absent (web/test) — viewport classification is enough.
  }
  return classify(width, height, isTabletDevice, viewportSegments);
}
