import { describe, expect, it } from "vitest";
import { loadContent } from "../../data/loadContent";

/**
 * THE SACRED TIMELINE — data invariant half of the chronology pair.
 *
 * Time in this game is LINEAR: the story runs strictly forward from 1885 to the
 * stars. These tests enforce that the AUTHORED content can never describe a
 * timeline that bends backward — eras march in chronological order, every event
 * sits inside its era's years, and every parallel world-timeline is itself
 * ordered. The runtime half (chronology-runtime) proves that no sequence of
 * play can violate this; this half proves the data it plays over is sound.
 *
 * If you are here because this test failed: you added an event whose `year` is
 * outside its era, or an era whose years overlap/precede the previous one.
 * Fix the DATA — do not relax the invariant. Linear time is load-bearing for
 * determinism, replay, and the butterfly/consequence scheduler.
 */

const content = loadContent();

describe("sacred timeline — era chronology is strictly forward", () => {
  it("eras are listed in ascending `order` with no gaps or duplicates", () => {
    const orders = content.eras.map((e) => e.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
    expect(new Set(orders).size).toBe(orders.length);
    // Orders are a CONTIGUOUS integer run with no holes — but may start below 0
    // (the deep-history caliphate era uses a negative order, FD-6). Assert
    // contiguity from the minimum rather than a hardcoded 0..N-1.
    const min = Math.min(...orders);
    for (let i = 0; i < orders.length; i++) expect(orders[i]).toBe(min + i);
  });

  it("each era's own span is forward (yearStart <= yearEnd)", () => {
    for (const era of content.eras) {
      expect(era.yearEnd, `${era.id} span`).toBeGreaterThanOrEqual(era.yearStart);
    }
  });

  it("consecutive eras never move time backward (monotonic, non-overlapping)", () => {
    const byOrder = [...content.eras].sort((a, b) => a.order - b.order);
    for (let i = 1; i < byOrder.length; i++) {
      const prev = byOrder[i - 1];
      const cur = byOrder[i];
      if (!prev || !cur) continue;
      // A later era cannot start before the previous era ended — that would let
      // an era roll-over (year := nextEra.yearStart) jump the clock backward.
      expect(cur.yearStart, `${cur.id} starts before ${prev.id} ends`).toBeGreaterThanOrEqual(
        prev.yearEnd,
      );
    }
  });

  it("every authored event sits within its era's year bounds", () => {
    const eraById = new Map(content.eras.map((e) => [e.id, e]));
    const offenders: string[] = [];
    for (const ev of content.allEvents) {
      const era = eraById.get(ev.era);
      if (!era) continue;
      if (ev.year < era.yearStart || ev.year > era.yearEnd) {
        offenders.push(
          `${ev.id} (year ${ev.year}) outside ${era.id} [${era.yearStart}..${era.yearEnd}]`,
        );
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});

describe("sacred timeline — parallel world timelines never overlap impossibly", () => {
  // World-timeline files are READ in any author order; the linking protocol
  // (dueWorldEvents) sorts by year before applying, so file order is cosmetic
  // for behavior. The load-bearing data invariant is that no single timeline
  // pins two DIFFERENT events to the same (year,id) — that would make the
  // forward-only broadcast order ambiguous under replay.
  it("no timeline has a duplicate event id, and (year,id) ordering is total", () => {
    const offenders: string[] = [];
    for (const tl of content.worldTimelines) {
      const ids = new Set<string>();
      for (const ev of tl.events) {
        const key = `${tl.scope}/${tl.branch ?? "default"}:${ev.id}`;
        if (ids.has(ev.id)) offenders.push(`duplicate ${key}`);
        ids.add(ev.id);
      }
      // The (year, id) sort the runtime uses must be a strict total order — no
      // two events share BOTH year and id (the tiebreak would be undefined).
      const keys = tl.events.map((e) => `${e.year}:${e.id}`);
      if (new Set(keys).size !== keys.length) {
        offenders.push(`${tl.scope}/${tl.branch ?? "default"} has a (year,id) collision`);
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});
