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

// Each base-flavored spine act: its default open, the scene the variants divert to, the variant-scene id
// prefix, the 5 bases it covers, and the ONE base its default open serves (un-gated). g0-g2's default is
// the press printing-house; g3's default is the commerce Broad-Street exchange. (FS-SPINE-ORIGIN-FLAVOR
// g0; -DEPTH g1/g2/g3.)
const ALL_BASES = ["land", "commerce", "pulpit", "law", "military", "press"];
const FLAVORED_ACTS = [
  {
    open: "spine:g0:founding:open",
    divert: "spine:g0:founding:allegiance",
    base: "spine:g0:founding:open_",
    bases: ["land", "commerce", "pulpit", "law", "military"],
    defaultBase: "press",
  },
  {
    open: "spine:g1:earlyrepublic:open",
    divert: "spine:g1:earlyrepublic:doctrine",
    base: "spine:g1:earlyrepublic:open_",
    bases: ["land", "commerce", "pulpit", "law", "military"],
    defaultBase: "press",
  },
  {
    open: "spine:g2:antebellum:open",
    divert: "spine:g2:antebellum:allegiance",
    base: "spine:g2:antebellum:open_",
    // g2's default open is the {family_name} shipping concern — commerce-themed — so commerce is the default
    // and press is the flavored variant (matching g3-g5; CodeRabbit #102).
    bases: ["land", "press", "pulpit", "law", "military"],
    defaultBase: "commerce",
  },
  {
    open: "spine:g3:gildedage:open",
    divert: "spine:g3:gildedage:venture",
    base: "spine:g3:gildedage:open_",
    bases: ["land", "pulpit", "law", "military", "press"],
    defaultBase: "commerce",
  },
  {
    open: "spine:g4:progressive:open",
    divert: "spine:g4:progressive:allegiance",
    base: "spine:g4:progressive:open_",
    bases: ["land", "pulpit", "law", "military", "press"],
    defaultBase: "commerce",
  },
  {
    open: "spine:g5:midcentury:open",
    divert: "spine:g5:midcentury:reckoning",
    base: "spine:g5:midcentury:open_",
    bases: ["land", "pulpit", "law", "military", "press"],
    defaultBase: "commerce",
  },
  {
    // g6's default open is the TV control room — press-themed (the media generation) — so press is the
    // default and commerce is the flavored variant.
    open: "spine:g6:broadcast:open",
    divert: "spine:g6:broadcast:platform",
    base: "spine:g6:broadcast:open_",
    bases: ["land", "commerce", "pulpit", "law", "military"],
    defaultBase: "press",
  },
];

function actIdOf(open: string): string {
  return open.replace(/:open$/, "");
}

for (const a of FLAVORED_ACTS) {
  const actId = actIdOf(a.open);
  describe(`FS-SPINE-ORIGIN-FLAVOR: the founding base colors ${actId}`, () => {
    for (const base of a.bases) {
      it(`a ${base} founder opens on ${a.base}${base}`, () => {
        expect(openingSceneIdFor(actId, [`base:${base}`])).toBe(`${a.base}${base}`);
      });
    }

    it(`the default base (${a.defaultBase}) + a no-base run get the default open`, () => {
      expect(openingSceneIdFor(actId, [`base:${a.defaultBase}`])).toBe(a.open);
      expect(openingSceneIdFor(actId, [])).toBe(a.open);
    });

    it("each base variant carries real multi-paragraph prose + the family-name token + diverts forward", () => {
      for (const base of a.bases) {
        const s = corpus.scenes.get(`${a.base}${base}`);
        expect(s, `${a.base}${base}`).toBeTruthy();
        expect(s?.prose.length).toBeGreaterThanOrEqual(2);
        expect(s?.prose.join(" ")).toContain("{family_name}");
        expect(s?.next).toBe(a.divert);
      }
    });

    it("covers all six power bases (5 flavored variants + 1 default)", () => {
      expect(new Set([...a.bases, a.defaultBase])).toEqual(new Set(ALL_BASES));
    });
  });
}
