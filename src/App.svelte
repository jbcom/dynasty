<script lang="ts">
import { loadContent } from "./data/loadContent";
import { capacitorStorage, type Storage } from "./engine/storage";
import { clearSave, hasSave, loadGame } from "./engine/save";
import type { Content } from "./sim/content";
import type { DynastyKey } from "./sim/slots";
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

async function newGame(seed: string, dynasty: DynastyKey = "trump"): Promise<void> {
  if (!storage) return;
  // Await the clear so a fast first choice can't race the old save's deletion.
  await clearSave(storage);
  store = new GameStore(content, seed, storage, undefined, dynasty);
  screen = "play";
}

async function continueGame(): Promise<void> {
  if (!storage) return;
  const restored: GameState | null = await loadGame(storage, content);
  if (!restored) return;
  // Pass restored.dynasty so GameStore/Game hold the right dynasty context even
  // though the restore path skips initState (the saved state already contains it).
  // Prevents a future "restart era" path from silently defaulting back to "trump".
  store = new GameStore(content, restored.seed, storage, restored, restored.dynasty);
  screen = "play";
}

function restart(): void {
  store = undefined;
  if (storage) hasSave(storage).then((h) => (saveExists = h));
  screen = "title";
}
</script>

{#if screen === "title" || !store}
  <TitleScreen hasSave={saveExists} onNewGame={newGame} onContinue={continueGame} />
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
