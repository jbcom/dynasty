import { classify, detectFormFactor, type FormFactorInfo } from "../engine/formFactor";

/**
 * Reactive form-factor store for the medium-native HUD. Resolves the Capacitor
 * Device profile once, then tracks viewport resizes so the layout adapts live
 * (phone → compact stack; tablet/foldable → wider diegetic surfaces).
 */
export class FormFactorStore {
  info = $state<FormFactorInfo>(classify(412, 915));
  private onResize = (): void => {
    if (typeof window !== "undefined") {
      this.info = classify(window.innerWidth, window.innerHeight, this.info.factor !== "phone");
    }
  };

  start(): () => void {
    void detectFormFactor().then((i) => {
      this.info = i;
    });
    if (typeof window !== "undefined") {
      window.addEventListener("resize", this.onResize);
      return () => window.removeEventListener("resize", this.onResize);
    }
    return () => {};
  }
}
