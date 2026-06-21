import { describe, expect, it } from "vitest";
import { validRaw } from "../../sim/__tests__/fixtures";
import { buildContent } from "../../sim/content";
import { applyChoice } from "../../sim/effects";
import { createRng } from "../../sim/rng";
import { initState } from "../../sim/state";
import { clearSave, fromSave, hasSave, loadGame, saveGame, toSave } from "../save";
import { localStorageBacked, memoryStorage } from "../storage";

const content = () => buildContent(validRaw());

function playTwo() {
  const c = content();
  const born = c.allEvents.find((e) => e.id === "ev_born");
  const school = c.allEvents.find((e) => e.id === "ev_military_school");
  if (!born || !school) throw new Error("fixture events missing");
  let s = initState(c, "save-seed");
  s = applyChoice(c, s, born, "cry_loud", createRng("save-seed")).state;
  s = applyChoice(c, s, school, "excel", createRng("save-seed")).state;
  return { c, s };
}

describe("save/load (deterministic replay)", () => {
  it("toSave captures seed + archetype + history", () => {
    const { s } = playTwo();
    const save = toSave(s);
    expect(save.seed).toBe("save-seed");
    expect(save.archetype).toBe("economic"); // default archetype
    expect(save.history).toHaveLength(2);
    expect(save.version).toBe(2);
  });

  it("fromSave preserves archetype on round-trip (FD-3.5 regression)", () => {
    // A technological run started with initState(content, seed, 'technological') must
    // survive a save → fromSave → replay cycle with archetype = 'technological'.
    const c = content();
    const s = initState(c, "musk-seed", "technological");
    const reconstructed = fromSave(c, toSave(s));
    expect(reconstructed.archetype).toBe("technological");
    expect(reconstructed.birthYear).toBe(1971);
    expect(reconstructed.flags).toContain("musk_dynasty_active");
  });

  it("fromSave migrates a legacy v1 literal-dynasty save onto its archetype", () => {
    const c = content();
    const reconstructed = fromSave(c, {
      version: 1,
      seed: "legacy",
      // biome-ignore lint/suspicious/noExplicitAny: exercising the legacy v1 shape
      dynasty: "musk" as any,
      archetype: undefined as unknown as "economic",
      history: [],
      savedYear: 1971,
    });
    expect(reconstructed.archetype).toBe("technological");
  });

  it("fromSave reconstructs the exact live state", () => {
    const { c, s } = playTwo();
    const reconstructed = fromSave(c, toSave(s));
    expect(reconstructed).toEqual(s);
  });

  it("round-trips through memory storage", async () => {
    const { c, s } = playTwo();
    const store = memoryStorage();
    expect(await hasSave(store)).toBe(false);
    await saveGame(store, s);
    expect(await hasSave(store)).toBe(true);
    const loaded = await loadGame(store, c);
    expect(loaded).toEqual(s);
  });

  it("round-trips through real localStorage (browser env)", async () => {
    const { c, s } = playTwo();
    const store = localStorageBacked();
    await clearSave(store);
    await saveGame(store, s);
    const loaded = await loadGame(store, c);
    expect(loaded?.flags).toEqual(s.flags);
    expect(loaded?.meters).toEqual(s.meters);
    await clearSave(store);
    expect(await hasSave(store)).toBe(false);
  });

  it("loadGame returns null when there is no save", async () => {
    const store = memoryStorage();
    expect(await loadGame(store, content())).toBeNull();
  });

  it("rejects an unsupported save version", () => {
    expect(() =>
      fromSave(content(), {
        version: 99,
        seed: "x",
        archetype: "economic",
        history: [],
        savedYear: 1946,
      }),
    ).toThrow(/version/);
  });
});
