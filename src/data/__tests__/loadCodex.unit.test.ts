import { describe, expect, it } from "vitest";
import { loadCodex } from "../loadSaga";

/**
 * The codex lore briefs (PF-11) load + validate. Optional content (never gates play); each entry is
 * {id, title, body}, leak-free, and the waves + macro-acts are covered.
 */
const LEAK = /\b(Donald|Trump|Drumpf|Elon|Musk|Kennedy|Fred(erick)?|Friedrich)\b/i;

describe("loadCodex", () => {
  const codex = loadCodex();

  it("loads codex entries with id/title/body", () => {
    expect(codex.length).toBeGreaterThanOrEqual(10); // 7 waves + 3 macro-acts
    for (const e of codex) {
      expect(e.id.length).toBeGreaterThan(0);
      expect(e.title.length).toBeGreaterThan(0);
      expect(e.body.length).toBeGreaterThan(60); // a real brief, not a stub
    }
  });

  it("covers every wave + every macro-act", () => {
    const ids = new Set(codex.map((e) => e.id));
    for (const wave of [
      "ireland",
      "bavaria",
      "italian",
      "ashkenazi_jewish",
      "scandinavian",
      "chinese",
      "baghdad",
    ]) {
      expect(ids.has(`wave:${wave}`), wave).toBe(true);
    }
    for (const macro of ["convergence", "emergence", "ascension"]) {
      expect(ids.has(`macro:${macro}`), macro).toBe(true);
    }
  });

  it("never leaks a preset person", () => {
    for (const e of codex) expect(LEAK.test(`${e.title} ${e.body}`), e.id).toBe(false);
  });
});
