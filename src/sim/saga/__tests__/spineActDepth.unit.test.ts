import { describe, expect, it } from "vitest";
import { loadSaga } from "../../../data/loadSaga";
import keeperReport from "../../../data/saga/fabric/keepers.json" with { type: "json" };
import { initMotivators } from "../../motivators";
import { auditProseQuality } from "../../proseQuality";
import { actEnded, chooseBeat, chooseDecision, currentScene, startAct } from "../runner";

/**
 * SPINE-ACT-DEPTH — EVERY spine act (g0..g9) is deepened with decisionless INTERSTITIAL scenes interleaved
 * between the authored DecisionArchitecture beats: a TEXTURE scene after the open and a CONSEQUENCE scene
 * after the first major decision. Per [[novel-not-fragments]] these are weave-only (gather beats, fall
 * forward) — they add lived texture + reading time toward the hour+ mandate WITHOUT adding more major
 * decisions (the anti-sameness invariant is unaffected). These tests walk each act and assert the deepened
 * chain (open → texture → decision → consequence → … → close) is reached from EVERY opening, and that the
 * interstitials are genuine decisionless texture in the spine voice.
 */

const corpus = loadSaga();
const PROMOTED_CONVERGENCE_KEEPER_ID = "act:ireland:economic:poor:t0:turn";
const PROMOTED_ASCENSION_KEEPER_ID = "act:ireland:religious:poor:t5:midpoint";
const PROMOTED_EMERGENCE_KEEPER_ID = "act:ireland:athletic:poor:t3:rising";
const PROMOTED_NON_IRELAND_KEEPER_ID = "act:italian:athletic:poor:t1:midpoint";
const KEEPERS = (
  keeperReport as {
    keepers: Array<{
      sceneId: string;
      wave: string;
      era: string;
      tier: number;
      keeperScore: number;
      maxSimilarity: number;
    }>;
  }
).keepers;

/** Every authored spine generation act — all are deepened with a texture + consequence interstitial. */
const SPINE_ACTS = [
  "spine:g0:founding",
  "spine:g1:earlyrepublic",
  "spine:g2:antebellum",
  "spine:g3:gildedage",
  "spine:g4:progressive",
  "spine:g5:midcentury",
  "spine:g6:broadcast",
  "spine:g7:networked",
  "spine:g8:orbital",
  "spine:g9:interstellar",
];

function act(actId: string) {
  const a = corpus.acts.get(actId);
  if (!a) throw new Error(`no act ${actId}`);
  return a;
}

function scene(sceneId: string) {
  const s = corpus.scenes.get(sceneId);
  if (!s) throw new Error(`no scene ${sceneId}`);
  return s;
}

function qualityParts(sceneId: string): string[] {
  const s = scene(sceneId);
  return [
    ...s.prose,
    ...s.beats.flatMap((beat) => [...beat.prose, beat.choice?.text ?? ""]),
    s.decision?.prompt ?? "",
    ...(s.decision?.options.map((option) => option.text) ?? []),
  ].filter(Boolean);
}

function topKeeperFor(wave: string, tier: number): (typeof KEEPERS)[number] | undefined {
  return KEEPERS.filter((keeper) => keeper.wave === wave && keeper.tier === tier).sort(
    (a, b) => b.keeperScore - a.keeperScore,
  )[0];
}

function keeperBySceneId(sceneId: string): (typeof KEEPERS)[number] | undefined {
  return KEEPERS.find((keeper) => keeper.sceneId === sceneId);
}

/** Walk an act from a founding flag set, always taking beat 0 / decision option 0, collecting scene ids
 *  (stripped of the act prefix) until the act ends or a guard trips. */
function walk(actId: string, flags: string[]): string[] {
  let state = startAct(corpus, act(actId), initMotivators(), flags);
  const path: string[] = [];
  let guard = 0;
  while (!actEnded(state) && guard++ < 30) {
    const scene = currentScene(corpus, state);
    if (!scene) break;
    path.push(scene.id.replace(`${actId}:`, ""));
    state = scene.decision ? chooseDecision(corpus, state, 0) : chooseBeat(corpus, state, 0);
  }
  return path;
}

describe("SPINE-ACT-DEPTH: every spine act is deepened with texture + consequence interstitials", () => {
  it("GENAI-GENERATE ratchet: regenerated spine generations keep distinct structural fingerprints", () => {
    const fingerprints = SPINE_ACTS.map((actId) => {
      const a = act(actId);
      return a.scenes
        .map((id) => {
          const scene = corpus.scenes.get(id);
          if (!scene) throw new Error(`no scene ${id}`);
          return `${scene.sense}:${scene.beats.length}${scene.decision ? "D" : ""}${
            scene.decision ? `:${scene.decision.options.length}` : ""
          }`;
        })
        .join("|");
    });
    const distinct = new Set(fingerprints).size;
    const largestCluster = Math.max(
      0,
      ...[...new Set(fingerprints)].map(
        (fingerprint) => fingerprints.filter((candidate) => candidate === fingerprint).length,
      ),
    );
    expect(
      distinct / SPINE_ACTS.length,
      "distinct structural fingerprint ratio",
    ).toBeGreaterThanOrEqual(0.9);
    expect(largestCluster, "no repeated generated spine skeleton cluster").toBeLessThanOrEqual(2);
  });

  it("g0 walks open → texture → allegiance → consequence → reversal → bargain → close (heavy-act shape)", () => {
    expect(walk("spine:g0:founding", [])).toEqual([
      "open",
      "tex_pressroom",
      "allegiance",
      "csq_aftermath",
      "rev_csq_aftermath",
      "bargain",
      "close",
    ]);
  });

  it("KEY-PILLARS-2: keeper-ranked legacy fabric is rewritten into the authored Gilded Age spine", () => {
    const encounterId = "spine:g3:gildedage:keeper_ireland_coal";
    const keeper = topKeeperFor("ireland", 0);
    expect(keeper?.sceneId).toBe(PROMOTED_CONVERGENCE_KEEPER_ID);
    expect(keeper?.keeperScore).toBeGreaterThanOrEqual(0.85);
    expect(keeper?.maxSimilarity).toBe(0);

    const gilded = act("spine:g3:gildedage");
    const texIndex = gilded.scenes.indexOf("spine:g3:gildedage:tex_open");
    expect(gilded.scenes.slice(texIndex, texIndex + 4)).toEqual([
      "spine:g3:gildedage:tex_open",
      encounterId,
      "spine:g3:gildedage:keeper_italian_common",
      "spine:g3:gildedage:venture",
    ]);

    const encounter = scene(encounterId);
    const prose = encounter.prose.join(" ");
    expect(prose).toMatch(/hollow-cheeked child/i);
    expect(prose).toMatch(/dray cart/i);
    expect(prose).toMatch(/dropped bit of coal/i);
    expect(prose).not.toMatch(/\b(I|me|my|mine|we|our|ours|us)\b/i);
    expect(prose).toMatch(/\{given_name\}|\{surname\}/);
    expect(encounter.decision).toBeUndefined();
    expect(encounter.beats.length).toBeGreaterThanOrEqual(2);
    expect(encounter.next).toBe("spine:g3:gildedage:keeper_italian_common");

    const report = auditProseQuality(
      "spine:g3:gildedage:keeper_ireland_coal",
      qualityParts(encounterId),
    );
    expect(report.pass, JSON.stringify(report.findings, null, 2)).toBe(true);
  });

  it("KEY-PILLARS-7: strongest non-Ireland keeper broadens the Gilded Age spine", () => {
    const encounterId = "spine:g3:gildedage:keeper_italian_common";
    const keeper = topKeeperFor("italian", 1);
    expect(keeper?.sceneId).toBe(PROMOTED_NON_IRELAND_KEEPER_ID);
    expect(keeper?.wave).toBe("italian");
    expect(keeper?.era).toBe("convergence");
    expect(keeper?.tier).toBe(1);
    expect(keeper?.keeperScore).toBeGreaterThanOrEqual(0.838);
    expect(keeper?.maxSimilarity).toBe(0);

    const gilded = act("spine:g3:gildedage");
    const coalIndex = gilded.scenes.indexOf("spine:g3:gildedage:keeper_ireland_coal");
    expect(gilded.scenes.slice(coalIndex, coalIndex + 3)).toEqual([
      "spine:g3:gildedage:keeper_ireland_coal",
      encounterId,
      "spine:g3:gildedage:venture",
    ]);

    const encounter = scene(encounterId);
    const prose = encounter.prose.join(" ");
    expect(prose).toMatch(/dust-covered Italian youth/i);
    expect(prose).toMatch(/stray ball/i);
    expect(prose).toMatch(/hard-packed common/i);
    expect(prose).not.toMatch(/\b(I|me|my|mine|we|our|ours|us)\b/i);
    expect(prose).toMatch(/\{given_name\}/);
    expect(encounter.decision).toBeUndefined();
    expect(encounter.beats.length).toBeGreaterThanOrEqual(2);
    expect(encounter.next).toBe("spine:g3:gildedage:venture");
    expect(walk("spine:g3:gildedage", [])).toContain("keeper_italian_common");

    const report = auditProseQuality(
      "spine:g3:gildedage:keeper_italian_common",
      qualityParts(encounterId),
    );
    expect(report.pass, JSON.stringify(report.findings, null, 2)).toBe(true);
  });

  it("KEY-PILLARS-3: ascension keeper fabric broadens promotion into the interstellar spine", () => {
    const encounterId = "spine:g9:interstellar:keeper_ireland_receiver";
    const keeper = keeperBySceneId(PROMOTED_ASCENSION_KEEPER_ID);
    expect(keeper?.wave).toBe("ireland");
    expect(keeper?.era).toBe("ascension");
    expect(keeper?.tier).toBe(5);
    expect(keeper?.keeperScore).toBeGreaterThanOrEqual(0.82);
    expect(keeper?.maxSimilarity).toBe(0);

    const interstellar = act("spine:g9:interstellar");
    const texIndex = interstellar.scenes.indexOf("spine:g9:interstellar:tex_open");
    expect(interstellar.scenes.slice(texIndex, texIndex + 3)).toEqual([
      "spine:g9:interstellar:tex_open",
      encounterId,
      "spine:g9:interstellar:transit",
    ]);

    const encounter = scene(encounterId);
    const prose = encounter.prose.join(" ");
    expect(prose).toMatch(/copper coils/i);
    expect(prose).toMatch(/crackling console/i);
    expect(prose).toMatch(/clockwork rhythms of the far-born/i);
    expect(prose).not.toMatch(/\b(I|me|my|mine|we|our|ours|us)\b/i);
    expect(prose).toMatch(/\{given_name\}|\{surname\}/);
    expect(encounter.decision).toBeUndefined();
    expect(encounter.beats.length).toBeGreaterThanOrEqual(2);
    expect(encounter.next).toBe("spine:g9:interstellar:transit");
    expect(walk("spine:g9:interstellar", [])).toContain("keeper_ireland_receiver");

    const report = auditProseQuality(
      "spine:g9:interstellar:keeper_ireland_receiver",
      qualityParts(encounterId),
    );
    expect(report.pass, JSON.stringify(report.findings, null, 2)).toBe(true);
  });

  it("KEY-PILLARS-4: emergence keeper fabric broadens promotion into the Progressive spine", () => {
    const encounterId = "spine:g4:progressive:keeper_ireland_ward_champion";
    const keeper = keeperBySceneId(PROMOTED_EMERGENCE_KEEPER_ID);
    expect(keeper?.wave).toBe("ireland");
    expect(keeper?.era).toBe("emergence");
    expect(keeper?.tier).toBe(3);
    expect(keeper?.keeperScore).toBeGreaterThanOrEqual(0.84);
    expect(keeper?.maxSimilarity).toBe(0);

    const progressive = act("spine:g4:progressive");
    const texIndex = progressive.scenes.indexOf("spine:g4:progressive:tex_open");
    expect(progressive.scenes.slice(texIndex, texIndex + 3)).toEqual([
      "spine:g4:progressive:tex_open",
      encounterId,
      "spine:g4:progressive:allegiance",
    ]);

    const encounter = scene(encounterId);
    const prose = encounter.prose.join(" ");
    expect(prose).toMatch(/ward office/i);
    expect(prose).toMatch(/heavy tweed coat/i);
    expect(prose).toMatch(/hopeful locals reach for the sleeve/i);
    expect(prose).not.toMatch(/\b(I|me|my|mine|we|our|ours|us)\b/i);
    expect(prose).toMatch(/\{given_name\}|\{family_name\}/);
    expect(encounter.decision).toBeUndefined();
    expect(encounter.beats.length).toBeGreaterThanOrEqual(2);
    expect(encounter.next).toBe("spine:g4:progressive:allegiance");
    expect(walk("spine:g4:progressive", [])).toContain("keeper_ireland_ward_champion");

    const report = auditProseQuality(
      "spine:g4:progressive:keeper_ireland_ward_champion",
      qualityParts(encounterId),
    );
    expect(report.pass, JSON.stringify(report.findings, null, 2)).toBe(true);
  });

  it("SPINE-ACT-DEPTH-2 + EXTEND-MIDWEIGHT: EVERY act carries a third REVERSAL interstitial (7 scenes)", () => {
    // The heavy acts got the reversal first (SPINE-ACT-DEPTH-2); EXTEND-MIDWEIGHT brought the six
    // mid-weight acts to the same 7-scene shape, so all 10 now run open → tex → decision → csq → rev →
    // decision → close, locking the full-hour playtest.
    for (const actId of SPINE_ACTS) {
      const path = walk(actId, []);
      expect(
        path.some((id) => id.startsWith("rev_")),
        `${actId} has a reversal scene`,
      ).toBe(true);
      expect(new Set(path).size, `${actId} reaches ≥7 scenes`).toBeGreaterThanOrEqual(7);
      // The reversal sits AFTER the consequence and BEFORE the act's terminal close.
      const revIdx = path.findIndex((id) => id.startsWith("rev_"));
      const csqIdx = path.findIndex((id) => id.startsWith("csq_"));
      expect(revIdx, `${actId} reversal follows the consequence`).toBeGreaterThan(csqIdx);
      expect(revIdx, `${actId} reversal precedes close`).toBeLessThan(path.length - 1);
    }
  });

  for (const actId of SPINE_ACTS) {
    it(`${actId}: a default founder passes BOTH interstitials and ends at close`, () => {
      const path = walk(actId, []);
      expect(
        path.some((id) => id.startsWith("tex_")),
        `${actId} has a texture scene`,
      ).toBe(true);
      expect(
        path.some((id) => id.startsWith("csq_")),
        `${actId} has a consequence scene`,
      ).toBe(true);
      expect(path[path.length - 1], `${actId} ends at close`).toBe("close");
      // The deepening roughly doubled each act: at least 6 distinct reachable scenes (toward the hour+).
      expect(new Set(path).size, `${actId} reaches ≥6 scenes`).toBeGreaterThanOrEqual(6);
    });
  }

  it("g0's five base founders each reach both interstitials (texture is on every path, not just default)", () => {
    for (const base of ["land", "commerce", "pulpit", "law", "military"]) {
      const path = walk("spine:g0:founding", [`base:${base}`]);
      expect(path[0], base).toBe(`open_${base}`);
      expect(path, base).toContain("tex_pressroom");
      expect(path, base).toContain("csq_aftermath");
      expect(path[path.length - 1], base).toBe("close");
    }
  });

  it("every interstitial is decisionless TEXTURE — weave beats only, no terminal decision, falls forward", () => {
    for (const actId of SPINE_ACTS) {
      const a = act(actId);
      const interstitials = a.scenes.filter((id) => /:(tex|csq|rev)_/.test(id));
      expect(interstitials.length, `${actId} has ≥2 interstitials`).toBeGreaterThanOrEqual(2);
      for (const id of interstitials) {
        const s = corpus.scenes.get(id);
        expect(s, id).toBeTruthy();
        expect(s?.decision, `${id} carries no major decision`).toBeUndefined();
        expect(s?.beats.length, `${id} carries weave beats`).toBeGreaterThanOrEqual(1);
        expect(s?.next, `${id} falls forward via next`).toBeTruthy();
        expect(s?.prose.length, `${id} is multi-paragraph`).toBeGreaterThanOrEqual(2);
        expect(s?.prose.join(" "), `${id} uses a family token`).toMatch(
          /\{given_name\}|\{surname\}|\{family_name\}/,
        );
      }
    }
  });
});
