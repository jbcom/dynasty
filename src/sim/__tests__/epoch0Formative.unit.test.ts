import { describe, expect, it } from "vitest";
import { buildFormativeBeats, leanFlag } from "../founding/epoch0Formative";
import { buildChildhoodScene } from "../founding/epoch0Opening";
import { SceneSchema } from "../saga/schema";

/**
 * EI-4 FORMATIVE BEATS — the lived childhood→youth of the un-retired Epoch 0: first friend / schooling /
 * betrayal / loss / romance, each a real-copy saga scene that sets a life-seed AND nudges a power base, with
 * the romance close carrying the kept succession hand-off (the emergence ends; Act 1 begins).
 */

describe("epoch-0 formative beats (EI-4 FORMATIVE BEATS)", () => {
  const scenes = buildFormativeBeats();

  it("authors the five named formative beats, each a schema-valid Scene with real prose", () => {
    expect(scenes.map((s) => s.id)).toEqual([
      "epoch0:formative",
      "epoch0:schooling",
      "epoch0:betrayal",
      "epoch0:loss",
      "epoch0:romance",
    ]);
    for (const s of scenes) {
      expect(() => SceneSchema.parse(s), `${s.id} is schema-valid`).not.toThrow();
      expect(s.prose.join(" ").length, `${s.id} has real prose`).toBeGreaterThan(40);
      expect(s.decision, `${s.id} has a decision`).toBeDefined();
    }
  });

  it("each beat sets a life-seed flag; the bent-shaping beats nudge a power base (the facet crystallizes)", () => {
    for (const s of scenes) {
      const flags = (s.decision?.options ?? []).flatMap((o) => o.setFlags);
      // Every formative beat sets a life-seed.
      expect(
        flags.some((f) => f.startsWith("seed:")),
        `${s.id} sets a life-seed`,
      ).toBe(true);
      // The bent-shaping beats (friend / schooling / betrayal / loss) nudge a power base; the romance CLOSE
      // is the succession threshold instead (it carries takesPartner, not a power-base lean).
      if (s.id !== "epoch0:romance") {
        expect(
          flags.some((f) => f.startsWith("power_lean:")),
          `${s.id} nudges a power base`,
        ).toBe(true);
      }
    }
  });

  it("chains unbroken from childhood → formative → … → romance via next links + requires", () => {
    // The childhood scene (EI-3) hands off to the formative chain.
    expect(buildChildhoodScene().next).toBe("epoch0:formative");
    // Each scene's `next` is the following scene's id (the last — romance — ends the emergence).
    for (let i = 0; i < scenes.length - 1; i++) {
      expect(scenes[i]?.next, `${scenes[i]?.id} → ${scenes[i + 1]?.id}`).toBe(scenes[i + 1]?.id);
    }
    expect(scenes[scenes.length - 1]?.id).toBe("epoch0:romance");
    expect(
      scenes[scenes.length - 1]?.next,
      "the romance close ends the emergence (no next)",
    ).toBeUndefined();
  });

  it("the romance close carries the succession hand-off (the kept Epoch-0 mechanic) + marks emergence done", () => {
    const romance = scenes.find((s) => s.id === "epoch0:romance");
    expect(romance?.decision?.tier).toBe("major");
    const opts = romance?.decision?.options ?? [];
    // A partner option steps the line to the next generation (takesPartner); both options mark emerged.
    expect(
      opts.some((o) => o.succession?.takesPartner === true),
      "a take-partner option exists",
    ).toBe(true);
    expect(
      opts.every((o) => o.setFlags.includes("epoch0:emerged")),
      "every close marks emergence done",
    ).toBe(true);
  });

  it("the power-base leans span the founding power bases (the bent can emerge toward any)", () => {
    const leans = new Set(
      scenes
        .flatMap((s) => s.decision?.options ?? [])
        .flatMap((o) => o.setFlags)
        .filter((f) => f.startsWith("power_lean:")),
    );
    // Across the five beats, several distinct power bases are reachable (commerce/pulpit/law/land/military/press).
    expect(leans.size, `leans: ${[...leans].join(",")}`).toBeGreaterThanOrEqual(4);
    expect(leans.has(leanFlag("commerce"))).toBe(true);
    expect(leans.has(leanFlag("pulpit"))).toBe(true);
  });
});
