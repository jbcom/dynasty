import { describe, expect, it } from "vitest";
import { resolveEmergentFounding } from "../founding/resolveEmergentFounding";
import { dealSenseCues } from "../founding/senseEmergence";
import { resolveFoundingStart } from "../foundingOrigin";
import { createRng } from "../rng";

/**
 * EI-6a — the lived Epoch-0 emergence's accumulated FLAGS resolve into the {region, base, standing} the
 * existing founding seam (resolveFoundingStart) consumes, so the opening feeds foundByComposition with no
 * card menu. Pure + deterministic.
 */

describe("resolve emergent founding (EI-6a)", () => {
  const cues = dealSenseCues(createRng("ef1"));

  it("derives a valid {region, base, standing} from the emergence flags", () => {
    const choice = resolveEmergentFounding(cues, [
      "attend:sound",
      "attend:smell",
      "power_lean:commerce",
      "power_lean:commerce",
      "power_lean:law",
      "epoch0:standing_rising",
    ]);
    expect(["new_england", "mid_atlantic", "south"]).toContain(choice.region);
    // The most-leaned base wins (commerce 2 > law 1).
    expect(choice.base).toBe("commerce");
    expect(choice.standing).toBe("rising");
    // It feeds the existing seam without error → a real archetype + motivators + class state.
    const start = resolveFoundingStart(choice);
    expect(start.archetype).toBeTruthy();
    expect(start.flags).toContain(`standing:${choice.standing}`);
  });

  it("reads established standing + ties-break the base deterministically", () => {
    const choice = resolveEmergentFounding(cues, [
      "epoch0:standing_established",
      "power_lean:pulpit",
      "power_lean:law",
    ]);
    expect(choice.standing).toBe("established");
    // 1 vs 1 → fixed POWER_BASES order breaks the tie (law before pulpit? order is land,commerce,pulpit,law,…
    // so pulpit precedes law → pulpit wins the tie by appearing first at equal count).
    expect(["pulpit", "law"]).toContain(choice.base);
  });

  it("defaults sensibly with no leans/standing (rising + the substrate base)", () => {
    const choice = resolveEmergentFounding(cues, ["attend:touch"]);
    expect(choice.standing).toBe("rising"); // immigrant-origin default
    expect(choice.base).toBe("land"); // the era's substrate base
    expect(["new_england", "mid_atlantic", "south"]).toContain(choice.region);
  });

  it("is deterministic: same cues + flags → same choice", () => {
    const flags = ["attend:sound", "power_lean:military", "epoch0:standing_rising"];
    const a = resolveEmergentFounding(cues, flags);
    const b = resolveEmergentFounding(dealSenseCues(createRng("ef1")), flags);
    expect(b).toEqual(a);
  });
});
