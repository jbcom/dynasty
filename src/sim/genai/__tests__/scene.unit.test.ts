import { describe, expect, it } from "vitest";
import { loadContent } from "../../../data/loadContent";
import type { GenerateFn } from "../client";
import { expand } from "../expand";
import { buildScenePrompt, mergeSceneFile, validateSceneFile } from "../scene";

/**
 * The `scene` mode of the GenAI expander authors a whole act of the NOVEL — a single object validated
 * through SagaFileSchema (the real gate), merged into the family's canonical act file. Stubbed GenerateFn.
 */

const content = loadContent();
const req = { wave: "bavaria", cls: "middle" as const, archetype: "economic" as const, tier: 1 };

/** A minimal-but-valid generated act file for the bavaria/economic tier-1 act. */
function validActFile() {
  return {
    acts: [
      {
        id: "act:bavaria:economic:t1",
        wave: "bavaria",
        archetype: "economic",
        tier: 1,
        macroAct: "convergence",
        title: "Act II — The New Ground",
        scenes: ["act:bavaria:economic:t1:open"],
      },
    ],
    scenes: [
      {
        id: "act:bavaria:economic:t1:open",
        sense: "smell",
        prose: [
          "The bakery the {family_name}s have leased smells of rye and coal-smoke, and of the river two streets over that floods every spring.",
          "Your father counts the day's takings twice, the way he counts everything twice now, as if arithmetic could be made to lie in your favour by sheer attention.",
        ],
        beats: [
          {
            prose: ["You learn the ledger before you learn your letters."],
            choice: {
              text: "Money is a language; you mean to be fluent.",
              motivatorShift: { wealth: 8 },
              setFlags: ["learned_the_books"],
            },
          },
        ],
      },
    ],
  };
}

const stubObj =
  (obj: unknown): GenerateFn =>
  async () =>
    JSON.stringify(obj);

describe("genai scene mode", () => {
  it("builds a prompt naming every scene slot of the cell's act", () => {
    const p = buildScenePrompt(req);
    expect(p).toContain("act:bavaria:economic:t1");
    expect(p).toContain("act:bavaria:economic:t1:open");
    expect(p).toContain("never re-stating when/where"); // the no-when/where rule via the opening slot intent
  });

  it("accepts a schema-valid act file and merges it into the canonical saga file", async () => {
    const res = await expand(
      content,
      { type: "scene", scene: req, count: 1 },
      stubObj(validActFile()),
    );
    expect(res.canonicalFile).toBe("src/data/saga/bavaria/economic.act.json");
    expect(res.accepted).toHaveLength(1);
    expect(res.rejected).toHaveLength(0);
    const merged = res.merge({ acts: [], scenes: [] }) as { acts: unknown[]; scenes: unknown[] };
    expect(merged.acts).toHaveLength(1);
    expect(merged.scenes).toHaveLength(1);
  });

  it("rejects a malformed act file (fragment prose / bad shape)", async () => {
    const bad = { acts: [], scenes: [{ id: "x", sense: "smell", prose: [] }] }; // prose must be min(1)
    const res = await expand(content, { type: "scene", scene: req, count: 1 }, stubObj(bad));
    expect(res.accepted).toHaveLength(0);
    expect(res.rejected[0]?.reasons.join(" ")).toContain("schema");
  });

  it("rejects a preset-person leak", () => {
    const leaky = validActFile();
    leaky.scenes[0]!.prose[0] = "Donald visited the bakery.";
    const out = validateSceneFile(leaky, req);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.reasons).toContain("preset-person leak");
  });

  it("rejects an act relabelled to the wrong cell/tier", () => {
    const wrong = validActFile();
    wrong.acts[0]!.id = "act:ireland:economic:t0";
    const out = validateSceneFile(wrong, req);
    expect(out.ok).toBe(false);
  });

  it("normalizes model drift: a beat's `line` string coerces to prose[]", () => {
    const drifted = validActFile();
    // Simulate the model emitting `line` instead of `prose` on the beat.
    const beat = drifted.scenes[0]!.beats[0] as Record<string, unknown>;
    delete beat.prose;
    beat.line = "You learn the ledger before your letters.";
    const out = validateSceneFile(drifted, req);
    expect(out.ok).toBe(true);
    if (out.ok) {
      const scene = out.file.scenes[0] as { beats: Array<{ prose: string[] }> };
      expect(scene.beats[0]?.prose).toEqual(["You learn the ledger before your letters."]);
    }
  });

  it("normalizes object-with-numeric-keys drift (prose/beats as object → array)", () => {
    const drifted = validActFile() as unknown as {
      scenes: Array<{ prose: unknown; beats: unknown }>;
    };
    // Simulate Gemini emitting prose + beats as objects instead of arrays.
    const sc = drifted.scenes[0]!;
    sc.prose = {
      "0": "First paragraph long enough to be real prose, not a fragment at all here.",
      "1": "Second paragraph also long enough to count as genuine multi-paragraph novel prose.",
    };
    sc.beats = {
      "0": {
        prose: ["A framing line."],
        choice: { text: "Pick me.", motivatorShift: { wealth: 3 }, setFlags: [] },
      },
    };
    const out = validateSceneFile(drifted, req);
    expect(out.ok).toBe(true);
    if (out.ok) {
      const scene = out.file.scenes[0] as { prose: string[]; beats: unknown[] };
      expect(Array.isArray(scene.prose)).toBe(true);
      expect(scene.prose).toHaveLength(2);
      expect(Array.isArray(scene.beats)).toBe(true);
    }
  });

  it("merge dedups by id (regenerated act replaces the old)", () => {
    const first = validActFile();
    const merged1 = mergeSceneFile({ acts: [], scenes: [] }, first) as {
      acts: unknown[];
      scenes: unknown[];
    };
    const merged2 = mergeSceneFile(merged1, validActFile()) as {
      acts: unknown[];
      scenes: unknown[];
    };
    expect(merged2.acts).toHaveLength(1); // not duplicated
    expect(merged2.scenes).toHaveLength(1);
  });
});
