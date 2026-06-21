import { describe, expect, it } from "vitest";
import { buildContent, type RawContent } from "../../sim/content";
import { autoPlaythrough } from "../../sim/effects";
import { createRng } from "../../sim/rng";
import { initState } from "../../sim/state";
import butterflyJson from "../butterfly-rules.json";
import endingsJson from "../endings.json";
import indexJson from "../eras/index.json";
import metersJson from "../meters.json";

// Eagerly import every authored era events file (eras/<place>/<period>/*.json).
const eraModules = import.meta.glob("../eras/**/*.json", { eager: true }) as Record<
  string,
  { default: { era?: string } }
>;

function realContent() {
  const eraEvents = Object.entries(eraModules)
    .filter(([p]) => !p.endsWith("index.json"))
    .map(([, m]) => ({ era: m.default.era ?? "", data: m.default }));
  const raw: RawContent = {
    meters: metersJson,
    eraIndex: indexJson,
    eraEvents,
    butterflyRules: butterflyJson,
    endings: endingsJson,
    assets: { assets: [] },
  };
  return buildContent(raw);
}

describe("full authored content", () => {
  it("builds all eras with cross-reference integrity (13 modern + 1 deep-history)", () => {
    const content = realContent();
    expect(content.eras).toHaveLength(14);
    // Each era has an events pool with at least 7 events.
    for (const era of content.eras) {
      const pool = content.eventsByEra.get(era.id) ?? [];
      expect(pool.length).toBeGreaterThanOrEqual(7);
    }
  });

  it("every butterfly rule's target event id actually exists", () => {
    const content = realContent();
    const eventIds = new Set(content.allEvents.map((e) => e.id));
    const tags = new Set(content.allEvents.flatMap((e) => e.tags));
    for (const rule of content.butterflyRules) {
      if (rule.affectsKind === "event") {
        expect(eventIds.has(rule.affects), `rule ${rule.id} → missing event ${rule.affects}`).toBe(
          true,
        );
      } else {
        expect(tags.has(rule.affects), `rule ${rule.id} → missing tag ${rule.affects}`).toBe(true);
      }
    }
  });

  it("every butterfly rule cause flag is set by some choice (chains can fire)", () => {
    const content = realContent();
    const setFlags = new Set(
      content.allEvents.flatMap((e) => e.choices.flatMap((c) => c.setFlags)),
    );
    const rippleChannels = new Set(
      content.allEvents.flatMap((e) => e.choices.flatMap((c) => c.ripples.map((r) => r.to))),
    );
    for (const rule of content.butterflyRules) {
      const reachable = setFlags.has(rule.cause) || rippleChannels.has(rule.cause);
      expect(
        reachable,
        `butterfly cause "${rule.cause}" (rule ${rule.id}) is never set by any choice`,
      ).toBe(true);
    }
  });

  it("auto-playthroughs always reach a real, data-driven end state with divergent outcomes", () => {
    const content = realContent();
    const kinds = new Set(content.endings.map((e) => e.kind));
    // Across many seeds, every run must terminate in an authored ending. The
    // outcomes must DIVERGE (proving the branching arc isn't a single corridor) —
    // a naive first-choice bot legitimately hits early-outs too (the "every era
    // can end" rule), so we assert spread of endings, not depth.
    const reached = new Set<string>();
    for (let i = 0; i < 24; i++) {
      const final = autoPlaythrough(content, `smoke-${i}`, initState, createRng);
      expect(final.end, `seed smoke-${i} never ended`).not.toBeNull();
      expect(kinds.has(final.end?.kind ?? ""), `seed smoke-${i} kind ${final.end?.kind}`).toBe(
        true,
      );
      if (final.end?.endingId) reached.add(final.end.endingId);
    }
    // At least two distinct endings across the seed sweep → genuine divergence.
    expect(reached.size).toBeGreaterThanOrEqual(2);
  });

  it("reports ending flags not yet wired into content (I3 tracker)", () => {
    const content = realContent();
    const setFlags = new Set(
      content.allEvents.flatMap((e) => e.choices.flatMap((c) => c.setFlags)),
    );
    for (const cq of content.consequences) for (const f of cq.setFlags) setFlags.add(f);
    const unwired = new Set<string>();
    for (const ending of content.endings) {
      for (const f of ending.when.flags) if (!setFlags.has(f)) unwired.add(f);
    }
    // Endings that gate purely on meters/personality (no flags) must still exist.
    const flagless = content.endings.filter((e) => e.when.flags.length === 0);
    expect(flagless.length).toBeGreaterThan(0);
    // NOTE: I3/J/M wire the remaining ending flags into era content. This logs
    // what's still outstanding rather than failing the in-progress batch.
    if (unwired.size > 0) {
      console.warn(`[I3 TODO] ending flags not yet set by content: ${[...unwired].join(", ")}`);
    }
  });

  it("is deterministic across full-content playthroughs", () => {
    const content = realContent();
    const a = autoPlaythrough(content, "determinism", initState, createRng);
    const b = autoPlaythrough(content, "determinism", initState, createRng);
    expect(a.history).toEqual(b.history);
    expect(a.end).toEqual(b.end);
  });
});
