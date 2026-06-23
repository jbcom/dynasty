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
  // FS-RETIRE-PROLOGUE emptied ONLY the new-york Trump-line prologue file; the `origins` era still merges
  // 13 immigration-WAVE place files (ireland/italian/…, the cast material) with real events, so the merged
  // origins era keeps its density. Still exclude any era that ends up wholly empty (a spine-only era).
  return [...byEra.entries()]
    .map(([id, events]) => ({ id, events }))
    .filter((e) => e.events.length > 0);
}

/**
 * Branch-density verification (M3): a good cause-and-effect era is NOT a straight
 * line. Each era must have meaningful path divergence — gated events, multi-choice
 * events, and choices that set flags other events depend on.
 *
 * FS-RETIRE-PROLOGUE: `origins` is now a SPINE-DRIVEN era — its per-generation branching narrative lives
 * entirely in the saga acts (src/data/saga/**, the authored spine, where every scene frames a choice and
 * destiny branches fork via spineBranch.ts). The dead Trump-line new-york prologue (which used to carry
 * origins' event-card branching + causal coupling) was retired; the 13 remaining origins files are thin
 * immigration-WAVE cast vignettes. So origins is EXEMPT from the event-card BRANCHING gates (multi-choice
 * ratio, intra-era causal coupling) — those measure event-card divergence, which origins no longer carries.
 * It still must clear the event-COUNT + gated-events floors (the cast vignettes are real, gated content).
 */
describe("branch density (no era is a straight line)", () => {
  // Eras whose branching lives in the saga spine, not their event cards — exempt from the branching-ratio
  // gates below (their divergence is the spine's concern, asserted by the saga/spine tests).
  const SPINE_DRIVEN = new Set(["origins"]);
  it("every era has many events, most with 3+ choices", () => {
    for (const era of eras()) {
      expect(era.events.length, `${era.id} too few events`).toBeGreaterThanOrEqual(12);
      if (SPINE_DRIVEN.has(era.id)) continue; // branching moved to the spine
      const multi = era.events.filter((e) => e.choices.length >= 3).length;
      expect(multi / era.events.length, `${era.id} too few multi-choice events`).toBeGreaterThan(
        0.6,
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
      if (SPINE_DRIVEN.has(era.id)) continue; // origins' causal branching is in the spine now
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
