import { describe, expect, it } from "vitest";
import {
  attendFlag,
  buildBirthScene,
  buildChildhoodScene,
  buildEpoch0Opening,
  buildNamingScene,
} from "../founding/epoch0Opening";
import { dealSenseCues, resolvePlace, type Sense } from "../founding/senseEmergence";
import { createRng } from "../rng";
import { SceneSchema } from "../saga/schema";

/**
 * EI-3 EPOCH-0 OPENING ACT — the birth scene un-retires Epoch 0 on the saga substrate: a valid Scene with
 * the newborn's senses as GLOWING INLINE beat-choices (not a .card menu), real authored prose, and a major
 * close decision through which the emergent place crystallizes (EI-2 resolvePlace reads the attend:* flags).
 */

describe("epoch-0 birth scene (EI-3 EPOCH-0 OPENING ACT)", () => {
  it("is a schema-valid Scene with multi-paragraph real prose and a sense beat per dealt cue", () => {
    const cues = dealSenseCues(createRng("b1"));
    const scene = buildBirthScene(cues);
    // It parses against the real saga SceneSchema — it renders through the SceneReader like any saga scene.
    expect(() => SceneSchema.parse(scene)).not.toThrow();
    expect(scene.id).toBe("epoch0:birth");
    expect(scene.prose.length, "multi-paragraph birth prose").toBeGreaterThanOrEqual(2);
    // One inline beat-choice per dealt sense; each beat's choice stamps the attend flag (no .card menu).
    expect(scene.beats.length).toBe(cues.length);
    for (const cue of cues) {
      const beat = scene.beats.find((b) => b.prose.join(" ").includes(cue.text));
      expect(beat, `a beat surfaces the ${cue.sense} cue`).toBeDefined();
      expect(beat?.choice?.setFlags).toContain(attendFlag(cue.sense));
      expect(beat?.choice?.gather, "attending a sense gathers (stays in the scene)").toBe(true);
    }
  });

  it("closes on a MAJOR decision whose options carry the attend flags the place-resolver reads", () => {
    const cues = dealSenseCues(createRng("b2"));
    const scene = buildBirthScene(cues);
    expect(scene.decision?.tier).toBe("major");
    expect(scene.decision?.options.length).toBe(cues.length);
    for (const opt of scene.decision?.options ?? []) {
      // Each close option stamps an attend flag + marks the place resolved — the moment awareness sets.
      expect(opt.setFlags.some((f) => f.startsWith("attend:"))).toBe(true);
      expect(opt.setFlags).toContain("epoch0:place_resolved");
    }
    // The act flows forward to the naming beat (EI-5), not back to a menu.
    expect(scene.next).toBe("epoch0:naming");
  });

  it("the attend flags drive EI-2 resolvePlace end-to-end (senses → one place)", () => {
    const cues = dealSenseCues(createRng("b3"));
    // Simulate the player attending two senses; the flags the birth scene would stamp feed resolvePlace.
    const attended: Sense[] = [cues[0]?.sense, cues[1]?.sense].filter(Boolean) as Sense[];
    const place = resolvePlace(cues, attended);
    expect(["new_england", "mid_atlantic", "south"]).toContain(place);
    // Deterministic: the same cues + attentions resolve the same place.
    expect(resolvePlace(dealSenseCues(createRng("b3")), attended)).toBe(place);
  });

  it("EI-3b: the NAMING scene names the line in-fiction (identity tokens) + sets the named flag", () => {
    const scene = buildNamingScene();
    expect(() => SceneSchema.parse(scene)).not.toThrow();
    expect(scene.id).toBe("epoch0:naming");
    // The name is spoken in-fiction via identity tokens (resolved from the live family at render).
    const text = [...scene.prose, ...scene.beats.flatMap((b) => b.prose)].join(" ");
    expect(text).toMatch(/\{full_name\}|\{given_name\}/);
    expect(scene.beats.some((b) => b.choice?.setFlags.includes("epoch0:named"))).toBe(true);
    // It only runs after the place resolved, and flows to childhood.
    expect(scene.requires.flags).toContain("epoch0:place_resolved");
    expect(scene.next).toBe("epoch0:childhood");
  });

  it("EI-3b: the CHILDHOOD scene reads standing diegetically (established vs rising) and bridges to formative", () => {
    const scene = buildChildhoodScene();
    expect(() => SceneSchema.parse(scene)).not.toThrow();
    const standingFlags = (scene.decision?.options ?? []).flatMap((o) => o.setFlags);
    expect(standingFlags).toContain("epoch0:standing_established");
    expect(standingFlags).toContain("epoch0:standing_rising");
    expect(scene.requires.flags).toContain("epoch0:named");
    expect(scene.next).toBe("epoch0:formative");
  });

  it("EI-3+EI-4: buildEpoch0Opening returns the full connected birth → … → romance chain", () => {
    const scenes = buildEpoch0Opening(dealSenseCues(createRng("chain")));
    // The full emergence: birth → naming → childhood → the five formative beats.
    expect(scenes.map((s) => s.id)).toEqual([
      "epoch0:birth",
      "epoch0:naming",
      "epoch0:childhood",
      "epoch0:formative",
      "epoch0:schooling",
      "epoch0:betrayal",
      "epoch0:loss",
      "epoch0:romance",
    ]);
    // Every scene is schema-valid and the `next` links form an unbroken chain up to the romance close.
    for (const s of scenes) expect(() => SceneSchema.parse(s)).not.toThrow();
    for (let i = 0; i < scenes.length - 1; i++) {
      expect(scenes[i]?.next, `${scenes[i]?.id} → ${scenes[i + 1]?.id}`).toBe(scenes[i + 1]?.id);
    }
    // The romance close ends the emergence (no next) and marks emerged.
    expect(scenes[scenes.length - 1]?.next).toBeUndefined();
  });
});
