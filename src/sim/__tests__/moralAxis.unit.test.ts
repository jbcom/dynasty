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
    expect(
      moralPoleOf(make([], { ideology: -90, grandiosity: -50, outward: -90, inward: 0 })),
    ).toBe("utopian");
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
    // nazi pole comes from the run's reich_*_pole flag, NOT the branch marker:
    // its "utopia" (the New Order perfected) is monstrous-but-coherent.
    expect(moralPoleLabel(make(["axis_ascendant", "reich_america_utopian"]))).toBe(
      "the New Order perfected",
    );
    expect(moralPoleLabel(make(["axis_ascendant", "reich_dictatorial_pole"]))).toBe(
      "the iron Reich",
    );
    // the branch marker alone (no pole flag) → personality fallback (centrist).
    expect(moralPoleLabel(make(["axis_ascendant"]))).toBe("the administered Reich");
  });

  it("every branch's three pole flags resolve to the right pole (nb-003 coverage)", () => {
    const cases: Array<[string[], "utopian" | "centrist" | "dictatorial"]> = [
      [["reich_america_utopian"], "utopian"],
      [["reich_centrist_pole"], "centrist"],
      [["reich_interstellar_conquest"], "dictatorial"],
      [["interstellar_trade_commonwealth"], "utopian"],
      [["monopoly_trade_regime"], "centrist"],
      [["alien_subjugation"], "dictatorial"],
      [["media_utopian_pole"], "utopian"],
      [["media_centrist_pole"], "centrist"],
      [["media_dictatorial_pole"], "dictatorial"],
      [["pole_utopian"], "utopian"],
      [["pole_dictatorial"], "dictatorial"],
      [["communion_theology_pole"], "utopian"],
      [["theodicy_of_fire_pole"], "dictatorial"],
      [["missionary_uplift"], "utopian"],
    ];
    for (const [flags, pole] of cases) {
      expect(moralPoleOf(make(flags)), flags.join()).toBe(pole);
    }
  });
});
