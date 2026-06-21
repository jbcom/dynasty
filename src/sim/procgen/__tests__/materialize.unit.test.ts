import { describe, expect, it } from "vitest";
import { loadContent } from "../../../data/loadContent";
import { validRaw } from "../../__tests__/fixtures";
import { buildContent, type Content, type RawContent } from "../../content";
import { eligibleEvents } from "../../events";
import { foundDynasty } from "../../founding";
import { createRng } from "../../rng";
import type { GameState } from "../../state";
import { initState } from "../../state";
import { materializeProcedural } from "../index";

function loadRealContent(): Content {
  return loadContent();
}
function foundRealDynasty(real: Content): GameState {
  return foundDynasty(real, { momentId: "abbasid_baghdad_762", surname: "al-Rashid", seed: "dh" })
    .state;
}

/**
 * FD-4.2 — lazy bounded materialization: templates load + cross-ref validate;
 * materializeProcedural is deterministic and in-era; eligibleEvents injects
 * procedural fill only when the authored pool is thin AND an rng is supplied.
 */

function rawWithTemplates(): RawContent {
  const raw = validRaw();
  raw.tropes = {
    tropes: [
      { id: "accidental-heir", label: "The Accidental Heir", kind: "succession", summary: "x" },
    ],
  };
  raw.templates = {
    templates: [
      {
        id: "succession",
        era: "boyhood",
        title: "{member} and {rival}",
        scene: "In {year}, {member} faces {peril}.",
        slots: ["member", "rival", "year", "peril"],
        tropes: ["accidental-heir"],
        tags: ["family"],
        choices: [
          {
            id: "act",
            text: "{member} acts",
            outcome: "Done.",
            effects: { power: { min: 1, max: 5 } },
          },
        ],
      },
    ],
  };
  return raw;
}

describe("FD-4.2 templates content wiring", () => {
  it("loads templates + cross-ref validates their trope ids", () => {
    expect(() => buildContent(rawWithTemplates())).not.toThrow();
  });

  it("rejects a template whose trope id is not in the catalog", () => {
    const raw = rawWithTemplates();
    const tpls = raw.templates as { templates: Array<{ tropes: string[] }> };
    const tpl = tpls.templates[0];
    if (tpl) tpl.tropes = ["ghost-trope"];
    expect(() => buildContent(raw)).toThrow(/unknown trope/);
  });
});

describe("FD-4.2 materializeProcedural", () => {
  const content = buildContent(rawWithTemplates());
  const era = content.eras.find((e) => e.id === "boyhood");
  if (!era) throw new Error("fixture missing boyhood era");

  it("is deterministic for a given seed", () => {
    const state = initState(content, "s");
    const a = materializeProcedural(content, state, era, createRng("p"), 4);
    const b = materializeProcedural(content, state, era, createRng("p"), 4);
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(0);
  });

  it("respects the cap and only emits in-era events", () => {
    const state = initState(content, "s");
    const out = materializeProcedural(content, state, era, createRng("p"), 1);
    expect(out.length).toBe(1);
    for (const ev of out) {
      expect(ev.era).toBe("boyhood");
      expect(ev.tags).toContain("procedural");
      expect(ev.tags).toContain("trope:accidental-heir");
    }
  });

  it("returns [] for an era with no templates", () => {
    const state = initState(content, "s");
    const mogul = content.eras.find((e) => e.id === "mogul");
    if (!mogul) throw new Error("fixture missing mogul era");
    expect(materializeProcedural(content, state, mogul, createRng("p"), 4)).toEqual([]);
  });
});

describe("FD-4.2 eligibleEvents procedural fill", () => {
  const content = buildContent(rawWithTemplates());

  it("does NOT inject procedural events without an rng (analysis path)", () => {
    const state = initState(content, "s");
    const ev = eligibleEvents(content, state);
    expect(ev.every((e) => !e.tags.includes("procedural"))).toBe(true);
  });

  it("injects procedural events when the authored pool is thin and an rng is given", () => {
    // Consume the authored boyhood beats so the forward pool falls below threshold.
    const base = initState(content, "s");
    const boyhood = content.eventsByEra.get("boyhood") ?? [];
    const state = { ...base, firedEvents: boyhood.map((e) => e.id) };
    const ev = eligibleEvents(content, state, createRng("p"));
    expect(ev.some((e) => e.tags.includes("procedural"))).toBe(true);
  });
});

describe("FD-4.3 deep-history templates (real content)", () => {
  const real = loadRealContent();

  it("the caliphate deep-history era has procedural templates", () => {
    const caliphateTemplates = real.templates.filter((t) => t.era === "caliphate");
    expect(caliphateTemplates.length).toBeGreaterThan(0);
    // Their tropes resolve to the catalog (buildContent would have thrown otherwise).
    const ids = new Set(real.tropes.map((t) => t.id));
    for (const tpl of caliphateTemplates) {
      for (const tr of tpl.tropes) expect(ids.has(tr), `${tpl.id}:${tr}`).toBe(true);
    }
  });

  it("a founded deep-history line materializes caliphate procedural events", () => {
    const founded = foundRealDynasty(real);
    const era = real.eras.find((e) => e.id === "caliphate");
    if (!era) throw new Error("no caliphate era");
    const out = materializeProcedural(real, founded, era, createRng("dh"), 2);
    expect(out.length).toBeGreaterThan(0);
    for (const e of out) {
      expect(e.era).toBe("caliphate");
      expect(e.tags).toContain("procedural");
      // {place} resolves to the Baghdad stack label, not a raw token.
      expect(e.scene).not.toMatch(/\{place\}/);
    }
  });
});
