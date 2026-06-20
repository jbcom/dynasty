import { describe, expect, it } from "vitest";
import { loadContent } from "../../data/loadContent";

/**
 * DE-2c — every branch expresses all three moral poles AS REACHABLE play.
 *
 * It is not enough that the per-branch pole endings (end_<branch>_<pole>) exist;
 * the pole FLAGS they gate on must be settable by some authored event or world
 * timeline, or the pole is a dead end no player can reach. This test enforces
 * that invariant permanently: a future pole ending that references an
 * unreachable flag fails here instead of silently becoming unwinnable.
 */

const content = loadContent();

/** Every flag any event or world-timeline can set (choice setFlags + event setFlags). */
function settableFlags(): Set<string> {
  const set = new Set<string>();
  for (const ev of content.allEvents) {
    for (const c of ev.choices) {
      for (const f of c.setFlags) set.add(f);
    }
  }
  for (const tl of content.worldTimelines) {
    for (const ev of tl.events) {
      for (const f of ev.setFlags ?? []) set.add(f);
    }
  }
  return set;
}

describe("DE-2c — branch moral poles are reachable, not just defined", () => {
  const POLES = ["utopian", "centrist", "dictatorial"] as const;
  const BRANCHES = ["nazi", "theocracy", "westcoast", "media", "megachurch", "oligarchy"] as const;

  it("each branch defines an ending for all three poles", () => {
    const ids = new Set(content.endings.map((e) => e.id));
    const missing: string[] = [];
    for (const b of BRANCHES) {
      for (const p of POLES) {
        if (!ids.has(`end_${b}_${p}`)) missing.push(`end_${b}_${p}`);
      }
    }
    expect(missing, missing.join(", ")).toEqual([]);
  });

  it("every pole ending gates only on flags some event/timeline can set", () => {
    const settable = settableFlags();
    const unreachable: string[] = [];
    for (const ending of content.endings) {
      if (!/_(utopian|centrist|dictatorial)$/.test(ending.id)) continue;
      for (const f of ending.when.flags) {
        if (!settable.has(f)) unreachable.push(`${ending.id} requires unsettable flag "${f}"`);
      }
    }
    expect(unreachable, unreachable.join("\n")).toEqual([]);
  });
});
