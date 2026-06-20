import { describe, expect, it } from "vitest";
import { moralPoleLabel, moralPoleOf } from "../moralAxis";
import { initPersonality } from "../personality";

const make = (flags: string[], personality = initPersonality()) => ({ flags, personality });

describe("branch moral axis (task-022)", () => {
  it("explicit pole flags decide the pole within a branch's value system", () => {
    expect(moralPoleOf(make(["covenant_commonwealth"]))).toBe("utopian");
    expect(moralPoleOf(make(["managed_oligopoly"]))).toBe("centrist");
    expect(moralPoleOf(make(["gilead_regime"]))).toBe("dictatorial");
  });

  it("the darkest authored signal wins when poles conflict", () => {
    expect(moralPoleOf(make(["covenant_commonwealth", "gilead_regime"]))).toBe("dictatorial");
  });

  it("falls back to the personality tyranny↔utopia axis with no pole flag", () => {
    // tyrannyUtopiaAxis is dominated by `outward` (the world's perception).
    expect(moralPoleOf(make([], { ideology: -90, grandiosity: -50, outward: -90, inward: 0 }))).toBe(
      "utopian",
    );
    expect(moralPoleOf(make([], { ideology: 90, grandiosity: 90, outward: 90, inward: 0 }))).toBe(
      "dictatorial",
    );
    expect(moralPoleOf(make([], initPersonality()))).toBe("centrist");
  });

  it("labels the pole in the branch's own terms (a Reich utopia is not our utopia)", () => {
    // theocracy utopia = the Covenant Commonwealth
    expect(moralPoleLabel(make(["evangelical_scion", "covenant_commonwealth"]))).toBe(
      "the Covenant Commonwealth",
    );
    // theocracy dictatorial = Gilead
    expect(moralPoleLabel(make(["evangelical_scion", "gilead_regime"]))).toBe("Gilead");
    // nazi "utopia" is the New Order perfected (monstrous-but-coherent)
    expect(moralPoleLabel(make(["axis_ascendant"]))).toBe("the iron Reich");
  });
});
