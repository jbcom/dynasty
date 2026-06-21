import { describe, expect, it } from "vitest";
import { validRaw } from "../../sim/__tests__/fixtures";
import { buildContent, type RawContent } from "../../sim/content";
import { loadContent } from "../loadContent";

/**
 * FD-1 — family-tree data model: the archetype spines load + cross-ref validate,
 * and buildContent enforces the structural invariants (one founder-patriarch, all
 * child/spouse refs resolve, no cycles). CP-R-ARCH adds the entertainment + athletic
 * spines (thin pre-founding fallbacks; the live family tree drives founded runs).
 */

const content = loadContent();

describe("FD-1 family trees — the archetype spines", () => {
  it("loads a spine for all six power archetypes", () => {
    const byArchetype = new Set(content.familyTrees.map((t) => t.archetype));
    expect(byArchetype).toEqual(
      new Set(["economic", "political", "technological", "religious", "entertainment", "athletic"]),
    );
    // The four original literal spines plus the two new generic ones.
    const byDynasty = new Set(content.familyTrees.map((t) => t.dynasty));
    expect(byDynasty).toEqual(
      new Set(["trump", "kennedy", "musk", "religious", "entertainment", "athletic"]),
    );
  });

  it("every tree has exactly one founder-patriarch", () => {
    for (const tree of content.familyTrees) {
      const founders = tree.members.filter((m) => m.role === "founder-patriarch");
      expect(founders.length, `${tree.dynasty}`).toBe(1);
    }
  });

  it("every child + spouse id resolves to a real member", () => {
    for (const tree of content.familyTrees) {
      const ids = new Set(tree.members.map((m) => m.id));
      for (const m of tree.members) {
        for (const c of m.children) expect(ids.has(c), `${tree.dynasty}:${m.id}→${c}`).toBe(true);
        if (m.spouse) expect(ids.has(m.spouse), `${tree.dynasty}:${m.id} spouse`).toBe(true);
      }
    }
  });

  it("the religious spine is the Graham line with the Billy→Franklin pole pivot", () => {
    const g = content.familyTrees.find((t) => t.dynasty === "religious");
    expect(g?.spine).toBe("graham");
    const billy = g?.members.find((m) => m.id === "billy_graham");
    const franklin = g?.members.find((m) => m.id === "franklin_graham");
    expect(billy?.poleTilt).toBe("megachurch"); // centrist establishment
    expect(franklin?.poleTilt).toBe("theocracy"); // the political-theocracy heir
    expect(billy?.children).toContain("franklin_graham");
  });
});

describe("FD-1 cross-ref validation rejects malformed trees", () => {
  const treeRaw = (trees: unknown[]): RawContent => ({ ...validRaw(), familyTrees: { trees } });

  it("rejects a tree with no founder-patriarch", () => {
    expect(() =>
      buildContent(
        treeRaw([
          {
            dynasty: "x",
            archetype: "economic",
            spine: "x",
            members: [{ id: "a", name: "A", born: 1900, role: "progenitor", children: [] }],
          },
        ]),
      ),
    ).toThrow(/founder-patriarch/);
  });

  it("rejects a child reference that does not resolve", () => {
    expect(() =>
      buildContent(
        treeRaw([
          {
            dynasty: "x",
            archetype: "economic",
            spine: "x",
            members: [
              { id: "a", name: "A", born: 1900, role: "founder-patriarch", children: ["ghost"] },
            ],
          },
        ]),
      ),
    ).toThrow(/unknown child/);
  });

  it("rejects a cycle", () => {
    expect(() =>
      buildContent(
        treeRaw([
          {
            dynasty: "x",
            archetype: "economic",
            spine: "x",
            members: [
              { id: "a", name: "A", born: 1900, role: "founder-patriarch", children: ["b"] },
              { id: "b", name: "B", born: 1930, role: "heir-successor", children: ["a"] },
            ],
          },
        ]),
      ),
    ).toThrow(/cycle/);
  });
});
