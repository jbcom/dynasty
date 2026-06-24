import { describe, expect, it } from "vitest";
import {
  applyPruneToIndex,
  buildPruneTransactions,
  cheapPruneScore,
  cheapPruneSignals,
  collectPruneCandidates,
  type FabricEntry,
  type FabricIndex,
  selectPruneCandidates,
} from "../pruneFabric";

const clearVignette =
  "Mara crossed the harbor before dawn. The family ledger stayed dry under her coat. By noon she could bargain for the dock lease, or walk away and keep the house free.";

const secondClearVignette =
  "The council chamber filled slowly after rain. Elias watched the clerks sort petitions, then chose which promise the family could keep without selling its name.";

const denseVignette =
  "In the cold administrative clarity of the morning, the family considered the institutionally overdetermined consequences of a strategically ambiguous compact drafted by committees, revised by subcommittees, recited by counsel, returned to the table with additional clauses, and expanded until every ordinary reader would lose the central human stake before reaching the verb. In the cold administrative clarity of the morning, another similarly overburdened sentence delayed its actual choice behind abstract qualifications, procedural hedges, historical caveats, and a needless procession of nouns.";

const harsherDenseVignette =
  "The consolidated apparatus of municipal extraction, familial obligation, inherited suspicion, commercial debt, religious memory, metallurgical ambition, charitable dependency, and transoceanic patronage pressed upon the table with such simultaneous density that every possible decision dissolved into one elongated administrative weather system whose clauses would not end. The consolidated apparatus of municipal extraction continued to accumulate subordinate phrases, fiscal cautions, political callbacks, sensory overload, and procedural qualifications until the simple question of who should be helped first became nearly unreadable.";

const duplicatedLeadVignetteA =
  "Under the brass awning, Mara counted the coins twice. The harbor watched quietly while the family weighed a clean alliance against a quick betrayal.";

const duplicatedLeadVignetteB =
  "Under the brass awning, Elias counted the coins twice. The harbor watched quietly while the family weighed a public alliance against a private betrayal.";

function entry(
  sceneId: string,
  vignette: string,
  overrides: Partial<FabricEntry> = {},
): FabricEntry {
  return {
    sceneId,
    tier: 2,
    score: 0.5,
    settings: ["harbor"],
    vignettes: [vignette],
    ...overrides,
  };
}

function index(entries: FabricEntry[]): FabricIndex {
  return {
    generated: "fixture",
    keepFraction: 0.2,
    totalScenes: entries.length,
    keptScenes: entries.length,
    byEra: { emergence: entries.length },
    fabric: {
      italian: {
        emergence: entries,
      },
    },
  };
}

describe("fabric prune policy", () => {
  it("scores cheap pre-read risk with size, similarity, duplicate leads, and empty settings", () => {
    const signals = cheapPruneSignals(
      entry("dup:a", duplicatedLeadVignetteA, { maxSimilarity: 0.96, settings: [] }),
      2,
    );

    expect(signals.maxSimilarity).toBe(0.96);
    expect(signals.duplicateLeadCount).toBe(2);
    expect(signals.emptySettings).toBe(true);
    expect(cheapPruneScore(signals)).toBeGreaterThan(1);
  });

  it("collects duplicate opening leads as a candidate signal", () => {
    const candidates = collectPruneCandidates(
      index([
        entry("dup:a", duplicatedLeadVignetteA, { maxSimilarity: 0.94 }),
        entry("dup:b", duplicatedLeadVignetteB, { maxSimilarity: 0.93 }),
        entry("clear", clearVignette),
      ]),
    );

    const duplicate = candidates.find((candidate) => candidate.entry.sceneId === "dup:a");
    const clear = candidates.find((candidate) => candidate.entry.sceneId === "clear");
    expect(duplicate?.cheapSignals.duplicateLeadCount).toBe(2);
    expect(duplicate?.cheapScore).toBeGreaterThan(clear?.cheapScore ?? 0);
  });

  it("prune-one selects the least scannable kept fabric item", () => {
    const picked = selectPruneCandidates(
      index([entry("clear", clearVignette), entry("dense", denseVignette)]),
      "one",
    );

    expect(picked).toHaveLength(1);
    expect(picked[0]?.entry.sceneId).toBe("dense");
    expect(picked[0]?.report.pass).toBe(false);
  });

  it("prune-n returns a deterministic batch of the next worst items", () => {
    const picked = selectPruneCandidates(
      index([
        entry("clear", clearVignette),
        entry("dense:b", denseVignette),
        entry("dense:a", harsherDenseVignette),
      ]),
      "n",
      2,
    );

    expect(picked.map((candidate) => candidate.entry.sceneId)).toEqual(["dense:b", "dense:a"]);
  });

  it("prune-auto can pre-read by cheap similarity/duplicate signals before full audit", () => {
    const picked = selectPruneCandidates(
      index([
        entry("dup:a", duplicatedLeadVignetteA, { maxSimilarity: 0.96 }),
        entry("dup:b", duplicatedLeadVignetteB, { maxSimilarity: 0.95 }),
        entry("clear", clearVignette),
      ]),
      "auto",
      1,
      { autoCandidatePoolSize: 1 },
    );

    expect(picked).toHaveLength(1);
    expect(picked[0]?.entry.sceneId).toBe("dup:a");
    expect(picked[0]?.cheapSignals.maxSimilarity).toBeGreaterThan(0.9);
  });

  it("prune-all only selects severe failing surfaces", () => {
    const picked = selectPruneCandidates(
      index([entry("clear", clearVignette), entry("dense", denseVignette)]),
      "all",
    );

    expect(picked.map((candidate) => candidate.entry.sceneId)).toEqual(["dense"]);
  });

  it("applies removals and emits a transaction with the rewrite gap", () => {
    const source = index([
      entry("clear", clearVignette),
      entry("dense", denseVignette, { tier: 4 }),
      entry("clear:two", secondClearVignette),
    ]);
    const picked = selectPruneCandidates(source, "one");
    const pruned = applyPruneToIndex(source, picked);
    const transactions = buildPruneTransactions("one", picked, "2026-06-24T00:00:00.000Z");
    const prunedEmergence = pruned.fabric.italian?.emergence ?? [];

    expect(pruned.keptScenes).toBe(2);
    expect(pruned.byEra).toEqual({ emergence: 2 });
    expect(prunedEmergence.map((item) => item.sceneId)).toEqual(["clear", "clear:two"]);
    expect(transactions).toHaveLength(1);
    expect(transactions[0]).toMatchObject({
      ts: "2026-06-24T00:00:00.000Z",
      type: "fabric-prune-one",
      sceneId: "dense",
      wave: "italian",
      era: "emergence",
      tier: 4,
      source: "scripts/mine-fabric.ts --prune-one",
    });
    expect(transactions[0]?.gap).toContain("rewritten non-first-person replacement");
    expect(transactions[0]?.reason).toContain("cheap pre-read score");
  });
});
