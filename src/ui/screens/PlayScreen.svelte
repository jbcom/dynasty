<script lang="ts">
import type { Content } from "../../sim/content";
import type { GameView } from "../../engine/loop";
import Portrait from "../../render/Portrait.svelte";
import ButterflyLog from "../ButterflyLog.svelte";
import Dossier from "../Dossier.svelte";
import EventCard from "../EventCard.svelte";
import MeterHud from "../MeterHud.svelte";
import NewsTicker from "../NewsTicker.svelte";
import PersonalityDial from "../PersonalityDial.svelte";
import StatsView from "../StatsView.svelte";
import TimelineView from "../TimelineView.svelte";
import { tyrannyUtopiaAxis } from "../../sim/personality";

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

type Tab = "event" | "news" | "timeline" | "stats" | "butterfly" | "dossier";
let tab = $state<Tab>("event");
const hasNews = $derived(content.worldTimelines.length > 0);

const tabs = $derived<Array<{ id: Tab; label: string }>>([
  { id: "event", label: "Now" },
  ...(hasNews ? [{ id: "news" as Tab, label: "📰" }] : []),
  { id: "timeline", label: "Timeline" },
  { id: "stats", label: "Stats" },
  { id: "butterfly", label: "🦋" },
  { id: "dossier", label: "Dossier" },
]);
</script>

{#snippet eventPane()}
  {#if view.currentEvent}
    <div class="event-pane">
      <div class="portrait-wrap">
        <Portrait portraitId={view.currentEvent.portrait} size={wide ? 140 : 96} />
      </div>
      <EventCard event={view.currentEvent} {busy} {onchoose} />
    </div>
  {:else}
    <p class="interlude">The era turns…</p>
  {/if}
{/snippet}

{#snippet infoTab()}
  {#if tab === "news"}
    <NewsTicker {content} gameState={view.state} />
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
  <PersonalityDial personality={view.state.personality} />

  {#if wide}
    <!-- Tablet / foldable: the event and an info panel sit side-by-side, a richer
         surface than the phone's single-column tab stack. -->
    <div class="split">
      <div class="event-col">{@render eventPane()}</div>
      <aside class="info-col">
        <nav class="tabs side">
          {#each tabs.filter((t) => t.id !== "event") as t (t.id)}
            <button type="button" class:active={tab === t.id} onclick={() => (tab = t.id)}>{t.label}</button>
          {/each}
        </nav>
        <div class="content">{@render infoTab()}</div>
      </aside>
    </div>
  {:else}
    <nav class="tabs">
      {#each tabs as t (t.id)}
        <button type="button" class:active={tab === t.id} onclick={() => (tab = t.id)}>{t.label}</button>
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
    gap: 0.25rem;
    padding: 0.4rem;
    overflow-x: auto;
    background: var(--mmm-navy-deep);
  }
  .tabs button {
    flex: 1 0 auto;
    padding: 0.4rem 0.7rem;
    border: none;
    border-radius: var(--mmm-radius);
    background: transparent;
    color: var(--mmm-text-dim);
    font-weight: 700;
    cursor: pointer;
  }
  .tabs button.active {
    background: var(--mmm-surface);
    color: var(--mmm-gold);
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
