<script lang="ts">
import type { FoundingInput } from "../../sim/founding";
import { getCulture, pickGivenName } from "../../sim/onomastics";
import { createRng } from "../../sim/rng";
import type { Axis, AxisKind, Calling, OnomasticsFile, StartMoment, WorldStack } from "../../sim/schema";
import { axisIntensityFor } from "../../sim/axes";
import { resolveStack } from "../../sim/worldStacks";

interface Props {
  moments: StartMoment[];
  callings: Calling[];
  axes: Axis[];
  worldStacks: WorldStack[];
  onomastics: OnomasticsFile["cultures"];
  hasSave: boolean;
  /** Found a dynasty with the full control-panel config. */
  onFound: (input: FoundingInput) => void;
  onContinue: () => void;
  onSettings: () => void;
}

const { moments, callings, axes, worldStacks, onomastics, hasSave, onFound, onContinue, onSettings }: Props =
  $props();

type Step = "title" | "moment" | "name" | "calling" | "axes" | "confirm";
let step = $state<Step>("title");

// The founding draft the control panel unfolds to gather.
let seed = $state("");
let chosenId = $state<string | null>(null);
let surname = $state("");
let given = $state("");
let gender = $state<"male" | "female">("male");
let callingId = $state<string | null>(null);
const axisChoice = $state<Record<string, string>>({});

const moment = $derived(moments.find((m) => m.id === chosenId) ?? null);
const culture = $derived(moment ? onomastics[moment.culture] : undefined);
// The place×era stack drives the axis intensities shown to the player.
const stack = $derived(moment ? resolveStack(worldStacks, moment.place, moment.startEra) : undefined);

function effectiveSeed(): string {
  return seed.trim() || `${Math.floor(Date.now() % 1e9).toString(36)}-dynasty`;
}

function rollGiven(): void {
  if (!culture) return;
  // UI-only suggestion (the sim re-derives its own seeded name at founding).
  const r = createRng(`${effectiveSeed()}:suggest:${gender}:${Math.floor(Date.now() % 1e6)}`);
  given = pickGivenName(culture, gender, r);
}

function beginFounding(): void {
  step = "moment";
}
function chooseMoment(id: string): void {
  chosenId = id;
  const m = moments.find((x) => x.id === id);
  if (m) gender = m.progenitorSex;
  rollGiven();
  step = "name";
}
function toCalling(): void {
  if (!surname.trim()) return;
  step = "calling";
}
function chooseCalling(id: string): void {
  callingId = id;
  step = axes.length > 0 ? "axes" : "confirm";
}
function setAxis(axis: AxisKind, optionId: string): void {
  axisChoice[axis] = optionId;
}
function toConfirm(): void {
  step = "confirm";
}
function found(): void {
  if (!chosenId || !surname.trim()) return;
  onFound({
    momentId: chosenId,
    surname: surname.trim(),
    seed: effectiveSeed(),
    gender,
    ...(callingId ? { calling: callingId } : {}),
    ...(Object.keys(axisChoice).length
      ? { axisChoices: axisChoice as FoundingInput["axisChoices"] }
      : {}),
  });
}

function intensityLabel(axis: AxisKind): string {
  const v = axisIntensityFor(stack, axis);
  return v >= 0.66 ? "charged here" : v >= 0.33 ? "present here" : "muted here";
}

function back(to: Step): void {
  step = to;
}
</script>

{#if step === "title"}
  <main class="panel-screen">
    <div class="masthead">
      <span class="eyebrow">A DYNASTIC SAGA</span>
      <h1>Dynasty</h1>
      <div class="rule" aria-hidden="true"><span class="diamond">◆</span></div>
      <p class="tagline">Found a line. Steer it across the centuries.</p>
    </div>
    <div class="panel">
      <label for="seed">Seed (optional)</label>
      <input id="seed" bind:value={seed} placeholder="leave blank for random" autocomplete="off" />
      <button class="primary" type="button" onclick={beginFounding}>New Game — Found a Dynasty</button>
      {#if hasSave}
        <button class="secondary" type="button" onclick={onContinue}>Load Game — Continue</button>
      {/if}
      <button class="secondary" type="button" onclick={onSettings}>Settings</button>
    </div>
  </main>
{:else if step === "moment"}
  <main class="panel-screen scroll">
    <div class="sub-masthead">
      <span class="eyebrow">CHOOSE YOUR HINGE</span>
      <h2>Where History Turns</h2>
      <p class="sub">Found your line at a pivotal moment. Real time, real place — your name.</p>
    </div>
    <div class="cards">
      {#each moments as m (m.id)}
        <button class="card moment" class:deep={m.deepHistory} type="button" onclick={() => chooseMoment(m.id)}>
          <span class="card-tag">{m.archetype}</span>
          <span class="card-title">{m.label}</span>
          <span class="card-where">{m.place} · {m.year}</span>
          <p class="card-body">{m.scene}</p>
          {#if m.deepHistory}<span class="deep-badge">Deep history</span>{/if}
          <span class="cta">Found here →</span>
        </button>
      {/each}
    </div>
    <button class="back-btn" type="button" onclick={() => back("title")}>← Back</button>
  </main>
{:else if step === "name"}
  <main class="panel-screen">
    <div class="sub-masthead">
      <span class="eyebrow">NAME YOUR LINE</span>
      <h2>The Founding</h2>
      {#if moment}<p class="sub">{moment.label} — {moment.place}, {moment.year}</p>{/if}
    </div>
    <div class="panel">
      <label for="surname">Family name</label>
      <input id="surname" bind:value={surname} placeholder="your dynasty's surname" autocomplete="off" maxlength="32" />

      <span class="field-label">The founder is…</span>
      <div class="seg">
        <button type="button" class:on={gender === "male"} onclick={() => { gender = "male"; rollGiven(); }}>Patriarch</button>
        <button type="button" class:on={gender === "female"} onclick={() => { gender = "female"; rollGiven(); }}>Matriarch</button>
      </div>

      <label for="given">Given name</label>
      <div class="given-row">
        <input id="given" bind:value={given} placeholder="given name" autocomplete="off" maxlength="32" />
        <button class="ghost" type="button" onclick={rollGiven} title="Suggest another">↻</button>
      </div>
      <p class="note">
        A {moment?.culture.replace(/_/g, " ")} name; reroll for another, or write your own.
      </p>

      <button class="primary" type="button" disabled={!surname.trim()} onclick={toCalling}>Next: the Calling</button>
      <button class="back-btn" type="button" onclick={() => back("moment")}>← Choose another moment</button>
    </div>
  </main>
{:else if step === "calling"}
  <main class="panel-screen scroll">
    <div class="sub-masthead">
      <span class="eyebrow">CHOOSE A CALLING</span>
      <h2>The Family's Bent</h2>
      <p class="sub">A calling shapes the line's gifts and fortunes for generations.</p>
    </div>
    <div class="cards">
      {#each callings as c (c.id)}
        <button class="card" class:on={callingId === c.id} type="button" onclick={() => chooseCalling(c.id)}>
          <span class="card-title">{c.label}</span>
          <p class="card-body">{c.summary}</p>
          <span class="cta">Take this calling →</span>
        </button>
      {/each}
    </div>
    <button class="back-btn" type="button" onclick={() => back("name")}>← Back</button>
  </main>
{:else if step === "axes"}
  <main class="panel-screen scroll">
    <div class="sub-masthead">
      <span class="eyebrow">EPOCH ZERO</span>
      <h2>The First Convictions</h2>
      <p class="sub">Where the line stands now will echo down the generations — and weighs more where the age is charged.</p>
    </div>
    {#each axes as a (a.axis)}
      <div class="axis">
        <div class="axis-head">
          <span class="axis-label">{a.label}</span>
          <span class="axis-intensity">{intensityLabel(a.axis)}</span>
        </div>
        <p class="axis-prompt">{a.prompt}</p>
        <div class="axis-options">
          {#each a.options as o (o.id)}
            <button
              class="axis-opt"
              class:on={axisChoice[a.axis] === o.id}
              type="button"
              onclick={() => setAxis(a.axis, o.id)}
            >
              <span class="opt-label">{o.label}</span>
              <span class="opt-blurb">{o.blurb}</span>
            </button>
          {/each}
        </div>
      </div>
    {/each}
    <button class="primary wide" type="button" onclick={toConfirm}>Begin the Line</button>
    <button class="back-btn" type="button" onclick={() => back("calling")}>← Back</button>
  </main>
{:else}
  <main class="panel-screen">
    <div class="sub-masthead">
      <span class="eyebrow">THE FOUNDING</span>
      <h2>{given || "The founder"} {surname}</h2>
      {#if moment}<p class="sub">{moment.label} — {moment.place}, {moment.year}</p>{/if}
    </div>
    <div class="panel">
      <p class="confirm-line">
        A {gender === "male" ? "patriarch" : "matriarch"} of the {callings.find((c) => c.id === callingId)?.label ?? "untitled"} calling.
      </p>
      <button class="primary" type="button" onclick={found}>Begin the Line</button>
      <button class="back-btn" type="button" onclick={() => back(axes.length ? "axes" : "calling")}>← Back</button>
    </div>
  </main>
{/if}

<style>
  .panel-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    min-height: 100dvh;
    padding: max(1.25rem, env(safe-area-inset-top)) var(--mmm-pad);
    text-align: center;
    background: radial-gradient(120% 80% at 50% 0%, var(--mmm-navy-light) 0%, var(--mmm-navy) 55%, var(--mmm-navy-deep) 100%);
  }
  .panel-screen.scroll {
    justify-content: flex-start;
  }
  .masthead,
  .sub-masthead {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
  }
  .eyebrow {
    font-family: var(--mmm-font-body);
    font-size: 0.72rem;
    letter-spacing: 0.4em;
    text-indent: 0.4em;
    color: var(--mmm-gold-deep);
    text-transform: uppercase;
  }
  h1 {
    margin: 0;
    font-family: var(--mmm-font-display);
    font-weight: 800;
    font-size: clamp(3.2rem, 15vw, 5rem);
    line-height: 0.95;
    background: linear-gradient(180deg, var(--mmm-gold-bright) 0%, var(--mmm-gold) 45%, var(--mmm-gold-deep) 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    filter: drop-shadow(0 0 18px rgb(212 175 55 / 0.25));
  }
  h2 {
    margin: 0;
    font-family: var(--mmm-font-display);
    font-weight: 800;
    font-size: clamp(1.8rem, 9vw, 3rem);
    line-height: 1;
    background: linear-gradient(180deg, var(--mmm-gold-bright), var(--mmm-gold-deep));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .rule {
    display: flex;
    align-items: center;
    justify-content: center;
    width: min(18rem, 70vw);
    color: var(--mmm-gold-deep);
  }
  .rule::before,
  .rule::after {
    content: "";
    height: 1px;
    flex: 1;
    background: linear-gradient(90deg, transparent, var(--mmm-gold-deep));
  }
  .rule::after {
    background: linear-gradient(90deg, var(--mmm-gold-deep), transparent);
  }
  .diamond {
    font-size: 0.7rem;
    color: var(--mmm-gold);
    padding: 0 0.6rem;
  }
  .tagline,
  .sub {
    margin: 0;
    font-family: var(--mmm-font-body);
    font-style: italic;
    color: var(--mmm-text-dim);
    max-width: 32rem;
  }
  .panel {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    width: min(26rem, 92vw);
    padding: 1.25rem;
    border-radius: var(--mmm-radius-lg);
    background: color-mix(in srgb, var(--mmm-surface) 55%, transparent);
    border: 1px solid color-mix(in srgb, var(--mmm-gold-deep) 60%, transparent);
    box-shadow: var(--mmm-shadow);
    text-align: left;
  }
  label,
  .field-label {
    font-family: var(--mmm-font-body);
    font-size: 0.8rem;
    letter-spacing: 0.04em;
    color: var(--mmm-text-dim);
  }
  input {
    padding: 0.6rem 0.7rem;
    border-radius: var(--mmm-radius);
    border: 1px solid var(--mmm-gold-deep);
    background: var(--mmm-navy-deep);
    color: var(--mmm-text);
    font-family: var(--mmm-font-body);
    font-size: 1rem;
    width: 100%;
  }
  input:focus-visible {
    outline: 2px solid var(--mmm-gold);
  }
  .given-row {
    display: flex;
    gap: 0.5rem;
  }
  .seg {
    display: flex;
    gap: 0.4rem;
  }
  .seg button {
    flex: 1;
    padding: 0.6rem;
    border-radius: var(--mmm-radius);
    border: 1px solid var(--mmm-gold-deep);
    background: var(--mmm-navy-deep);
    color: var(--mmm-text);
    font-family: var(--mmm-font-display);
    font-weight: 700;
    cursor: pointer;
  }
  .seg button.on {
    background: linear-gradient(180deg, var(--mmm-gold-bright), var(--mmm-gold-deep));
    color: var(--mmm-ink);
  }
  .note {
    margin: 0;
    font-family: var(--mmm-font-body);
    font-size: 0.76rem;
    font-style: italic;
    color: var(--mmm-text-dim);
  }
  button {
    cursor: pointer;
    transition: transform var(--mmm-dur-fast) var(--mmm-ease);
  }
  button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .primary {
    padding: 0.8rem;
    border-radius: var(--mmm-radius);
    font-family: var(--mmm-font-display);
    font-weight: 700;
    font-size: 1.05rem;
    border: 1px solid var(--mmm-gold-deep);
    background: linear-gradient(180deg, var(--mmm-gold-bright), var(--mmm-gold-deep));
    color: var(--mmm-ink);
    box-shadow: var(--mmm-shadow-gold);
  }
  .primary.wide {
    width: min(26rem, 92vw);
  }
  .secondary {
    padding: 0.8rem;
    border-radius: var(--mmm-radius);
    font-family: var(--mmm-font-display);
    font-weight: 700;
    border: 1px solid var(--mmm-gold-deep);
    background: transparent;
    color: var(--mmm-text);
  }
  .ghost {
    padding: 0 0.8rem;
    border-radius: var(--mmm-radius);
    border: 1px solid var(--mmm-gold-deep);
    background: transparent;
    color: var(--mmm-gold);
    font-size: 1.1rem;
  }
  .cards {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
    width: min(68rem, 96vw);
  }
  .card {
    flex: 1 1 min(15rem, 85vw);
    max-width: 20rem;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.3rem;
    padding: 1.1rem;
    border-radius: var(--mmm-radius-lg);
    background: color-mix(in srgb, var(--mmm-surface) 60%, transparent);
    border: 1.5px solid color-mix(in srgb, var(--mmm-gold-deep) 40%, transparent);
    box-shadow: 0 2px 16px rgb(0 0 0 / 0.35);
    text-align: left;
  }
  .card.deep {
    border-color: color-mix(in srgb, #1d7a5f 55%, transparent);
  }
  .card:hover,
  .card:focus-visible,
  .card.on {
    transform: translateY(-3px);
    border-color: var(--mmm-gold);
    box-shadow: 0 8px 30px rgb(0 0 0 / 0.4), 0 0 16px color-mix(in srgb, var(--mmm-gold) 30%, transparent);
  }
  .card-tag {
    font-family: var(--mmm-font-body);
    font-size: 0.64rem;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: var(--mmm-gold-deep);
  }
  .card-title {
    font-family: var(--mmm-font-display);
    font-weight: 800;
    font-size: 1.15rem;
    color: var(--mmm-gold);
  }
  .card-where {
    font-family: var(--mmm-font-body);
    font-size: 0.74rem;
    font-style: italic;
    color: var(--mmm-text-dim);
  }
  .card-body {
    margin: 0.25rem 0 0.4rem;
    font-family: var(--mmm-font-body);
    font-size: 0.8rem;
    line-height: 1.5;
    color: var(--mmm-text-dim);
    flex: 1;
  }
  .deep-badge {
    font-family: var(--mmm-font-body);
    font-size: 0.64rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: #4fd1a5;
  }
  .cta {
    font-family: var(--mmm-font-display);
    font-weight: 700;
    font-size: 0.84rem;
    color: var(--mmm-gold);
  }
  .axis {
    width: min(34rem, 94vw);
    padding: 0.9rem 1rem;
    border-radius: var(--mmm-radius-lg);
    background: color-mix(in srgb, var(--mmm-surface) 50%, transparent);
    border: 1px solid color-mix(in srgb, var(--mmm-gold-deep) 40%, transparent);
    text-align: left;
  }
  .axis-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  .axis-label {
    font-family: var(--mmm-font-display);
    font-weight: 800;
    font-size: 1.05rem;
    color: var(--mmm-gold);
  }
  .axis-intensity {
    font-family: var(--mmm-font-body);
    font-size: 0.68rem;
    font-style: italic;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--mmm-gold-deep);
  }
  .axis-prompt {
    margin: 0.2rem 0 0.5rem;
    font-family: var(--mmm-font-body);
    font-style: italic;
    font-size: 0.85rem;
    color: var(--mmm-text-dim);
  }
  .axis-options {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .axis-opt {
    flex: 1 1 9rem;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    padding: 0.55rem 0.65rem;
    border-radius: var(--mmm-radius);
    border: 1px solid var(--mmm-gold-deep);
    background: var(--mmm-navy-deep);
    color: var(--mmm-text);
    text-align: left;
  }
  .axis-opt.on {
    background: color-mix(in srgb, var(--mmm-gold) 22%, var(--mmm-navy-deep));
    border-color: var(--mmm-gold);
  }
  .opt-label {
    font-family: var(--mmm-font-display);
    font-weight: 700;
    font-size: 0.9rem;
    color: var(--mmm-gold);
  }
  .opt-blurb {
    font-family: var(--mmm-font-body);
    font-size: 0.74rem;
    line-height: 1.4;
    color: var(--mmm-text-dim);
  }
  .confirm-line {
    margin: 0;
    font-family: var(--mmm-font-body);
    font-style: italic;
    color: var(--mmm-text-dim);
  }
  .back-btn {
    background: transparent;
    border: none;
    color: var(--mmm-text-dim);
    font-family: var(--mmm-font-body);
    font-size: 0.9rem;
    padding: 0.4rem 0.8rem;
  }
  .back-btn:hover {
    color: var(--mmm-text);
  }
</style>
