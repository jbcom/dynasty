/**
 * SAGA DRIVER (Narrative Acts model) — the engine-side bridge that drives the NOVEL during play.
 *
 * It owns the corpus + a per-line ActState and answers two questions the UI needs: "what scene is the
 * player reading?" and "what happens when they pick a beat/decision?". It derives the act for a founded
 * line from the run state (wave = founding place, archetype = run archetype, tier = reach tier) and
 * walks it via the pure runner. Motivators carried in/out keep the line's drift in sync with the rest
 * of the sim. Pure given the corpus — no DOM, no randomness; the walk is deterministic for replay.
 *
 * When a cell has no authored act yet (the corpus is still being fleshed by GenAI), the driver yields
 * a null scene and the engine falls back to its existing event flow — so partial content never breaks
 * play. As the lattice fills, more of the run reads as the novel.
 */

import type { Motivators } from "../sim/motivators";
import {
  actsForTier,
  type BraidedThread,
  resolveThreads,
  type SagaCorpus,
} from "../sim/saga/player";
import {
  type ActState,
  actEnded,
  chooseBeat,
  chooseDecision,
  currentScene,
  startAct,
} from "../sim/saga/runner";
import type { Scene } from "../sim/saga/schema";

/** The coordinates that select a line's act from the corpus. */
export interface SagaCell {
  wave: string;
  archetype: string;
  /** The reach tier (0 personal … 5 interstellar) — derived from the run's generation/era. */
  tier: number;
  /** The line's class rung (poor/middle/…) — its story track; falls back to "poor" if unauthored. */
  cls?: string;
}

/** What the UI renders for the played novel: the act's title + the current scene (or null = no act). */
export interface SagaFrame {
  actTitle: string | null;
  scene: Scene | null;
  /** Cross-family intersections braided into the current scene (ink threads) — empty when none fire. */
  threads: BraidedThread[];
  ended: boolean;
  /** The cell driving the current act — the render layer (RB-8) composes the portrait/wash from it. */
  cell: SagaCell | null;
}

/**
 * Drives one line's walk through the novel. Holds the corpus and the live ActState; `frame()` is the
 * UI snapshot, `pickBeat` / `pickDecision` advance the walk. Returns the carried motivators so the
 * engine can write them back to the run's personality vector.
 */
export class SagaDriver {
  private readonly _corpus: SagaCorpus;
  /** The loaded corpus — read-only access for deterministic cross-reads (e.g. crossing nudges). */
  get corpus(): SagaCorpus {
    return this._corpus;
  }
  private state: ActState | null = null;
  private actTitle: string | null = null;
  private cell: SagaCell | null = null;

  constructor(corpus: SagaCorpus) {
    this._corpus = corpus;
  }

  /** Begin (or restart) the act for a cell, carrying the line's current motivators + flags. */
  begin(cell: SagaCell, motivators: Motivators, flags: readonly string[] = []): void {
    const act = actsForTier(this.corpus, cell.wave, cell.archetype, cell.tier, cell.cls ?? "poor");
    if (!act) {
      this.state = null;
      this.actTitle = null;
      this.cell = null;
      return;
    }
    this.actTitle = act.title;
    this.cell = cell;
    this.state = startAct(this.corpus, act, motivators, flags);
  }

  /** The UI snapshot: the act title + current scene + any braided cross-family threads. */
  frame(): SagaFrame {
    const scene = this.state ? currentScene(this.corpus, this.state) : null;
    return {
      actTitle: this.actTitle,
      scene,
      threads: scene ? resolveThreads(this.corpus, scene) : [],
      ended: this.state ? actEnded(this.state) : false,
      cell: this.state ? this.cell : null,
    };
  }

  /** Whether the driver currently has an active (authored, unfinished) act to render. */
  get active(): boolean {
    return this.state !== null && !actEnded(this.state);
  }

  /** The line's accumulated flags (for save/replay + gating). */
  get flags(): string[] {
    return this.state ? [...this.state.flags] : [];
  }

  /** The line's current motivators (to write back to the run's personality vector). */
  get motivators(): Motivators | null {
    return this.state?.motivators ?? null;
  }

  /** Apply a weave beat choice; returns the new motivators (or null if no active scene). */
  pickBeat(beatIndex: number): Motivators | null {
    if (!this.state) return null;
    this.state = chooseBeat(this.corpus, this.state, beatIndex);
    return this.state.motivators;
  }

  /**
   * Apply the scene's terminal decision. Returns the new motivators AND any succession effect the
   * chosen option carries (read off the scene BEFORE advancing) — so the engine can step the line to
   * the next generation (partner → beget → succeed) when a `close`-scene option calls for it. Null
   * when there's no active scene.
   */
  pickDecision(optionIndex: number): DecisionResult | null {
    if (!this.state) return null;
    const scene = currentScene(this.corpus, this.state);
    const succession = scene?.decision?.options[optionIndex]?.succession;
    // A close scene's decision is the generational fork: if its chosen option carries NO succession,
    // the player chose to let the line end here (vs continue it) — the engine resolves a final ending.
    const wasCloseDecision = scene?.id.endsWith(":close") ?? false;
    this.state = chooseDecision(this.corpus, this.state, optionIndex);
    return { motivators: this.state.motivators, succession, wasCloseDecision };
  }
}

/** The outcome of a decision pick: the carried motivators + any succession effect to apply. */
export interface DecisionResult {
  motivators: Motivators;
  succession?: { takesPartner: boolean; begets: number };
  /** True when the decided scene was a generational `close` — the dynastic fork. */
  wasCloseDecision: boolean;
}
