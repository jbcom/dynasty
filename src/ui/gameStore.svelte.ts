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

  get finished(): boolean {
    return this.game.finished;
  }

  // ---- DEV HARNESS OVERLAY (CP-R7) — gated to dev builds by the caller ----

  /**
   * Fast-forward: auto-resolve up to `n` beats by picking the first eligible choice
   * of the current event each step. Stops at the run's end. Dev-only — lets a
   * reviewer skip generations to inspect the late-game timeline quickly.
   */
  async devFastForward(n: number): Promise<void> {
    for (let i = 0; i < n && !this.game.finished; i++) {
      const ev = this.view.currentEvent;
      const choice = ev?.choices[0];
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
