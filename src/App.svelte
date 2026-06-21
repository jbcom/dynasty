<script lang="ts">
import { loadContent } from "./data/loadContent";
import { capacitorStorage, type Storage } from "./engine/storage";
import { clearSave, hasSave, loadGame } from "./engine/save";
import type { Content } from "./sim/content";
import { foundDynasty } from "./sim/founding";
import type { GameState } from "./sim/state";
import { GameStore } from "./ui/gameStore.svelte";
import { FormFactorStore } from "./ui/formFactor.svelte";
import PlayScreen from "./ui/screens/PlayScreen.svelte";
import LegacyReport from "./ui/screens/LegacyReport.svelte";
import TitleScreen from "./ui/screens/TitleScreen.svelte";

type Screen = "title" | "play";

const content: Content = loadContent();
const formFactor = new FormFactorStore();
$effect(() => formFactor.start());

let storage = $state<Storage | undefined>();
let saveExists = $state(false);
let screen = $state<Screen>("title");
let store = $state<GameStore | undefined>();

// Resolve persistent storage and check for an existing save on mount.
$effect(() => {
  let alive = true;
  capacitorStorage().then(async (s) => {
    if (!alive) return;
    storage = s;
    saveExists = await hasSave(s);
  });
  return () => {
    alive = false;
  };
});

// FOUND a dynasty at a start-moment (FD-6): build the founded initial state via the
// pure founding flow and hand it to the store as the run's base.
async function foundGame(momentId: string, surname: string, seed: string): Promise<void> {
  if (!storage) return;
  // Await the clear so a fast first choice can't race the old save's deletion.
  await clearSave(storage);
  const founded = foundDynasty(content, { momentId, surname, seed }).state;
  store = new GameStore(content, seed, storage, founded, founded.archetype);
  screen = "play";
}

async function continueGame(): Promise<void> {
  if (!storage) return;
  const restored: GameState | null = await loadGame(storage, content);
  if (!restored) return;
  // Pass restored.archetype so GameStore/Game hold the right identity context even
  // though the restore path skips initState (the saved state already contains it).
  store = new GameStore(content, restored.seed, storage, restored, restored.archetype);
  screen = "play";
}

function restart(): void {
  store = undefined;
  if (storage) hasSave(storage).then((h) => (saveExists = h));
  screen = "title";
}
</script>

{#if screen === "title" || !store}
  <TitleScreen
    moments={content.startMoments}
    hasSave={saveExists}
    onFound={foundGame}
    onContinue={continueGame}
  />
{:else if store.view?.state.end}
  <LegacyReport {content} state={store.view.state} end={store.view.state.end} onRestart={restart} />
{:else}
  <PlayScreen
    {content}
    view={store.view}
    busy={store.busy}
    wide={formFactor.info?.wide}
    onchoose={(id) => store?.choose(id)}
  />
{/if}
