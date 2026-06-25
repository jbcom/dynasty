import { describe, expect, it } from "vitest";
import promotionMap from "../../../data/saga/fabric/promotion-diversity.json";
import spineData from "../../../data/saga/spine.act.json";
import visualReliefReport from "../../../data/saga/visual-relief-cadence.json";
import type { SagaFile, Scene } from "../schema";
import {
  buildVisualReliefCadenceReport,
  type PromotedEncounterAnchor,
  type VisualReliefCadenceReport,
} from "../visualReliefCadence";

function words(count: number): string {
  return Array.from({ length: count }, (_, i) => `word${i}`).join(" ");
}

function scene(id: string, prose: string[], next?: string): Scene {
  return {
    id,
    sense: "sight",
    prose,
    beats: [],
    thread: [],
    braidSlots: [],
    requires: { flags: [], notFlags: [] },
    ...(next ? { next } : {}),
  };
}

function livePromotedAnchors(): PromotedEncounterAnchor[] {
  return (
    promotionMap as {
      promotions: Array<{
        spineTarget: string;
        wave?: string;
        sourceEra?: string;
        keeperScore?: number;
      }>;
    }
  ).promotions.map((promotion) => ({
    sceneId: promotion.spineTarget,
    wave: promotion.wave,
    sourceEra: promotion.sourceEra,
    keeperScore: promotion.keeperScore,
  }));
}

describe("KEY-PILLARS-9 visual relief cadence audit", () => {
  it("splits a route at promoted encounter hooks and chooses the heavy prose target", () => {
    const saga: Pick<SagaFile, "acts" | "scenes"> = {
      acts: [
        {
          id: "spine:g0:fixture",
          wave: "spine",
          archetype: "founding",
          cls: "spine",
          tier: 0,
          macroAct: "founding",
          title: "Fixture Act",
          scenes: [
            "spine:g0:fixture:open",
            "spine:g0:fixture:wall",
            "spine:g0:fixture:keeper",
            "spine:g0:fixture:close",
          ],
        },
      ],
      scenes: [
        scene("spine:g0:fixture:open", ["threshold"], "spine:g0:fixture:wall"),
        scene("spine:g0:fixture:wall", [words(36)], "spine:g0:fixture:keeper"),
        scene("spine:g0:fixture:keeper", ["encounter hook"], "spine:g0:fixture:close"),
        {
          ...scene("spine:g0:fixture:close", ["closing"], undefined),
          decision: {
            tier: "major",
            prompt: "Unrendered prompt",
            options: [
              { text: "Continue the line", motivatorShift: {}, setFlags: [] },
              { text: "End the line", motivatorShift: {}, setFlags: [] },
            ],
          },
        },
      ],
    };

    const report = buildVisualReliefCadenceReport({
      saga,
      promotedEncounterAnchors: [{ sceneId: "spine:g0:fixture:keeper" }],
      thresholds: {
        heavySceneWords: 25,
        maxWordsBetweenMajorAnchors: 40,
        maxPagesBetweenMajorAnchors: 2,
      },
    });

    expect(report.summary).toMatchObject({
      acts: 1,
      playableRouteVariants: 1,
      promotedEncounterAnchors: 1,
      generationBoundaryAnchors: 1,
      stretchesNeedingRelief: 1,
    });
    expect(report.worstStretches[0]).toMatchObject({
      startSceneId: "spine:g0:fixture:open",
      endSceneId: "spine:g0:fixture:keeper",
      toAnchor: { types: ["promoted-encounter-hook"] },
      needsRelief: true,
    });
    expect(report.gaps.nextReliefTarget).toMatchObject({
      sceneId: "spine:g0:fixture:wall",
      renderedWords: 36,
    });
  });

  it("matches the live spine visual-relief baseline", () => {
    const report = visualReliefReport as VisualReliefCadenceReport;
    expect(report).toEqual(
      buildVisualReliefCadenceReport({
        saga: spineData as Pick<SagaFile, "acts" | "scenes">,
        promotedEncounterAnchors: livePromotedAnchors(),
      }),
    );
    expect(report.generated).toBe("KEY-PILLARS-9 diegetic visual-relief cadence audit");
    expect(report.summary).toMatchObject({
      acts: 10,
      playableRouteVariants: 60,
      uniqueScenes: 124,
      heavyScenes: 15,
      promotedEncounterAnchors: 4,
      generationBoundaryAnchors: 10,
      routeVariantsNeedingRelief: 13,
      stretchesNeedingRelief: 13,
      maxStretchWords: 1789,
      maxStretchPages: 18,
    });
    expect(report.gaps.nextReliefTarget).toMatchObject({
      actId: "spine:g2:antebellum",
      variant: "fallback",
      sceneId: "spine:g2:antebellum:allegiance",
      renderedWords: 325,
      prosePages: 3,
    });
    expect(report.gaps.heavySceneSamples).toContain("spine:g2:antebellum:allegiance:325w/3p");
    expect(report.gaps.guidance).toEqual(
      expect.arrayContaining([
        expect.stringMatching(
          /Portrait, sense-frame, scene-transition, and inline-choice anchors/i,
        ),
        expect.stringMatching(/Promoted keeper encounters now count as major relief hooks/i),
        expect.stringMatching(/Next relief target: spine:g2:antebellum:allegiance/i),
      ]),
    );
  });
});
