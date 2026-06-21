<script lang="ts">
import { loadContent } from "./data/loadContent";
import { capacitorStorage, type Storage } from "./engine/storage";
import { clearSave, hasSave, loadGame } from "./engine/save";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  setGeminiKey,
  setLiveExtrapolation,
  type Settings,
} from "./engine/settings";
import type { Content } from "./sim/content";
import { type FoundingInput, foundDynasty } from "./sim/founding";
import type { GameState } from "./sim/state";
import { GameStore } from "./ui/gameStore.svelte";
import { FormFactorStore } from "./ui/formFactor.svelte";
import PlayScreen from "./ui/screens/PlayScreen.svelte";
import LegacyReport from "./ui/screens/LegacyReport.svelte";
import SettingsScreen from "./ui/screens/SettingsScreen.svelte";
import TitleScreen from "./ui/screens/TitleScreen.svelte";

type Screen = "title" | "play" | "settings";

const content: Content = loadContent();
const formFactor = new FormFactorStore();
$effect(() => formFactor.start());

let storage = $state<Storage | undefined>();
let saveExists = $state(false);
let screen = $state<Screen>("title");
let store = $state<GameStore | undefined>();
let settings = $state<Settings>(DEFAULT_SETTINGS);

// Resolve persistent storage, check for an existing save, and load settings on mount.
$effect(() => {
  let alive = true;
  capacitorStorage().then(async (s) => {
    if (!alive) return;
    storage = s;
    saveExists = await hasSave(s);
    settings = await loadSettings(s);
  });
  return () => {
    alive = false;
  };
});

async function saveKey(key: string): Promise<void> {
  if (!storage) return;
  await setGeminiKey(storage, key);
  settings = await loadSettings(storage);
}
async function toggleLive(on: boolean): Promise<void> {
  if (!storage) return;
  await setLiveExtrapolation(storage, on);
  settings = await loadSettings(storage);
}

// FOUND a dynasty (FD-6 / CP-7): the control panel gathers the full founding
// config (moment, surname, gender, calling, Epoch-0 axis stances) and hands it to
// the pure founding flow; the founded state becomes the run's base.
async function foundGame(input: FoundingInput): Promise<void> {
  if (!storage) return;
  // Await the clear so a fast first choice can't race the old save's deletion.
  await clearSave(storage);
  const founded = foundDynasty(content, input).state;
  store = new GameStore(content, input.seed, storage, founded, founded.archetype);
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

{#if screen === "settings"}
  <SettingsScreen
    geminiKey={settings.geminiKey}
    liveExtrapolation={settings.liveExtrapolation}
    onSaveKey={saveKey}
    onToggleLive={toggleLive}
    onBack={() => (screen = "title")}
  />
{:else if screen === "title" || !store}
  <TitleScreen
    moments={content.startMoments}
    callings={content.callings}
    axes={content.axes}
    worldStacks={content.worldStacks}
    onomastics={content.onomastics}
    hasSave={saveExists}
    onFound={foundGame}
    onContinue={continueGame}
    onSettings={() => (screen = "settings")}
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
