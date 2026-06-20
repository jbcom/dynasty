<script lang="ts">
import type { Content } from "../../sim/content";
import type { GameView } from "../../engine/loop";
import Portrait from "../../render/Portrait.svelte";
import ButterflyLog from "../ButterflyLog.svelte";
import Dossier from "../Dossier.svelte";
import EventCard from "../EventCard.svelte";
import MarketsView from "../MarketsView.svelte";
import MeterHud from "../MeterHud.svelte";
import NewsTicker from "../NewsTicker.svelte";
import PersonalityDial from "../PersonalityDial.svelte";
import StatsView from "../StatsView.svelte";
import TimelineView from "../TimelineView.svelte";
import { tyrannyUtopiaAxis } from "../../sim/personality";
import { branchOf } from "../../sim/branch";
import { moralPoleOf, moralPoleLabel } from "../../sim/moralAxis";
import { applyTerms } from "../../sim/terms";

interface Props {
  content: Content;
  view: GameView;
  busy: boolean;
  onchoose: (choiceId: string) => void;
  /** Medium-native layout: phones get a compact tab stack; wide tablets/foldables
      get the event + an info panel side-by-side. */
  wide?: boolean;
}

const { content, view, busy, onchoose, wide = false }: Props = $props();

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
const term = $derived((text: string) => applyTerms(text, content.terms, branch));

type Tab = "event" | "news" | "markets" | "timeline" | "stats" | "butterfly" | "dossier";
let tab = $state<Tab>("event");
const hasNews = $derived(content.worldTimelines.length > 0);
const hasMarkets = $derived(content.markets.length > 0 || content.ranks.length > 0);

// Each tab carries a real 2D line-icon asset (public/assets/icons/ui/<icon>.svg).
const tabs = $derived<Array<{ id: Tab; label: string; icon: string }>>([
  { id: "event", label: "Now", icon: "now" },
  ...(hasNews ? [{ id: "news" as Tab, label: "News", icon: "news" }] : []),
  ...(hasMarkets ? [{ id: "markets" as Tab, label: "Markets", icon: "markets" }] : []),
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
  {#if view.currentEvent}
    <div class="event-pane">
      <div class="portrait-wrap">
        <Portrait portraitId={view.currentEvent.portrait} size={wide ? 140 : 96} />
      </div>
      <EventCard event={view.currentEvent} {busy} {onchoose} {term} />
    </div>
  {:else}
    <p class="interlude">The era turns…</p>
  {/if}
{/snippet}

{#snippet infoTab()}
  {#if tab === "news"}
    <NewsTicker {content} gameState={view.state} {term} />
  {:else if tab === "markets"}
    <MarketsView {content} gameState={view.state} />
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

<div class="play" data-drift={drift} class:wide>
  <MeterHud defs={content.meters} meters={view.state.meters} />
  <PersonalityDial personality={view.state.personality} {pole} {poleLabel} />

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
    min-height: 100dvh;
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
  .interlude {
    text-align: center;
    color: var(--mmm-text-dim);
    font-style: italic;
    padding: 2rem;
  }
</style>
