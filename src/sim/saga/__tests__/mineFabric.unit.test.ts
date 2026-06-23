import { describe, expect, it } from "vitest";
import {
  buildDocFreq,
  contentWords,
  crossingPotential,
  type MineScene,
  scoreScene,
  selectFabric,
  uniqueness,
} from "../mineFabric";

/**
 * FS-4: the corpus miner finds the STANDOUT scenes in the templated 504-act bulk. These tests pin the
 * core signal — that templated scenes (shared vocabulary) score BELOW distinctive ones (rare vocabulary),
 * so mining keeps the singular moments and retires the sameness.
 */

// Five "templated" scenes sharing the same skeleton vocabulary (the 504× sameness).
const templated: MineScene[] = Array.from({ length: 5 }, (_, i) => ({
  id: `tmpl:${i}`,
  sense: "smell",
  prose: [
    "The steerage hold smelled of rancid tallow and sour vinegar and rotted straw.",
    "The community stood at a crossroads between survival and the long despair of the ward.",
  ],
}));
// One genuinely distinctive scene — rare, specific language nothing else shares.
const distinctive: MineScene = {
  id: "uniq:1",
  sense: "sight",
  prose: [
    "The orrery's brass planets ticked through their constitutional revolutions beneath a cracked glass dome.",
    "A surveyor's chain coiled on the mahogany like a serpent measuring the unmapped republic.",
    "Ink-stained delegates argued ratification while moths immolated themselves against the whale-oil lamp.",
  ],
  braidSlots: [
    { kind: "source", setting: "statehouse", vignette: "the {family_name}s among the delegates" },
    { kind: "destination", setting: "statehouse" },
  ],
};

describe("corpus miner (FS-4)", () => {
  it("contentWords drops stopwords, punctuation, and identity tokens", () => {
    const w = contentWords(["The {surname}s walked, slowly, into the cold harbor at dawn."]);
    expect(w).not.toContain("the");
    expect(w).not.toContain("surname");
    expect(w).toContain("harbor");
    expect(w).toContain("dawn");
  });

  it("UNIQUENESS: a distinctive scene scores far above the templated bulk", () => {
    const all = [...templated, distinctive];
    const df = buildDocFreq(all);
    const uTmpl = uniqueness(templated[0]!, df, all.length);
    const uUniq = uniqueness(distinctive, df, all.length);
    expect(uUniq).toBeGreaterThan(uTmpl);
    // The distinctive scene's rare words push it well clear of the shared-vocabulary template.
    expect(uUniq - uTmpl).toBeGreaterThan(0.15);
  });

  it("UNIQUENESS: a single-scene corpus is maximally unique, not NaN (totalScenes<=1 guard)", () => {
    // Math.log(1)=0 in the idf normalizer would divide by zero → NaN; the guard returns 1 instead.
    const df = buildDocFreq([distinctive]);
    const u = uniqueness(distinctive, df, 1);
    expect(Number.isNaN(u)).toBe(false);
    expect(u).toBe(1);
  });

  it("crossing potential rewards source vignettes", () => {
    expect(crossingPotential(distinctive)).toBeGreaterThan(0);
    expect(crossingPotential(templated[0]!)).toBe(0); // no braid slots
  });

  it("composite score ranks the distinctive scene first", () => {
    const all = [...templated, distinctive];
    const df = buildDocFreq(all);
    const scored = all.map((s) => scoreScene(s, df, all.length)).sort((a, b) => b.score - a.score);
    expect(scored[0]?.id).toBe("uniq:1");
  });

  it("selectFabric keeps the standouts and retires the templated bulk", () => {
    const all = [...templated, distinctive];
    const kept = selectFabric(all, 0.2); // keep top 20% → ~1 of 6
    expect(kept.some((k) => k.id === "uniq:1")).toBe(true);
    expect(kept.length).toBeLessThan(all.length);
    // Kept scenes carry their braid settings for the fabric key.
    expect(kept.find((k) => k.id === "uniq:1")?.settings).toContain("statehouse");
  });

  it("is deterministic — same corpus → same kept set", () => {
    const all = [...templated, distinctive];
    expect(selectFabric(all, 0.3).map((k) => k.id)).toEqual(
      selectFabric(all, 0.3).map((k) => k.id),
    );
  });
});
