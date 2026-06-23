import { describe, expect, it } from "vitest";
import { buildEpoch0Opening } from "../founding/epoch0Opening";
import {
  chooseOpeningBeat,
  chooseOpeningDecision,
  currentOpeningScene,
  type OpeningState,
  openingEnded,
  startOpening,
} from "../founding/openingRunner";
import { resolveEmergentFounding } from "../founding/resolveEmergentFounding";
import { dealSenseCues } from "../founding/senseEmergence";
import { resolveFoundingStart } from "../foundingOrigin";
import { createRng } from "../rng";

/**
 * EI-6b — a pure runner walks the Epoch-0 opening scene chain end-to-end: attend senses (beats), take each
 * scene's decision, reach the end; the accumulated flags + cues then resolve a valid founding. This is the
 * sim spine of the live entry flow the UI drives (the SceneReader's onbeat/ondecision call these).
 */

describe("opening runner (EI-6b)", () => {
  const cues = dealSenseCues(createRng("run1"));
  const scenes = buildEpoch0Opening(cues);

  it("starts at the birth scene with empty accumulated state", () => {
    const s = startOpening(scenes);
    expect(s.sceneId).toBe("epoch0:birth");
    expect(s.flags).toEqual([]);
    expect(openingEnded(s)).toBe(false);
    expect(currentOpeningScene(scenes, s)?.id).toBe("epoch0:birth");
  });

  it("a gathering beat stays in the scene + accrues its flag; the decision advances to the next scene", () => {
    let s = startOpening(scenes);
    s = chooseOpeningBeat(scenes, s, 0); // attend the first sense
    expect(s.sceneId, "a gathering beat stays in the birth scene").toBe("epoch0:birth");
    expect(s.flags.some((f) => f.startsWith("attend:"))).toBe(true);
    s = chooseOpeningDecision(scenes, s, 0); // settle the place
    expect(s.sceneId, "the decision advances to naming").toBe("epoch0:naming");
    expect(s.flags).toContain("epoch0:place_resolved");
  });

  it("walks the FULL chain to the end and the accumulated flags resolve a valid founding", () => {
    let s: OpeningState = startOpening(scenes);
    let guard = 0;
    // Drive: attend the first beat (if any) then take the first decision option, scene by scene, to the end.
    while (!openingEnded(s) && guard < 30) {
      const scene = currentOpeningScene(scenes, s);
      if (!scene) break;
      if (scene.beats.length > 0) s = chooseOpeningBeat(scenes, s, 0);
      // After the (gathering) beat we're still in-scene; take the decision to advance.
      const afterBeat = currentOpeningScene(scenes, s);
      if (afterBeat?.decision) s = chooseOpeningDecision(scenes, s, 0);
      else if (afterBeat?.next) s = { ...s, sceneId: afterBeat.next };
      else break;
      guard++;
    }
    expect(openingEnded(s), "the opening runs to its end").toBe(true);
    // The emergence completed: the romance close stamped epoch0:emerged.
    expect(s.flags).toContain("epoch0:emerged");
    // The accumulated flags + cues resolve a real founding (the whole EI chain integrates).
    const choice = resolveEmergentFounding(cues, s.flags);
    expect(["new_england", "mid_atlantic", "south"]).toContain(choice.region);
    const start = resolveFoundingStart(choice);
    expect(start.archetype, "a real archetype emerges from the lived opening").toBeTruthy();
  });

  it("is deterministic: the same picks over the same opening reach the same flags", () => {
    const drive = (sc: ReturnType<typeof buildEpoch0Opening>) => {
      let s: OpeningState = startOpening(sc);
      let guard = 0;
      while (!openingEnded(s) && guard < 30) {
        const scene = currentOpeningScene(sc, s);
        if (!scene) break;
        if (scene.beats.length > 0) s = chooseOpeningBeat(sc, s, 0);
        const afterBeat = currentOpeningScene(sc, s);
        if (afterBeat?.decision) s = chooseOpeningDecision(sc, s, 0);
        else if (afterBeat?.next) s = { ...s, sceneId: afterBeat.next };
        else break;
        guard++;
      }
      return s.flags.slice().sort();
    };
    expect(drive(buildEpoch0Opening(dealSenseCues(createRng("run1"))))).toEqual(
      drive(buildEpoch0Opening(dealSenseCues(createRng("run1")))),
    );
  });

  it("an out-of-bounds beat/decision index is a NO-OP, not a crash (Amazon-Q #192 bounds guard)", () => {
    const s = startOpening(scenes);
    // Bad indices return the SAME state (no throw, no advance, no flag change).
    expect(chooseOpeningBeat(scenes, s, 99)).toEqual(s);
    expect(chooseOpeningBeat(scenes, s, -1)).toEqual(s);
    expect(chooseOpeningDecision(scenes, s, 99)).toEqual(s);
    expect(chooseOpeningDecision(scenes, s, -1)).toEqual(s);
  });
});
