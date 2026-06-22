import { describe, expect, it } from "vitest";
import { rampForEra } from "../../render/palettes";
import { chordForEra } from "../../ui/sound";
import { bandForEra, ERA_BANDS } from "../eras";

/**
 * RB-10 anti-drift invariant: the audio chord (chordForEra, ui/sound.ts) and the visual wash
 * (rampForEra, render/palettes.ts) BOTH resolve through the one ERA_BANDS table — so for any era id
 * they agree on the band. If someone changes a chord or a ramp without going through eras.ts, or adds
 * an era to one cue and not the other, this fails. (Browser test because sound.ts pulls the audio
 * engine, which isn't node-safe.)
 */

describe("era cue agreement (RB-10)", () => {
  // A sample id from every band family + a default-fallback id.
  const samples = [
    "origins-1885",
    "mogul-1964",
    "primetime-brand",
    "mars-interregnum",
    "interstellar-stars",
    "Ascension", // macro-act title
    "totally-unmapped", // → default origins band
  ];

  it("chordForEra and rampForEra resolve to the SAME band for every sample era", () => {
    for (const id of samples) {
      const band = bandForEra(id);
      // The audio chord is exactly the band's chord.
      expect(chordForEra(id)).toEqual([...band.chord]);
      // The visual ramp is exactly the band's ramp (+ id).
      expect(rampForEra(id)).toEqual({ id: band.id, top: band.ramp.top, bottom: band.ramp.bottom });
    }
  });

  it("covers every band — each band id is reachable by some sample (no orphan band)", () => {
    const reached = new Set(samples.map((id) => bandForEra(id).id));
    for (const b of ERA_BANDS) expect(reached.has(b.id)).toBe(true);
  });
});
