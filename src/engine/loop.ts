import { loadSaga } from "../data/loadSaga";
import type { Content } from "../sim/content";
import { applyChoice } from "../sim/effects";
import { createRng, type Rng } from "../sim/rng";
import type { GameEvent } from "../sim/schema";
import type { Archetype } from "../sim/slots";
import { type GameState, initState, type LedgerEntry } from "../sim/state";
import { advanceTimeline } from "../sim/timeline";
import { pickNextEventViaWorld } from "../sim/world";
import { SagaDriver, type SagaFrame } from "./sagaDriver";

/** A snapshot the UI renders from. Immutable per turn. */
export interface GameView {
  state: GameState;
  currentEvent: GameEvent | null;
  /** The played NOVEL frame — the act title + current scene. `scene` is null when the line's act
   *  isn't authored yet (the UI then renders the event flow). */
  saga: SagaFrame;
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
    // Reach tier = the protagonist's generation depth (founder = 0), capped at the spine's top tier.
    const family = this.state.family;
    const protagonist = family?.members.find((m) => m.id === family.protagonistId);
    const tier = Math.min(protagonist?.generation ?? 0, 5);
    this.saga.begin({ wave, archetype: this.state.archetype, tier }, this.state.personality, []);
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
    return {
      state: this.state,
      currentEvent: this.current,
      saga: this.saga.frame(),
      lastLedger: this.lastLedger,
    };
  }

  /** Write the driver's carried motivators back into the run's personality vector. */
  private syncMotivators(m: ReturnType<SagaDriver["pickBeat"]>): void {
    if (m) this.state = { ...this.state, personality: m };
  }

  /** Apply a weave-beat choice on the current novel scene, then re-emit. */
  pickBeat(beatIndex: number): void {
    this.syncMotivators(this.saga.pickBeat(beatIndex));
    this.emit();
  }

  /** Apply the current scene's terminal decision, then re-emit. */
  pickDecision(optionIndex: number): void {
    this.syncMotivators(this.saga.pickDecision(optionIndex));
    this.emit();
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
}
