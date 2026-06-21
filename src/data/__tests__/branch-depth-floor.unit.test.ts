import { describe, expect, it } from "vitest";
import { WorldTimelineSchema } from "../../sim/schema";

/**
 * DE-3b / AH4 — NO-SHALLOWNESS depth floor for branch backdrop pools.
 *
 * Taking any alternate-history fork must open a comparably rich world, not a thin
 * stub. CP-R-ARCH-2 collapsed the per-branch <scope>.<branch>.json files into one
 * file per scope, with each event carrying a `branch` field; this test now measures
 * depth by counting events whose effective branch matches, across scopes — so the
 * no-shallowness floor survives the collapse.
 *
 * If this fails: a branch pool is too thin — deepen it (more backdrop events,
 * more scopes) rather than lowering the floor.
 */

const tlModules = import.meta.glob("../timelines/*.json", { eager: true }) as Record<
  string,
  { default: unknown }
>;

const BRANCHES = ["nazi", "westcoast", "theocracy", "media", "megachurch", "oligarchy"] as const;
// Floors derived from the leanest shipped branch (megachurch ~104) with headroom.
const MIN_EVENTS = 90;
const MIN_SCOPES = 3;

function poolFor(branch: string) {
  const scopes = new Set<string>();
  let events = 0;
  for (const [, mod] of Object.entries(tlModules)) {
    const tl = WorldTimelineSchema.parse((mod as { default: unknown }).default);
    // An event's effective branch is its own field, else the file's branch
    // (back-compat for not-yet-collapsed scopes), else default.
    const matching = tl.events.filter((e) => (e.branch ?? tl.branch ?? "default") === branch);
    if (matching.length > 0) {
      scopes.add(tl.scope);
      events += matching.length;
    }
  }
  return { events, scopes: scopes.size };
}

describe("DE-3b — every branch backdrop pool clears the no-shallowness floor", () => {
  for (const branch of BRANCHES) {
    it(`${branch} has >= ${MIN_EVENTS} backdrop events across >= ${MIN_SCOPES} scopes`, () => {
      const { events, scopes } = poolFor(branch);
      expect(events, `${branch} backdrop events`).toBeGreaterThanOrEqual(MIN_EVENTS);
      expect(scopes, `${branch} backdrop scopes`).toBeGreaterThanOrEqual(MIN_SCOPES);
    });
  }

  it("no branch is a stub relative to the others (within 3x of the richest)", () => {
    const counts = BRANCHES.map((b) => poolFor(b).events);
    const max = Math.max(...counts);
    const min = Math.min(...counts);
    // The leanest branch must be at least a third as deep as the richest — no
    // branch is a token afterthought next to the headline ones.
    expect(min * 3, `leanest ${min} vs richest ${max}`).toBeGreaterThanOrEqual(max);
  });
});
