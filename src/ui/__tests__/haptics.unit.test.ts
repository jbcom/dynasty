import { describe, expect, it } from "vitest";
import { effectMagnitude, styleForMagnitude } from "../haptics";

describe("haptics magnitude", () => {
  it("sums absolute meter deltas but ignores money", () => {
    expect(effectMagnitude({ power: 5, reputation: -8 })).toBe(13);
    expect(effectMagnitude({ money: 1_000_000, power: 3 })).toBe(3);
    expect(effectMagnitude({})).toBe(0);
  });

  it("maps magnitude to an impact style", () => {
    expect(styleForMagnitude(2)).toBe("light");
    expect(styleForMagnitude(12)).toBe("medium");
    expect(styleForMagnitude(40)).toBe("heavy");
  });
});
