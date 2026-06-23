<script lang="ts">
import { loadContent } from "./data/loadContent";
import { capacitorStorage, type Storage } from "./engine/storage";
import { clearSave, hasSave, loadGame } from "./engine/save";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  setGeminiKey,
  setLiveExtrapolation,
  setSound,
  type Settings,
} from "./engine/settings";
import { setSoundEnabled } from "./ui/sound";
import type { Content } from "./sim/content";
import { foundByComposition } from "./sim/founding";
import { FOUNDING_YEAR } from "./sim/macroActs";
import { dealComposition, placeById } from "./sim/places";
import { regionPlaceId, resolveFoundingStart } from "./sim/foundingOrigin";
import { dealFoundingSurname } from "./sim/onomastics";
import { createRng } from "./sim/rng";
import type { GameState } from "./sim/state";
import { GameStore } from "./ui/gameStore.svelte";
import { FormFactorStore } from "./ui/formFactor.svelte";
import PlayScreen from "./ui/screens/PlayScreen.svelte";
import LegacyReport from "./ui/screens/LegacyReport.svelte";
import OpeningScreen from "./ui/screens/OpeningScreen.svelte";
import SettingsScreen from "./ui/screens/SettingsScreen.svelte";
import TitleScreen from "./ui/screens/TitleScreen.svelte";
import { resolveEmergentFounding } from "./sim/founding/resolveEmergentFounding";
import type { SenseCue } from "./sim/founding/senseEmergence";

type Screen = "title" | "opening" | "play" | "settings";

const content: Content = loadContent();
const formFactor = new FormFactorStore();
$effect(() => formFactor.start());

let storage = $state<Storage | undefined>();
let saveExists = $state(false);
let screen = $state<Screen>("title");
let store = $state<GameStore | undefined>();
// EI-6b-ui: the hidden seed for the in-progress emergence (drawn when New Game opens the OpeningScreen).
let pendingSeed = $state<string | undefined>();
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
async function toggleSound(on: boolean): Promise<void> {
  if (!storage) return;
  await setSound(storage, on);
  settings = await loadSettings(storage);
}

// Keep the sound-cue engine in sync with the setting (PF-15).
$effect(() => {
  setSoundEnabled(settings.sound);
});

// EI-6b-ui: NEW GAME opens the lived Epoch-0 EMERGENCE (no card funnel). A hidden seed is drawn; the
// OpeningScreen plays the emergence and, on completion, hands back the accumulated flags + dealt cues.
function startNewGame(): void {
  const words = crypto.getRandomValues(new Uint32Array(2));
  pendingSeed = `r${(words[0] ?? 0).toString(36)}${(words[1] ?? 0).toString(36)}`;
  screen = "opening";
}

// EI-6b-ui: found the run from the EMERGENCE's accumulated flags. The lived opening's senses → region, its
// power_lean beats → base, its childhood beat → standing (EI-6a resolveEmergentFounding); the name/gender are
// the SAME seed-deal the OpeningScreen showed (dealComposition is deterministic for the seed). Then
// resolveFoundingStart supplies motivators/archetype/class, exactly as the retired funnel did.
async function birthGameFromEmergence(
  flags: readonly string[],
  cues: readonly SenseCue[],
): Promise<void> {
  if (!storage || !pendingSeed) return;
  const seed = pendingSeed;
  const { region, base, standing } = resolveEmergentFounding(cues, flags);
  const placeDef = placeById(content.places, regionPlaceId(region));
  if (!placeDef) {
    console.error(`birthGameFromEmergence: unknown founding region place "${regionPlaceId(region)}"`);
    return;
  }
  await clearSave(storage);
  // Same seed → the same dealt family name/gender/given the OpeningScreen's provisional found showed. The
  // surname is dealt region-independently from the identical seed label so the founded line carries the
  // exact name the naming beat spoke (EI-6b).
  const surname = dealFoundingSurname(createRng(`${seed}::founding:surname`));
  const composition = dealComposition(content.places, content.eras, seed, surname, placeDef);
  const { motivators, archetype, flags: originFlags } = resolveFoundingStart({ region, base, standing });
  const founded = foundByComposition(content, {
    ...composition,
    year: FOUNDING_YEAR,
    archetype,
    seedMotivators: motivators,
    // Carry the emergence's own flags forward too (the life-seeds/dispositions it stamped) alongside the
    // origin flags, so the lived opening's choices persist into the run.
    seedFlags: [...originFlags, ...flags],
  }).state;
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
    sound={settings.sound}
    onSaveKey={saveKey}
    onToggleLive={toggleLive}
    onToggleSound={toggleSound}
    onBack={() => (screen = "title")}
  />
{:else if screen === "opening" && pendingSeed}
  <!-- EI-6b-ui: the lived Epoch-0 emergence replaces the .card onboarding funnel. {#key} remounts it per run
       (a fresh seed → a fresh emergence + runner state). -->
  {#key pendingSeed}
    <OpeningScreen
      {content}
      seed={pendingSeed}
      onComplete={birthGameFromEmergence}
      onCancel={() => (screen = "title")}
    />
  {/key}
{:else if screen === "title" || !store}
  <TitleScreen
    hasSave={saveExists}
    onNewGame={startNewGame}
    onContinue={continueGame}
    onSettings={() => (screen = "settings")}
  />
{:else if store.view?.state.end}
  <LegacyReport
    {content}
    state={store.view.state}
    end={store.view.state.end}
    convergence={store.view.convergence}
    rivalStandings={store.view.rivalStandings}
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
    onpress={(id) => store?.pressRival(id)}
    oninvest={(m) => store?.investRecovery(m)}
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
