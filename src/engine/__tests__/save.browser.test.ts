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

describe("CP-6 founded-run save carries the full founding config", () => {
  it("round-trips a configured founded line (calling/gender/successionMode/axisChoices)", async () => {
    const { loadContent } = await import("../../data/loadContent");
    const { foundDynasty } = await import("../../sim/founding");
    const real = loadContent();
    const founded = foundDynasty(real, {
      momentId: "abbasid_baghdad_762",
      surname: "al-Rashid",
      seed: "cp6",
      calling: "scholar",
      gender: "female",
      successionMode: "matriarchal",
      axisChoices: { faith: "devout" },
    }).state;

    const save = toSave(founded);
    expect(save.founding).toMatchObject({
      momentId: "abbasid_baghdad_762",
      surname: "al-Rashid",
      calling: "scholar",
      gender: "female",
      successionMode: "matriarchal",
      axisChoices: { faith: "devout" },
    });

    // fromSave rebuilds the EXACT founded base — identical state to the original.
    const reconstructed = fromSave(real, save);
    expect(reconstructed.founding).toEqual(founded.founding);
    expect(reconstructed.flags).toEqual(founded.flags);
    expect(reconstructed.meters).toEqual(founded.meters);
    expect(reconstructed.family).toEqual(founded.family);
  });
});

describe("SAGA-RESTORE-CURSOR: a saga-deep founded run survives the persisted save round-trip", () => {
  it("toSave records saga walk steps, and fromSave reconstructs the exact mid-saga state", async () => {
    const { loadContent } = await import("../../data/loadContent");
    const { foundByComposition } = await import("../../sim/founding");
    const { Game } = await import("../loop");
    const real = loadContent();
    const comp = {
      place: "ireland",
      era: "origins",
      culture: "irish_catholic",
      year: 1885,
      archetype: "economic" as const,
      gender: "male" as const,
      surname: "Persist",
      seed: "sagapersist",
      originId: "composed:ireland:origins",
    };
    // Play DEEP into the saga — many beats + several generational decisions — so the run is far past the
    // founded base and well into the novel walk (the surface a persisted save previously could not rebuild).
    const live = new Game(real, comp.seed, foundByComposition(real, comp).state, comp.archetype);
    for (let i = 0; i < 80 && !live.finished; i++) {
      const s = live.view.saga.scene;
      if (s) {
        if (s.decision) {
          const idx = s.decision.options.findIndex((o) => o.succession?.takesPartner);
          live.pickDecision(idx >= 0 ? idx : 0);
        } else if (s.beats.length) live.pickBeat(0);
        else break;
      } else if (live.view.currentEvent) {
        const c = live.view.currentEvent.choices[0];
        if (!c) break;
        live.choose(c.id);
      } else break;
    }
    const liveState = live.view.state;
    // The choice log captured saga steps (not just events) — that's what makes the save reconstructable.
    expect(liveState.history.some((h) => h.saga === "beat" || h.saga === "decision")).toBe(true);

    // The PERSISTED save (seed + interleaved history) reconstructs the EXACT mid-saga state.
    const save = toSave(liveState);
    expect(save.history.some((h) => h.saga)).toBe(true);
    const reconstructed = fromSave(real, save);
    expect(reconstructed.year).toBe(liveState.year);
    expect(reconstructed.flags).toEqual(liveState.flags);
    expect(reconstructed.meters).toEqual(liveState.meters);
    expect(reconstructed.family).toEqual(liveState.family);
    expect(reconstructed.personality).toEqual(liveState.personality);
    expect(reconstructed.saga).toEqual(liveState.saga);
    expect(reconstructed.end).toEqual(liveState.end);
  });
});
