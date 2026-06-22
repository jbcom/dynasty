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
import { foundByComposition } from "./sim/founding";
import { dealComposition, placeById } from "./sim/places";
import { type ArrivalClass, resolveWaveStart } from "./sim/waveSelect";
import type { GameState } from "./sim/state";
import { GameStore } from "./ui/gameStore.svelte";
import { FormFactorStore } from "./ui/formFactor.svelte";
import PlayScreen from "./ui/screens/PlayScreen.svelte";
import LegacyReport from "./ui/screens/LegacyReport.svelte";
import OnboardingScreen from "./ui/screens/OnboardingScreen.svelte";
import SettingsScreen from "./ui/screens/SettingsScreen.svelte";
import TitleScreen from "./ui/screens/TitleScreen.svelte";

type Screen = "title" | "onboarding" | "play" | "settings";

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

// FOUND THE RUN (OB-3): the onboarding chose the PLACE (geography) + bestowed the family
// name; the seed is a hidden random draw (world only). Found a composition for the chosen
// place (era/gender/archetype seed-dealt as starting defaults the authored Epoch-0 lets the
// player override in-game), then drop into the Epoch-0 story.
async function birthGame(
  seed: string,
  place: string,
  surname: string,
  cls: ArrivalClass,
): Promise<void> {
  if (!storage) return;
  const placeDef = placeById(content.places, place);
  // Guard: the place comes from the onboarding catalog, so this should never miss — but bail
  // rather than silently fall back to a random place if an invalid id ever reaches here.
  if (!placeDef) {
    console.error(`birthGame: unknown place "${place}"`);
    return;
  }
  // Await the clear so a fast first choice can't race the old save's deletion.
  await clearSave(storage);
  const composition = dealComposition(content.places, content.eras, seed, surname, placeDef);
  // SS-7 + PF-6: seed the line's starting motivators from the PLAYER'S chosen arrival class (poor/
  // middle), not the place's default — so the class choice actually grounds the run + saga track.
  const { motivators } = resolveWaveStart(placeDef, cls);
  const founded = foundByComposition(content, { ...composition, seedMotivators: motivators }).state;
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

// DEV harness: download the current run's bespoke timeline as JSON (CP-R7).
function dumpTimeline(): void {
  if (!store) return;
  const blob = new Blob([store.devDumpTimeline()], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dynasty-timeline-${store.view?.state.seed ?? "run"}.json`;
  a.click();
  URL.revokeObjectURL(url);
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
{:else if screen === "onboarding"}
  <OnboardingScreen {content} onComplete={birthGame} onCancel={() => (screen = "title")} />
{:else if screen === "title" || !store}
  <TitleScreen
    hasSave={saveExists}
    onNewGame={() => (screen = "onboarding")}
    onContinue={continueGame}
    onSettings={() => (screen = "settings")}
  />
{:else if store.view?.state.end}
  <LegacyReport
    {content}
    state={store.view.state}
    end={store.view.state.end}
    convergence={store.view.convergence}
    onRestart={restart}
  />
{:else}
  <PlayScreen
    {content}
    view={store.view}
    busy={store.busy}
    wide={formFactor.info?.wide}
    onchoose={(id) => store?.choose(id)}
    onpickbeat={(i) => store?.pickBeat(i)}
    onpickdecision={(i) => store?.pickDecision(i)}
  />
{/if}

<!-- DEV HARNESS OVERLAY (CP-R7): fast-forward + timeline dump, dev builds only. -->
{#if import.meta.env.DEV && store && !store.view?.state.end}
  <aside class="dev-overlay" aria-label="Dev harness">
    <span class="dev-tag">DEV · {store.view?.state.year}</span>
    <button type="button" onclick={() => store?.devFastForward(1)}>▶ +1</button>
    <button type="button" onclick={() => store?.devFastForward(10)}>⏩ +10</button>
    <button type="button" onclick={() => store?.devFastForward(100)}>⏭ +100</button>
    <button type="button" onclick={dumpTimeline}>⬇ dump</button>
  </aside>
{/if}

<style>
  .dev-overlay {
    position: fixed;
    bottom: env(safe-area-inset-bottom, 0);
    right: 0;
    display: flex;
    gap: 0.25rem;
    align-items: center;
    padding: 0.3rem 0.5rem;
    background: rgb(0 0 0 / 0.7);
    border-top-left-radius: 6px;
    font-family: monospace;
    font-size: 0.7rem;
    z-index: 9999;
  }
  .dev-overlay .dev-tag {
    color: #4fd1a5;
    letter-spacing: 0.08em;
  }
  .dev-overlay button {
    background: #1b2a4a;
    color: #d4af37;
    border: 1px solid #d4af3755;
    border-radius: 4px;
    padding: 0.2rem 0.4rem;
    cursor: pointer;
    font-family: monospace;
    font-size: 0.7rem;
  }
  .dev-overlay button:hover {
    background: #25406b;
  }
</style>
