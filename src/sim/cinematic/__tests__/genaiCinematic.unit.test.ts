import { describe, expect, it } from "vitest";
import {
  buildFinalePrompt,
  buildHandoffPrompt,
  CINEMATIC_STYLE,
  cinematicKey,
} from "../genaiCinematic";

/**
 * GA-VIDEO GV-1 — the pure Veo cinematic prompt builders + keys. Period-true, leak-safe (no real likeness/
 * text), deterministic. Generated offline + cached, played via a <video> at the boundary/finale.
 */

describe("GA-VIDEO GV-1 keys", () => {
  it("keys handoff by era band + finale by outcome (run-independent, offline-cached)", () => {
    expect(cinematicKey("handoff", "industrial_late1800s")).toBe(
      "cinematic:handoff:industrial_late1800s",
    );
    expect(cinematicKey("finale", "stars")).toBe("cinematic:finale:stars");
  });
});

describe("GA-VIDEO GV-1 handoff prompt", () => {
  it("films the succession in the era's register, in the locked cinematic style, leak-safe", () => {
    const p = buildHandoffPrompt("founding_1700s");
    expect(p).toMatch(/passing of a family line|succession/i);
    expect(p).toMatch(/colonial|candle/i);
    expect(p).toContain(CINEMATIC_STYLE);
    expect(p).toMatch(/NO real-person likeness/i);
    expect(p).toMatch(/NO on-screen text/i);
  });

  it("the era register tracks the band (founding colonial vs stellar)", () => {
    expect(buildHandoffPrompt("founding_1700s")).toMatch(/colonial/i);
    expect(buildHandoffPrompt("stellar")).toMatch(/stellar|stars/i);
  });
});

describe("GA-VIDEO GV-1 finale prompt", () => {
  it("films the dynastic close by outcome, in the cinematic style", () => {
    expect(buildFinalePrompt("stars")).toMatch(/ascension|stars|cosmos/i);
    expect(buildFinalePrompt("extinguished")).toMatch(/extinction|last of the line|fading/i);
    expect(buildFinalePrompt("contributed")).toContain(CINEMATIC_STYLE);
  });

  it("each outcome reads distinct (the four endings get different films)", () => {
    const outcomes = ["stars", "contributed", "earthbound", "extinguished"] as const;
    expect(new Set(outcomes.map(buildFinalePrompt)).size).toBe(4);
  });
});
