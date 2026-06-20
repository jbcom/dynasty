import { describe, expect, it } from "vitest";
import { METER_CSS_VAR, formatMoney } from "../theme";

describe("formatMoney", () => {
  it("formats across magnitudes", () => {
    expect(formatMoney(900)).toBe("$900");
    expect(formatMoney(12_000)).toBe("$12K");
    expect(formatMoney(340_000_000)).toBe("$340.0M");
    expect(formatMoney(1_200_000_000)).toBe("$1.2B");
    expect(formatMoney(2_500_000_000_000)).toBe("$2.5T");
  });

  it("handles negatives and zero", () => {
    expect(formatMoney(0)).toBe("$0");
    expect(formatMoney(-5000)).toBe("-$5K");
  });
});

describe("METER_CSS_VAR", () => {
  it("maps every meter to a token var", () => {
    for (const v of Object.values(METER_CSS_VAR)) {
      expect(v).toMatch(/^var\(--mmm-meter-/);
    }
  });
});
