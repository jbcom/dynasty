<script lang="ts">
/**
 * VD-3 — DossierView: composes a Dossier's typed panels into a designed BRIEFING SPREAD (the SHOW-DON'T-TELL
 * set piece). A masthead (path + era) over a magazine layout — the atmospheric figure leads, the path-voice
 * brief reads beside it, and the real data-viz panels (chart / graph / map) anchor the assessment. Suzerain
 * scannability: measured columns, lifted set pieces, real anchors. Pure presentation over the pure Dossier.
 */
import type { DossierPanel } from "../../sim/dossier/dossier";
import type { Dossier } from "../../sim/dossier/dossier";
import type { EraBand } from "../../sim/genai/portrait";
import BriefPanel from "./BriefPanel.svelte";
import ChartPanel from "./ChartPanel.svelte";
import FigurePanel from "./FigurePanel.svelte";
import GraphPanel from "./GraphPanel.svelte";
import { loadDossierBrief } from "./loadDossierBrief";
import MapPanel from "./MapPanel.svelte";

interface Props {
  dossier: Dossier;
  /** An explicit brief override (tests/preview). When omitted, the brief loads from its panel key (VD-6). */
  brief?: string[];
}
const { dossier, brief }: Props = $props();

// VD-6: resolve the brief from the offline-generated map by the brief panel's key, unless an override is given.
// A typed predicate narrows the discriminated union (no unsafe cast — review).
const briefPanelKey = $derived(
  dossier.panels.find((p): p is Extract<DossierPanel, { type: "brief" }> => p.type === "brief")?.key,
);
const resolvedBrief = $derived(brief ?? (briefPanelKey ? loadDossierBrief(briefPanelKey) : undefined));

// A short era label for the masthead — total over EraBand (the type guarantees coverage, no fallback needed).
const ERA_LABEL: Record<EraBand, string> = {
  founding_1700s: "The Founding · 1770s",
  federal_1800s: "The Early Republic",
  industrial_late1800s: "The Gilded Age",
  early_1900s: "The Modern Century",
  midcentury: "Mid-Century",
  digital_modern: "The Digital Age",
  near_future: "The Near Future",
  stellar: "Among the Stars",
};
</script>

<section class="dossier-view" data-kind={dossier.kind} data-testid="dossier-view">
  <header class="masthead">
    <h2>{dossier.title}</h2>
    <p class="era">{ERA_LABEL[dossier.eraBand]}</p>
  </header>

  <div class="spread">
    {#each dossier.panels as panel, i (i)}
      {#if panel.type === "figure"}
        <div class="cell figure-cell"><FigurePanel figureKey={panel.key} /></div>
      {:else if panel.type === "brief"}
        <div class="cell brief-cell"><BriefPanel paragraphs={resolvedBrief} /></div>
      {:else if panel.type === "chart"}
        <div class="cell"><ChartPanel spec={panel.data} /></div>
      {:else if panel.type === "graph"}
        <div class="cell"><GraphPanel spec={panel.data} /></div>
      {:else if panel.type === "map"}
        <div class="cell map-cell"><MapPanel spec={panel.data} /></div>
      {/if}
    {/each}
  </div>
</section>

<style>
  .dossier-view {
    display: flex;
    flex-direction: column;
    gap: 1.4rem;
    padding: max(1.25rem, env(safe-area-inset-top)) var(--mmm-pad)
      max(1.25rem, env(safe-area-inset-bottom));
    background: radial-gradient(
      120% 80% at 50% 0%,
      var(--mmm-navy-light) 0%,
      var(--mmm-navy) 55%,
      var(--mmm-navy-deep) 100%
    );
  }
  .masthead h2 {
    margin: 0;
    font-family: var(--mmm-font-display);
    font-size: 1.6rem;
    color: var(--mmm-gold-bright);
    letter-spacing: 0.01em;
  }
  .masthead .era {
    margin: 0.2rem 0 0;
    font-family: var(--mmm-font-body);
    font-size: 0.85rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--mmm-text-dim);
  }
  .spread {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.4rem;
  }
  .cell {
    padding-top: 1rem;
    border-top: 1px solid color-mix(in srgb, var(--mmm-gold-deep) 35%, transparent);
  }
  .figure-cell {
    border-top: none;
    padding-top: 0;
  }
  /* On a wider screen the figure + brief sit side-by-side (the briefing's lead), the data anchors below. */
  @media (min-width: 52rem) {
    .spread {
      grid-template-columns: 1fr 1fr;
      align-items: start;
    }
    .map-cell {
      grid-column: 1 / -1;
    }
  }
</style>
