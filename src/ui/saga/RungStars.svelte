<script lang="ts">
import { MAX_RUNG } from "../../sim/classRung";
/**
 * RUNG STARS — the one place the rung→stars contract lives: a 0..MAX_RUNG rung renders as rung+1 ★s
 * (a founder at rung 0 shows one star), with an aria-label that voices the SAME displayed magnitude so
 * screen-readers match what sighted users count. Used by the convergence readouts (RivalField, the
 * SagaPanel glimpse strip) so the off-by-one + MAX_RUNG math isn't duplicated. Pure presentation.
 */
interface Props {
  rung: number;
  /** Spoken prefix, e.g. "reach" (your line) or "their reach" (a rival). */
  reachLabel?: string;
  /** Optional hover title (the glimpse strip uses one). */
  title?: string;
  /** Extra class so existing test/styling hooks (e.g. .glimpse-rung) still apply. */
  extraClass?: string;
}
const { rung, reachLabel = "reach", title, extraClass = "" }: Props = $props();
</script>

<span
  class="rungs {extraClass}"
  {title}
  aria-label={`${reachLabel} ${rung + 1} of ${MAX_RUNG + 1}`}>{"★".repeat(rung + 1)}</span>

<style>
  .rungs {
    color: var(--mmm-gold);
    letter-spacing: 0.05em;
    white-space: nowrap;
  }
</style>
