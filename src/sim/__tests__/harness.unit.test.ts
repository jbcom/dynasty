import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { loadContent } from "../../data/loadContent";
import { auditTimelines, tracePlaythrough, validateTrace } from "../harness";
import { dealComposition, placeById, resolveComposition } from "../places";
import { ARCHETYPES } from "../slots";

/**
 * CP-R7 — the dev-harness review. Plays a founded run forward, dumps the entire
 * post-Gen-0 bespoke timeline to a repository artifact, and validates it for
 * consistency, linear time, no leaks, and clean generation-to-generation progression
 * across the whole offered place × era × archetype space.
 */

const content = loadContent();

describe("CP-R7 timeline dump + consistency audit", () => {
  it("a single founded run traces clean (linear time, no leaks, progression)", () => {
    const ireland = placeById(content.places, "ireland");
    if (!ireland) throw new Error("no ireland");
    const composition = resolveComposition(ireland, {
      era: "origins",
      year: 1885,
      archetype: "economic",
      gender: "male",
      surname: "Donnelly",
      seed: "trace-demo",
    });
    const trace = tracePlaythrough(content, composition);
    expect(trace.beats.length).toBeGreaterThan(0);
    expect(trace.finalName.endsWith(" Donnelly")).toBe(true);
    expect(validateTrace(trace)).toEqual([]);
  });

  it("AUDIT: every place × era × archetype traces clean, and dump the timelines to artifacts/", () => {
    // The full offered origin space: each place × each of its valid eras × every
    // archetype (so all branch paths the graph can take are exercised).
    const origins = content.places.flatMap((p) =>
      p.validEras.flatMap((era) =>
        ARCHETYPES.map((archetype) => ({ place: p.id, era, archetype })),
      ),
    );
    const { traces, findings } = auditTimelines(content, origins, 3, (origin, seed) => {
      const p = placeById(content.places, origin.place);
      if (!p) throw new Error(`no place ${origin.place}`);
      const era0 = content.eras.find((e) => e.id === origin.era);
      return resolveComposition(p, {
        era: origin.era,
        year: era0?.yearStart ?? 1900,
        archetype: origin.archetype as (typeof ARCHETYPES)[number],
        gender: "male",
        surname: "Audit",
        seed,
      });
    });

    // Dump the whole bespoke-timeline corpus + findings to a repository artifact so
    // it can be reviewed by hand (the user's culminating deliverable).
    const out = resolve(__dirname, "../../../artifacts/timeline-audit.json");
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(
      out,
      `${JSON.stringify(
        {
          summary: {
            origins: origins.length,
            traces: traces.length,
            beats: traces.reduce((n, t) => n + t.beats.length, 0),
            findings: findings.length,
            maxGenerations: traces.reduce((m, t) => Math.max(m, t.generations), 0),
          },
          findings,
          traces,
        },
        null,
        2,
      )}\n`,
    );

    // The timeline graph is consistent: NO findings across the whole space.
    expect(findings, JSON.stringify(findings.slice(0, 10), null, 2)).toEqual([]);
  }, 60_000); // 180 traces × thousands of beats — generous timeout for slower CI hardware.
});

describe("EX-5 the millennium run (dev `survive` policy)", () => {
  // A dealt birth, played by the survivor policy, walks the WHOLE era chain — from
  // its founding era to interstellar (era order 12, ~2161) — across many generations,
  // with the recurring partner→beget life-stage beats re-firing each generation and
  // ZERO preset-person leaks the whole way. This is the dev-mode 1000-year dynasty.
  it("a survivor-policy run traverses the full era chain to the far future, 0 leaks", () => {
    const NEUTRAL = ["Calloway", "Mercer", "Thornbury", "Aldridge", "Castellan", "Whitlock"];
    let reachedFarFuture = 0;
    let sawMultiGenBeget = 0;
    let totalLeaks = 0;
    const RUNS = 18;
    for (let s = 1; s <= RUNS; s++) {
      const surname = NEUTRAL[s % NEUTRAL.length] ?? "Calloway";
      const comp = dealComposition(content.places, content.eras, String(s), surname);
      const trace = tracePlaythrough(content, comp, { maxSteps: 30_000, policy: "survive" });
      totalLeaks += validateTrace(trace).filter((f) => f.kind === "leak").length;

      const lastEra = trace.beats.at(-1)?.era;
      const lastOrder = content.eras.find((e) => e.id === lastEra)?.order ?? -1;
      if (lastOrder >= 9) reachedFarFuture++; // unification(9)+ = deep into the future

      // The recurring beget: the partner+heirs beats fire for more than one generation.
      const begetGens = new Set(
        trace.beats.filter((b) => b.eventId === "ev_cp_raise_heirs").map((b) => b.generation),
      );
      if (begetGens.size >= 2) sawMultiGenBeget++;
    }

    // Determinism: every survive trace is reproducible for its composition.
    const c = dealComposition(content.places, content.eras, "1", "Calloway");
    const a = tracePlaythrough(content, c, { maxSteps: 30_000, policy: "survive" });
    const b = tracePlaythrough(content, c, { maxSteps: 30_000, policy: "survive" });
    expect(a.beats.length).toBe(b.beats.length);
    expect(a.end).toEqual(b.end);

    expect(totalLeaks, "the millennium run must never leak a preset person").toBe(0);
    // Most dealt births reach the far future under the survivor policy (the rest are
    // legitimate line-extinctions — a dynastic outcome, not a content gap).
    expect(reachedFarFuture).toBeGreaterThanOrEqual(RUNS / 2);
    // The line continues across generations: the beget beat re-fires, not once-only.
    expect(sawMultiGenBeget).toBeGreaterThanOrEqual(RUNS / 2);
  }, 60_000);
});
