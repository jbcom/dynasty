<script lang="ts">
import { fade } from "svelte/transition";
import type { Scene } from "../../sim/saga/schema";
import { playCue, startMusic } from "../sound";

/**
 * SCENE READER (Narrative Acts model) — renders a scene as a PAGED novel, Suzerain-style: ONE
 * paragraph at a time, tap ANYWHERE to turn to the next. When the prose is spent, the scene's CHOICE
 * folds into the same paragraph as GLOWING PULSING text — the weave beats (alternatives) or the
 * terminal tiered decision. The options remain real buttons for accessibility, but visually they are
 * part of the prose, not a detached block below it. Tapping a non-option area while a choice is up makes
 * the options pulse faster (it does not advance) to say "pick one". Pure presentation: resolves identity tokens via the
 * injected `term` fn and emits the player's choice upward — never the sim.
 */

import type { BraidedThread } from "../../sim/saga/player";

interface Props {
  scene: Scene;
  /** VL-2b: the generation's portrait (the one speaker, Suzerain pattern) — a generated engraving shown
   *  beside the prose. Undefined = prose-only (non-spine scenes). */
  portraitSrc?: string;
  /** Cross-dynasty intersections to WEAVE into this scene's prose flow (WV-1). Empty when none fire. */
  threads?: BraidedThread[];
  /** Resolve {surname}/{given_name}/… tokens — the run's `applyTerms` binding (identity in tests). */
  term?: (text: string) => string;
  /** The player picked a weave beat (index into scene.beats). */
  onbeat?: (beatIndex: number) => void;
  /** The player picked the terminal decision option (index into scene.decision.options). */
  ondecision?: (optionIndex: number) => void;
}
const { scene, portraitSrc, threads = [], term = (t) => t, onbeat, ondecision }: Props = $props();

// WV-1: the PAGES the reader turns through = the scene's own prose, then the woven crossing passage(s).
// A crossing is folded into the SAME paged flow as narration (a `woven` page gets a subtle inline mark),
// not a detached "Where paths cross" block — so another dynasty enters as a moment in THIS line's story.
// One lead page per thread (the crossing moment) + up to two paragraphs of the rival's fragment.
interface Page {
  text: string;
  woven: boolean;
  lead: boolean; // the first page of a woven passage (carries the inline mark)
}
// ASSUMPTION (WV-1): `threads` is IMMUTABLE for the life of a scene — set once at corpus-build time and
// only ever swapped together with `scene` (a scene change resets paging). If WV-2 ever injects a thread
// LIVE mid-scene (threads change while scene.id is stable), `pages` grows + `lastPara` un-fires and the
// player is pulled back mid-flow — clamp paraIdx or freeze injection until scene-end before doing that.
const pages = $derived.by<Page[]>(() => {
  // Defensive: schema guarantees prose.min(1), but guard against a malformed/dynamic thread (CodeRabbit
  // #96) so a missing crossing/fragment can never produce an empty/blank page or throw.
  const out: Page[] = (scene.prose ?? []).map((text) => ({ text, woven: false, lead: false }));
  for (const t of threads) {
    if (t?.crossing) out.push({ text: t.crossing, woven: true, lead: true });
    for (const para of (t?.scene?.prose ?? []).slice(0, 2)) {
      out.push({ text: para, woven: true, lead: false });
    }
  }
  // Never hand the reader zero pages (would make lastPara always-true) — fall back to one empty page.
  return out.length > 0 ? out : [{ text: "", woven: false, lead: false }];
});

// Whether the user prefers reduced motion — gates the JS-driven scene fade (CSS handles the rest).
// Guarded for SSR/tests where matchMedia is absent; defaults to false (motion on).
const reduceMotion =
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

// Paged reading position: which prose paragraph is currently shown (the last one revealed).
let paraIdx = $state(0);
// In a decision-bearing scene the beat is a preamble; once taken, the decision options show.
let beatTaken = $state(false);
// Transient "pick one" urge — set briefly when the player taps away while options are up.
let urging = $state(false);
let urgeTimer: ReturnType<typeof setTimeout> | undefined;

// Reset paging when the scene changes — compare against the id we last paged from (no effect that
// writes tracked state on every run, which would fight the click updates). Seeded from the initial
// scene so the first paint shows paragraph 0 without a reset race.
// svelte-ignore state_referenced_locally
let pagedFrom = $state(scene.id);
$effect(() => {
  if (scene.id !== pagedFrom) {
    pagedFrom = scene.id;
    paraIdx = 0;
    beatTaken = false;
    urging = false;
  }
});

// Clear the pending urge timer on unmount so its callback can't write state on a destroyed component.
$effect(() => () => clearTimeout(urgeTimer));

// The paragraph actually SHOWN, derived synchronously so a scene change can never flash stale prose:
// the reset $effect runs after paint, so on a scene swap `paraIdx` is briefly the OLD index — clamp it
// to THIS scene's range during render (and treat a not-yet-reset index as paragraph 0 of the new scene).
const shownPara = $derived(scene.id === pagedFrom ? Math.min(paraIdx, pages.length - 1) : 0);
const lastPara = $derived(shownPara >= pages.length - 1);
const hasBeats = $derived(scene.beats.length > 0);
// Options show once the prose is fully read: the weave beats first, then (after a beat) the decision.
const showWeave = $derived(lastPara && hasBeats && !beatTaken);
const showDecision = $derived(lastPara && !!scene.decision && (!hasBeats || beatTaken));
const optionsUp = $derived(showWeave || showDecision);

function urge() {
  urging = true;
  clearTimeout(urgeTimer);
  // Long enough for two fast pulses, then settle back to the calm glow.
  urgeTimer = setTimeout(() => {
    urging = false;
  }, 900);
}

/** Tap on the page body: turn to the next paragraph, or — if a choice is up — urge the player to pick. */
function tapPage() {
  startMusic(); // first tap is the user gesture that lets the ambient bed begin (autoplay policy)
  if (optionsUp) {
    urge();
    return;
  }
  if (!lastPara) {
    paraIdx += 1;
    playCue("click"); // a soft page-turn
  }
}

function chooseBeat(i: number) {
  beatTaken = true;
  playCue("stinger"); // a choice lands
  onbeat?.(i);
}
</script>

<!-- The whole page is the tap target (advance / urge). Options stop propagation so a pick isn't an urge. -->
<!-- `data-scene-id` exposes the current scene to harness/e2e walks (the runner's id isn't otherwise in the DOM). -->
<section
  class="scene"
  data-sense={scene.sense}
  data-scene-id={scene.id}
  data-testid="scene-reader"
  data-options-up={optionsUp ? "" : undefined}
>
  <!-- Full-bleed tap layer: turn the page, or urge the player when a choice is up. A button so it's
       keyboard-focusable + screen-reader operable without an a11y-role mismatch. -->
  <button
    type="button"
    class="tap-layer"
    aria-label={optionsUp ? "Choose an inline option" : "Continue"}
    onclick={tapPage}
  ></button>

  <!-- KEY-PILLARS-1e: a non-text reader rail gives long prose a visual rhythm. Each mark is one page in
       the current scene flow; woven thread pages get their own mark so cross-line encounters are felt as
       part of the read, not only as more text. Decorative only: screen readers already get the prose. -->
  <div
    class="reader-progress"
    aria-hidden="true"
    data-testid="reader-progress"
    data-page-count={pages.length}
    data-current-page={shownPara + 1}
  >
    {#each pages as page, i (`${scene.id}:${i}`)}
      <span
        class="progress-step"
        class:active={i === shownPara}
        class:past={i < shownPara}
        class:woven={page.woven}
        data-active={i === shownPara ? "" : undefined}
        data-woven={page.woven ? "" : undefined}
      ></span>
    {/each}
  </div>

  <!-- One paragraph at a time. The outer key fades the whole page in when the SCENE changes (a composed
       between-scene transition, distinct from the per-paragraph page-turn); the inner key animates each
       paragraph turn within a scene. The fade is JS-driven (inline opacity), so it does NOT pick up the
       CSS reduced-motion rule — we gate its duration to 0 via the reactive `reduceMotion` flag instead. -->
  {#key scene.id}
    <div class="scene-body" in:fade={{ duration: reduceMotion ? 0 : 320 }}>
      <!-- VL-2b/EI-7: the generation's PORTRAIT (the one speaker, Suzerain pattern) — a generated engraving
           that FLOATS at the head of the prose flow so the text wraps ALONGSIDE it and then continues DOWN
           BELOW it (a magazine wrap, at every width — not a portrait-block-then-text-block stack). It lives
           INSIDE .scene-body (the block-flow box) so the float takes effect; shape-outside rounds the wrap to
           the plate. Decorative (the prose carries the story), so aria-hidden; pointer-events:none so the
           full-bleed tap layer still turns the page through it. -->
      {#if portraitSrc}
        {#key scene.id}
          <!-- EI-9d: a life-stage/era portrait key may not be generated yet (the matrix is on-demand) — if the
               asset 404s, HIDE the img so the page degrades cleanly to prose-only instead of showing a broken-
               image icon in the magazine wrap. -->
          <img
            class="portrait"
            src={portraitSrc}
            alt=""
            aria-hidden="true"
            decoding="async"
            fetchpriority="high"
            onerror={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
            in:fade={{ duration: reduceMotion ? 0 : 320 }}
          />
        {/key}
      {/if}
      {#key shownPara}
        <!-- A woven crossing page reads as narration with a subtle inline mark (CSS), not a labelled
             aside; its lead page opens the passage. WV-1 — the intersection is part of the story. -->
        <p
          class="para"
          class:woven={pages[shownPara]?.woven}
          class:woven-lead={pages[shownPara]?.lead}
          data-testid="para"
          data-woven={pages[shownPara]?.woven ? "" : undefined}
        >
          {term(pages[shownPara]?.text ?? "")}
          {#if showWeave}
            <span
              class="choices"
              class:urging
              data-testid="weave"
              aria-label="Choose how the moment turns"
            >
              {#each scene.beats as beat, i (i)}
                {#if beat.choice}
                  <button
                    type="button"
                    class="inline-option"
                    onclick={(e) => {
                      e.stopPropagation();
                      chooseBeat(i);
                    }}
                  >
                    {term(beat.choice.text)}
                  </button>
                {/if}
              {/each}
            </span>
          {/if}
          {#if showDecision && scene.decision}
            <span
              class="choices decision"
              class:urging
              data-tier={scene.decision.tier}
              data-testid="decision"
              aria-label="Choose the line's decision"
            >
              {#each scene.decision.options as opt, i (i)}
                <button
                  type="button"
                  class="inline-option"
                  onclick={(e) => {
                    e.stopPropagation();
                    playCue("stinger");
                    ondecision?.(i);
                  }}
                >
                  {term(opt.text)}
                </button>
              {/each}
            </span>
          {/if}
        </p>
      {/key}
    </div>
  {/key}

  {#if !optionsUp}
    <!-- Quiet affordance that the page turns on tap. -->
    <span class="turn-hint" aria-hidden="true">{lastPara ? "" : "tap to continue"}</span>
  {/if}

</section>

<style>
  .scene {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    max-width: 42rem;
    min-height: 60vh;
    margin-inline: auto;
    padding: var(--mmm-pad);
    /* Each sense tints the page edge with a faint wash so the frame is felt, not labelled. */
    border-left: 3px solid var(--sense-accent, var(--mmm-gold-deep));
    background: linear-gradient(
      to right,
      color-mix(in srgb, var(--sense-accent, var(--mmm-gold-deep)) 8%, transparent),
      transparent 30%
    );
  }
  /* Full-bleed invisible tap target behind the text; options sit above it (z-index) so they're clickable. */
  .tap-layer {
    position: absolute;
    inset: 0;
    appearance: none;
    border: none;
    background: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    z-index: 0;
  }
  .tap-layer:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--mmm-gold) 50%, transparent);
    outline-offset: -4px;
  }
  .scene-body,
  .para,
  .turn-hint,
  .choices,
  .portrait,
  .reader-progress {
    position: relative;
    z-index: 1;
  }
  /* KEY-PILLARS-1e: visual relief without more labels. This reader rail gives each paged scene a small
     visual cadence, with stable dot dimensions so progressing through prose does not shift layout. */
  .reader-progress {
    position: absolute;
    left: 0.55rem;
    top: 0.85rem;
    display: grid;
    grid-template-columns: 0.42rem;
    grid-auto-rows: 0.42rem;
    gap: 0.38rem;
    pointer-events: none;
  }
  .progress-step {
    width: 0.42rem;
    height: 0.42rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--mmm-text-dim) 24%, transparent);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--sense-accent, var(--mmm-gold-deep)) 20%, transparent);
  }
  .progress-step.past {
    background: color-mix(in srgb, var(--sense-accent, var(--mmm-gold-deep)) 42%, transparent);
  }
  .progress-step.active {
    background: var(--sense-accent, var(--mmm-gold));
    box-shadow:
      0 0 0 1px color-mix(in srgb, var(--sense-accent, var(--mmm-gold)) 70%, transparent),
      0 0 12px color-mix(in srgb, var(--sense-accent, var(--mmm-gold)) 55%, transparent);
  }
  .progress-step.woven {
    border-radius: 0.08rem;
    transform: rotate(45deg);
  }
  /* VL-2b/EI-7: the generation portrait — an engraved bust the prose wraps AROUND (magazine wrap). It
     FLOATS at the head of the block flow at EVERY width: the shown paragraph runs alongside it and, when
     long enough, continues down below it — never a portrait-block-then-text-block stack. shape-outside
     rounds the text wrap to the plate; pointer-events:none so the full-bleed tap layer still turns the page
     through it. The engraving art carries its own plate framing; a soft gold edge + shadow seats it on the
     navy ground. */
  .portrait {
    float: right;
    width: min(11rem, 40vw);
    aspect-ratio: 1;
    object-fit: cover;
    /* Space the wrapped text off the plate (right-floated → margin on the LEFT + below). */
    margin: 0.2rem 0 1rem 1.4rem;
    border-radius: var(--mmm-radius);
    border: 1px solid color-mix(in srgb, var(--mmm-gold-deep) 55%, transparent);
    box-shadow: var(--mmm-shadow);
    /* Round the wrap to the plate so the prose hugs the engraving's rounded corner, not a hard box. */
    shape-outside: inset(0 round var(--mmm-radius));
    shape-margin: 0.9rem;
    pointer-events: none;
  }
  /* The scene-body is the block-flow box the portrait floats inside — block (not flex) so the float takes
     effect and text wraps around it. Only ONE .para shows at a time (paged), so paragraph spacing lives on
     .para's margin rather than a flex gap. clear:both is unnecessary — the single paragraph IS the wrap. */
  .scene-body {
    display: block;
    /* The MEASURED reading column (Suzerain #1, ~62ch) lives on the block-flow box so the portrait floats
       INSIDE the measure: the prose wraps beside the plate within the column, then reclaims the full column
       width below it (the magazine wrap), instead of the float widening the line beyond a readable measure. */
    max-width: 62ch;
  }
  .scene[data-sense="smell"] { --sense-accent: #8c6f4d; }
  .scene[data-sense="taste"] { --sense-accent: #a4564d; }
  .scene[data-sense="touch"] { --sense-accent: #6f7d8c; }
  .scene[data-sense="sound"] { --sense-accent: #5d7a86; }
  .scene[data-sense="sight"] { --sense-accent: var(--mmm-gold); }

  .para {
    margin: 0;
    /* The measure now lives on .scene-body (EI-7) so the portrait float sits inside the reading column; the
       paragraph fills that column, wrapping beside the plate then under it. */
    font-family: var(--mmm-font-body);
    /* Novel-readable: generous measure + leading, serif body. One paragraph holds the focus. */
    font-size: 1.18rem;
    line-height: 1.8;
    color: var(--mmm-text);
    text-wrap: pretty;
    animation: page-in 0.4s ease both;
  }
  /* WV-1: a woven crossing page reads as narration — same flow, faintly set apart so the moment another
     line enters is FELT, not labelled. The lead page carries a hairline gold rule (CSS, no asset). */
  .para.woven {
    color: color-mix(in srgb, var(--mmm-text) 82%, var(--mmm-gold-deep));
    font-style: italic;
  }
  .para.woven-lead {
    border-left: 2px solid color-mix(in srgb, var(--mmm-gold) 45%, transparent);
    padding-left: 0.9rem;
  }
  @keyframes page-in {
    from { opacity: 0; transform: translateY(0.4rem); }
    to { opacity: 1; transform: none; }
  }
  .turn-hint {
    align-self: center;
    margin-top: auto;
    font-family: var(--mmm-font-body);
    font-size: 0.78rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--mmm-text-dim) 70%, transparent);
    animation: hint-breathe 2.4s ease-in-out infinite;
  }
  @keyframes hint-breathe {
    0%, 100% { opacity: 0.35; }
    50% { opacity: 0.7; }
  }

  /* OPTIONS folded into the story: glowing, pulsing, bigger than the body, and physically part of the
     paragraph flow — no ruled-off choice block that interrupts the reading cadence. */
  .choices {
    display: inline;
    margin-left: 0.35em;
    border-top: 0;
  }
  .inline-option {
    appearance: none;
    border: none;
    background: none;
    text-align: left;
    display: inline-block;
    vertical-align: baseline;
    /* A leading glyph marks each as a discrete, choosable phrase — a glow dash, not a box, so it reads
       as "a path you take" while remaining part of the sentence-level prose surface. */
    margin: 0.05rem 0.55rem 0.05rem 0;
    padding: 0 0 0 1.05rem;
    position: relative;
    cursor: pointer;
    font-family: var(--mmm-font-display);
    font-size: 1.18em;
    line-height: inherit;
    letter-spacing: 0.01em;
    color: var(--mmm-gold-bright);
    text-shadow: 0 0 8px color-mix(in srgb, var(--mmm-gold) 55%, transparent);
    animation: option-glow 2.6s ease-in-out infinite;
  }
  .inline-option::before {
    content: "›";
    position: absolute;
    left: 0;
    top: 0;
    color: var(--sense-accent, var(--mmm-gold));
    opacity: 0.8;
  }
  /* A major (fate-fork) decision's options read heavier. */
  .decision[data-tier="major"] .inline-option {
    font-weight: 800;
    font-size: 1.26em;
  }
  .inline-option:hover {
    color: #fff;
    text-shadow: 0 0 14px color-mix(in srgb, var(--mmm-gold) 80%, transparent);
  }
  @keyframes option-glow {
    0%, 100% {
      text-shadow: 0 0 6px color-mix(in srgb, var(--mmm-gold) 35%, transparent);
      opacity: 0.9;
    }
    50% {
      text-shadow: 0 0 14px color-mix(in srgb, var(--mmm-gold) 75%, transparent);
      opacity: 1;
    }
  }
  /* Tap-away urge: pulse FAST to draw the eye to the options without advancing. */
  .choices.urging .inline-option {
    animation: option-urge 0.45s ease-in-out 2;
  }
  @keyframes option-urge {
    0%, 100% {
      text-shadow: 0 0 8px color-mix(in srgb, var(--mmm-gold) 50%, transparent);
      transform: none;
    }
    50% {
      text-shadow: 0 0 20px color-mix(in srgb, var(--mmm-gold) 100%, transparent);
      transform: scale(1.04);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .para { animation: none; }
    .turn-hint { animation: none; }
    .inline-option { animation: none; text-shadow: 0 0 10px color-mix(in srgb, var(--mmm-gold) 60%, transparent); }
    .choices.urging .inline-option { animation: none; color: #fff; }
  }
</style>
