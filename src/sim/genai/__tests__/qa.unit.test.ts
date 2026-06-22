import { describe, expect, it } from "vitest";
import type { Scene } from "../../saga/schema";
import {
  applyBraid,
  applySlots,
  applySuccession,
  type BraidRequest,
  braidPassSystem,
  buildBraidPassPrompt,
  buildLineagePassPrompt,
  buildScenePassPrompt,
  buildSlotPassPrompt,
  buildSuccessionPrompt,
  type LineageSurface,
  lineagePassSystem,
  normalizeBraidSlots,
  type SuccessionRequest,
  scenePassSystem,
  slotPassSystem,
  successionPassSystem,
} from "../qa";

/**
 * The scoped QA builders (src/sim/genai/qa.ts) are pure prompt strings + one pure mutation
 * (applyBraid). These tests pin the scope contracts: each pass tells the model what to PRESERVE,
 * the braid mutation writes a thread[] entry weaveThreads will honor, and the shared rules ride along.
 */

const scene: Scene = {
  id: "act:ireland:economic:poor:t0:midpoint",
  sense: "smell",
  prose: ["The wharf reeked of brine and the heavy musk of dray horses."],
  beats: [],
  thread: [],
  braidSlots: [],
  requires: { flags: [], notFlags: [] },
};

describe("scene-polish pass", () => {
  it("system instruction forbids changing the wiring and names the leak/sense rules", () => {
    const sys = scenePassSystem();
    expect(sys).toMatch(/PRESERVE EXACTLY/);
    expect(sys).toMatch(/never write a real person's name/i);
    expect(sys).toMatch(/sensory frame/i);
  });
  it("prompt carries the act register cues + the scene JSON", () => {
    const p = buildScenePassPrompt(scene, {
      title: "Act I — The Crossing",
      macroAct: "convergence",
    });
    expect(p).toMatch(/The Crossing/);
    expect(p).toMatch(/convergence/);
    expect(p).toContain(scene.id);
  });
});

describe("lineage pass", () => {
  it("asks for cross-tier breaks as structured JSON, not style nits", () => {
    const sys = lineagePassSystem();
    expect(sys).toMatch(/CROSS-TIER breaks/);
    expect(sys).toMatch(/breaks:/);
    expect(sys).toMatch(/not style nits/i);
  });
  it("prompt embeds the lean chain surface", () => {
    const surface: LineageSurface = {
      wave: "ireland",
      archetype: "economic",
      cls: "poor",
      acts: [{ id: "a", tier: 0, macroAct: "convergence", title: "T", scenes: [] }],
    };
    const p = buildLineagePassPrompt(surface);
    expect(p).toMatch(/six generations/);
    expect(p).toContain("ireland");
  });
});

describe("braid pass", () => {
  it("system instruction demands a pair-specific crossing + a relation", () => {
    const sys = braidPassSystem();
    expect(sys).toMatch(/CROSS-STORYLINE/);
    expect(sys).toMatch(/could only be these two lines/);
    expect(sys).toMatch(/opposing.*contributing.*neutral/);
  });
  it("prompt names BOTH lines and the tier/era", () => {
    const req: BraidRequest = {
      wave: "ireland",
      waveLabel: "Irish",
      rival: "bavaria",
      rivalLabel: "German",
      tier: 2,
      macroAct: "convergence",
      sceneOpening: "The wharf reeked of brine.",
    };
    const p = buildBraidPassPrompt(req);
    expect(p).toMatch(/Irish/);
    expect(p).toMatch(/German/);
    expect(p).toMatch(/tier 2/);
  });
  it("applyBraid writes an authored crossing weaveThreads will honor (replaces same-rival, keeps others)", () => {
    const withOther: Scene = {
      ...scene,
      thread: [{ wave: "chinese", atTier: 0, crossing: "old" }],
    };
    const out = applyBraid(withOther, "bavaria", 2, {
      crossing: "A specific German rivalry.",
      relation: "opposing",
    });
    // The chinese ref is preserved; the new bavaria ref is added with the authored crossing + relation.
    expect(out.thread).toHaveLength(2);
    const bav = out.thread.find((t) => t.wave === "bavaria");
    expect(bav?.crossing).toBe("A specific German rivalry.");
    expect(bav?.relation).toBe("opposing");
    expect(out.thread.find((t) => t.wave === "chinese")).toBeDefined();
  });
  it("applyBraid replaces an existing entry for the same rival (no duplicate)", () => {
    const withBav: Scene = {
      ...scene,
      thread: [{ wave: "bavaria", atTier: 2, crossing: "template" }],
    };
    const out = applyBraid(withBav, "bavaria", 2, { crossing: "authored", relation: "neutral" });
    expect(out.thread).toHaveLength(1);
    expect(out.thread[0]?.crossing).toBe("authored");
  });
});

describe("succession pass", () => {
  it("system instruction demands exactly one take-partner+heirs option carrying the succession effect", () => {
    const sys = successionPassSystem();
    expect(sys).toMatch(/dynastic fork/);
    expect(sys).toMatch(/EXACTLY ONE/);
    expect(sys).toMatch(/takesPartner: true/);
    expect(sys).toMatch(/3 options/);
  });
  it("prompt roots the decision in the close prose + family", () => {
    const req: SuccessionRequest = {
      wave: "ireland",
      waveLabel: "Irish",
      archetype: "economic",
      tier: 2,
      closeProse: "The hearth has gone cold and the ledger is closed for the last time.",
    };
    const p = buildSuccessionPrompt(req);
    expect(p).toMatch(/Irish/);
    expect(p).toMatch(/generation 3/);
    expect(p).toMatch(/hearth has gone cold/);
  });
  it("applySuccession attaches the authored decision to the close scene", () => {
    const close: Scene = {
      id: "act:ireland:economic:poor:t2:close",
      sense: "taste",
      prose: ["The last loaf cools."],
      beats: [],
      thread: [],
      braidSlots: [],
      requires: { flags: [], notFlags: [] },
    };
    const decision: Scene["decision"] = {
      tier: "major",
      prompt: "Does the line go on?",
      options: [
        {
          text: "Take a partner; raise children to carry the trade.",
          motivatorShift: { lineage: 3 },
          setFlags: ["took_partner"],
          succession: { takesPartner: true, begets: 2 },
        },
        {
          text: "Pour everything into the work; let the name thin.",
          motivatorShift: { reach: 2 },
          setFlags: [],
        },
      ],
    };
    const out = applySuccession(close, decision);
    expect(out.decision?.options[0]?.succession?.takesPartner).toBe(true);
    expect(out.decision?.options[0]?.succession?.begets).toBe(2);
    expect(out.id).toBe(close.id); // scene wiring untouched
  });
});

describe("braid-slot pass (WV-2)", () => {
  it("system instruction names the two slot kinds + the public-setting rule", () => {
    const sys = slotPassSystem();
    expect(sys).toMatch(/DESTINATION/);
    expect(sys).toMatch(/SOURCE/);
    expect(sys).toMatch(/vignette/);
    expect(sys).toMatch(/PUBLIC/i);
    expect(sys).toMatch(/braidSlots/);
  });
  it("prompt indexes the scene's paragraphs for the model to reference by `at`", () => {
    const s: Scene = {
      ...scene,
      prose: [
        "The peddler calls his wares on the corner.",
        "An Irish family wanders past, looking.",
      ],
    };
    const p = buildSlotPassPrompt(s);
    expect(p).toContain("[0] The peddler");
    expect(p).toContain("[1] An Irish family");
    expect(p).toContain(s.id);
  });
  it("applySlots attaches the authored slots to the scene (wiring untouched)", () => {
    const out = applySlots(scene, [
      { kind: "source", at: 0, setting: "market", vignette: "A peddler hawks tin and thread." },
      { kind: "destination", at: 0, setting: "market" },
    ]);
    expect(out.braidSlots).toHaveLength(2);
    expect(out.braidSlots[0]?.kind).toBe("source");
    expect(out.braidSlots[1]?.kind).toBe("destination");
    expect(out.id).toBe(scene.id);
  });

  it("normalizeBraidSlots coerces model drift (kind casing/synonyms, lowercases setting)", () => {
    const out = normalizeBraidSlots([
      { kind: "DESTINATION", at: 0, setting: "Market" }, // uppercase kind + setting
      { kind: "src", at: 1, setting: "dock", vignette: "A peddler." }, // synonym
      { kind: "anchor", at: 2, setting: "civic hall" }, // synonym → destination
      { kind: "??", at: 3, setting: "x" }, // unresolvable → dropped
    ]);
    expect(out).toHaveLength(3); // the unresolvable one is dropped
    expect((out[0] as { kind: string }).kind).toBe("destination");
    expect((out[0] as { setting: string }).setting).toBe("market"); // lowercased
    expect((out[1] as { kind: string }).kind).toBe("source");
    expect((out[2] as { kind: string }).kind).toBe("destination");
  });

  it("normalizeBraidSlots strips a vignette off a destination (schema would reject it)", () => {
    const out = normalizeBraidSlots([
      { kind: "destination", at: 0, setting: "market", vignette: "stray" },
    ]);
    expect((out[0] as { vignette?: string }).vignette).toBeUndefined();
  });
});
