<script lang="ts">
import type { GameState, LiveMember } from "../sim/state";

interface Props {
  gameState: GameState;
}
const { gameState }: Props = $props();

const family = $derived(gameState.family);
const year = $derived(gameState.year);

// Members grouped by generation, each generation sorted by birth order (member id seq).
const generations = $derived.by(() => {
  const fam = family;
  if (!fam) return [] as Array<{ gen: number; members: LiveMember[] }>;
  const byGen = new Map<number, LiveMember[]>();
  for (const m of fam.members) {
    const list = byGen.get(m.generation) ?? [];
    list.push(m);
    byGen.set(m.generation, list);
  }
  return [...byGen.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([gen, members]) => ({
      gen,
      members: [...members].sort((a, b) => seq(a) - seq(b)),
    }));
});

function seq(m: LiveMember): number {
  const n = Number(m.id.slice(1));
  return Number.isFinite(n) ? n : 0;
}

function isAliveNow(m: LiveMember): boolean {
  return m.died === undefined || m.died > year;
}

function lifespan(m: LiveMember): string {
  return m.died !== undefined ? `${m.born}–${m.died}` : `b. ${m.born}`;
}

// The current protagonist's partner (CP-5), if any — surfaced as a "Consort" marker so
// the lineage reads as relationships, not just a roster of names (PL-8).
const partnerId = $derived(family?.partnerId);
function roleOf(m: LiveMember): string | null {
  if (m.isProtagonist) return "You";
  if (m.id === partnerId) return "Consort";
  return null;
}
</script>

<section class="lineage">
  <h3>The Line</h3>
  {#if !family}
    <p class="empty">This run has no founded line.</p>
  {:else}
    <p class="house">House of {family.members[0]?.surname ?? "—"}</p>
    {#each generations as g (g.gen)}
      <div class="gen">
        <span class="gen-label">Generation {g.gen + 1}</span>
        <div class="members">
          {#each g.members as m (m.id)}
            {@const role = roleOf(m)}
            {@const dead = !isAliveNow(m)}
            <div class="member" class:protagonist={m.isProtagonist} class:dead>
              <span class="name">
                {m.given}
                {m.surname}{#if dead}<span class="cross" title="Deceased" aria-label="deceased">
                    &#10013;</span
                  >{/if}
              </span>
              <span class="life">{lifespan(m)}</span>
              {#if role}<span class="badge" class:consort={role === "Consort"}>{role}</span>{/if}
            </div>
          {/each}
        </div>
      </div>
    {/each}
  {/if}
</section>

<style>
  .lineage {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.5rem 0;
  }
  h3 {
    margin: 0;
    font-family: var(--mmm-font-display);
    font-weight: 800;
    font-size: 1.1rem;
    color: var(--mmm-gold);
  }
  .house {
    margin: 0;
    font-family: var(--mmm-font-body);
    font-style: italic;
    color: var(--mmm-text-dim);
    font-size: 0.85rem;
  }
  .empty {
    color: var(--mmm-text-dim);
    font-style: italic;
  }
  .gen {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .gen-label {
    font-family: var(--mmm-font-body);
    font-size: 0.66rem;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: var(--mmm-gold-deep);
  }
  .members {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .member {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    padding: 0.45rem 0.65rem;
    border-radius: var(--mmm-radius);
    background: color-mix(in srgb, var(--mmm-surface) 60%, transparent);
    border: 1px solid color-mix(in srgb, var(--mmm-gold-deep) 35%, transparent);
    min-width: 8rem;
  }
  .member.protagonist {
    border-color: var(--mmm-gold);
    box-shadow: 0 0 10px color-mix(in srgb, var(--mmm-gold) 30%, transparent);
  }
  .member.dead {
    opacity: 0.55;
  }
  .name {
    font-family: var(--mmm-font-display);
    font-weight: 700;
    font-size: 0.95rem;
    color: var(--mmm-text);
  }
  .life {
    font-family: var(--mmm-font-body);
    font-size: 0.72rem;
    color: var(--mmm-text-dim);
  }
  .badge {
    align-self: flex-start;
    font-family: var(--mmm-font-body);
    font-size: 0.6rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--mmm-ink);
    background: var(--mmm-gold);
    padding: 0.05rem 0.35rem;
    border-radius: 0.2rem;
    margin-top: 0.15rem;
  }
  /* The consort reads as a quieter, outlined badge — present in the line but not the
     protagonist (PL-8). */
  .badge.consort {
    color: var(--mmm-gold);
    background: transparent;
    border: 1px solid var(--mmm-gold-deep);
  }
  .cross {
    color: var(--mmm-text-dim);
    font-size: 0.78rem;
  }
</style>
