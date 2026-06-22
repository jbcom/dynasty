import { describe, expect, it } from "vitest";
import { loadContent } from "../../../data/loadContent";
import { DYNASTY_SPINE, spineActForGen } from "../../saga/spineAuthored";
import type { GenerateFn } from "../client";
import { expand } from "../expand";
import {
  buildScenePrompt,
  buildSpinePrompt,
  buildTitlePrompt,
  lineagePassBrief,
  mergeSceneFile,
  normalizeTitle,
  scenePassBrief,
  validateSceneFile,
} from "../scene";

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
        id: "act:bavaria:economic:middle:t1",
        wave: "bavaria",
        archetype: "economic",
        cls: "middle",
        tier: 1,
        macroAct: "convergence",
        title: "Act II — The New Ground",
        scenes: ["act:bavaria:economic:middle:t1:open"],
      },
    ],
    scenes: [
      {
        id: "act:bavaria:economic:middle:t1:open",
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
    expect(p).toContain("act:bavaria:economic:middle:t1");
    expect(p).toContain("act:bavaria:economic:middle:t1:open");
    expect(p).toContain("never re-stating when/where"); // the no-when/where rule via the opening slot intent
  });

  it("accepts a schema-valid act file and merges it into the canonical saga file", async () => {
    const res = await expand(
      content,
      { type: "scene", scene: req, count: 1 },
      stubObj(validActFile()),
    );
    expect(res.canonicalFile).toBe("src/data/saga/bavaria/economic.middle.act.json");
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

  it("rejects a dangling scene ref (act lists a scene id no scene object has)", () => {
    const broken = validActFile();
    // Simulate the model dropping/mis-spelling a scene id (e.g. a truncated wave) in the act's list.
    broken.acts[0]!.scenes = [
      "act:bavaria:economic:middle:t1:open",
      "act:bavaria:economic:middle:t1:rising",
    ];
    const out = validateSceneFile(broken, req);
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.reasons.join(" ")).toContain("dangling scene ref");
  });

  it("strips backticks the model wraps around identity tokens (`{surname}` → {surname})", () => {
    const drifted = validActFile();
    drifted.scenes[0]!.prose[0] =
      "The `{surname}`s crossed paths with the `{given_name} {surname}` line.";
    const out = validateSceneFile(drifted, req);
    expect(out.ok).toBe(true);
    if (out.ok) {
      const scene = out.file.scenes[0] as { prose: string[] };
      expect(scene.prose[0]).toBe(
        "The {surname}s crossed paths with the {given_name} {surname} line.",
      );
      expect(scene.prose[0]).not.toContain("`");
    }
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

describe("act retitle (distinct meso chapter titles)", () => {
  it("the title prompt roots the title in the act's opening prose + cell", () => {
    const p = buildTitlePrompt({
      wave: "ireland",
      archetype: "economic",
      cls: "poor",
      tier: 0,
      openingProse: "The hold smells of tar and brine and two hundred unwashed bodies.",
      cue: "The Crossing",
    });
    expect(p).toContain("ireland");
    expect(p).toContain("The hold smells of tar");
    expect(p).toContain("The Crossing"); // the cue, marked do-not-copy
  });

  it("normalizes a model title to 'Act <roman> — <title>' and strips quotes / stray prefix", () => {
    const out = normalizeTitle('"Salt in the Blood"', 2, "The Climb");
    expect(out.ok).toBe(true);
    if (out.ok) expect(out.title).toBe("Act III — Salt in the Blood");
    expect(normalizeTitle("Act V — A Name Bought in Steel", 4, "The World Player")).toEqual({
      ok: true,
      title: "Act V — A Name Bought in Steel",
    });
  });

  it('unwraps a JSON-wrapped model title ({"title":"…"} / ["…"])', () => {
    const obj = normalizeTitle('{"title": "An Unstooped Ascent"}', 2, "The Climb");
    expect(obj).toEqual({ ok: true, title: "Act III — An Unstooped Ascent" });
    const arr = normalizeTitle('["Where the Iron Takes Root"]', 1, "The Crossing");
    expect(arr).toEqual({ ok: true, title: "Act II — Where the Iron Takes Root" });
    const chap = normalizeTitle('{"chapter_title": "The Salt-Slick Threshold"}', 0, "The Crossing");
    expect(chap).toEqual({ ok: true, title: "Act I — The Salt-Slick Threshold" });
  });

  it("rejects an empty title, a leak, or a bare echo of the generic cue", () => {
    expect(normalizeTitle("   ", 0, "The Crossing").ok).toBe(false);
    expect(normalizeTitle("The Trump Ascendancy", 0, "The Crossing").ok).toBe(false);
    expect(normalizeTitle("The Crossing", 0, "The Crossing").ok).toBe(false); // echoed cue
  });
});

describe("QA guidance briefs (UQ-2) — fed from the corrected guidance.json", () => {
  it("scenePassBrief carries the era's qaLookFor/qaReject + the wave's myth-flags", () => {
    const brief = scenePassBrief("ireland", 0, "poor");
    expect(brief).toMatch(/THIS ERA MUST HAVE/);
    expect(brief).toMatch(/THIS ERA MUST NOT/);
    expect(brief).toMatch(/DO NOT INTRODUCE THESE MYTHS/);
    // Real corrected content: the Irish myth-flags name the exaggerated placard.
    expect(brief).toMatch(/No Irish Need Apply/i);
  });
  it("lineagePassBrief carries the wave's documented history/arc/braid + myths", () => {
    const brief = lineagePassBrief("italian");
    expect(brief).toMatch(/HISTORY:/);
    expect(brief).toMatch(/ARC \(arrival/);
    expect(brief).toMatch(/WHO THEY PLAUSIBLY CROSS/);
    // Real corrected content: the Italian Commission was established 1931, not the immigrant era.
    expect(brief).toMatch(/1931/);
  });
  it("returns an empty brief for an unknown wave (pass runs guidance-free)", () => {
    expect(lineagePassBrief("atlantis")).toBe("");
    expect(scenePassBrief("atlantis", 99, "poor")).toBe("");
  });
});

describe("authored-spine generation (FS-3b) — per-era decision architecture in the prompt", () => {
  it("injects the founding act's distinct architecture (bargain/allegiance, not a generic crossroads)", () => {
    const g0 = spineActForGen(0)!;
    const p = buildSpinePrompt(g0);
    expect(p).toMatch(/ONE dynasty line/);
    expect(p).toMatch(/America's\s+founding/i);
    expect(p).toMatch(/BARGAIN:/); // g0 uses bargain + allegiance
    expect(p).toMatch(/ALLEGIANCE:/);
    // It must explicitly steer AWAY from the old generic template.
    expect(p).toMatch(/do NOT default to a generic/i);
  });

  it("a later era injects a DIFFERENT architecture than the founding era (anti-sameness)", () => {
    const founding = buildSpinePrompt(spineActForGen(0)!);
    const broadcast = buildSpinePrompt(DYNASTY_SPINE.find((a) => a.era === "The Broadcast Age")!);
    expect(broadcast).toMatch(/PLATFORM:/); // broadcast era = platform play
    expect(broadcast).not.toMatch(/BARGAIN:/); // not the founding shape
    expect(founding).not.toMatch(/PLATFORM:/);
  });

  it("the terminal stellar act injects the EXPANSION architecture (seeds the stellar endings)", () => {
    const stellar = DYNASTY_SPINE.at(-1)!;
    const p = buildSpinePrompt(stellar);
    expect(p).toMatch(/EXPANSION:/);
    expect(p).toMatch(/FORGE ALLIES|SEIZE COLONIES|QUIET/);
  });

  it("carries the optional founding-identity brief when given", () => {
    const p = buildSpinePrompt(spineActForGen(0)!, "FOUNDER: Tobias, a Boston printer's son.");
    expect(p).toContain("Tobias, a Boston printer's son");
  });
});
