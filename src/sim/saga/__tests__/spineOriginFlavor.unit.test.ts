import { describe, expect, it } from "vitest";
import { loadSaga } from "../../../data/loadSaga";
import { initMotivators } from "../../motivators";
import { currentScene, startAct } from "../runner";

/**
 * FS-SPINE-ORIGIN-FLAVOR — the player's chosen founding POWER BASE colors the FOUNDING act (g0) opening
 * from beat one. Each base has a gated opening-scene variant (requires.flags:["base:X"], diverting forward
 * to the shared allegiance scene); a press/uncovered founder gets the default `open`. These tests start the
 * g0 act with each base's seed flag and assert the runner opens on that base's scene.
 */

const corpus = loadSaga();

function g0() {
  const act = corpus.acts.get("spine:g0:founding");
  if (!act) throw new Error("no g0 founding act");
  return act;
}

function openingSceneIdFor(flags: string[]): string | null {
  const state = startAct(corpus, g0(), initMotivators(), flags);
  return currentScene(corpus, state)?.id ?? null;
}

describe("FS-SPINE-ORIGIN-FLAVOR: the founding base colors the g0 opening scene", () => {
  const cases: Array<{ base: string; scene: string }> = [
    { base: "land", scene: "spine:g0:founding:open_land" },
    { base: "commerce", scene: "spine:g0:founding:open_commerce" },
    { base: "pulpit", scene: "spine:g0:founding:open_pulpit" },
    { base: "law", scene: "spine:g0:founding:open_law" },
    { base: "military", scene: "spine:g0:founding:open_military" },
  ];

  for (const { base, scene } of cases) {
    it(`a ${base} founder opens on ${scene}`, () => {
      expect(openingSceneIdFor([`base:${base}`])).toBe(scene);
    });
  }

  it("a press founder (or an uncovered/no-base run) gets the default printing-house open", () => {
    expect(openingSceneIdFor(["base:press"])).toBe("spine:g0:founding:open");
    expect(openingSceneIdFor([])).toBe("spine:g0:founding:open");
  });

  it("each base variant carries real multi-paragraph prose + the family-name token", () => {
    for (const { scene } of cases) {
      const s = corpus.scenes.get(scene);
      expect(s, scene).toBeTruthy();
      expect(s?.prose.length).toBeGreaterThanOrEqual(2);
      // The founding voice interpolates the line's name — proves it's authored prose, not a stub.
      expect(s?.prose.join(" ")).toContain("{family_name}");
      // It diverts forward to the shared allegiance scene (skipping the default open).
      expect(s?.next).toBe("spine:g0:founding:allegiance");
    }
  });
});
