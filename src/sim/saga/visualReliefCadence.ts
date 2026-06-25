import type { ActChapter, SagaFile, Scene, Sense } from "./schema";

export interface VisualReliefCadenceThresholds {
  heavySceneWords: number;
  maxWordsBetweenMajorAnchors: number;
  maxPagesBetweenMajorAnchors: number;
}

export const VISUAL_RELIEF_CADENCE_THRESHOLDS = {
  heavySceneWords: 240,
  maxWordsBetweenMajorAnchors: 1500,
  maxPagesBetweenMajorAnchors: 16,
} as const satisfies VisualReliefCadenceThresholds;

export type VisualReliefLightAnchor =
  | "portrait"
  | "scene-transition"
  | "sense-frame"
  | "inline-choice";

export type VisualReliefMajorAnchor =
  | "promoted-encounter-hook"
  | "generation-boundary-cinematic"
  | "generation-boundary-dossier"
  | "dossier-chart"
  | "dossier-map";

export interface PromotedEncounterAnchor {
  sceneId: string;
  wave?: string;
  sourceEra?: string;
  keeperScore?: number;
}

export interface VisualReliefCadenceInput {
  saga: Pick<SagaFile, "acts" | "scenes">;
  promotedEncounterAnchors?: readonly PromotedEncounterAnchor[];
  source?: Partial<VisualReliefCadenceReport["source"]>;
  thresholds?: Partial<VisualReliefCadenceThresholds>;
}

export interface SceneReliefRow {
  sceneId: string;
  sense: Sense;
  renderedWords: number;
  proseWords: number;
  inlineChoiceWords: number;
  prosePages: number;
  inlineChoiceCount: number;
  heavy: boolean;
  lightAnchors: VisualReliefLightAnchor[];
  majorAnchors: VisualReliefMajorAnchor[];
}

export interface RouteReliefSummary {
  routeId: string;
  actId: string;
  actTitle: string;
  macroAct: ActChapter["macroAct"];
  variant: string;
  variantFlags: string[];
  sceneIds: string[];
  renderedWords: number;
  prosePages: number;
  sceneCount: number;
  heavySceneCount: number;
  majorAnchorCount: number;
  maxStretchWords: number;
  maxStretchPages: number;
  needsRelief: boolean;
}

export interface ReliefStretch {
  id: string;
  routeId: string;
  actId: string;
  actTitle: string;
  macroAct: ActChapter["macroAct"];
  variant: string;
  startSceneId: string;
  endSceneId: string;
  toAnchor: {
    id: string;
    types: VisualReliefMajorAnchor[];
  };
  renderedWords: number;
  prosePages: number;
  sceneCount: number;
  senses: Sense[];
  heavyScenes: Array<Pick<SceneReliefRow, "sceneId" | "renderedWords" | "prosePages">>;
  reliefScore: number;
  needsRelief: boolean;
  recommendation: string;
}

export interface VisualReliefTarget {
  stretchId: string;
  routeId: string;
  actId: string;
  actTitle: string;
  variant: string;
  sceneId: string;
  renderedWords: number;
  prosePages: number;
  reason: string;
  recommendation: string;
}

export interface VisualReliefCadenceReport {
  generated: "KEY-PILLARS-9 diegetic visual-relief cadence audit";
  source: {
    spine: string;
    promotedEncounterAnchors: string;
    runtimeAnchors: string;
  };
  thresholds: VisualReliefCadenceThresholds;
  summary: {
    acts: number;
    playableRouteVariants: number;
    uniqueScenes: number;
    heavyScenes: number;
    promotedEncounterAnchors: number;
    generationBoundaryAnchors: number;
    routeVariantsNeedingRelief: number;
    stretchesNeedingRelief: number;
    maxStretchWords: number;
    maxStretchPages: number;
  };
  sceneRows: SceneReliefRow[];
  routes: RouteReliefSummary[];
  worstStretches: ReliefStretch[];
  gaps: {
    nextReliefTarget: VisualReliefTarget | null;
    heavySceneSamples: string[];
    guidance: string[];
  };
}

const DEFAULT_SOURCE = {
  spine: "src/data/saga/spine.act.json authored dynasty-spine routes",
  promotedEncounterAnchors:
    "src/data/saga/fabric/promotion-diversity.json promotions[].spineTarget",
  runtimeAnchors:
    "SceneReader portrait/sense/transition/inline-choice anchors plus generation-boundary CinematicView + DossierView chart/map panels",
} satisfies VisualReliefCadenceReport["source"];

function round(n: number, places = 3): number {
  const mult = 10 ** places;
  return Math.round(n * mult) / mult;
}

function wordCount(text: string | undefined): number {
  if (!text) return 0;
  const words = text.trim().match(/\S+/g);
  return words?.length ?? 0;
}

function sceneProseWords(scene: Scene): number {
  return scene.prose.reduce((sum, paragraph) => sum + wordCount(paragraph), 0);
}

function inlineChoiceTexts(scene: Scene): string[] {
  return [
    ...scene.beats.map((beat) => beat.choice?.text ?? ""),
    ...(scene.decision?.options.map((option) => option.text) ?? []),
  ].filter(Boolean);
}

function inlineChoiceWords(scene: Scene): number {
  return inlineChoiceTexts(scene).reduce((sum, text) => sum + wordCount(text), 0);
}

function sceneIdPrefix(act: ActChapter): RegExp {
  return new RegExp(`^${act.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:open(?:_|$)`);
}

function openingVariants(act: ActChapter, sceneById: ReadonlyMap<string, Scene>): Scene[] {
  const prefix = sceneIdPrefix(act);
  const variants = act.scenes
    .map((id) => sceneById.get(id))
    .filter((scene): scene is Scene => !!scene && prefix.test(scene.id));
  if (variants.length > 0) return variants;
  const first = sceneById.get(act.scenes[0] ?? "");
  return first ? [first] : [];
}

function routeVariant(scene: Scene): { variant: string; variantFlags: string[] } {
  const flags = scene.requires.flags;
  const variant = flags[0]?.replace(/^base:/, "") ?? "fallback";
  return { variant, variantFlags: [...flags] };
}

function nextSceneId(
  act: ActChapter,
  scene: Scene,
  sceneById: ReadonlyMap<string, Scene>,
): string | undefined {
  if (scene.next && sceneById.has(scene.next)) return scene.next;
  const index = act.scenes.indexOf(scene.id);
  return index >= 0 && index + 1 < act.scenes.length ? act.scenes[index + 1] : undefined;
}

function routeScenes(
  act: ActChapter,
  start: Scene,
  sceneById: ReadonlyMap<string, Scene>,
): Scene[] {
  const scenes: Scene[] = [];
  const seen = new Set<string>();
  let id: string | undefined = start.id;
  while (id && !seen.has(id)) {
    seen.add(id);
    const scene = sceneById.get(id);
    if (!scene) break;
    scenes.push(scene);
    id = nextSceneId(act, scene, sceneById);
  }
  return scenes;
}

function lightAnchors(scene: Scene): VisualReliefLightAnchor[] {
  const anchors: VisualReliefLightAnchor[] = ["portrait", "scene-transition", "sense-frame"];
  if (inlineChoiceTexts(scene).length > 0) anchors.push("inline-choice");
  return anchors;
}

function sceneRow(
  scene: Scene,
  promotedSceneIds: ReadonlySet<string>,
  thresholds: VisualReliefCadenceThresholds,
): SceneReliefRow {
  const proseWords = sceneProseWords(scene);
  const choiceWords = inlineChoiceWords(scene);
  return {
    sceneId: scene.id,
    sense: scene.sense,
    renderedWords: proseWords + choiceWords,
    proseWords,
    inlineChoiceWords: choiceWords,
    prosePages: scene.prose.length,
    inlineChoiceCount: inlineChoiceTexts(scene).length,
    heavy: proseWords + choiceWords >= thresholds.heavySceneWords,
    lightAnchors: lightAnchors(scene),
    majorAnchors: promotedSceneIds.has(scene.id) ? ["promoted-encounter-hook"] : [],
  };
}

function boundaryAnchorId(act: ActChapter): string {
  return `${act.id}:generation-boundary`;
}

function boundaryAnchorTypes(): VisualReliefMajorAnchor[] {
  return [
    "generation-boundary-cinematic",
    "generation-boundary-dossier",
    "dossier-chart",
    "dossier-map",
  ];
}

function reliefScore(
  words: number,
  pages: number,
  heavyScenes: readonly SceneReliefRow[],
  thresholds: VisualReliefCadenceThresholds,
): number {
  const wordExcess = Math.max(0, words - thresholds.maxWordsBetweenMajorAnchors);
  const pageExcess = Math.max(0, pages - thresholds.maxPagesBetweenMajorAnchors) * 60;
  const heavyExcess = heavyScenes.reduce(
    (sum, scene) => sum + Math.max(0, scene.renderedWords - thresholds.heavySceneWords),
    0,
  );
  return round(wordExcess + pageExcess + heavyExcess);
}

function stretchNeedsRelief(
  words: number,
  pages: number,
  thresholds: VisualReliefCadenceThresholds,
): boolean {
  return (
    words > thresholds.maxWordsBetweenMajorAnchors || pages > thresholds.maxPagesBetweenMajorAnchors
  );
}

function stretchRecommendation(
  heavyScenes: readonly SceneReliefRow[],
  fallbackSceneId: string,
  anchorTypes: readonly VisualReliefMajorAnchor[],
): string {
  const targetScene = heavyScenes[0]?.sceneId ?? fallbackSceneId;
  if (anchorTypes.includes("promoted-encounter-hook")) {
    return `Keep the promoted encounter hook at ${fallbackSceneId}, then check whether ${targetScene} still needs a larger visual beat before the next major choice.`;
  }
  return `Add a diegetic visual or sensory break at ${targetScene}: a plate, small map/chart inset, or encounter-art hook before the next long prose run continues.`;
}

function routeStretches(
  act: ActChapter,
  routeId: string,
  variant: string,
  scenes: readonly Scene[],
  rowsBySceneId: ReadonlyMap<string, SceneReliefRow>,
  thresholds: VisualReliefCadenceThresholds,
): ReliefStretch[] {
  const stretches: ReliefStretch[] = [];
  let pending: SceneReliefRow[] = [];
  let stretchIndex = 0;

  const flush = (anchorId: string, anchorTypes: VisualReliefMajorAnchor[]) => {
    if (pending.length === 0) return;
    const words = pending.reduce((sum, row) => sum + row.renderedWords, 0);
    const pages = pending.reduce((sum, row) => sum + row.prosePages, 0);
    const heavyScenes = [...pending]
      .filter((row) => row.heavy)
      .sort((a, b) => b.renderedWords - a.renderedWords || a.sceneId.localeCompare(b.sceneId));
    const needsRelief = stretchNeedsRelief(words, pages, thresholds);
    const startSceneId = pending[0]?.sceneId ?? "";
    const endSceneId = pending[pending.length - 1]?.sceneId ?? "";
    stretches.push({
      id: `${routeId}:stretch:${stretchIndex}`,
      routeId,
      actId: act.id,
      actTitle: act.title,
      macroAct: act.macroAct,
      variant,
      startSceneId,
      endSceneId,
      toAnchor: { id: anchorId, types: anchorTypes },
      renderedWords: words,
      prosePages: pages,
      sceneCount: pending.length,
      senses: [...new Set(pending.map((row) => row.sense))],
      heavyScenes: heavyScenes.map((row) => ({
        sceneId: row.sceneId,
        renderedWords: row.renderedWords,
        prosePages: row.prosePages,
      })),
      reliefScore: reliefScore(words, pages, heavyScenes, thresholds),
      needsRelief,
      recommendation: stretchRecommendation(heavyScenes, endSceneId, anchorTypes),
    });
    stretchIndex += 1;
    pending = [];
  };

  for (const scene of scenes) {
    const row = rowsBySceneId.get(scene.id);
    if (!row) continue;
    pending.push(row);
    if (row.majorAnchors.length > 0) flush(row.sceneId, row.majorAnchors);
  }
  flush(boundaryAnchorId(act), boundaryAnchorTypes());
  return stretches;
}

function routeSummary(
  act: ActChapter,
  routeId: string,
  variant: string,
  variantFlags: string[],
  scenes: readonly Scene[],
  rowsBySceneId: ReadonlyMap<string, SceneReliefRow>,
  stretches: readonly ReliefStretch[],
): RouteReliefSummary {
  const rows = scenes
    .map((scene) => rowsBySceneId.get(scene.id))
    .filter((row): row is SceneReliefRow => !!row);
  return {
    routeId,
    actId: act.id,
    actTitle: act.title,
    macroAct: act.macroAct,
    variant,
    variantFlags,
    sceneIds: scenes.map((scene) => scene.id),
    renderedWords: rows.reduce((sum, row) => sum + row.renderedWords, 0),
    prosePages: rows.reduce((sum, row) => sum + row.prosePages, 0),
    sceneCount: rows.length,
    heavySceneCount: rows.filter((row) => row.heavy).length,
    majorAnchorCount: rows.reduce((sum, row) => sum + row.majorAnchors.length, 0) + 1,
    maxStretchWords: Math.max(0, ...stretches.map((stretch) => stretch.renderedWords)),
    maxStretchPages: Math.max(0, ...stretches.map((stretch) => stretch.prosePages)),
    needsRelief: stretches.some((stretch) => stretch.needsRelief),
  };
}

function compareStretches(a: ReliefStretch, b: ReliefStretch): number {
  return (
    b.reliefScore - a.reliefScore ||
    b.renderedWords - a.renderedWords ||
    b.prosePages - a.prosePages ||
    a.actId.localeCompare(b.actId) ||
    a.routeId.localeCompare(b.routeId)
  );
}

function targetFromStretch(
  stretch: ReliefStretch | undefined,
  thresholds: VisualReliefCadenceThresholds,
): VisualReliefTarget | null {
  if (!stretch) return null;
  const targetScene = stretch.heavyScenes[0] ?? {
    sceneId: stretch.startSceneId,
    renderedWords: stretch.renderedWords,
    prosePages: stretch.prosePages,
  };
  const reasons = [];
  if (stretch.renderedWords > thresholds.maxWordsBetweenMajorAnchors) {
    reasons.push(`${stretch.renderedWords} rendered words before the next major visual anchor`);
  }
  if (stretch.prosePages > thresholds.maxPagesBetweenMajorAnchors) {
    reasons.push(`${stretch.prosePages} prose pages before the next major visual anchor`);
  }
  if (stretch.heavyScenes.length > 0) {
    reasons.push(`${stretch.heavyScenes.length} heavy scene(s) inside the stretch`);
  }
  return {
    stretchId: stretch.id,
    routeId: stretch.routeId,
    actId: stretch.actId,
    actTitle: stretch.actTitle,
    variant: stretch.variant,
    sceneId: targetScene.sceneId,
    renderedWords: targetScene.renderedWords,
    prosePages: targetScene.prosePages,
    reason: reasons.join("; "),
    recommendation: stretch.recommendation,
  };
}

function guidance(nextTarget: VisualReliefTarget | null, promotedCount: number): string[] {
  const out = [
    "Portrait, sense-frame, scene-transition, and inline-choice anchors are present throughout the spine reader, so the audit focuses its warning on longer runs before larger visual set pieces.",
  ];
  if (promotedCount > 0) {
    out.push(
      "Promoted keeper encounters now count as major relief hooks because they interrupt the one-dynasty spine with mined legacy-fabric people met along the way.",
    );
  }
  if (nextTarget) {
    out.push(
      `Next relief target: ${nextTarget.sceneId} in ${nextTarget.actTitle}; add a compact visual/sensory set piece before broadening later acts.`,
    );
  } else {
    out.push("No current spine stretch exceeds the configured visual-relief thresholds.");
  }
  return out;
}

export function buildVisualReliefCadenceReport({
  saga,
  promotedEncounterAnchors = [],
  source,
  thresholds,
}: VisualReliefCadenceInput): VisualReliefCadenceReport {
  const mergedThresholds = { ...VISUAL_RELIEF_CADENCE_THRESHOLDS, ...thresholds };
  const sceneById = new Map(saga.scenes.map((scene) => [scene.id, scene]));
  const promotedBySceneId = new Map(
    promotedEncounterAnchors.map((anchor) => [anchor.sceneId, anchor]),
  );
  const promotedSceneIds = new Set(promotedBySceneId.keys());
  const sceneRows = saga.scenes
    .filter((scene) => scene.id.startsWith("spine:"))
    .map((scene) => sceneRow(scene, promotedSceneIds, mergedThresholds))
    .sort((a, b) => a.sceneId.localeCompare(b.sceneId));
  const rowsBySceneId = new Map(sceneRows.map((row) => [row.sceneId, row]));

  const routes: RouteReliefSummary[] = [];
  const allStretches: ReliefStretch[] = [];
  for (const act of saga.acts.filter((candidate) => candidate.id.startsWith("spine:"))) {
    for (const start of openingVariants(act, sceneById)) {
      const { variant, variantFlags } = routeVariant(start);
      const routeId = `${act.id}:${variant}`;
      const scenes = routeScenes(act, start, sceneById);
      const stretches = routeStretches(
        act,
        routeId,
        variant,
        scenes,
        rowsBySceneId,
        mergedThresholds,
      );
      allStretches.push(...stretches);
      routes.push(
        routeSummary(act, routeId, variant, variantFlags, scenes, rowsBySceneId, stretches),
      );
    }
  }

  const stretchesNeedingRelief = allStretches.filter((stretch) => stretch.needsRelief);
  const worstStretches = [...allStretches].sort(compareStretches).slice(0, 24);
  const nextTarget = targetFromStretch(
    [...stretchesNeedingRelief].sort(compareStretches)[0],
    mergedThresholds,
  );
  const heavySceneSamples = sceneRows
    .filter((row) => row.heavy)
    .sort((a, b) => b.renderedWords - a.renderedWords || a.sceneId.localeCompare(b.sceneId))
    .slice(0, 24)
    .map((row) => `${row.sceneId}:${row.renderedWords}w/${row.prosePages}p`);

  return {
    generated: "KEY-PILLARS-9 diegetic visual-relief cadence audit",
    source: { ...DEFAULT_SOURCE, ...source },
    thresholds: mergedThresholds,
    summary: {
      acts: saga.acts.filter((act) => act.id.startsWith("spine:")).length,
      playableRouteVariants: routes.length,
      uniqueScenes: sceneRows.length,
      heavyScenes: sceneRows.filter((row) => row.heavy).length,
      promotedEncounterAnchors: promotedSceneIds.size,
      generationBoundaryAnchors: saga.acts.filter((act) => act.id.startsWith("spine:")).length,
      routeVariantsNeedingRelief: routes.filter((route) => route.needsRelief).length,
      stretchesNeedingRelief: stretchesNeedingRelief.length,
      maxStretchWords: Math.max(0, ...allStretches.map((stretch) => stretch.renderedWords)),
      maxStretchPages: Math.max(0, ...allStretches.map((stretch) => stretch.prosePages)),
    },
    sceneRows,
    routes: routes.sort((a, b) => a.routeId.localeCompare(b.routeId)),
    worstStretches,
    gaps: {
      nextReliefTarget: nextTarget,
      heavySceneSamples,
      guidance: guidance(nextTarget, promotedSceneIds.size),
    },
  };
}
