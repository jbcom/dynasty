import { describe, expect, it } from "vitest";
import { classify } from "../formFactor";

describe("form-factor classify", () => {
  it("treats a tall narrow viewport as a phone", () => {
    const f = classify(412, 915);
    expect(f.factor).toBe("phone");
    expect(f.wide).toBe(false);
  });

  it("treats a large min-side viewport as a tablet", () => {
    expect(classify(820, 1180).factor).toBe("tablet");
  });

  it("treats a near-square large display as a foldable", () => {
    // Unfolded foldable: big short side, low aspect ratio.
    expect(classify(1768, 2208).factor).toBe("foldable");
    expect(classify(900, 840).factor).toBe("foldable");
  });

  it("honors the native tablet-device hint", () => {
    // Even a phone-ish viewport flagged as a tablet device classifies as tablet.
    expect(classify(500, 800, true).factor).toBe("tablet");
  });

  it("keeps phone-landscape compact while allowing true tablet landscape split", () => {
    expect(classify(915, 412).factor).toBe("phone");
    expect(classify(915, 412).wide).toBe(false);
    expect(classify(1280, 720).wide).toBe(true);
  });

  it("treats tablet portrait as wide enough for the split play surface", () => {
    const f = classify(820, 1180);
    expect(f.factor).toBe("tablet");
    expect(f.wide).toBe(true);
    expect(f.orientation).toBe("portrait");
  });

  it("treats segmented viewports as foldable for unfolded/posture-aware layouts", () => {
    const f = classify(720, 900, false, 2);
    expect(f.factor).toBe("foldable");
    expect(f.viewportSegments).toBe(2);
    expect(f.wide).toBe(true);
  });
});
