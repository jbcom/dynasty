import { Game, type GameView } from "../engine/loop";
import { saveGame } from "../engine/save";
import type { Storage } from "../engine/storage";
import type { Content } from "../sim/content";
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

  constructor(content: Content, seed: string, storage: Storage, restore?: GameState) {
    this.storage = storage;
    this.game = new Game(content, seed, restore);
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
}
