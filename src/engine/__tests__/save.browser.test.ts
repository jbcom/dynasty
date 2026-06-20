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
  it("toSave captures only seed + history", () => {
    const { s } = playTwo();
    const save = toSave(s);
    expect(save.seed).toBe("save-seed");
    expect(save.history).toHaveLength(2);
    expect(save.version).toBe(1);
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
      fromSave(content(), { version: 99, seed: "x", history: [], savedYear: 1946 }),
    ).toThrow(/version/);
  });
});
