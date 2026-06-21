import { describe, expect, it } from "vitest";
import { validRaw } from "../../sim/__tests__/fixtures";
import { buildContent, type RawContent } from "../../sim/content";
import { TropeKindSchema } from "../../sim/schema";
import { loadContent } from "../loadContent";

/**
 * FD-3 — dynastic trope catalog: the canonical trope taxonomy loads + validates,
 * and buildContent enforces that any `trope:<id>` event tag references a real
 * catalog trope (so a refactor can never leave an event pointing at a deleted or
 * misspelled trope).
 */

const content = loadContent();

// The catalog ids from the design spec §1c (the full set incl. the
// previously-missing tropes). The test pins the catalog so a silent drop is
// caught — the catalog is the contract the compiler + retagger depend on.
const CANONICAL_IDS = [
  "accidental-heir",
  "bootlegger-to-legitimacy",
  "frontier-capital-origin",
  "centrist-to-zealot",
  "conqueror",
  "prophet",
  "pleasure-king",
  "oligarch",
  "techno-frontier",
  "megachurch-prosperity",
  "dissipating-line",
  "martyr",
  "matriarch-regency",
  "dynastic-merger",
  "cadet-branch",
  "prodigal-heir",
  "scandal-fall-rehab",
  "exile-return",
  "reformer-vs-reactionary",
  "outside-claimant",
];

describe("FD-3 trope catalog", () => {
  it("loads the full canonical catalog", () => {
    expect(content.tropes.length).toBe(CANONICAL_IDS.length);
    expect(new Set(content.tropes.map((t) => t.id))).toEqual(new Set(CANONICAL_IDS));
  });

  it("has unique ids and valid kinds", () => {
    const ids = content.tropes.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of content.tropes) {
      expect(() => TropeKindSchema.parse(t.kind), t.id).not.toThrow();
      expect(t.label.length, t.id).toBeGreaterThan(0);
      expect(t.summary.length, t.id).toBeGreaterThan(0);
    }
  });

  it("covers every lifecycle kind", () => {
    const kinds = new Set(content.tropes.map((t) => t.kind));
    expect(kinds).toEqual(
      new Set(["rise", "succession", "decline", "schism", "alliance", "governance", "ideological"]),
    );
  });
});

describe("FD-3 trope cross-reference gate", () => {
  function firstEvent(raw: RawContent): { tags: string[] } {
    const entry = raw.eraEvents[0];
    if (!entry) throw new Error("fixture has no era events");
    const ev = (entry.data as { events: Array<{ tags: string[] }> }).events[0];
    if (!ev) throw new Error("fixture era has no events");
    return ev;
  }

  function rawWithTrope(tag: string): RawContent {
    const raw = validRaw();
    raw.tropes = { tropes: [{ id: "rise-x", label: "Rise X", kind: "rise", summary: "x" }] };
    // Attach the tag to the first authored event.
    const ev = firstEvent(raw);
    ev.tags = [...(ev.tags ?? []), tag];
    return raw;
  }

  it("accepts a trope tag that references a catalog id", () => {
    expect(() => buildContent(rawWithTrope("trope:rise-x"))).not.toThrow();
  });

  it("rejects a trope tag that references an unknown id", () => {
    expect(() => buildContent(rawWithTrope("trope:does-not-exist"))).toThrow(/unknown trope/);
  });

  it("ignores non-trope tags entirely", () => {
    const raw = validRaw();
    raw.tropes = { tropes: [{ id: "rise-x", label: "Rise X", kind: "rise", summary: "x" }] };
    firstEvent(raw).tags = ["scandal", "media"];
    expect(() => buildContent(raw)).not.toThrow();
  });
});
