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
  nudgeRival,
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
import { applyFamilyDeathShock, rollSagaShock } from "../sim/sagaShock";
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

/** A snapshot the UI renders from. Immutable per turn. */
export interface GameView {
  state: GameState;
  currentEvent: GameEvent | null;
  /** The played NOVEL frame — the act title + current scene. `scene` is null when the line's act
   *  isn't authored yet (the UI then renders the event flow). */
  saga: SagaFrame;
  /** Rival lines (the convergence world) visible from the player's vantage this turn. */
  glimpses: Glimpse[];
  /** The WHOLE convergence field — every rival line's current standing (label + rung), sorted high→low,
   *  for a "where all the lines are racing" readout (RB-5), beyond the near-vantage glimpses. */
  rivalStandings: Array<{ id: string; label: string; rung: number }>;
  /** The player's class rung (generation depth, 0..5) — for the read-model's class readout. */
  rung: number;
  /** The dynastic CONVERGENCE ending (toward the stars / contributed / earthbound / extinguished),
   *  resolved when the run ends; null while in progress. */
  convergence: ConvergenceEnding | null;
  lastLedger: LedgerEntry[];
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
  private rivalStandings(): Array<{ id: string; label: string; rung: number }> {
    if (!this.world) return [];
    return this.world.snapshots
      .map((s) => ({ id: s.id, label: s.label, rung: s.rung }))
      .sort((a, b) => b.rung - a.rung || a.label.localeCompare(b.label));
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
    const rivalsReachedStars = (this.world?.snapshots ?? []).some((s) => s.rung >= MAX_RUNG);
    return resolveConvergence({
      motivators: this.state.personality,
      tier: this.playerRung(),
      survived: !Game.FAILURE_ENDS.has(this.state.end.kind),
      hasHeir: livingHeir,
      rivalsReachedStars,
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
    };
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
    const shock = rollSagaShock(
      this.state.family,
      fromYear,
      era,
      this.rng.fork(`sagashock:${fromYear}`),
    );
    if (shock.kind === "none") return;
    if (shock.kind === "family_death" && this.state.family) {
      this.state = {
        ...this.state,
        family: applyFamilyDeathShock(this.state.family, shock, fromYear),
      };
    } else if (shock.kind === "meter_blow" && shock.meter && shock.delta !== undefined) {
      this.state = {
        ...this.state,
        meters: applyDelta(this.content.meters, this.state.meters, { [shock.meter]: shock.delta }),
      };
    }
    // Record the shock as a flag (inspectable + a hook for an authored loss/recovery scene downstream).
    const flag = `shock:${shock.kind}:${fromYear}`;
    if (!this.state.flags.includes(flag)) {
      this.state = { ...this.state, flags: [...this.state.flags, flag] };
    }
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
      this.state = {
        ...this.state,
        end: {
          kind: "apex",
          year: this.state.year,
          reason: "The dynasty carried its name from the founding to the stars.",
        },
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
  ): GameState {
    const game = new Game(content, base.seed, base, base.archetype);
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
    }
    return game.view.state;
  }
}
