import {
  classify,
  currentViewport,
  detectFormFactor,
  detectViewportSegments,
  FOLDABLE_MEDIA_QUERIES,
  type FormFactorInfo,
} from "../engine/formFactor";

/**
 * Reactive form-factor store for the medium-native HUD. Resolves the Capacitor
 * Device profile once, then tracks viewport resizes so the layout adapts live
 * (phone → compact stack; tablet/foldable → wider diegetic surfaces).
 */
export class FormFactorStore {
  info = $state<FormFactorInfo>(classify(412, 915));
  private resizeRaf = 0;
  private recompute = (): void => {
    if (typeof window === "undefined") return;
    const { width, height } = currentViewport();
    this.info = classify(width, height, this.info.isTabletDevice, detectViewportSegments());
  };
  private onViewportChange = (): void => {
    if (typeof window === "undefined") return;
    if (this.resizeRaf) return;
    this.resizeRaf = window.requestAnimationFrame(() => {
      this.resizeRaf = 0;
      this.recompute();
    });
  };

  start(): () => void {
    void detectFormFactor().then((i) => {
      this.info = i;
    });
    if (typeof window !== "undefined") {
      const stops: Array<() => void> = [];
      const addWindowListener = (event: "resize" | "orientationchange"): void => {
        window.addEventListener(event, this.onViewportChange);
        stops.push(() => window.removeEventListener(event, this.onViewportChange));
      };
      addWindowListener("resize");
      addWindowListener("orientationchange");

      if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", this.onViewportChange);
        stops.push(() => window.visualViewport?.removeEventListener("resize", this.onViewportChange));
      }

      if (typeof window.matchMedia === "function") {
        for (const query of FOLDABLE_MEDIA_QUERIES) {
          const mql = window.matchMedia(query);
          const listener = (): void => this.onViewportChange();
          mql.addEventListener?.("change", listener);
          mql.addListener?.(listener);
          stops.push(() => {
            mql.removeEventListener?.("change", listener);
            mql.removeListener?.(listener);
          });
        }
      }

      return () => {
        for (const stop of stops) stop();
        if (this.resizeRaf) {
          window.cancelAnimationFrame(this.resizeRaf);
          this.resizeRaf = 0;
        }
      };
    }
    return () => {};
  }
}
