<script lang="ts">
import type { SagaView } from "../../sim/readModel";
import RungStars from "./RungStars.svelte";
import SceneStage from "../../render/SceneStage.svelte";
import { composeScene } from "../../render/composeScene";

/**
 * SAGA PANEL (Convergence Saga, SS-14) — renders the SS-13 read-model as the novel's running
 * frame: the macro-act + year, the line's dominant character + class rung, the 8 motivators as a
 * compact lean strip, and glimpses of the other lines (opposing/contributing/neutral). Pure
 * presentation over the SagaView — no sim access. Mobile-first; luxury Dynasty tokens.
 */

interface Props {
  view: SagaView;
}
const { view }: Props = $props();

const relationIcon: Record<string, string> = {
  opposing: "⚔",
  contributing: "🤝",
  neutral: "•",
};
</script>

<section class="saga" data-macro-act={view.macroAct}>
  <header class="frame">
    <span class="act">{view.macroActTitle}</span>
    <span class="year">{view.year}</span>
  </header>

  <p class="character">
    A <strong>{view.dominant.pole}</strong> line{#if view.rung}, {view.rung} station{/if}.
  </p>

  <div class="motivators" data-testid="motivators">
    {#each view.motivators as m (m.axis)}
      <div class="axis" class:active={Math.abs(m.value) >= 45}>
        <span class="axis-name">{m.axis}</span>
        <span class="axis-label">{m.label}</span>
      </div>
    {/each}
  </div>

  {#if view.glimpses.length}
    <div class="glimpses" data-testid="glimpses">
      <span class="glimpses-title">Other lines</span>
      {#each view.glimpses as g (g.rivalId)}
        <span class="glimpse" data-relation={g.relation}>
          <!-- RB-8: a small archetype SILHOUETTE vignette so the other line reads as a person, not a row. -->
          <span class="glimpse-vignette" aria-hidden="true">
            <SceneStage frame={composeScene({ variant: "rival", archetype: g.archetype, cls: "poor", eraId: view.macroActTitle })} />
          </span>
          <span class="rel-icon" aria-hidden="true">{relationIcon[g.relation] ?? "•"}</span>
          {g.label} — {g.note}
          <!-- The rival's rung: your crossings move it (opposing suppresses, contributing lifts) — RB-4. -->
          <RungStars rung={g.rung} reachLabel="their reach" title="their reach (your crossings move it)" extraClass="glimpse-rung" />
        </span>
      {/each}
    </div>
  {/if}
</section>

<style>
  .saga {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
    padding: var(--mmm-pad);
    border-radius: var(--mmm-radius-lg);
    background: color-mix(in srgb, var(--mmm-surface) 50%, transparent);
    border: 1px solid color-mix(in srgb, var(--mmm-gold-deep) 45%, transparent);
  }
  .frame {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  .act {
    font-family: var(--mmm-font-display);
    font-weight: 800;
    letter-spacing: 0.04em;
    color: var(--mmm-gold);
  }
  .year {
    font-family: var(--mmm-font-body);
    color: var(--mmm-text-dim);
  }
  .character {
    margin: 0;
    font-family: var(--mmm-font-body);
    font-style: italic;
    color: var(--mmm-text);
  }
  .character strong {
    color: var(--mmm-gold-bright);
    font-style: normal;
  }
  .motivators {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.3rem 0.8rem;
  }
  .axis {
    display: flex;
    justify-content: space-between;
    font-size: 0.82rem;
    color: var(--mmm-text-dim);
    border-bottom: 1px solid color-mix(in srgb, var(--mmm-gold-deep) 20%, transparent);
    padding-bottom: 0.15rem;
  }
  .axis.active .axis-label {
    color: var(--mmm-gold);
    font-weight: 700;
  }
  .axis-name {
    text-transform: capitalize;
  }
  .glimpses {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-top: 0.2rem;
  }
  .glimpses-title {
    font-family: var(--mmm-font-display);
    font-size: 0.78rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--mmm-gold-deep);
  }
  .glimpse {
    font-size: 0.85rem;
    color: var(--mmm-text);
  }
  /* RB-8: a small inline vignette box that contains the rival's absolutely-positioned silhouette. */
  .glimpse-vignette {
    position: relative;
    display: inline-block;
    width: 1.6rem;
    height: 1.6rem;
    vertical-align: middle;
    margin-right: 0.35rem;
    border-radius: 50%;
    overflow: hidden;
    opacity: 0.7;
  }
  .glimpse[data-relation="opposing"] .rel-icon {
    color: #c0504d;
  }
  .glimpse[data-relation="contributing"] .rel-icon {
    color: #4d8c57;
  }
</style>
