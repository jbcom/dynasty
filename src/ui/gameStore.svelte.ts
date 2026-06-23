import { Game, type GameView } from "../engine/loop";
import { saveGame } from "../engine/save";
import type { Storage } from "../engine/storage";
import type { Content } from "../sim/content";
import type { Archetype } from "../sim/slots";
import type { GameState } from "../sim/state";

/**
 * Reactive bridge between the pure Game controller and Svelte. The UI reads
 * `store.view` (a $state snapshot) and calls `store.choose`; the store keeps the
 * snapshot in sync and autosaves after every choice. UI never touches the sim
 * directly — this is the documented bridge.
 */
export class GameStore {
  private game: Game;
  private readonly storage: Storage;
  view = $state<GameView>(null as unknown as GameView);
  busy = $state(false);

  constructor(
    content: Content,
    seed: string,
    storage: Storage,
    restore?: GameState,
    archetype?: Archetype,
  ) {
    this.storage = storage;
    this.game = new Game(content, seed, restore, archetype);
    this.game.subscribe((v) => {
      this.view = v;
    });
  }

  async choose(choiceId: string): Promise<void> {
    if (this.busy || this.game.finished) return;
    this.busy = true;
    try {
      this.game.choose(choiceId);
      // Autosave is best-effort: a storage failure must not roll back the choice
      // (the run is reconstructable from seed+history on the next successful save).
      try {
        await saveGame(this.storage, this.view.state);
      } catch {
        // swallow — state already advanced; next choice will retry the save.
      }
    } finally {
      this.busy = false;
    }
  }

  /** Pick a weave beat on the current novel scene (saga play). Best-effort autosave. */
  async pickBeat(beatIndex: number): Promise<void> {
    if (this.busy || this.game.finished) return;
    this.busy = true;
    try {
      this.game.pickBeat(beatIndex);
      try {
        await saveGame(this.storage, this.view.state);
      } catch {
        // swallow — the walk advanced; next pick retries the save.
      }
    } finally {
      this.busy = false;
    }
  }

  /** Pick the current scene's terminal decision option (saga play). Best-effort autosave. */
  async pickDecision(optionIndex: number): Promise<void> {
    if (this.busy || this.game.finished) return;
    this.busy = true;
    try {
      this.game.pickDecision(optionIndex);
      try {
        await saveGame(this.storage, this.view.state);
      } catch {
        // swallow — the walk advanced; next pick retries the save.
      }
    } finally {
      this.busy = false;
    }
  }

  /** RIVAL-CROSSING-EXPLOIT: press a faltering rival (deepen its stumble for a heat cost). Best-effort autosave. */
  async pressRival(rivalId: string): Promise<void> {
    if (this.busy || this.game.finished) return;
    this.busy = true;
    try {
      this.game.pressRival(rivalId);
      try {
        await saveGame(this.storage, this.view.state);
      } catch {
        // swallow — the press applied; next action retries the save.
      }
    } finally {
      this.busy = false;
    }
  }

  /** RECOVERY-CHOICE: invest a meter (money/heat) to boost the next rebound. Best-effort autosave. */
  async investRecovery(meter: "money" | "heat"): Promise<void> {
    if (this.busy || this.game.finished) return;
    this.busy = true;
    try {
      this.game.investRecovery(meter);
      try {
        await saveGame(this.storage, this.view.state);
      } catch {
        // swallow — the invest applied; next action retries the save.
      }
    } finally {
      this.busy = false;
    }
  }

  get finished(): boolean {
    return this.game.finished;
  }

  // ---- DEV HARNESS OVERLAY (CP-R7) — gated to dev builds by the caller ----

  /**
   * Fast-forward: auto-resolve up to `n` steps, picking the first eligible choice each step. Stops at
   * the run's end. Dev-only — lets a reviewer skip generations to inspect the late-game timeline quickly.
   * Saga-aware: a FOUNDED line plays SAGA scenes (currentEvent is usually null), so resolve the current
   * scene (its terminal decision, else its first weave beat); fall back to the event path otherwise.
   */
  async devFastForward(n: number): Promise<void> {
    for (let i = 0; i < n && !this.game.finished; i++) {
      const scene = this.view.saga.scene;
      if (scene) {
        if (scene.decision) {
          // Prefer a SUCCESSION-bearing option (take partner / beget) so the line advances to the next
          // generation — otherwise a non-succession close stalls the spine at the current gen.
          const opts = scene.decision.options;
          const succIdx = opts.findIndex(
            (o) => o.succession && (o.succession.takesPartner || (o.succession.begets ?? 0) > 0),
          );
          // eslint-disable-next-line no-await-in-loop -- sequential by design
          await this.pickDecision(succIdx >= 0 ? succIdx : 0);
        } else {
          // eslint-disable-next-line no-await-in-loop -- sequential by design
          await this.pickBeat(0);
        }
        continue;
      }
      const choice = this.view.currentEvent?.choices[0];
      if (!choice) break;
      // eslint-disable-next-line no-await-in-loop -- sequential by design
      await this.choose(choice.id);
    }
  }

  /**
   * Dump the run's bespoke timeline (seed + history + the rendered beats so far) as
   * a JSON string a reviewer can save. Pure read of the current state.
   */
  devDumpTimeline(): string {
    const s = this.view.state;
    return JSON.stringify(
      {
        seed: s.seed,
        archetype: s.archetype,
        founding: s.founding,
        year: s.year,
        age: s.age,
        flags: [...s.flags].sort(),
        meters: s.meters,
        history: s.history,
        end: s.end,
      },
      null,
      2,
    );
  }
}
