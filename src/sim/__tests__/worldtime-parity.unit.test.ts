import { describe, expect, it } from "vitest";
import { loadContent } from "../../data/loadContent";
import { branchOf } from "../branch";
import { initState } from "../state";
import { applyWorldFlags, timelinesForBranch } from "../worldtime";

/**
 * FD-14 — worldtime.ts retirement PARITY CHECK.
 *
 * The directive asked whether projectWorldEvents (the FD-2 unified-pool projection)
 * fully covers the worldtime.ts LINKING PROTOCOL so the latter can be retired. It
 * does NOT — and this test documents why, so worldtime.ts stays:
 *
 *  • projectWorldEvents turns world-timeline entries into REACTABLE GameEvents:
 *    their setFlags fire only when the player CHOOSES "live through it".
 *  • applyWorldFlags (the linking protocol) broadcasts those same flags
 *    AUTOMATICALLY as in-world years pass — no choice required. This auto-broadcast
 *    is what gates era-entry science-ladder flags, endings, and butterfly causes.
 *
 * The two are COMPLEMENTARY (ambient reactable backdrop vs. automatic causal
 * broadcast), not redundant. Retiring worldtime.ts would silently break the
 * automatic gating. This test asserts the auto-broadcast still does real work.
 */

const content = loadContent();

describe("FD-14 worldtime linking protocol is still load-bearing", () => {
  it("applyWorldFlags auto-broadcasts dated flags as years pass", () => {
    const base = initState(content, "parity-seed");
    const active = timelinesForBranch(content.worldTimelines, branchOf(base));
    // Sweep a wide year window and broadcast each year's due flags onto the state.
    let state = { ...base, year: 2000 };
    let broadcastCount = 0;
    // applyWorldFlags fires events with year in (fromYear, state.year]; advance the
    // floor year by year so each year's due events broadcast exactly once.
    for (let y = 1900; y < 2000; y++) {
      const before = state.flags.length;
      state = applyWorldFlags(state, y, active);
      broadcastCount += state.flags.length - before;
    }
    // The linking protocol set at least one flag automatically (no player choice).
    expect(broadcastCount).toBeGreaterThan(0);
  });

  it("auto-broadcast flags include ones that gate the run (not all are reactable)", () => {
    const base = initState(content, "parity-seed");
    const active = timelinesForBranch(content.worldTimelines, branchOf(base));
    let state = { ...base, year: 2100 };
    for (let y = 1900; y < 2100; y++) state = applyWorldFlags(state, y, active);

    // Collect the flags reachable ONLY by reacting to a projected world-event
    // (i.e. the setFlags on the synthetic "Live through it" choices).
    const reactableFlags = new Set<string>();
    for (const ev of content.worldEvents) {
      for (const c of ev.choices) for (const f of c.setFlags) reactableFlags.add(f);
    }
    // The auto-broadcast produced flags the reactable path does NOT cover →
    // projectWorldEvents alone cannot replace the linking protocol.
    const autoOnly = state.flags.filter((f) => !reactableFlags.has(f));
    expect(autoOnly.length).toBeGreaterThan(0);
  });
});
