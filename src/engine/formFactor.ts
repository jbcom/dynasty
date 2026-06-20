/**
 * Form-factor detection. Combines the Capacitor Device profile (on native) with
 * viewport measurement (everywhere) so the UI can present medium-native surfaces:
 * a compact button stack on phones, but richer diegetic framing (newspaper / TV
 * broadcast / wide dossier) on tablets and unfolded foldables.
 */
export type FormFactor = "phone" | "tablet" | "foldable";

export interface FormFactorInfo {
  factor: FormFactor;
  width: number;
  height: number;
  /** Landscape + wide enough for side-by-side diegetic panels. */
  wide: boolean;
}

/** Classify from raw viewport dimensions (pure — testable without a device). */
export function classify(width: number, height: number, isTabletDevice = false): FormFactorInfo {
  const longest = Math.max(width, height);
  const shortest = Math.min(width, height);
  const aspect = longest / Math.max(1, shortest);

  // A foldable unfolds to a near-square, large display (aspect < 1.4, big min side).
  const foldable = shortest >= 580 && aspect < 1.4;
  const tablet = isTabletDevice || foldable || shortest >= 600;

  const factor: FormFactor = foldable ? "foldable" : tablet ? "tablet" : "phone";
  return { factor, width, height, wide: width > height && width >= 720 };
}

/** Measure the current viewport (browser). */
export function currentViewport(): { width: number; height: number } {
  if (typeof window === "undefined") return { width: 412, height: 915 };
  return { width: window.innerWidth, height: window.innerHeight };
}

/**
 * Resolve the form factor, consulting the Capacitor Device plugin on native for
 * a more reliable tablet signal. Lazy-imported + guarded so web/test builds are
 * unaffected. Returns a viewport-only classification synchronously via classify().
 */
export async function detectFormFactor(): Promise<FormFactorInfo> {
  const { width, height } = currentViewport();
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
  return classify(width, height, isTabletDevice);
}
