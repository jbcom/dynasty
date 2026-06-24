import { describe, expect, it } from "vitest";
import { buildMusicPrompt, MUSIC_TRACKS, musicTrackKey } from "../genaiMusic";

/**
 * GA-MUSIC GM-1 — the pure Lyria prompt builder + track keys for the per-era ambient score. Deterministic;
 * the offline runner captures each to /assets/audio/<track>.ogg (the AudioEngine's existing slot).
 */

describe("GA-MUSIC GM-1", () => {
  it("covers the 10 ambient-track slots in chronological order", () => {
    expect(MUSIC_TRACKS).toHaveLength(10);
    expect(MUSIC_TRACKS[0]).toBe("boyhood");
    expect(MUSIC_TRACKS.at(-1)).toBe("redplanet");
    // No duplicates.
    expect(new Set(MUSIC_TRACKS).size).toBe(10);
  });

  it("the key is the track stem (matches the AudioEngine's /assets/audio/<track>.ogg load)", () => {
    expect(musicTrackKey("mogul")).toBe("mogul");
    expect(musicTrackKey("redplanet")).toBe("redplanet");
  });

  it("builds a loopable, instrumental, era-true prompt per track", () => {
    for (const t of MUSIC_TRACKS) {
      const p = buildMusicPrompt(t);
      expect(p).toMatch(/LOOPABLE/);
      expect(p).toMatch(/[Ii]nstrumental/);
      expect(p).toMatch(/no vocals/i);
    }
  });

  it("the era character tracks the slot (boyhood tender, atomic dread, redplanet interstellar)", () => {
    expect(buildMusicPrompt("boyhood")).toMatch(/tender|hopeful|origin/i);
    expect(buildMusicPrompt("atomic")).toMatch(/dread|ominous|horror/i);
    expect(buildMusicPrompt("redplanet")).toMatch(/interstellar|stars|cold grandeur/i);
  });

  it("every track's prompt is distinct (the bed genuinely shifts era to era)", () => {
    const prompts = new Set(MUSIC_TRACKS.map((t) => buildMusicPrompt(t)));
    expect(prompts.size).toBe(MUSIC_TRACKS.length);
  });
});
