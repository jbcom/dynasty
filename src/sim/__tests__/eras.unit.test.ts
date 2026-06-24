import { describe, expect, it } from "vitest";
import { bandForEra, DEFAULT_ERA_BAND, ERA_BANDS, trackForEra } from "../eras";
import { MUSIC_TRACKS } from "../music/genaiMusic";

/**
 * Era bands — the single source the audio chord reads (chordForEra in ui/sound.ts). Pure + deterministic:
 * the table is ordered origins → stars, every band carries a chord, and bandForEra resolves by the
 * era-id keyword family (default = origins).
 */

describe("ERA_BANDS", () => {
  it("is ordered origins → stars and every band carries a chord", () => {
    expect(ERA_BANDS.map((b) => b.id)).toEqual([
      "origins",
      "mogul",
      "ascent",
      "interregnum",
      "stars",
    ]);
    for (const b of ERA_BANDS) {
      expect(b.chord.length).toBeGreaterThan(0);
    }
  });

  it("matches each band by its era-id keyword family", () => {
    expect(bandForEra("origins").id).toBe("origins");
    expect(bandForEra("mogul-1964").id).toBe("mogul");
    expect(bandForEra("primetime-brand").id).toBe("ascent");
    expect(bandForEra("mars-interregnum").id).toBe("interregnum");
    expect(bandForEra("interstellar-contact").id).toBe("stars");
    // Macro-act titles carry the same keywords.
    expect(bandForEra("Ascension").id).toBe("stars");
  });

  it("SAGA-AUDIO-ATMOSPHERE: each saga MACRO-ACT maps to a DISTINCT band (the founding→stellar bed arc)", () => {
    // The saga clock runs on macro-acts, not the era ladder; the ambient bed must shift across all four.
    const byAct = {
      founding: bandForEra("founding").id,
      convergence: bandForEra("convergence").id,
      emergence: bandForEra("emergence").id,
      ascension: bandForEra("ascension").id,
    };
    expect(byAct).toEqual({
      founding: "origins",
      convergence: "mogul",
      emergence: "ascent",
      ascension: "stars",
    });
    // Four distinct beds — no two macro-acts collapse to the same chord mood.
    expect(new Set(Object.values(byAct)).size).toBe(4);
  });

  it("falls back to the rooted origins band for an unknown era", () => {
    expect(bandForEra("some-unmapped-period")).toBe(DEFAULT_ERA_BAND);
    expect(DEFAULT_ERA_BAND.id).toBe("origins");
  });

  it("is deterministic — same era id yields the same band", () => {
    expect(bandForEra("stars")).toBe(bandForEra("stars"));
  });

  it("the chord mood shifts across the arc (rooted origins ≠ open stars)", () => {
    expect(bandForEra("origins").chord).not.toEqual(bandForEra("stars").chord);
  });

  it("GA-MUSIC: trackForEra resolves the saga MACRO-ACTS + mismatched era ids to REAL generated tracks", () => {
    // The review HIGH bug: setMusicEra requested <eraId>.wav, but the generated beds are keyed by track. The
    // saga path passes macro-acts (founding/convergence/…) + some era ids differ from their track — all must
    // resolve to one of the 10 GENERATED MUSIC_TRACKS (a real /assets/audio/<track>.wav), never a missing file.
    const generated = new Set<string>(MUSIC_TRACKS);
    for (const id of [
      "founding",
      "convergence",
      "emergence",
      "ascension", // saga macro-acts (the main play path)
      "caliphate",
      "origins",
      "firstcontact",
      "interstellar", // era ids whose id ≠ ambientTrack
      "some-unmapped-period", // unknown → default band's track
    ]) {
      expect(
        generated.has(trackForEra(id)),
        `${id} → ${trackForEra(id)} is a generated track`,
      ).toBe(true);
    }
    // The macro-acts still map to DISTINCT beds across the arc (not all collapsed to one).
    expect(
      new Set(["founding", "convergence", "emergence", "ascension"].map(trackForEra)).size,
    ).toBe(4);
  });
});
