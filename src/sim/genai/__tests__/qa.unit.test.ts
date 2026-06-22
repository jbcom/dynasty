import { describe, expect, it } from "vitest";
import type { Scene } from "../../saga/schema";
import {
  applyBraid,
  type BraidRequest,
  braidPassSystem,
  buildBraidPassPrompt,
  buildLineagePassPrompt,
  buildScenePassPrompt,
  type LineageSurface,
  lineagePassSystem,
  scenePassSystem,
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
