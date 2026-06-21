import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { loadContent } from "../../data/loadContent";
import { auditTimelines, tracePlaythrough, validateTrace } from "../harness";
import { placeById, resolveComposition } from "../places";
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
  });
});
