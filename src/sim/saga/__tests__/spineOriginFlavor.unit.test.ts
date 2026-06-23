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

function act(id: string) {
  const a = corpus.acts.get(id);
  if (!a) throw new Error(`no act ${id}`);
  return a;
}

function openingSceneIdFor(actId: string, flags: string[]): string | null {
  const state = startAct(corpus, act(actId), initMotivators(), flags);
  return currentScene(corpus, state)?.id ?? null;
}

// Each spine act that has base-flavored openings: act id, its default open, the scene the variants divert
// to, and the base→variant-scene id prefix (FS-SPINE-ORIGIN-FLAVOR g0; -DEPTH g1 + g2).
const FLAVORED_ACTS = [
  {
    actId: "spine:g0:founding",
    open: "spine:g0:founding:open",
    divert: "spine:g0:founding:allegiance",
    base: "spine:g0:founding:open_",
  },
  {
    actId: "spine:g1:earlyrepublic",
    open: "spine:g1:earlyrepublic:open",
    divert: "spine:g1:earlyrepublic:doctrine",
    base: "spine:g1:earlyrepublic:open_",
  },
  {
    actId: "spine:g2:antebellum",
    open: "spine:g2:antebellum:open",
    divert: "spine:g2:antebellum:allegiance",
    base: "spine:g2:antebellum:open_",
  },
];
const BASES = ["land", "commerce", "pulpit", "law", "military"];

for (const a of FLAVORED_ACTS) {
  describe(`FS-SPINE-ORIGIN-FLAVOR: the founding base colors ${a.actId}`, () => {
    for (const base of BASES) {
      it(`a ${base} founder opens on ${a.base}${base}`, () => {
        expect(openingSceneIdFor(a.actId, [`base:${base}`])).toBe(`${a.base}${base}`);
      });
    }

    it("an uncovered/no-base run gets the default open", () => {
      // g0 default is press (printing house); g1 default is maritime/commerce — both un-gated for press.
      expect(openingSceneIdFor(a.actId, ["base:press"])).toBe(a.open);
      expect(openingSceneIdFor(a.actId, [])).toBe(a.open);
    });

    it("each base variant carries real multi-paragraph prose + the family-name token + diverts forward", () => {
      for (const base of BASES) {
        const s = corpus.scenes.get(`${a.base}${base}`);
        expect(s, `${a.base}${base}`).toBeTruthy();
        expect(s?.prose.length).toBeGreaterThanOrEqual(2);
        expect(s?.prose.join(" ")).toContain("{family_name}");
        expect(s?.next).toBe(a.divert);
      }
    });
  });
}
