import { describe, expect, it } from "vitest";
import { ERA_BAND_ORDER } from "../../genai/portrait";
import {
  allNarrationJobs,
  NARRATION_BEATS,
  narrationKey,
  narrationText,
  narrationVoice,
} from "../genaiNarration";

describe("genaiNarration (GA-TTS GT-1)", () => {
  it("narrationKey is the stable narration:<beat>:<era> composite", () => {
    expect(narrationKey("founding", "founding_1700s")).toBe("narration:founding:founding_1700s");
    expect(narrationKey("finale", "stellar")).toBe("narration:finale:stellar");
  });

  it("narrationText is beat- and era-specific (the founding read differs from the finale, 1700s from stellar)", () => {
    expect(narrationText("founding", "founding_1700s")).not.toBe(
      narrationText("finale", "founding_1700s"),
    );
    expect(narrationText("founding", "founding_1700s")).not.toBe(
      narrationText("founding", "stellar"),
    );
    // Period registers come through.
    expect(narrationText("founding", "founding_1700s")).toMatch(/new country|begins|line/i);
    expect(narrationText("finale", "stellar")).toMatch(/stars/i);
  });

  it("narrationVoice shifts register across eras (a founding voice differs from the star-age voice)", () => {
    expect(narrationVoice("founding_1700s")).not.toBe(narrationVoice("stellar"));
    // Every era resolves to a non-empty prebuilt voice name.
    for (const era of ERA_BAND_ORDER) {
      expect(narrationVoice(era).length).toBeGreaterThan(0);
    }
  });

  it("allNarrationJobs covers every beat × era, keyed/texted/voiced consistently", () => {
    const jobs = allNarrationJobs();
    expect(jobs.length).toBe(NARRATION_BEATS.length * ERA_BAND_ORDER.length);
    for (const j of jobs) {
      expect(j.key).toBe(narrationKey(j.beat, j.eraBand));
      expect(j.text).toBe(narrationText(j.beat, j.eraBand));
      expect(j.voice).toBe(narrationVoice(j.eraBand));
    }
    // No duplicate keys.
    expect(new Set(jobs.map((j) => j.key)).size).toBe(jobs.length);
  });
});
