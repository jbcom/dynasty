import { describe, expect, it } from "vitest";
import { computeDepth, estPlaytimeMinutes, lineageRuns, READ_WPM } from "../playtimeDepth";

/**
 * PLAYTIME-DEPTH-AUDIT — a durable floor on the retained class-keyed corpus/fabric depth. The live played
 * hour+ proof is the authored spine playtest; this guard remains so the wave/class source material does not
 * silently thin.
 */

const rows = lineageRuns(); // sorted shortest→longest

describe("playtime depth metric", () => {
  it("computeDepth sums scenes / paragraphs / words / beats / decisions", () => {
    // computeDepth reads only prose, beats.length, and decision truthiness — so a minimal structural stub
    // (cast through the real Scene[] param) suffices without `any`: a quiet Scene and a beat+decision one.
    const stub = [
      { id: "a", sense: "sight", prose: ["one two three", "four five"], beats: [] },
      {
        id: "b",
        sense: "sound",
        prose: ["six"],
        beats: [{}, {}],
        decision: { prompt: "?", options: [] },
      },
    ] as unknown as Parameters<typeof computeDepth>[0];
    const d = computeDepth(stub);
    expect(d.scenes).toBe(2);
    expect(d.paragraphs).toBe(3);
    expect(d.words).toBe(6); // "one two three" (3) + "four five" (2) + "six" (1)
    expect(d.beats).toBe(2);
    expect(d.decisions).toBe(1);
  });

  it("estPlaytimeMinutes scales with read pace + deliberation", () => {
    const base = estPlaytimeMinutes({
      scenes: 1,
      paragraphs: 1,
      words: READ_WPM,
      beats: 0,
      decisions: 0,
    });
    expect(base).toBeCloseTo(1, 5); // READ_WPM words = exactly 1 minute of reading
    const withDecisions = estPlaytimeMinutes({
      scenes: 1,
      paragraphs: 1,
      words: READ_WPM,
      beats: 0,
      decisions: 3,
    });
    expect(withDecisions).toBeGreaterThan(base); // deliberation adds time
  });

  it("FABRIC FLOOR: the median retained lineage file clears a 40-minute scene-depth floor", () => {
    expect(rows.length).toBeGreaterThan(0);
    const median = rows[Math.floor(rows.length / 2)];
    // The retained fabric should stay substantive even though the live play route is the authored spine.
    expect(
      median?.minutes,
      `median lineage run ~${median?.minutes.toFixed(0)} min`,
    ).toBeGreaterThan(40);
  });

  it("NO STARVED PATH: even the thinnest lineage run carries a substantive run (>25 min of scenes)", () => {
    const thinnest = rows[0];
    expect(
      thinnest?.minutes,
      `thinnest path ${thinnest?.name} ~${thinnest?.minutes.toFixed(0)} min`,
    ).toBeGreaterThan(25);
  });
});
