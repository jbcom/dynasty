<script lang="ts">
import type { Content } from "../../sim/content";
import type { GameView } from "../../engine/loop";
import Portrait from "../../render/Portrait.svelte";
import ButterflyLog from "../ButterflyLog.svelte";
import Dossier from "../Dossier.svelte";
import EventCard from "../EventCard.svelte";
import MeterHud from "../MeterHud.svelte";
import StatsView from "../StatsView.svelte";
import TimelineView from "../TimelineView.svelte";

interface Props {
  content: Content;
  view: GameView;
  busy: boolean;
  onchoose: (choiceId: string) => void;
}

const { content, view, busy, onchoose }: Props = $props();

type Tab = "event" | "timeline" | "stats" | "butterfly" | "dossier";
let tab = $state<Tab>("event");

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "event", label: "Now" },
  { id: "timeline", label: "Timeline" },
  { id: "stats", label: "Stats" },
  { id: "butterfly", label: "🦋" },
  { id: "dossier", label: "Dossier" },
];
</script>

<div class="play">
  <MeterHud defs={content.meters} meters={view.state.meters} />

  <nav class="tabs">
    {#each tabs as t (t.id)}
      <button type="button" class:active={tab === t.id} onclick={() => (tab = t.id)}>{t.label}</button>
    {/each}
  </nav>

  <div class="content">
    {#if tab === "event"}
      {#if view.currentEvent}
        <div class="event-pane">
          <div class="portrait-wrap">
            <Portrait portraitId={view.currentEvent.portrait} size={96} />
          </div>
          <EventCard event={view.currentEvent} {busy} {onchoose} />
        </div>
      {:else}
        <p class="interlude">The era turns…</p>
      {/if}
    {:else if tab === "timeline"}
      <TimelineView {content} gameState={view.state} />
    {:else if tab === "stats"}
      <StatsView {content} gameState={view.state} />
    {:else if tab === "butterfly"}
      <ButterflyLog ledger={view.state.ledger} />
    {:else if tab === "dossier"}
      <Dossier defs={content.meters} gameState={view.state} />
    {/if}
  </div>
</div>

<style>
  .play {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
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
