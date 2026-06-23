import { loadSaga } from "../data/loadSaga";
import triggersData from "../data/saga/triggers.json" with { type: "json" };
import { MAX_RUNG, sagaClassForWealth } from "../sim/classRung";
import type { Content } from "../sim/content";
import { type ConvergenceEnding, resolveConvergence } from "../sim/convergence";
import { strategyForArchetype } from "../sim/dynastyAgent";
import {
  advanceWorld,
  createDynastyWorld,
  type DynastyWorld,
  detectGlimpses,
  type Glimpse,
  humanizeRivalLabel,
  nudgeRival,
  type RungTrend,
  surgeHeadline,
} from "../sim/dynastyWorld";
import { advanceFamily, applyChoice, applySuccessionToFamily, succeedToHeir } from "../sim/effects";
import { macroActForYear } from "../sim/macroActs";
import { applyDelta } from "../sim/meters";
import type { Motivators } from "../sim/motivators";
import { createRng, type Rng } from "../sim/rng";
import { candidatesFromSnapshots, type RivalLike, selectBraid } from "../sim/saga/braidSelect";
import { actsForTier, resolveThreads } from "../sim/saga/player";
import type { BraidSlot } from "../sim/saga/schema";
import { TriggerTableSchema } from "../sim/saga/schema";
import { DYNASTY_SPINE } from "../sim/saga/spineAuthored";
import {
  type ActivatedBranch,
  crossedFlag,
  evaluateTriggers,
  spineStateProjection,
} from "../sim/saga/triggerLattice";
import {
  applyFamilyDeathShock,
  foreshadowWeight,
  recoveryForeshadow,
  recoveryForeshadowText,
  rollSagaRecovery,
  rollSagaShock,
  type SagaShockNote,
  shockMeterFlag,
  shockNote,
} from "../sim/sagaShock";
import type { GameEvent } from "../sim/schema";
import type { Archetype } from "../sim/slots";
import { type GameState, initState, isMemberAlive, type LedgerEntry } from "../sim/state";
import {
  advanceSagaClock,
  advanceTimeline,
  detectEnd,
  SAGA_GENERATION_SPAN,
  SAGA_YEAR_STEP,
} from "../sim/timeline";
import { pickNextEventViaWorld } from "../sim/world";
import { SagaDriver, type SagaFrame } from "./sagaDriver";

/** The deterministic-trigger lattice table (FS-5b), parsed + validated once at module load. */
const GAME_TRIGGERS = TriggerTableSchema.parse(triggersData);

/** The top generation index of the authored spine (g0..g9) — spine play uses the TRUE generation up to
 *  this, NOT MAX_RUNG (the cell-lattice cap), so the run reaches the broadcast/orbital/stellar acts. */
const SPINE_MAX_GEN = Math.max(...DYNASTY_SPINE.map((a) => a.gen));

/** STELLAR-EPILOGUE-VARIETY: the apex end's `reason` line, keyed by the stellar DESTINY the line crowned — so
 *  the ultimate close reflects HOW it reached the stars, not one flat line. Any star path that didn't resolve
 *  to a distinct destiny falls back to APEX_REASON_DEFAULT (the quiet/hidden finale). */
const APEX_REASON_DEFAULT =
  "The dynasty carried its name to the stars — and found, at last, a quiet horizon.";
const APEX_REASON: Record<string, string> = {
  stellar_conquest:
    "The dynasty carried its name to the stars — and took them by force, an empire of suns.",
  stellar_allies:
    "The dynasty carried its name to the stars — trusted across worlds, a covenant kept.",
  stellar_hidden: APEX_REASON_DEFAULT,
};

/** A snapshot the UI renders from. Immutable per turn. */
export interface GameView {
  state: GameState;
  currentEvent: GameEvent | null;
  /** The played NOVEL frame — the act title + current scene. `scene` is null when the line's act
   *  isn't authored yet (the UI then renders the event flow). */
  saga: SagaFrame;
  /** Rival lines (the convergence world) visible from the player's vantage this turn. */
  glimpses: Glimpse[];
  /** The WHOLE convergence field — every rival line's current standing (label + rung + whether it is
   *  faltering), sorted high→low, for a "where all the lines are racing" readout (RB-5) and the end-game
   *  rival reckoning (CONVERGENCE-RIVAL-FINALE), beyond the near-vantage glimpses. */
  rivalStandings: Array<{
    id: string;
    label: string;
    rung: number;
    faltering: boolean;
    trend: RungTrend;
    fallen: boolean;
  }>;
  /** The player's class rung (generation depth, 0..5) — for the read-model's class readout. */
  rung: number;
  /** The dynastic CONVERGENCE ending (toward the stars / contributed / earthbound / extinguished),
   *  resolved when the run ends; null while in progress. */
  convergence: ConvergenceEnding | null;
  lastLedger: LedgerEntry[];
  /** WV-3-SHOCK-SCENES: the disruption shock's one-line aftermath that struck on the last saga move, or
   *  null. The PlayScreen narrates it for one turn (a death/loss/scandal beat the player reads). */
  shock: SagaShockNote | null;
  /** RIVAL-RACE-PRESENCE: dispatches about the rival lines near the player's station this turn — a rival
   *  that has stumbled (a window) or surged past the player (pressure). Surfaced in the NewsTicker so the
   *  convergence race is felt in-run, not just at the close. */
  rivalNews: RivalNewsItem[];
  /** SHOCK-FORESHADOW + FORESHADOW-WEIGHT/IN-TONE: a one-line omen when the next saga tick carries an elevated
   *  hazard OR a plausible rebound, with its WEIGHT (so the UI styles dread proportionally — grave heavier than
   *  marginal) and its TONE (RECOVERY-FORESHADOW-TONE: a strained line's omen reads as HOPE rising — a rebound
   *  coming — not the dread of a loss looming). Null otherwise. */
  foreshadow: { text: string; weight: "marginal" | "grave"; tone: "dread" | "hope" } | null;
  /** RECOVERY-CHOICE: true when the player may invest in the next rebound — there's an outstanding blown
   *  meter and no invest is already pending. The UI offers the invest action only then. */
  canInvestRecovery: boolean;
}

/** A one-line dispatch about a near-vantage rival line (RIVAL-RACE-PRESENCE). */
export interface RivalNewsItem {
  id: string;
  kind: "faltered" | "surged" | "fallen";
  headline: string;
}

type Listener = (view: GameView) => void;

/**
 * The game controller: owns the live state, content, and RNG, and turns player
 * choices into new states via the pure sim. UI-agnostic — Svelte subscribes via
 * `subscribe`. All randomness flows from the run seed through a single RNG so the
 * whole session stays reproducible (and replayable from seed + history).
 */
export class Game {
  private readonly content: Content;
  private readonly rng: Rng;
  private state: GameState;
  private current: GameEvent | null;
  private lastLedger: LedgerEntry[] = [];
  /** WV-3-SHOCK-SCENES: the disruption shock that struck on the LAST saga move, or null. Surfaced in the
   *  view for one turn as an aftermath line, then cleared on the next move (a transient, like lastLedger). */
  private lastShock: SagaShockNote | null = null;
  private readonly listeners = new Set<Listener>();
  private readonly saga: SagaDriver;
  /** The parallel world of RIVAL lines (the convergence layer) — created for a founded line, advanced
   *  as the run's years pass, surfaced as glimpses the player sees beside their own line. */
  private world: DynastyWorld | null = null;

  constructor(
    content: Content,
    seed: string,
    restore?: GameState,
    archetype: Archetype = "economic",
  ) {
    this.content = content;
    this.rng = createRng(seed);
    this.state = restore ?? initState(content, seed, archetype);
    this.current = this.state.end ? null : this.pick();
    this.saga = new SagaDriver(loadSaga());
    this.beginSagaActForState();
    this.beginWorldForState();
  }

  /** Create the rival-line world for a founded run (deterministic from the run seed), then advance it
   *  to the run's current year so a RESTORED mid-run shows rivals at the right vantage. No-op unfounded. */
  private beginWorldForState(): void {
    const wave = this.state.founding?.place;
    if (!wave) return;
    this.world = createDynastyWorld(this.content.places, wave, this.rng.fork("world"));
    this.applyCrossingNudges(); // deterministic from playerRung — re-derived on every (re)build
    this.advanceWorldToNow();
  }

  /** The player's rung as the world sees it: the protagonist's generation depth (0 founder … MAX_RUNG). */
  private playerRung(): number {
    const family = this.state.family;
    const protagonist = family?.members.find((m) => m.id === family.protagonistId);
    return Math.min(protagonist?.generation ?? 0, MAX_RUNG);
  }

  /** Rival lines visible from the player's current vantage — empty when unfounded / no world. */
  private currentGlimpses(): Glimpse[] {
    if (!this.world) return [];
    return detectGlimpses(
      this.world,
      this.playerRung(),
      strategyForArchetype(this.state.archetype),
    );
  }

  /** Every rival line's current standing (label + rung), sorted high→low — the full convergence field
   *  for the RB-5 readout. Empty when unfounded / no world. */
  private rivalStandings(): GameView["rivalStandings"] {
    if (!this.world) return [];
    return this.world.snapshots
      .map((s) => ({
        id: s.id,
        label: s.label,
        rung: s.rung,
        faltering: s.faltering,
        fallen: s.fallen,
        trend: s.trend,
      }))
      .sort((a, b) => b.rung - a.rung || a.label.localeCompare(b.label));
  }

  /**
   * RIVAL-RACE-PRESENCE: dispatches about the rival lines near the player's station this turn. A near-vantage
   * rival that is FALTERING (mid-setback) yields a "stumbled" line — a window the player can exploit; a rival
   * that has SURGED above the player's rung yields an "outpaced you" line — the pressure half. Derived purely
   * from the glimpses (faltering) + standings (rung vs player) — re-derived each turn, so it tracks the live
   * race. Place ids are humanized. Empty when unfounded / no world.
   */
  private rivalNews(): RivalNewsItem[] {
    if (!this.world) return [];
    const playerRung = this.playerRung();
    // Snapshot-by-id map for O(1) lookup in the glimpse loop (Gemini #126 perf — was a find-in-loop).
    const byId = new Map(this.world.snapshots.map((s) => [s.id, s]));
    const out: RivalNewsItem[] = [];
    const seen = new Set<string>(); // one dispatch per rival — a faltering rival never also surges, but guard
    // FALTER news: a glimpsed (near-vantage) rival currently faltering — the glimpse note is "struggling".
    // PRESS-FALLEN-GUARD: a line that has already DROPPED OUT (fallen) is excluded — it gets the "fallen"
    // dispatch below instead, and must not read as a pressable stumble (you can't press a line out of the race).
    for (const g of this.currentGlimpses()) {
      const snap = byId.get(g.rivalId);
      if (snap?.faltering && !snap.fallen && !seen.has(g.rivalId)) {
        seen.add(g.rivalId);
        out.push({
          id: g.rivalId,
          kind: "faltered",
          headline: `Word reaches you: the ${humanizeRivalLabel(g.label)} line has stumbled.`,
        });
      }
    }
    // SURGE news: a rival that has climbed ABOVE the player's rung (within sight) — the race's pressure half.
    // A faltering rival can't surge (the !faltering guard), and `seen` prevents any double-dispatch (Amazon-Q #126).
    // RIVAL-RISE-NEWS-WEIGHT: the headline's urgency scales with the rung GAP — just ahead reads milder than a
    // line pulling away toward the stars while you're earthbound. (No upper cap now: a far-ahead rival is the
    // MOST urgent dispatch, not silenced.)
    for (const s of this.world.snapshots) {
      const gap = s.rung - playerRung;
      if (gap > 0 && !s.faltering && !seen.has(s.id)) {
        seen.add(s.id);
        out.push({
          id: s.id,
          kind: "surged",
          headline: surgeHeadline(humanizeRivalLabel(s.label), gap),
        });
      }
    }
    // FALLEN news (FALLEN-NEWS): a rival that has dropped OUT of the race — fired ONCE, when first seen fallen
    // and not yet announced (the `fallen_seen:<id>` flag, stamped at the next saga advance). A major field event.
    for (const s of this.world.snapshots) {
      if (s.fallen && !seen.has(s.id) && !this.state.flags.includes(Game.fallenSeenFlag(s.id))) {
        seen.add(s.id);
        out.push({
          id: s.id,
          kind: "fallen",
          headline: `The ${humanizeRivalLabel(s.label)} line has dropped out of the race.`,
        });
      }
    }
    return out;
  }

  /** FALLEN-NEWS: the flag marking a rival whose elimination has already been ANNOUNCED, so the dispatch
   *  fires once. Stamped at the next saga advance (markFallenSeen) after the news surfaced. */
  private static fallenSeenFlag(rivalId: string): string {
    return `fallen_seen:${rivalId}`;
  }

  /** FALLEN-NEWS: stamp `fallen_seen:<id>` for every currently-fallen rival, so its elimination dispatch isn't
   *  re-announced. Called after each saga advance (the news for THIS turn has already surfaced in the view).
   *  Pure flag bookkeeping — derived from the deterministic world, so it replays identically. */
  private markFallenSeen(): void {
    if (!this.world) return;
    const fresh = this.world.snapshots
      .filter((s) => s.fallen && !this.state.flags.includes(Game.fallenSeenFlag(s.id)))
      .map((s) => Game.fallenSeenFlag(s.id));
    if (fresh.length > 0) this.state = { ...this.state, flags: [...this.state.flags, ...fresh] };
  }

  /** RIVAL-CROSSING-EXPLOIT: the heat cost of pressing a faltering rival — pressing the advantage draws
   *  dangerous attention to your own line. Flat + deterministic. */
  private static readonly PRESS_HEAT = 12;

  /**
   * RIVAL-CROSSING-EXPLOIT: the player presses a FALTERING rival — deepening its stumble one more rung — for a
   * heat cost (the advantage is not free; pressing draws notice). Only valid on a near-vantage faltering rival
   * surfaced in rivalNews this turn; a no-op otherwise (so a replayed press that no longer applies is skipped,
   * matching reconstruct's guard). Recorded in the press SIDE-LOG (not history) so it never perturbs the saga
   * RNG. No time passes — it's an action within the turn; the view re-emits with the world + meters updated.
   */
  pressRival(rivalId: string): void {
    if (!this.world || this.finished) return;
    // PRESS-FALLEN-GUARD (defense-in-depth): a line that has DROPPED OUT of the race (fallen — at the rung
    // floor across the window) cannot be pressed; it's already spent. This holds even if a caller bypasses the
    // news dispatch. The falter dispatch already excludes fallen lines, so this is belt-and-suspenders.
    const snap = this.world.snapshots.find((s) => s.id === rivalId);
    if (snap?.fallen) return;
    // Guard: only a rival currently dispatched as "faltered" (near-vantage + faltering) can be pressed.
    const pressable = this.rivalNews().some((n) => n.id === rivalId && n.kind === "faltered");
    if (!pressable) return;
    // EXPLOIT GUARD (Gemini #128, high): one press per rival per history STEP — else a player could spam
    // pressRival within a turn, draining the rival to rung 0 instantly while stacking heat. `at` is the
    // current history.length; a press already recorded at this `at` for this rival is rejected.
    const alreadyPressed = (this.state.presses ?? []).some(
      (p) => p.rivalId === rivalId && p.at === this.state.history.length,
    );
    if (alreadyPressed) return;
    this.applyPressEffect(rivalId);
    this.state = {
      ...this.state,
      presses: [
        ...(this.state.presses ?? []),
        { at: this.state.history.length, rivalId, year: this.state.year },
      ],
    };
    this.emit();
  }

  /** Apply a press's deterministic effects — deepen the rival's stumble + the heat cost — WITHOUT recording it
   *  (the caller owns the side-log). Shared by live pressRival and the reconstruct interleave. */
  private applyPressEffect(rivalId: string): void {
    if (!this.world) return;
    // nudgeRival returns a NEW world (re-synced snapshots that rivalStandings/glimpses read) — capture it,
    // don't discard the return (the agent rung mutates in place but the snapshot array is rebuilt).
    this.world = nudgeRival(this.world, rivalId, -1);
    this.state = {
      ...this.state,
      meters: applyDelta(this.content.meters, this.state.meters, { heat: Game.PRESS_HEAT }),
    };
  }

  /** End kinds that mean the line FAILED (didn't survive to a convergence). */
  private static readonly FAILURE_ENDS = new Set(["death", "coup", "jail", "line-extinct", "ruin"]);

  /**
   * The line's CONVERGENCE ending — the dynastic framing (toward the stars / contributed / earthbound /
   * extinguished), folding in the player's reach tier + motivators + whether a rival reached the stars.
   * Null until the run ends or for an unfounded run. Deterministic. (PF-7.)
   */
  private convergenceEnding(): ConvergenceEnding | null {
    if (!this.state.end || !this.state.founding?.place) return null;
    const family = this.state.family;
    const livingHeir = !!family?.members.some(
      (m) => m.id !== family.protagonistId && isMemberAlive(m, this.state.year),
    );
    const snaps = this.world?.snapshots ?? [];
    const rivalsReachedStars = snaps.some((s) => s.rung >= MAX_RUNG);
    // RIVAL-FATE-IN-CONVERGENCE-ENDING: a snapshot of the field's outcome relative to the player, for the
    // epilogue coda. Undefined when there's no rival world (the resolver then emits no epilogue).
    const playerTier = this.playerRung();
    const rivalField = snaps.length
      ? {
          reachedStars: snaps.filter((s) => s.rung >= MAX_RUNG).length,
          fallen: snaps.filter((s) => s.faltering || s.rung === 0).length,
          // FALLEN-NEWS-IN-ENDING: lines that DROPPED OUT entirely (isFallen — the in-run "Eliminated"
          // dispatch), distinct from the broader "fell behind / stumbled" count above.
          droppedOut: snaps.filter((s) => s.fallen).length,
          abovePlayer: snaps.filter((s) => s.rung >= playerTier).length,
          total: snaps.length,
        }
      : undefined;
    return resolveConvergence({
      motivators: this.state.personality,
      tier: playerTier,
      survived: !Game.FAILURE_ENDS.has(this.state.end.kind),
      hasHeir: livingHeir,
      rivalsReachedStars,
      rivalField,
    });
  }

  /**
   * Begin the novel act for the current line (the founded line's wave × archetype × reach tier),
   * carrying its motivators. A no-op (null scene) when the line isn't founded or the cell has no
   * authored act yet — the UI then renders the event flow. The reach tier derives from the line's
   * generation (each generation steps one act up the lattice, capped at the spine's top tier).
   */
  private beginSagaActForState(): void {
    const wave = this.state.founding?.place;
    if (!wave) return;
    const family = this.state.family;
    const protagonist = family?.members.find((m) => m.id === family.protagonistId);
    const generation = protagonist?.generation ?? 0;
    // FS-8: the founding-spine pivot — the ONE line plays the AUTHORED SPINE act for this GENERATION.
    // The spine has 10 generations (g0..g9), so spine play uses the TRUE generation (capped at the spine
    // length), NOT MAX_RUNG (5) — clamping to MAX_RUNG replayed g5 forever past the 6th generation.
    // SAGA-RESTORE-CURSOR: if this is a RESTORE of a run paused mid-act, resume at the SAVED scene
    // position rather than restarting the act at its opening (which replayed already-seen scenes and
    // over-advanced the decoupled saga clock). The cursor carries only actId/sceneId/beatCursor; the
    // motivators + flags come from the run's live personality/flags. Falls through to a fresh begin if
    // the act id no longer resolves (corpus drift).
    if (this.state.saga) {
      if (this.saga.restore(this.state.saga, this.state.personality, this.state.flags)) return;
    }
    const spineGen = Math.min(generation, SPINE_MAX_GEN);
    if (this.saga.beginSpine(spineGen, this.state.personality, this.state.flags)) {
      this.syncSagaCursor();
      return;
    }
    // Fall back to the 504-cell corpus only if the spine isn't authored that far (back-compat). The
    // cell lattice tops out at MAX_RUNG, so the cell path keeps the old cap.
    const tier = Math.min(generation, MAX_RUNG);
    const cls = sagaClassForWealth(this.state.personality.wealth);
    this.saga.begin(
      { wave, archetype: this.state.archetype, tier, cls },
      this.state.personality,
      [],
    );
  }

  /**
   * Pick (deterministically) the next event for the current state. The RNG fork
   * label is derived ENTIRELY from reconstructable state (history length + era
   * position), never from a mutable turn counter — so a restored session and an
   * uninterrupted one compute the identical label even after era force-advances.
   */
  private pick(): GameEvent | null {
    const label = `pick:${this.state.history.length}:${this.state.eraIndex}:${this.state.eraEventCount}`;
    return pickNextEventViaWorld(this.content, this.state, this.rng.fork(label));
  }

  get view(): GameView {
    const frame = this.saga.frame();
    // WV-2: fold any EMERGENT cross-dynasty crossing into the frame's threads (additive to corpus
    // threads). Bias-weighted, era-gated, seeded — borrows a rival's authored vignette at a destination
    // slot in the current scene. Deterministic per (scene, year, seed) so replay is identical.
    const emergent = this.emergentThreads(frame.scene);
    // FS-5c: fold any DETERMINISTIC-TRIGGER branches that fire for the current spine state into the
    // frame's threads (additive). Unlike the WV-2 braid (seeded), these are pure-deterministic: the same
    // spine state fires the same family branches every replay.
    const triggered = this.triggerThreads(frame.scene);
    const extra = [...emergent, ...triggered];
    return {
      state: this.state,
      currentEvent: this.current,
      saga: extra.length ? { ...frame, threads: [...frame.threads, ...extra] } : frame,
      glimpses: this.currentGlimpses(),
      rivalStandings: this.rivalStandings(),
      rung: this.playerRung(),
      convergence: this.convergenceEnding(),
      lastLedger: this.lastLedger,
      shock: this.lastShock,
      rivalNews: this.rivalNews(),
      foreshadow: this.foreshadow(),
      canInvestRecovery: this.canInvestRecovery(),
    };
  }

  /** RECOVERY-CHOICE: may the player invest in the next rebound? Only on an active saga walk, when an
   *  outstanding blown meter exists and no invest is already pending. View-derived, deterministic. */
  private canInvestRecovery(): boolean {
    if (!this.saga.active || this.finished) return false;
    if (this.state.flags.includes(Game.RECOVERY_INVEST_FLAG)) return false;
    return this.state.flags.some((f) => f.startsWith("shock_meter:"));
  }

  /** SHOCK-FORESHADOW: a one-line omen when the upcoming saga tick carries an elevated hazard. Only on an
   *  active saga walk (the shock fires there); null on the event flow / a safe era / no strain or kin. The
   *  text is era-neutral; deterministic (no RNG) so it's a stable view-derived hint, not a roll. */
  private foreshadow(): {
    text: string;
    weight: "marginal" | "grave";
    tone: "dread" | "hope";
  } | null {
    if (!this.saga.active || this.finished) return null;
    const family = this.state.family;
    const hasKin = !!family?.members.some(
      (m) => m.id !== family.protagonistId && isMemberAlive(m, this.state.year),
    );
    // RECOVERY-FORESHADOW-TONE: a line carrying an OUTSTANDING blown meter has a pending rebound roll — what's
    // coming for it is the CHANCE TO RECOVER, which reads as hope, not dread. This hope omen takes precedence
    // over the grave dread omen (which is driven by the SAME strain): the player has already taken the blow;
    // the foresight that matters now is the rebound ahead. A strained line is always at least "grave" weight.
    if (recoveryForeshadow(this.state.flags)) {
      // HOPE-OMEN-COPY-VARIETY: the rebound reads specific to WHAT is recovering (fortune / name / health / bonds).
      return { text: recoveryForeshadowText(this.state.flags), weight: "grave", tone: "hope" };
    }
    // FORESHADOW-WEIGHT: the omen's gravity scales with the hazard. FORESHADOW-IN-TONE: the weight rides along
    // so the UI styles dread proportionally. (Without strain, foreshadowWeight never returns "grave".)
    const weight = foreshadowWeight(macroActForYear(this.state.year), this.state.flags, hasKin);
    if (weight === "marginal") {
      return {
        text: "A shadow lies over the season; the years ahead feel uncertain.",
        weight,
        tone: "dread",
      };
    }
    return null;
  }

  /**
   * WV-2 emergent braid: for the current scene's DESTINATION slots, build candidates from the live rival
   * world (era-eligible, place/archetype-biased), run the seeded selector, and resolve the chosen
   * ThreadRef into a BraidedThread the SceneReader weaves into the prose. Returns [] when the scene has
   * no destination slots, there's no world, or the seeded roll declines. Pure given (scene, world, year,
   * seed); the rng fork is keyed on the scene id + year so it's stable across re-renders + replay.
   */
  private emergentThreads(scene: SagaFrame["scene"]): ReturnType<typeof resolveThreads> {
    if (!scene || !this.world) return [];
    const destinations = scene.braidSlots.filter((s) => s.kind === "destination");
    if (destinations.length === 0) return [];
    const wave = this.state.founding?.place;
    if (!wave) return [];
    const tier = this.playerRung();
    const cls = sagaClassForWealth(this.state.personality.wealth);
    // Each rival's borrowable source slots at this tier — from the driver's memoized wave→tier index
    // (built once), so this hot `view` path never re-scans the whole corpus per candidate per render.
    const sourcesFor = (rival: RivalLike): readonly BraidSlot[] =>
      this.saga.sourceSlots(rival.id, tier);
    const candidates = candidatesFromSnapshots(
      this.world.snapshots,
      { placeId: wave, archetype: this.state.archetype, cls, tier },
      strategyForArchetype(this.state.archetype),
      sourcesFor,
    );
    const match = selectBraid(
      { year: this.state.year, tier, destinations, baseChance: 0.45 },
      candidates,
      this.rng.fork(`braid:${scene.id}:${this.state.year}`),
    );
    if (!match) return [];
    // Resolve the emergent ThreadRef the same way corpus threads resolve (rival's opening fragment).
    return resolveThreads(this.saga.corpus, { ...scene, thread: [match.thread] });
  }

  /**
   * FS-5c: the DETERMINISTIC-TRIGGER lattice — fold any recurring-family branches whose compound
   * conditions hold for the current spine state into the scene's threads. Pure-deterministic (no RNG):
   * the projection reads archetype/leanings(motivators)/meters/place/year/era/flags(+crossing memory via
   * the `crossed:` flag convention), evaluateTriggers fires the matching branches, and each resolves into
   * a woven thread the SceneReader braids into the prose. Same spine state → same branches every replay.
   */
  /**
   * The DETERMINISTIC-TRIGGER branches that fire for the current spine state (pure — no RNG, no mutation).
   * Shared by `triggerThreads` (weave) and `recordTriggerCrossings` (memory). Honors `once` by deriving the
   * already-crossed set from the run's `crossed:<family>:<branch>` flags. Returns [] when unfounded / no scene.
   */
  private firedTriggerBranches(scene: SagaFrame["scene"]): ActivatedBranch[] {
    if (!scene) return [];
    const place = this.state.founding?.place;
    if (!place) return [];
    const spine = spineStateProjection({
      archetype: this.state.archetype,
      leanings: this.state.personality as unknown as Record<string, number>,
      meters: this.state.meters,
      place,
      year: this.state.year,
      era: macroActForYear(this.state.year),
      flags: this.state.flags,
    });
    const alreadyCrossed = new Set<string>();
    for (const f of this.state.flags) {
      const m = /^crossed:([^:]+):(.+)$/.exec(f);
      if (m) alreadyCrossed.add(`${m[1]}:${m[2]}`);
    }
    return evaluateTriggers(GAME_TRIGGERS.rules, spine, alreadyCrossed);
  }

  private triggerThreads(scene: SagaFrame["scene"]): ReturnType<typeof resolveThreads> {
    if (!scene) return [];
    const fired = this.firedTriggerBranches(scene);
    if (fired.length === 0) return [];
    const tier = this.playerRung();
    // Each fired branch weaves as a thread naming the recurring family at this tier (the branch's mined
    // fabric prose is borrowed downstream); resolveThreads braids the family's opening fragment in.
    const threads = fired.map((b) => ({ wave: b.family, atTier: tier }));
    return resolveThreads(this.saga.corpus, { ...scene, thread: threads });
  }

  /**
   * TRIGGER-CROSSING-RECORD: stamp a `crossed:<family>:<branch>` flag for every trigger branch the
   * just-engaged scene fired, so (a) `once` arrivals don't re-fire and (b) the recurring-cast MEMORY is
   * real — a `priorCrossing`-gated return branch unlocks once its family was met before (the Turtledove
   * model). Called on advance (pickBeat/pickDecision) against the scene the player just acted on. The fired
   * branches come from evaluateTriggers' stable sorted order, and flags are added in that order, so the
   * flag set + ordering is deterministic and replays bit-identically. New flags only (idempotent).
   */
  private recordTriggerCrossings(scene: SagaFrame["scene"]): void {
    const fired = this.firedTriggerBranches(scene);
    if (fired.length === 0) return;
    const existing = new Set(this.state.flags);
    const fresh: string[] = [];
    for (const b of fired) {
      const flag = crossedFlag(b.family, b.branch);
      if (!existing.has(flag)) fresh.push(flag);
    }
    if (fresh.length > 0) this.state = { ...this.state, flags: [...this.state.flags, ...fresh] };
  }

  /** Advance the rival world to the run's current year (deterministic). Called when the clock moves. */
  private advanceWorldToNow(): void {
    if (this.world) {
      // FALLEN-NEWS: stamp the PREVIOUS turn's fallen rivals as announced BEFORE re-advancing. A rival that
      // went fallen last turn surfaced its one-time dispatch in the view that was shown; marking it here means
      // it won't re-announce. A rival that falls on THIS advance surfaces its dispatch now, and is stamped on
      // the next advance — the same one-turn cadence as the shock aftermath.
      this.markFallenSeen();
      // WV-3-RIVAL-REACT: pass the player's vantage (rung + archetype strategy) so direct competitors
      // escalate against the line — the world reacts to where the player is, not just to static motivators.
      this.world = advanceWorld(
        this.world,
        this.state.year,
        this.rng.fork(`world:${this.state.year}`),
        { rung: this.playerRung(), strategy: strategyForArchetype(this.state.archetype) },
      );
    }
  }

  /**
   * INTERACTIVE CONVERGENCE (replay-safe, STATELESS): the played line ACTS on its rivals at the
   * cross-family crossings it has passed — an `opposing` crossing suppresses that rival's climb, a
   * `contributing` one lifts it. The set of crossings passed is a PURE function of the line's reach
   * (one crossing per act/tier up to the protagonist's generation), so we recompute the cumulative
   * nudge from `playerRung()` every time the world is (re)built — no transient `firedCrossings` Set
   * that a save/restore would lose (that broke determinism). Applied in beginWorldForState, before the
   * world advances to now. Rides the braid-pass relations already in the corpus — zero new authoring.
   */
  private applyCrossingNudges(): void {
    for (let tier = 0; tier <= this.playerRung(); tier++) this.nudgeForTier(tier);
  }

  /** Apply the crossing(s) at one act/tier's midpoint to the rival world. Pure-deterministic input
   *  (corpus + cell), so calling it for tier T during world-build and again when the line REACHES tier
   *  T produces the same cumulative world only if build covers [0..rung]; the live path nudges the NEW
   *  tier exactly once as the rung increments — together they total each tier's crossing once. */
  private nudgeForTier(tier: number): void {
    if (!this.world) return;
    const wave = this.state.founding?.place;
    if (!wave) return;
    const cls = sagaClassForWealth(this.state.personality.wealth);
    const act = actsForTier(this.saga.corpus, wave, this.state.archetype, tier, cls);
    const midId = act?.scenes.find((id: string) => id.endsWith(":midpoint"));
    const mid = midId ? this.saga.corpus.scenes.get(midId) : undefined;
    for (const ref of mid?.thread ?? []) {
      if (!ref.relation || ref.relation === "neutral") continue;
      this.world = nudgeRival(
        this.world,
        `rival:${ref.wave}`,
        ref.relation === "opposing" ? -1 : 1,
      );
    }
  }

  /** Write the driver's carried motivators back into the run's personality vector. */
  private syncMotivators(m: Motivators | null): void {
    if (m) this.state = { ...this.state, personality: m };
  }

  /**
   * Union the saga act's accumulated flags into the run's state.flags (PF-14), so a saga choice's
   * setFlags actually shape the run — gating events, feeding the butterfly ledger, persisting + being
   * inspectable — instead of being sealed inside the driver. Deterministic (set-union, stable order).
   */
  private syncSagaFlags(): void {
    const existing = new Set(this.state.flags);
    // Append only the genuinely-new saga flags, in their accumulation order — preserves the existing
    // flag order (and thus any order-sensitive replay) while adding the saga choices' marks.
    const fresh = this.saga.flags.filter((f) => !existing.has(f));
    if (fresh.length > 0) {
      this.state = { ...this.state, flags: [...this.state.flags, ...fresh] };
    }
  }

  /**
   * SAGA-RESTORE-CURSOR: mirror the driver's live walk position into the persisted run state, so a save
   * taken at any point reloads at the exact scene. Cleared (undefined) when no act is active so a restore
   * of a between-acts run begins the next act fresh. Deterministic — pure read of the driver's cursor.
   */
  private syncSagaCursor(): void {
    const cursor = this.saga.cursor;
    this.state = cursor
      ? { ...this.state, saga: cursor }
      : this.state.saga
        ? { ...this.state, saga: undefined }
        : this.state;
  }

  /**
   * Reading the novel passes in-world time: each saga choice ticks the timeline one step (years
   * advance, eras roll, the run can reach an end) so the run progresses toward its conclusion even
   * while the played surface is the novel rather than the event flow. Then, if the act has ended,
   * the event flow resumes (so the run keeps moving once a generation's act closes). Pure ticks; the
   * timeline + end detection are deterministic.
   */
  private advanceRunClock(sagaYears: number = SAGA_YEAR_STEP): void {
    const fromYear = this.state.year;
    // While a novel act is active, tick the SAGA clock by `sagaYears` (decoupled from the era ladder)
    // so any founding year — including baghdad's 762 CE — plays a full multi-generation run; the
    // era-budget timeline only drives the EVENT path (the 1885 waves it's calibrated for). The span is
    // driven by DECISIONS, not scene count: a decisionless texture beat passes 0 years (so deepening an
    // act with interstitial scenes never ages the line faster), while a succession decision advances a
    // whole generation's worth of years at once — which is what drives advanceFamily's per-year
    // mortality loop to age the protagonist to death and hand the line to the next-generation heir
    // (the ONLY thing that steps `protagonist.generation`). Freezing years on EVERY saga move (the
    // earlier attempt) froze aging → froze succession → the line never advanced a generation.
    this.state = this.saga.active
      ? advanceSagaClock(this.state, sagaYears)
      : advanceTimeline(this.content, this.state);
    // PF-8: age + succeed the family over the elapsed years — the same logic the event path runs — so
    // reading the novel actually advances the lineage (mortality, heir handoff, extinction).
    this.state = advanceFamily(
      this.content,
      this.state,
      fromYear,
      this.rng.fork(`sagafam:${fromYear}`),
    );
    // WV-3-MORTALITY: a year-advancing saga tick (a generational span, sagaYears>0 — NOT a 0-year texture
    // beat) rolls a seeded, era-weighted DISRUPTION shock — the exogenous variability the divergence audit
    // found missing on the saga path. It can take a (non-protagonist) family member or blow a meter, so runs
    // diverge in events. Seeded on the from-year (fork distinct from sagafam) → replay bit-identical.
    if (this.saga.active && sagaYears > 0) this.applySagaShock(fromYear);
    this.advanceWorldToNow();
    const end = detectEnd(this.content, this.state);
    if (end) {
      this.state = { ...this.state, end };
      this.current = null;
      return;
    }
    // When the novel act has run out (and no new act began), hand the run back to the event flow.
    // pickWithProgress force-advances eras until an event is found or the run ends, so the player is
    // never stranded on the "generation closes" interlude with no choice and no end screen.
    if (!this.saga.active) {
      this.current = this.pickWithProgress();
      if (this.state.end) this.current = null;
    }
  }

  /**
   * WV-3-MORTALITY: roll + apply one seeded disruption shock for a generational saga tick. A family_death
   * marks a (non-protagonist) member died; a meter_blow applies a negative meter delta (or +heat). The shock
   * flag (`shock:<kind>:<year>`) is unioned into state.flags so it (a) is inspectable/persisted and (b) can
   * gate a downstream loss/recovery scene later. Seeded on `fromYear` via the run rng → replay-identical.
   * No-op when the hazard doesn't fire. The macro-act era id tempers the hazard (better medicine → rarer).
   */
  private applySagaShock(fromYear: number): void {
    const era = macroActForYear(fromYear);
    // SHOCK-FAMILY-SUCCESSION-PRESSURE: the GROOMED heir (the `heir_<id>` flag) is a likelier, sharper
    // target — so the shock can take the chosen successor, forcing a weaker fallback.
    const namedHeirId = this.state.flags.find((f) => f.startsWith("heir_"))?.slice("heir_".length);
    // SHOCK-CLUSTERING-GUARD: was the line shocked within the last generation span? A `shock:*:<year>` flag
    // with year in (fromYear - SPAN, fromYear) means a recent blow → dampen this tick (no death spirals).
    // Derived from the persisted flags, so it replays identically without new state.
    const recentlyShocked = this.state.flags.some((f) => {
      const m = /^shock:(?:family_death|meter_blow):(\d+)$/.exec(f);
      if (!m) return false;
      const y = Number(m[1]);
      return y < fromYear && fromYear - y < SAGA_GENERATION_SPAN;
    });
    const shock = rollSagaShock(
      this.state.family,
      fromYear,
      era,
      this.rng.fork(`sagashock:${fromYear}`),
      namedHeirId,
      recentlyShocked,
    );
    // WV-3-SHOCK-RECOVERY: a tick with NO new shock is when a PRIOR meter blow can rebound (the two-act
    // shape: blow → later partial recovery). Rolling recovery only on quiet ticks keeps a shock and its
    // rebound from landing the same turn.
    if (shock.kind === "none") {
      this.applySagaRecovery(fromYear);
      return;
    }
    // Surface the shock as a one-turn aftermath note the SceneReader/PlayScreen narrates (WV-3-SHOCK-SCENES).
    this.lastShock = shockNote(shock);
    const newFlags: string[] = [];
    if (shock.kind === "family_death" && this.state.family) {
      this.state = {
        ...this.state,
        family: applyFamilyDeathShock(this.state.family, shock, fromYear),
      };
      // SHOCK-FAMILY-SUCCESSION-PRESSURE: the shock took the groomed heir — drop the `heir_<id>` flag so the
      // next succession falls back to the eldest living child (a weaker, unplanned handoff).
      if (shock.tookHeir && namedHeirId) {
        this.state = {
          ...this.state,
          flags: this.state.flags.filter((f) => f !== `heir_${namedHeirId}`),
        };
      }
    } else if (shock.kind === "meter_blow" && shock.meter && shock.delta !== undefined) {
      this.state = {
        ...this.state,
        meters: applyDelta(this.content.meters, this.state.meters, { [shock.meter]: shock.delta }),
      };
      // Mark the blown meter as RECOVERABLE (a stable flag the later recovery roll finds). Heat is a danger
      // spike, not a loss to rebound — it cools via the systemic tick, so it gets no recovery marker.
      if (shock.meter !== "heat") newFlags.push(shockMeterFlag(shock.meter));
    }
    // Record the shock as a flag (inspectable + a hook for an authored loss/recovery scene downstream).
    newFlags.push(`shock:${shock.kind}:${fromYear}`);
    const fresh = newFlags.filter((f) => !this.state.flags.includes(f));
    if (fresh.length > 0) this.state = { ...this.state, flags: [...this.state.flags, ...fresh] };
  }

  /**
   * WV-3-SHOCK-RECOVERY: on a quiet saga tick, a previously-blown meter may partially REBOUND (the family
   * rebuilds after the fire / lives down the scandal). Seeded; applies a positive meter delta + clears the
   * `shock_meter:<meter>` marker + surfaces a recovery note for one move. No-op when nothing rebounds.
   */
  private applySagaRecovery(fromYear: number): void {
    // RECOVERY-CHOICE: a pending player investment boosts this roll (chance + magnitude), then is consumed.
    const invested = this.state.flags.includes(Game.RECOVERY_INVEST_FLAG);
    const recovery = rollSagaRecovery(
      new Set(this.state.flags),
      fromYear,
      this.rng.fork(`sagarecover:${fromYear}`),
      invested,
    );
    if (!recovery) return;
    // SHOCK-LEDGER-RECOVERIES: clear the outstanding `shock_meter:<meter>` marker AND stamp a persistent
    // `recovered:<meter>:<year>` flag — so the ledger can read blow → comeback, not just the loss. The cleared
    // marker is transient bookkeeping; the recovered flag is the durable record the "What Befell" log surfaces.
    // RECOVERY-INVEST-IN-LEDGER: an INVESTED rebound gets a `:invested` suffix so the ledger credits the player.
    const recoveredFlag = `recovered:${recovery.meter}:${fromYear}${invested ? ":invested" : ""}`;
    this.state = {
      ...this.state,
      meters: applyDelta(this.content.meters, this.state.meters, {
        [recovery.meter]: recovery.delta,
      }),
      // Consume the invest flag on a fired recovery (the investment paid off this rebound).
      flags: [
        ...this.state.flags.filter(
          (f) => f !== recovery.clearFlag && f !== Game.RECOVERY_INVEST_FLAG,
        ),
        ...(this.state.flags.includes(recoveredFlag) ? [] : [recoveredFlag]),
      ],
    };
    this.lastShock = {
      kind: "recovery",
      text: this.recoveryText(recovery.note),
      note: recovery.note,
    };
  }

  /** RECOVERY-CHOICE: the flag marking a pending player investment in the next rebound (consumed when it fires). */
  private static readonly RECOVERY_INVEST_FLAG = "recovery_invest_pending";
  /** RECOVERY-CHOICE: the meters the player can spend to invest in a rebound, + the cost. Money (rebuild funds)
   *  or heat (call in favours, drawing notice). Flat + deterministic. */
  private static readonly INVEST_COST = 18;

  /**
   * RECOVERY-CHOICE: the player INVESTS in the next rebound — spends `meter` (money or heat-raise) to set a
   * pending-invest flag that boosts the next recovery's chance + magnitude. Only valid when (a) the player can
   * afford it / it's a sane meter, (b) there's an outstanding blown meter to recover, and (c) no invest is
   * already pending. Recorded in the recoveryInvests SIDE-LOG (not history) so it never perturbs the saga RNG;
   * reconstruct re-applies it at the same `at`. No time passes — an action within the turn. No-op otherwise.
   */
  investRecovery(meter: "money" | "heat"): void {
    if (!this.saga.active || this.finished) return;
    if (this.state.flags.includes(Game.RECOVERY_INVEST_FLAG)) return; // one pending invest at a time
    const hasOutstanding = this.state.flags.some((f) => f.startsWith("shock_meter:"));
    if (!hasOutstanding) return; // nothing to rebound — investing would be wasted
    // AFFORDABILITY GUARD (Gemini #130, high): a money invest must be affordable — else the player gets a
    // free/discounted boost (money would go negative). Heat invest is always allowed (a heat RISE is the cost).
    if (meter === "money" && this.state.meters.money < Game.INVEST_COST) return;
    this.applyInvestEffect(meter);
    this.state = {
      ...this.state,
      recoveryInvests: [
        ...(this.state.recoveryInvests ?? []),
        { at: this.state.history.length, meter, year: this.state.year },
      ],
    };
    this.emit();
  }

  /** Apply an invest's deterministic effect — the meter cost + the pending-invest flag — WITHOUT recording it
   *  (the caller / reconstruct owns the side-log). `money` is spent (negative); `heat` rises (a cost too). */
  private applyInvestEffect(meter: "money" | "heat"): void {
    const delta = meter === "money" ? { money: -Game.INVEST_COST } : { heat: Game.INVEST_COST };
    this.state = {
      ...this.state,
      meters: applyDelta(this.content.meters, this.state.meters, delta),
      flags: this.state.flags.includes(Game.RECOVERY_INVEST_FLAG)
        ? this.state.flags
        : [...this.state.flags, Game.RECOVERY_INVEST_FLAG],
    };
  }

  /** A one-line recovery aftermath, mirroring the loss note's voice (WV-3-SHOCK-RECOVERY). */
  private recoveryText(note: string): string {
    const TEXT: Record<string, string> = {
      convalescence: "The sickness passed; the household's strength slowly returned.",
      rebuilt: "Brick by brick the house was rebuilt — the fortune clawed back from the ash.",
      redeemed: "Time and quiet work redeemed the name; the scandal faded from memory.",
      reconciled: "Old wounds healed; the loyalty that had drained away was, in part, won back.",
    };
    return TEXT[note] ?? "The line steadied, and recovered some of what it had lost.";
  }

  /**
   * SAGA-RESTORE-CURSOR: record a saga walk step in the run's ONE ordered choice log, so the persisted
   * save (seed + history) reconstructs the novel walk on reload. Appended AFTER the move's clock/
   * succession logic — which keys RNG fork labels on `history.length` — so those labels (and thus replay
   * determinism) are unchanged; the step counts toward history only for the NEXT move, identically in
   * live play and reconstruction.
   */
  private recordSagaStep(kind: "beat" | "decision", index: number): void {
    this.state = {
      ...this.state,
      history: [...this.state.history, { saga: kind, index, year: this.state.year }],
    };
  }

  /** Apply a weave-beat choice on the current novel scene; time passes; then re-emit. */
  pickBeat(beatIndex: number): void {
    this.lastShock = null; // the aftermath note surfaces for one move only
    // Capture the scene the player just engaged BEFORE the driver advances off it, so any trigger branches
    // it surfaced get their crossing recorded (TRIGGER-CROSSING-RECORD).
    const engaged = this.saga.frame().scene;
    this.syncMotivators(this.saga.pickBeat(beatIndex));
    this.syncSagaFlags();
    this.recordTriggerCrossings(engaged);
    // A weave-beat is TEXTURE within a generation, not a generational step — it passes NO in-world
    // years, so an act's depth (how many interstitial beats it carries) no longer ages the line. The
    // generation's whole span is advanced once, at its succession decision (see pickDecision).
    this.advanceRunClock(0);
    this.recordSagaStep("beat", beatIndex);
    this.syncSagaCursor();
    this.emit();
  }

  /**
   * Apply the current scene's terminal decision; time passes; then re-emit. When the chosen option
   * carries a succession effect (a `close`-scene partner/heirs choice), the line steps to the next
   * generation: the next tier's act begins, carrying the line's drifted motivators.
   */
  pickDecision(optionIndex: number): void {
    this.lastShock = null; // the aftermath note surfaces for one move only
    // Capture the engaged scene before the driver advances (TRIGGER-CROSSING-RECORD).
    const engaged = this.saga.frame().scene;
    const result = this.saga.pickDecision(optionIndex);
    this.syncMotivators(result?.motivators ?? null);
    this.syncSagaFlags();
    this.recordTriggerCrossings(engaged);
    const continues =
      !!result?.succession && (result.succession.takesPartner || result.succession.begets > 0);
    // FS-8: the apex is the spine's TERMINAL generation (g9 = the stars), not MAX_RUNG (the cell cap).
    // The protagonist's true generation depth (uncapped) drives this so the run plays all 10 spine acts.
    const family = this.state.family;
    const protagonist = family?.members.find((m) => m.id === family.protagonistId);
    const trueGen = protagonist?.generation ?? 0;
    if (continues && result?.succession && trueGen >= SPINE_MAX_GEN) {
      // The line carried succession THROUGH the terminal stellar generation — the dynasty reaches its
      // apex among the stars. End on the survived convergence/destiny ending rather than looping the
      // last act forever (the decoupled clock would otherwise never terminate).
      // Set a provisional apex end so convergenceEnding() (which requires state.end) can resolve the destiny.
      this.state = {
        ...this.state,
        end: { kind: "apex", year: this.state.year, reason: APEX_REASON_DEFAULT },
      };
      // STELLAR-EPILOGUE-VARIETY: tailor the apex reason to HOW the line reached the stars (conquest / allies /
      // hidden) so the ultimate close reflects the path taken.
      const destiny = this.convergenceEnding()?.destiny;
      const reason = (destiny && APEX_REASON[destiny]) || APEX_REASON_DEFAULT;
      this.state = {
        ...this.state,
        end: { kind: "apex", year: this.state.year, reason },
      };
    } else if (continues && result?.succession) {
      // Apply the succession effect to the LIVE family (take a partner + beget heirs) BEFORE stepping
      // to the next act — else the player "raises heirs" but none are begotten and the line goes extinct
      // at the protagonist's death (DEPTH-3). Seeded for replay; label-scoped vs the event path.
      this.state = applySuccessionToFamily(
        this.content,
        this.state,
        result.succession,
        this.state.year,
        `saga:${this.state.year}:${this.state.history.length}`,
        this.rng.fork(`sagasucc:${this.state.year}:${this.state.history.length}`),
      );
      // Begin the NEXT generation's spine act BEFORE promoting the heir — it reads the CURRENT
      // protagonist's generation + 1 to pick the next act, so it must run while the protagonist is still
      // the outgoing generation (else the post-promotion +1 would skip a generation's act).
      this.beginNextGenerationAct();
      // The succession DECISION is the generational step: deterministically retire the current
      // protagonist and promote the just-begotten heir at the year a generation later, so generation
      // advancement is driven by the DECISION (one step per ~3-decision generation), NOT by whether a
      // probabilistic mortality roll happens to kill the protagonist within the elapsed span. The heir
      // begotten above (born this year) is eligible at year + SAGA_GENERATION_SPAN. This is what
      // actually increments `protagonist.generation`.
      this.state = succeedToHeir(this.state, this.state.year + SAGA_GENERATION_SPAN);
      // The line just reached the next tier — apply that tier's crossing nudge to the rivals (once).
      this.nudgeForTier(this.playerRung());
    } else if (result?.wasCloseDecision && !this.state.end) {
      // The dynastic fork resolved AGAINST continuing: the player closed a generation without taking a
      // partner / raising heirs, so the line ends here by choice. Mark it line-extinct so the run
      // resolves its convergence ending (earthbound/extinguished) + LegacyReport — a real, distinct
      // stake versus the continue branch, not a silent fall-through to the event flow.
      this.state = {
        ...this.state,
        end: {
          kind: "line-extinct",
          year: this.state.year,
          reason: "The line was not carried forward — no heir was raised to bear the name.",
        },
      };
    }
    // Don't tick the clock once the line has ended (here or via a prior end) — the run is over.
    // A succession decision is the GENERATIONAL step: advance a whole generation's span at once so
    // advanceFamily's per-year mortality loop ages the (now-heir-bearing) protagonist to death and the
    // line hands off to the next generation — the only path that steps `protagonist.generation`. A
    // non-succession terminal decision is in-generation, so it passes the small default step.
    if (!this.state.end) this.advanceRunClock(continues ? SAGA_GENERATION_SPAN : SAGA_YEAR_STEP);
    this.recordSagaStep("decision", optionIndex);
    this.syncSagaCursor();
    this.emit();
  }

  /**
   * Step the saga to the next generation's act. The full family advancement (partner → beget →
   * succeed, src/sim/effects.ts) is driven by the event/succession system; here the saga surface
   * re-begins at the next reach tier so the novel keeps moving generation-by-generation. Carries the
   * line's current (drifted) motivators + accumulated flags.
   */
  private beginNextGenerationAct(): void {
    const wave = this.state.founding?.place;
    if (!wave) return;
    const family = this.state.family;
    const protagonist = family?.members.find((m) => m.id === family.protagonistId);
    const nextGen = (protagonist?.generation ?? 0) + 1;
    // FS-8: prefer the AUTHORED SPINE act for the next generation (true gen, up to the spine's top), so
    // the line advances through ALL 10 generations to the stars — NOT clamped to MAX_RUNG (which replayed
    // the cell corpus past gen 5). Fall back to the cell lattice only if the spine isn't authored that far.
    if (
      this.saga.beginSpine(
        Math.min(nextGen, SPINE_MAX_GEN),
        this.state.personality,
        this.saga.flags,
      )
    )
      return;
    const nextTier = Math.min(nextGen, MAX_RUNG);
    const cls = sagaClassForWealth(this.state.personality.wealth);
    this.saga.begin(
      { wave, archetype: this.state.archetype, tier: nextTier, cls },
      this.state.personality,
      this.saga.flags,
    );
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    fn(this.view);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    const v = this.view;
    for (const fn of this.listeners) fn(v);
  }

  /** Resolve a choice on the current event and advance to the next. */
  choose(choiceId: string): void {
    if (!this.current) throw new Error("No current event to choose on");
    if (this.state.end) throw new Error("Run has ended");
    // The saga shock aftermath is a one-MOVE note: clear it on an event-flow advance too, else a note set
    // as a saga act ended would linger across the event flow and reappear when the next saga act begins
    // (Gemini #110). The event path doesn't roll saga shocks, so this only ever clears.
    this.lastShock = null;
    const result = applyChoice(this.content, this.state, this.current, choiceId, this.rng);
    this.state = result.state;
    this.lastLedger = result.newLedger;
    this.advanceWorldToNow();
    // If the era is exhausted but the run hasn't ended, force-advance once so the
    // player is never stuck with no event and no end screen.
    this.current = this.state.end ? null : this.pickWithProgress();
    this.emit();
  }

  /** Pick the next event, force-advancing eras until one is found or the run ends. */
  private pickWithProgress(): GameEvent | null {
    let next = this.pick();
    let guard = 0;
    while (!next && !this.state.end && guard < this.content.eras.length + 1) {
      const era = this.content.eras[this.state.eraIndex];
      if (!era) break;
      // Spend the rest of the era's budget to roll forward.
      this.state = advanceTimeline(this.content, {
        ...this.state,
        eraEventCount: era.eventBudget,
      });
      next = this.state.end ? null : this.pick();
      guard += 1;
    }
    return next;
  }

  get finished(): boolean {
    return this.state.end !== null;
  }

  /**
   * SAGA-RESTORE-CURSOR: reconstruct a run from a founded BASE state + the ordered choice log, replaying
   * BOTH channels through the live engine — event steps via `choose`, saga steps via `pickBeat`/
   * `pickDecision`. This is how a persisted save (seed + interleaved history) rebuilds a saga-deep run
   * bit-identically: the saga clock, family aging, and rival world all re-derive deterministically from
   * the choice sequence. Returns the reconstructed `GameState`. A step that no longer applies (corpus/
   * content drift, or the run already ended) is skipped so a partial-compat save still loads.
   */
  static reconstruct(
    content: Content,
    base: GameState,
    history: ReadonlyArray<{
      eventId?: string;
      choiceId?: string;
      saga?: "beat" | "decision";
      index?: number;
    }>,
    presses: ReadonlyArray<{ at: number; rivalId: string; year: number }> = [],
    recoveryInvests: ReadonlyArray<{ at: number; meter: "money" | "heat"; year: number }> = [],
  ): GameState {
    const game = new Game(content, base.seed, base, base.archetype);
    // RIVAL-CROSSING-EXPLOIT + RECOVERY-CHOICE: the player side-logs are interleaved by `at` (the history.length
    // at which each fired) so their deterministic effects land at the SAME point as live play — WITHOUT going
    // through `history` (which would shift history.length and desync the saga RNG). Sorted by `at`; applied after
    // each step once history.length has reached the mark, so the NEXT step sees the effect (a press's nudge, an
    // invest's pending flag) exactly as live play did.
    const orderedPresses = [...presses].sort((a, b) => a.at - b.at);
    const orderedInvests = [...recoveryInvests].sort((a, b) => a.at - b.at);
    let pi = 0;
    let ii = 0;
    const applyDue = () => {
      const len = game.state.history.length;
      while (pi < orderedPresses.length && (orderedPresses[pi]?.at ?? Infinity) <= len) {
        game.applyPressEffect(orderedPresses[pi]?.rivalId ?? "");
        pi++;
      }
      // Re-apply each invest's EXACT meter cost (stored in the side-log) + the pending-invest flag, so the
      // reconstructed meters match live play and the next recovery roll reads the boost identically.
      while (ii < orderedInvests.length && (orderedInvests[ii]?.at ?? Infinity) <= len) {
        game.applyInvestEffect(orderedInvests[ii]?.meter ?? "money");
        ii++;
      }
    };
    applyDue(); // any side-log item recorded before the first step (at === 0)
    for (const step of history) {
      if (game.finished) break;
      if (step.saga === "beat") {
        if (game.view.saga.scene) game.pickBeat(step.index ?? 0);
      } else if (step.saga === "decision") {
        if (game.view.saga.scene?.decision) game.pickDecision(step.index ?? 0);
      } else if (step.eventId && step.choiceId) {
        // Only replay the event step if it's the live current event (it always is in a faithful log).
        if (game.view.currentEvent?.id === step.eventId) game.choose(step.choiceId);
      }
      applyDue();
    }
    // Restore the side-logs onto the reconstructed state (their effects are already applied above).
    game.state = {
      ...game.state,
      ...(presses.length ? { presses: [...presses] } : {}),
      ...(recoveryInvests.length ? { recoveryInvests: [...recoveryInvests] } : {}),
    };
    return game.view.state;
  }
}
