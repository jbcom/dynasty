<script lang="ts">
import type { Content } from "../../sim/content";
import type { GameView } from "../../engine/loop";
import ButterflyLog from "../ButterflyLog.svelte";
import Dossier from "../Dossier.svelte";
import EventCard from "../EventCard.svelte";
import LineageView from "../LineageView.svelte";
import MarketsView from "../MarketsView.svelte";
import MeterHud from "../MeterHud.svelte";
import NewsTicker from "../NewsTicker.svelte";
import PersonalityDial from "../PersonalityDial.svelte";
import StatsView from "../StatsView.svelte";
import TimelineView from "../TimelineView.svelte";
import { tyrannyUtopiaAxis } from "../../sim/personality";
import { branchOf } from "../../sim/branch";
import { moralPoleOf, moralPoleLabel } from "../../sim/moralAxis";
import { applyTerms, runTerms } from "../../sim/terms";
import { projectSaga } from "../../sim/readModel";
import ShaderBackdrop from "../saga/ShaderBackdrop.svelte";
import RivalField from "../saga/RivalField.svelte";
import SagaPanel from "../saga/SagaPanel.svelte";
import SceneReader from "../saga/SceneReader.svelte";
import SceneStage from "../../render/SceneStage.svelte";
import { composeScene, type RenderClass } from "../../render/composeScene";
import type { Archetype } from "../../sim/slots";
import SlideOutMenu from "../saga/SlideOutMenu.svelte";
import CodexView from "../saga/CodexView.svelte";
import { loadCodex } from "../../data/loadSaga";
import { setMusicEra } from "../sound";

interface Props {
  content: Content;
  view: GameView;
  busy: boolean;
  onchoose: (choiceId: string) => void;
  /** Pick a weave beat on the current novel scene (saga play). */
  onpickbeat?: (beatIndex: number) => void;
  /** Pick the current scene's terminal decision option (saga play). */
  onpickdecision?: (optionIndex: number) => void;
  /** Medium-native layout: phones get a compact tab stack; wide tablets/foldables
      get the event + an info panel side-by-side. */
  wide?: boolean;
}

const { content, view, busy, onchoose, onpickbeat, onpickdecision, wide = false }: Props = $props();

// Diegetic ambient drift: the play area tints toward cyan (utopia) or red
// (tyranny) as the personality vector shifts, so the slide is felt, not just read.
const axis = $derived(tyrannyUtopiaAxis(view.state.personality));
const drift = $derived(axis < -25 ? "utopia" : axis > 25 ? "tyranny" : "neutral");

// Branch-aware term interpolation: the same authored {head_of_state} resolves
// to "President" or "Reichskommissar" etc. by the run's alternate-history branch.
const branch = $derived(branchOf(view.state));

// Moral-pole HUD (DE-2b): branch-relative resolved pole + label for the PersonalityDial.
// moralPoleOf resolves from pole-flags first (branch's own value system), then personality fallback.
// moralPoleLabel gives the branch-specific name (e.g. theocracy "utopian" = "the Covenant Commonwealth").
const pole = $derived(moralPoleOf(view.state));
const poleLabel = $derived(moralPoleLabel(view.state));
// Identity tokens (given_name/surname/full_name/family_name) resolve from the
// run's founded line; institutional tokens from the branch (CP-R1).
const resolvedTerms = $derived(runTerms(content.terms, branch, view.state));
const term = $derived((text: string) => applyTerms(text, resolvedTerms));

// SS-13/SS-14: the saga read-model view (macro-act, motivators, rung, glimpses) drives the
// novel-frame SagaPanel + the shader backdrop's per-macro-act register. Rung/glimpses are wired
// by the SS-15 cut-over; the projection renders what's available now (macro-act + motivators).
const sagaView = $derived(
  projectSaga({
    year: view.state.year,
    motivators: view.state.personality,
    rung: view.rung,
    glimpses: view.glimpses,
  }),
);

// Optional lore briefs (waves + macro-acts), shown in the slide-out menu's Codex. Static content.
const codex = loadCodex();

// PF-17: keep the ambient music bed on the run's current era (the AudioEngine starts on the first
// reader tap; setMusicEra remembers the era until then, then crossfades on each era change).
const currentEraId = $derived(content.eras[view.state.eraIndex]?.id ?? "");
$effect(() => {
  if (currentEraId) setMusicEra(currentEraId);
});

// RB-8: the visual backdrop for the current novel scene — the caricature portrait + procedural era
// wash. Composed from the act cell (archetype × class), the SAME era id the audio uses (so the wash
// and chord stay in lockstep — RB-10 unifies the two era tables), the scene's sense, and the line's
// dominant motivator pole. Null when there's no active scene (the stage isn't mounted then).
const sceneFrame = $derived.by(() => {
  const cell = view.saga.cell;
  const scene = view.saga.scene;
  if (!cell || !scene) return null;
  return composeScene({
    variant: "scene",
    archetype: cell.archetype as Archetype,
    cls: (cell.cls === "middle" ? "middle" : "poor") as RenderClass,
    eraId: currentEraId || sagaView.macroActTitle,
    sense: scene.sense,
    pole: sagaView.dominant.pole,
  });
});

type Tab =
  | "event"
  | "news"
  | "markets"
  | "lineage"
  | "timeline"
  | "stats"
  | "butterfly"
  | "dossier";
const hasNews = $derived(content.worldTimelines.length > 0);
const hasMarkets = $derived(content.markets.length > 0 || content.ranks.length > 0);
// The lineage tab appears only for a founded line (it has a live family tree).
const hasLineage = $derived(view.state.family !== undefined);
// In wide mode the "event" tab is shown directly in event-col, so the side nav
// starts on the first info tab (timeline is always present; news/markets optional).
const defaultTab = $derived<Tab>(wide ? (hasNews ? "news" : hasMarkets ? "markets" : "timeline") : "event");
let tab = $state<Tab>("event");
$effect(() => { if (tab === "event" && wide) tab = defaultTab; });

// Each tab carries a real 2D line-icon asset (public/assets/icons/ui/<icon>.svg).
const tabs = $derived<Array<{ id: Tab; label: string; icon: string }>>([
  { id: "event", label: "Now", icon: "now" },
  ...(hasNews ? [{ id: "news" as Tab, label: "News", icon: "news" }] : []),
  ...(hasMarkets ? [{ id: "markets" as Tab, label: "Markets", icon: "markets" }] : []),
  ...(hasLineage ? [{ id: "lineage" as Tab, label: "Lineage", icon: "dossier" }] : []),
  { id: "timeline", label: "Timeline", icon: "timeline" },
  { id: "stats", label: "Stats", icon: "stats" },
  { id: "butterfly", label: "Choices", icon: "butterfly" },
  { id: "dossier", label: "Dossier", icon: "dossier" },
]);
</script>

{#snippet tabButton(t: { id: Tab; label: string; icon: string })}
  <button type="button" class:active={tab === t.id} onclick={() => (tab = t.id)}>
    <img class="tab-icon" src={`/assets/icons/ui/${t.icon}.svg`} alt="" aria-hidden="true" />
    {t.label}
  </button>
{/snippet}

{#snippet eventPane()}
  {#if view.saga.scene}
    <!-- The NOVEL: the line's act reads as paged scenes that frame the choice. The act-chapter title
         lives in the slim always-visible header (saga-head), not repeated here. -->
    <div class="event-pane saga-pane">
      <!-- RB-8: the caricature portrait + procedural era wash, mounted BEHIND the prose. -->
      {#if sceneFrame}
        <SceneStage frame={sceneFrame} />
      {/if}
      <SceneReader
        scene={view.saga.scene}
        {term}
        onbeat={(i) => onpickbeat?.(i)}
        ondecision={(i) => onpickdecision?.(i)}
      />
      {#each view.saga.threads as braid (braid.wave)}
        <!-- A cross-family INTERSECTION: the specific moment another wave's line crosses yours, with a
             glimpse of that line braided beneath. -->
        <aside class="thread" data-testid="thread">
          <span class="thread-label">Where paths cross</span>
          <p class="thread-crossing">{term(braid.crossing)}</p>
          {#each braid.scene.prose as para, i (i)}
            <p class="thread-para">{term(para)}</p>
          {/each}
        </aside>
      {/each}
    </div>
  {:else if view.currentEvent}
    <!-- No active novel scene (the act ended, or this cell has none) — the event flow carries the run. -->
    <div class="event-pane">
      <EventCard event={view.currentEvent} year={view.state.year} {busy} {onchoose} {term} />
    </div>
  {:else if view.saga.ended}
    <p class="interlude">The generation closes…</p>
  {:else}
    <p class="interlude">The era turns…</p>
  {/if}
{/snippet}

{#snippet infoTab()}
  {#if tab === "news"}
    <NewsTicker {content} gameState={view.state} {term} />
  {:else if tab === "markets"}
    <MarketsView {content} gameState={view.state} />
  {:else if tab === "lineage"}
    <LineageView gameState={view.state} />
  {:else if tab === "timeline"}
    <TimelineView {content} gameState={view.state} />
  {:else if tab === "stats"}
    <StatsView {content} gameState={view.state} />
  {:else if tab === "butterfly"}
    <ButterflyLog ledger={view.state.ledger} />
  {:else if tab === "dossier"}
    <Dossier defs={content.meters} gameState={view.state} />
  {/if}
{/snippet}

<ShaderBackdrop macroAct={sagaView.macroAct} />

<div class="play" data-drift={drift} class:wide>
  <!-- Slim always-visible header: the ACT CHAPTER (meso) headline + year, with the macro span as
       quiet context. Everything else (meters, motivators, axis, settings) lives in the slide-out menu. -->
  <header class="saga-head" data-testid="saga-head">
    <div class="head-titles">
      {#if view.saga.actTitle}
        <span class="act-chapter">{view.saga.actTitle}</span>
      {/if}
      <span class="span-context">{sagaView.macroActTitle} · {view.state.year}</span>
    </div>
  </header>

  <SlideOutMenu label="Line & settings">
    <SagaPanel view={sagaView} />
    <RivalField standings={view.rivalStandings} playerRung={view.rung} />
    <MeterHud defs={content.meters} meters={view.state.meters} />
    <PersonalityDial personality={view.state.personality} {pole} {poleLabel} />
    <CodexView entries={codex} {term} />
  </SlideOutMenu>

  {#if wide}
    <!-- Tablet / foldable: the event and an info panel sit side-by-side, a richer
         surface than the phone's single-column tab stack. -->
    <div class="split">
      <div class="event-col">{@render eventPane()}</div>
      <aside class="info-col">
        <nav class="tabs side">
          {#each tabs.filter((t) => t.id !== "event") as t (t.id)}
            {@render tabButton(t)}
          {/each}
        </nav>
        <div class="content">{@render infoTab()}</div>
      </aside>
    </div>
  {:else}
    <nav class="tabs">
      {#each tabs as t (t.id)}
        {@render tabButton(t)}
      {/each}
    </nav>
    <div class="content">
      {#if tab === "event"}{@render eventPane()}{:else}{@render infoTab()}{/if}
    </div>
  {/if}
</div>

<style>
  .play {
    display: flex;
    flex-direction: column;
    /* height (not min-height): locks the container to exactly one screen so
       .content { flex: 1; overflow-y: auto } actually scrolls on Pixel-5a.
       overflow: hidden clips any stray paint below the fold. */
    height: 100dvh;
    overflow: hidden;
    transition: background var(--mmm-dur-slow) var(--mmm-ease);
  }
  /* Wide (tablet/foldable): event + info side-by-side. */
  .split {
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    gap: var(--mmm-gap);
    flex: 1;
    min-height: 0;
  }
  .event-col {
    overflow-y: auto;
    padding-top: var(--mmm-pad);
  }
  .info-col {
    display: flex;
    flex-direction: column;
    border-left: 1px solid var(--mmm-gold-deep);
    min-height: 0;
  }
  .tabs.side {
    flex-wrap: wrap;
  }
  /* Diegetic drift — the chrome itself leans toward utopia (cyan) or tyranny (red). */
  .play[data-drift="utopia"] {
    background: linear-gradient(180deg, color-mix(in srgb, var(--mmm-startrek) 12%, transparent), transparent 40%);
  }
  .play[data-drift="tyranny"] {
    background: linear-gradient(180deg, color-mix(in srgb, var(--mmm-red) 14%, transparent), transparent 40%);
  }
  .tabs {
    display: flex;
    gap: 0.2rem;
    padding: 0.35rem 0.5rem;
    overflow-x: auto;
    background: var(--mmm-navy-deep);
    border-bottom: 1px solid color-mix(in srgb, var(--mmm-gold-deep) 40%, transparent);
  }
  .tabs button {
    flex: 1 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
    padding: 0.4rem 0.5rem;
    border: none;
    border-radius: var(--mmm-radius);
    background: transparent;
    color: var(--mmm-text-dim);
    font-family: var(--mmm-font-body);
    font-size: 0.72rem;
    letter-spacing: 0.04em;
    font-weight: 600;
    cursor: pointer;
    transition:
      color var(--mmm-dur-fast) var(--mmm-ease),
      background var(--mmm-dur-fast) var(--mmm-ease),
      box-shadow var(--mmm-dur-fast) var(--mmm-ease);
  }
  .tab-icon {
    width: 20px;
    height: 20px;
    /* Line-art SVGs ship black; filter to the dim text color. */
    opacity: 0.7;
    filter: invert(78%) sepia(12%) saturate(420%) hue-rotate(187deg) brightness(92%);
    transition: opacity var(--mmm-dur-fast) var(--mmm-ease),
      filter var(--mmm-dur-fast) var(--mmm-ease);
  }
  .tabs button.active {
    background: color-mix(in srgb, var(--mmm-surface) 80%, transparent);
    color: var(--mmm-gold);
    box-shadow: inset 0 -2px 0 var(--mmm-gold);
  }
  .tabs button.active .tab-icon {
    opacity: 1;
    /* gold #d4af37 */
    filter: invert(72%) sepia(38%) saturate(680%) hue-rotate(2deg) brightness(92%);
  }
  .tabs button:hover:not(.active) {
    color: var(--mmm-text);
  }
  .tabs button:hover:not(.active) .tab-icon {
    opacity: 1;
  }
  .content {
    flex: 1;
    overflow-y: auto;
  }
  .event-pane {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding-top: var(--mmm-pad);
  }
  /* RB-8: contain the absolutely-positioned SceneStage behind the prose; SceneReader's own content
     carries its z-index above the stage's pointer-events:none backdrop. */
  .saga-pane {
    position: relative;
  }
  .saga-pane :global(.scene) {
    position: relative;
    z-index: 1;
  }
  .interlude {
    text-align: center;
    color: var(--mmm-text-dim);
    font-style: italic;
    padding: 2rem;
  }
  /* Slim always-visible header: the act-chapter (meso) headline + the macro span as quiet context.
     Leaves the hamburger room on the right; the rest of the HUD lives in the slide-out menu. */
  .saga-head {
    display: flex;
    align-items: baseline;
    padding: max(0.6rem, env(safe-area-inset-top)) 3.4rem 0.4rem var(--mmm-pad);
  }
  .head-titles {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    min-width: 0;
  }
  .act-chapter {
    font-family: var(--mmm-font-display);
    font-size: 1.18rem;
    font-weight: 800;
    letter-spacing: 0.02em;
    color: var(--mmm-gold);
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .span-context {
    font-family: var(--mmm-font-body);
    font-size: 0.78rem;
    letter-spacing: 0.06em;
    color: var(--mmm-text-dim);
  }
  .thread {
    max-width: 42rem;
    margin: 0.4rem auto 0;
    padding: 0.9rem 1.1rem;
    border-left: 3px solid color-mix(in srgb, var(--mmm-gold-deep) 60%, transparent);
    background: color-mix(in srgb, var(--mmm-surface) 35%, transparent);
    border-radius: var(--mmm-radius);
  }
  .thread-label {
    display: block;
    font-family: var(--mmm-font-display);
    font-size: 0.72rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--mmm-gold-deep);
    margin-bottom: 0.35rem;
  }
  .thread-crossing {
    margin: 0 0 0.6rem;
    font-family: var(--mmm-font-body);
    font-size: 1rem;
    line-height: 1.65;
    color: var(--mmm-text);
  }
  .thread-para {
    margin: 0 0 0.5rem;
    font-family: var(--mmm-font-body);
    font-style: italic;
    font-size: 0.96rem;
    line-height: 1.6;
    color: var(--mmm-text-dim);
  }
</style>
