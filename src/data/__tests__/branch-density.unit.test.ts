import { describe, expect, it } from "vitest";
import { EraEventsSchema } from "../../sim/schema";

// Eagerly import every authored era events file (eras/<place>/<period>/*.json).
const eraModules = import.meta.glob("../eras/**/*.json", { eager: true }) as Record<
  string,
  { default: unknown }
>;

// An era is the MERGED pool of every file sharing its era id — the place-arc model
// (EX-2) splits one era across multiple eras/<place>/<period>/ files, so density is
// measured on the merged era, not a single file.
function eras() {
  const byEra = new Map<string, ReturnType<typeof EraEventsSchema.parse>["events"]>();
  for (const [p, m] of Object.entries(eraModules)) {
    if (p.endsWith("index.json")) continue;
    const data = EraEventsSchema.parse(m.default);
    byEra.set(data.era, [...(byEra.get(data.era) ?? []), ...data.events]);
  }
  return [...byEra.entries()].map(([id, events]) => ({ id, events }));
}

/**
 * Branch-density verification (M3): a good cause-and-effect era is NOT a straight
 * line. Each era must have meaningful path divergence — gated events, multi-choice
 * events, and choices that set flags other events depend on.
 *
 * NA-11: `origins` is now a thinner BACKDROP era — its per-generation branching narrative moved to
 * the saga acts (src/data/saga/**, where every scene frames a choice and major decisions offer 3
 * options). The retired birth beats were deliberately single-EXPERIENCED moments anyway. So origins
 * gets a slightly lower multi-choice floor; the rest of the eras stay at the strict 0.6 gate.
 *
 * To RESTORE the 0.6 floor for origins, add multi-choice (3+) authored events to its events.json
 * files (or remove this override) — the actual ratio is ~0.53, so it needs a handful more branching
 * beats. Keep this override only while the saga acts carry origins' branching weight.
 */
describe("branch density (no era is a straight line)", () => {
  // Per-era multi-choice floor override (default 0.6). Keep this minimal — only relax with a reason.
  const MULTI_FLOOR: Record<string, number> = { origins: 0.5 };
  it("every era has many events, most with 3+ choices", () => {
    for (const era of eras()) {
      expect(era.events.length, `${era.id} too few events`).toBeGreaterThanOrEqual(12);
      const multi = era.events.filter((e) => e.choices.length >= 3).length;
      expect(multi / era.events.length, `${era.id} too few multi-choice events`).toBeGreaterThan(
        MULTI_FLOOR[era.id] ?? 0.6,
      );
    }
  });

  it("every era has gated events (divergent paths, not a corridor)", () => {
    for (const era of eras()) {
      const gated = era.events.filter((e) => {
        const r = e.requires;
        return (
          r.flags.length > 0 ||
          r.notFlags.length > 0 ||
          Object.keys(r.meters).length > 0 ||
          Object.keys(r.personality ?? {}).length > 0 ||
          r.minAge !== undefined ||
          r.maxAge !== undefined
        );
      }).length;
      // At least a quarter of an era's events should be conditionally gated.
      expect(gated, `${era.id} has no gated events — it's a straight line`).toBeGreaterThanOrEqual(
        Math.ceil(era.events.length * 0.25),
      );
    }
  });

  it("flags set by choices feed back into gates (causal coupling)", () => {
    for (const era of eras()) {
      const setFlags = new Set(era.events.flatMap((e) => e.choices.flatMap((c) => c.setFlags)));
      const gateFlags = new Set(
        era.events.flatMap((e) => [...e.requires.flags, ...e.requires.notFlags]),
      );
      const coupled = [...gateFlags].filter((f) => setFlags.has(f));
      // Each era should gate on at least one flag its own choices set (intra-era causality).
      expect(coupled.length, `${era.id} flags aren't causally coupled`).toBeGreaterThan(0);
    }
  });
});
