<script lang="ts">
import {
  FOUNDING_REGIONS,
  type FoundingRegion,
  POWER_BASES,
  type PowerBase,
  powerBaseDef,
  regionDef,
  type Standing,
} from "../../sim/foundingOrigin";
import type { Content } from "../../sim/content";
import { getCulture, type Sex, suggestGivenNames, suggestSurnames } from "../../sim/onomastics";
import { createRng } from "../../sim/rng";
import type {
  BestFriend,
  FirstJob,
  LifePartner,
  LifeSeedChoices,
} from "../../sim/saga/lifeSeeds";

/**
 * ONBOARDING (founding-spine pivot, FS-ONB-DRIFT). "The story of America": the player FOUNDS a line at
 * the 1776 American founding — NOT as a later immigrant (the immigration waves are now the recurring
 * CAST woven as intersections). A diegetic funnel: REGION (where the line takes root — New England /
 * Mid-Atlantic / South) → POWER BASE (the founder's lever: land, commerce, the pulpit, law, the press,
 * the sword) → STANDING (established or rising) → NAMING STYLE (the cultural naming convention) →
 * SURNAME → GENDER of the progenitor → GIVEN NAME → the FS-7b life-seeds (first job, best friend, life
 * partner). The region×base×standing selection seeds the line's starting motivators + archetype + class
 * rung (resolveFoundingStart). The run seed is a HIDDEN random draw (world only).
 */

interface Props {
  content: Content;
  /** Begin the founded run: hidden seed + chosen founding REGION + POWER BASE + STANDING + bestowed
   *  family name + the progenitor's chosen gender + given name + the chosen naming-style culture id +
   *  the FS-7b life-seeds. Founding seeds the right motivators/archetype/rung + stamps the identity. */
  onComplete: (
    seed: string,
    region: FoundingRegion,
    base: PowerBase,
    standing: Standing,
    surname: string,
    gender: Sex,
    given: string,
    culture: string,
    lifeSeeds: LifeSeedChoices,
  ) => void;
  /** Abandon onboarding and return to the title. */
  onCancel: () => void;
}

const { content, onComplete, onCancel }: Props = $props();

const seed = (() => {
  const words = crypto.getRandomValues(new Uint32Array(2));
  return `r${(words[0] ?? 0).toString(36)}${(words[1] ?? 0).toString(36)}`;
})();

const STANDING_LABEL: Record<Standing, { title: string; blurb: string }> = {
  established: {
    title: "Already standing",
    blurb: "Gentry, a master of the trade, a settled house — the line begins with a seat at the table.",
  },
  rising: {
    title: "On the rise",
    blurb: "An apprentice, a yeoman, a journeyman with little but ambition — the line begins hungry.",
  },
};

// Funnel state: region → power base → standing → naming-STYLE → surname → gender → given name.
let region = $state<FoundingRegion | undefined>();
let base = $state<PowerBase | undefined>();
let standing = $state<Standing | undefined>();
let styleId = $state<string | undefined>();
let surnameChosen = $state<string | undefined>();
let gender = $state<Sex | undefined>();
// FS-7b: the diegetic Epoch-0 life-seeds — the founder growing up after they're named.
let givenChosen = $state<string | undefined>();
let firstJob = $state<FirstJob | undefined>();
let bestFriend = $state<BestFriend | undefined>();
let modalOpen = $state(false);
let typedName = $state("");

// The diegetic life-stage options the founder lives through (each a story seed).
const JOB_OPTS: Array<{ id: FirstJob; title: string; blurb: string }> = [
  { id: "apprentice_tradesman", title: "Apprenticed to a tradesman", blurb: "A craft in the hands — patient, proud work." },
  { id: "dock_laborer", title: "Sent to the docks", blurb: "Hard labor among hard men; you learn loyalty and toil." },
  { id: "shop_clerk", title: "A clerk's stool", blurb: "Ledgers and customers — the language of commerce." },
  { id: "farmhand", title: "Bound to the land", blurb: "Soil, season, and the slow patience of the field." },
  { id: "printers_devil", title: "A printer's devil", blurb: "Ink, type, and dangerous ideas set in lead." },
];
const FRIEND_OPTS: Array<{ id: BestFriend; title: string; blurb: string }> = [
  { id: "a_loyal_equal", title: "A loyal equal", blurb: "Someone who would stand beside you, never above." },
  { id: "an_ambitious_rival", title: "An ambitious rival", blurb: "A friend who is also a spur — you sharpen each other." },
  { id: "a_mentor_elder", title: "A mentor, older + wise", blurb: "One who teaches you how the world really turns." },
  { id: "none", title: "No one close", blurb: "A solitary start; you keep your own counsel." },
];
const PARTNER_OPTS: Array<{ id: NonNullable<LifePartner>; title: string; blurb: string }> = [
  { id: "marry_for_love", title: "Marry for love", blurb: "A heart's choice — the line begins in devotion." },
  { id: "marry_for_advantage", title: "Marry for advantage", blurb: "A match of standing — the line begins in strategy." },
  { id: "remain_unwed", title: "Remain unwed (for now)", blurb: "The work before the family; the line waits." },
];

const GENDER_LABEL: Record<Sex, { title: string; blurb: string }> = {
  male: { title: "A son", blurb: "The progenitor of the line is a man." },
  female: { title: "A daughter", blurb: "The progenitor of the line is a woman." },
};

// The current region's def (cue + native bases) once chosen.
const regionInfo = $derived(region ? regionDef(region) : undefined);
// Power bases ordered with the chosen region's NATIVE bases first (its natural levers), then the rest —
// every base remains selectable (a printer in the planter South is a real, if rarer, choice).
const baseOptions = $derived.by(() => {
  if (!regionInfo) return POWER_BASES;
  const native = new Set(regionInfo.nativeBases);
  // Rank natives 0, others 1, then subtract — a symmetric comparator (two natives compare equal → 0),
  // unlike a -1/1 form that returns -1 both ways and breaks the sort's anti-symmetry contract.
  const rank = (id: PowerBase) => (native.has(id) ? 0 : 1);
  return [...POWER_BASES].sort((a, b) => rank(a.id) - rank(b.id));
});

// NAMING STYLE (ONB-1, user-ordered): an explicit list of every authored naming culture, the region's
// default first (the natural default) then the rest — so a cross-cultural founder is a real choice, not
// forced from the region. {id,label} from the onomastics file.
const styleOptions = $derived.by(() => {
  const all = Object.entries(content.onomastics).map(([id, c]) => ({ id, label: c.label }));
  const own = region ? `founding_${region}` : undefined;
  // The founding-region place's defaultCulture is the natural naming default for the region.
  const ownCulture = content.places.find((p) => p.id === own)?.defaultCulture;
  if (!ownCulture) return all;
  return all.sort((a, b) => (a.id === ownCulture ? -1 : b.id === ownCulture ? 1 : 0));
});
const culture = $derived(
  styleId ? getCulture({ cultures: content.onomastics }, styleId) : undefined,
);
const surnameSuggestions = $derived(
  culture ? suggestSurnames(culture, createRng(`${seed}::surname-offer`), 3) : [],
);
const givenSuggestions = $derived(
  culture && gender
    ? // ONO-DEDUP: never offer a given name equal to the chosen surname (e.g. "Sterling Sterling").
      suggestGivenNames(culture, gender, createRng(`${seed}::given-offer`), 3, surnameChosen)
    : [],
);

function pickRegion(r: FoundingRegion): void {
  region = r;
  base = undefined;
  standing = undefined;
  styleId = undefined;
  surnameChosen = undefined;
  gender = undefined;
}
function pickBase(b: PowerBase): void {
  base = b;
  standing = undefined;
  styleId = undefined;
  surnameChosen = undefined;
  gender = undefined;
}
function pickStanding(s: Standing): void {
  standing = s;
  styleId = undefined;
  surnameChosen = undefined;
  gender = undefined;
}
function pickStyle(id: string): void {
  styleId = id;
  surnameChosen = undefined;
  gender = undefined;
}
function pickGender(g: Sex): void {
  gender = g;
  // Re-picking gender resets the downstream identity + life-seed tail (given name is gender-derived).
  givenChosen = undefined;
  firstJob = undefined;
  bestFriend = undefined;
}
function back(): void {
  // Unwind the funnel newest-first: the FS-7b life-seed steps, then naming, then the cell choices.
  if (bestFriend) bestFriend = undefined;
  else if (firstJob) firstJob = undefined;
  else if (givenChosen) givenChosen = undefined;
  else if (gender) gender = undefined;
  else if (surnameChosen) surnameChosen = undefined;
  else if (styleId) styleId = undefined;
  else if (standing) standing = undefined;
  else if (base) base = undefined;
  else if (region) region = undefined;
  else onCancel();
}

const clean = (s: string): string => s.trim().replace(/\s+/g, " ").slice(0, 32);

/** Naming step 1: lock the family name, advance to gender then the given-name step. */
function chooseSurname(surname: string): void {
  const name = clean(surname);
  if (!name) return;
  surnameChosen = name;
  modalOpen = false;
  typedName = "";
}

/** Naming step 3: bestow the given name, then advance into the diegetic Epoch-0 life-seed steps. */
function bestowGiven(given: string): void {
  const first = clean(given);
  if (!first) return;
  givenChosen = first;
  modalOpen = false;
  typedName = "";
}
function pickJob(j: FirstJob): void {
  firstJob = j;
}
function pickFriend(f: BestFriend): void {
  bestFriend = f;
}
/** Life-seed step 3 (the founder takes — or doesn't — a partner): COMPLETE the founding. */
function pickPartnerAndBegin(p: LifePartner): void {
  const fam = surnameChosen;
  if (!region || !base || !standing || !styleId || !fam || !gender || !givenChosen || !firstJob || !bestFriend)
    return;
  const lifeSeeds: LifeSeedChoices = { firstJob, bestFriend, lifePartner: p };
  onComplete(seed, region, base, standing, fam, gender, givenChosen, styleId, lifeSeeds);
}
</script>

<!-- Global Escape closes the modal (the backdrop can't receive key events while focus is
     in the modal input — a11y review). `inert` on the page traps focus in the modal. -->
<svelte:window onkeydown={(e) => modalOpen && e.key === "Escape" && (modalOpen = false)} />

<main class="onboarding" inert={modalOpen}>
  {#if !region}
    <article class="card" data-phase="region">
      <p class="prompt">
        A new nation is being born, and your line will be born with it. Where does it take root?
      </p>
      <div class="choices">
        {#each FOUNDING_REGIONS as r (r.id)}
          <button type="button" onclick={() => pickRegion(r.id)}>
            <span class="opt-title">{r.label}</span>
            <span class="opt-blurb">{r.blurb}</span>
          </button>
        {/each}
      </div>
    </article>
  {:else if !base}
    <article class="card" data-phase="base">
      <p class="prompt">
        {regionInfo?.blurb} On what will the line in {regionInfo?.label} build its standing?
      </p>
      <div class="choices">
        {#each baseOptions as b (b.id)}
          <button type="button" onclick={() => pickBase(b.id)}>
            <span class="opt-title">{b.label}</span>
            <span class="opt-blurb">{b.blurb}</span>
          </button>
        {/each}
      </div>
    </article>
  {:else if !standing}
    <article class="card" data-phase="standing">
      <p class="prompt">
        {powerBaseDef(base).blurb} And does the line begin already standing, or on the rise?
      </p>
      <div class="choices">
        {#each ["established", "rising"] as const as s (s)}
          <button type="button" onclick={() => pickStanding(s)}>
            <span class="opt-title">{STANDING_LABEL[s].title}</span>
            <span class="opt-blurb">{STANDING_LABEL[s].blurb}</span>
          </button>
        {/each}
      </div>
    </article>
  {:else if !styleId}
    <article class="card" data-phase="style">
      <p class="prompt">
        This is where the {regionInfo?.label} line takes root. In what tradition is it named? (The
        region's own way is offered first, but the choice is yours.)
      </p>
      <div class="choices">
        {#each styleOptions as opt (opt.id)}
          <button type="button" onclick={() => pickStyle(opt.id)}>
            {opt.label}
          </button>
        {/each}
      </div>
    </article>
  {:else if !surnameChosen}
    <article class="card" data-phase="surname">
      <p class="prompt">
        A name is waiting to be laid over the line, carried down generations that do not yet exist.
        Which family name will it be?
      </p>
      <div class="choices">
        {#each surnameSuggestions as name (name)}
          <button type="button" onclick={() => chooseSurname(name)}>{name}</button>
        {/each}
        <button class="own" type="button" onclick={() => (modalOpen = true)}>
          Name your own line…
        </button>
      </div>
    </article>
  {:else if !gender}
    <article class="card" data-phase="gender">
      <p class="prompt">
        The {surnameChosen} line. Who is the one who founds it?
      </p>
      <div class="choices">
        {#each ["male", "female"] as const as g (g)}
          <button type="button" onclick={() => pickGender(g)}>
            <span class="opt-title">{GENDER_LABEL[g].title}</span>
            <span class="opt-blurb">{GENDER_LABEL[g].blurb}</span>
          </button>
        {/each}
      </div>
    </article>
  {:else if !givenChosen}
    <article class="card" data-phase="given">
      <p class="prompt">
        {GENDER_LABEL[gender].title} of the {surnameChosen} line. And the name {gender === "male"
          ? "he"
          : "she"} will be called by?
      </p>
      <div class="choices">
        {#each givenSuggestions as name (name)}
          <button type="button" onclick={() => bestowGiven(name)}>{name} {surnameChosen}</button>
        {/each}
        <button class="own" type="button" onclick={() => (modalOpen = true)}>
          Choose your own given name…
        </button>
      </div>
    </article>
  {:else if !firstJob}
    <article class="card" data-phase="job">
      <p class="prompt">
        {givenChosen} {surnameChosen} comes of age. What first put bread on the table — and shaped the
        hands of the line to come?
      </p>
      <div class="choices">
        {#each JOB_OPTS as o (o.id)}
          <button type="button" onclick={() => pickJob(o.id)}>
            <span class="opt-title">{o.title}</span>
            <span class="opt-blurb">{o.blurb}</span>
          </button>
        {/each}
      </div>
    </article>
  {:else if !bestFriend}
    <article class="card" data-phase="friend">
      <p class="prompt">
        Every life turns on the people in it. Who stood closest to {givenChosen} in those early years?
      </p>
      <div class="choices">
        {#each FRIEND_OPTS as o (o.id)}
          <button type="button" onclick={() => pickFriend(o.id)}>
            <span class="opt-title">{o.title}</span>
            <span class="opt-blurb">{o.blurb}</span>
          </button>
        {/each}
      </div>
    </article>
  {:else}
    <article class="card" data-phase="partner">
      <p class="prompt">
        And when the time came for the {surnameChosen} line to begin in earnest — how did {givenChosen}
        {gender === "male" ? "take a wife" : "take a husband"}, if at all?
      </p>
      <div class="choices">
        {#each PARTNER_OPTS as o (o.id)}
          <button type="button" onclick={() => pickPartnerAndBegin(o.id)}>
            <span class="opt-title">{o.title}</span>
            <span class="opt-blurb">{o.blurb}</span>
          </button>
        {/each}
      </div>
    </article>
  {/if}

  <button class="abandon" type="button" onclick={back}>Back</button>
</main>

{#if modalOpen}
  <!-- Non-disruptive overlay: the onboarding card stays mounted (inert) underneath; the
       backdrop is a real button so click AND keyboard (Enter/Space) dismiss it, and global
       Escape dismisses too — naming your own line never jolts you out of the moment. -->
  <button class="modal-backdrop" type="button" aria-label="Dismiss" onclick={() => (modalOpen = false)}
  ></button>
  <div class="modal" role="dialog" aria-modal="true" aria-label="Name your own line">
    <p class="modal-prompt">
      {surnameChosen
        ? "Speak the given name the founder will be called by."
        : "Speak the family name your line will carry through the centuries."}
    </p>
    <!-- svelte-ignore a11y_autofocus -->
    <input
      bind:value={typedName}
      autofocus
      autocomplete="off"
      maxlength="32"
      placeholder={surnameChosen ? "a given name" : "a family name"}
      onkeydown={(e) =>
        e.key === "Enter" &&
        typedName.trim() &&
        (surnameChosen ? bestowGiven(typedName) : chooseSurname(typedName))}
    />
    <div class="modal-actions">
      <button class="ghost" type="button" onclick={() => (modalOpen = false)}>Cancel</button>
      <button
        class="confirm"
        type="button"
        disabled={!typedName.trim()}
        onclick={() => (surnameChosen ? bestowGiven(typedName) : chooseSurname(typedName))}
      >
        Bestow it
      </button>
    </div>
  </div>
{/if}

<style>
  .onboarding {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    min-height: 100dvh;
    padding: max(1.25rem, env(safe-area-inset-top)) var(--mmm-pad);
    background: radial-gradient(120% 80% at 50% 0%, var(--mmm-navy-light) 0%, var(--mmm-navy) 55%, var(--mmm-navy-deep) 100%);
  }
  .card {
    max-width: 34rem;
    width: min(34rem, 92vw);
    padding: var(--mmm-pad);
    border-radius: var(--mmm-radius-lg);
    background: color-mix(in srgb, var(--mmm-surface) 55%, transparent);
    border: 1px solid color-mix(in srgb, var(--mmm-gold-deep) 50%, transparent);
    box-shadow: var(--mmm-shadow);
  }
  .prompt {
    margin: 0 0 1.1rem;
    font-family: var(--mmm-font-body);
    font-style: italic;
    font-size: 1.08rem;
    line-height: 1.5;
    color: var(--mmm-text);
  }
  .choices {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  .choices button {
    text-align: left;
    padding: 0.85rem 1rem;
    border-radius: var(--mmm-radius);
    border: 1px solid color-mix(in srgb, var(--mmm-gold-deep) 55%, transparent);
    background: color-mix(in srgb, var(--mmm-navy-deep) 70%, transparent);
    color: var(--mmm-text);
    font-family: var(--mmm-font-body);
    font-size: 1rem;
    line-height: 1.4;
    cursor: pointer;
    transition:
      border-color var(--mmm-dur-fast) var(--mmm-ease),
      transform var(--mmm-dur-fast) var(--mmm-ease);
  }
  .choices button:hover,
  .choices button:focus-visible {
    border-color: var(--mmm-gold);
    transform: translateY(-1px);
    outline: none;
  }
  .choices .own {
    font-family: var(--mmm-font-display);
    color: var(--mmm-gold);
    text-align: center;
    font-style: italic;
  }
  .opt-title {
    display: block;
    font-family: var(--mmm-font-display);
    font-weight: 700;
    color: var(--mmm-gold);
  }
  .opt-blurb {
    display: block;
    margin-top: 0.2rem;
    font-size: 0.9rem;
    color: var(--mmm-text-dim);
    line-height: 1.35;
  }
  .abandon {
    background: none;
    border: none;
    color: var(--mmm-text-dim);
    font-family: var(--mmm-font-body);
    font-size: 0.85rem;
    cursor: pointer;
  }
  .abandon:hover {
    color: var(--mmm-text);
  }
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgb(0 0 0 / 0.55);
    backdrop-filter: blur(2px);
    border: none;
    cursor: pointer;
  }
  .modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: min(24rem, 90vw);
    padding: 1.5rem;
    border-radius: var(--mmm-radius-lg);
    background: var(--mmm-surface);
    border: 1px solid var(--mmm-gold-deep);
    box-shadow: var(--mmm-shadow);
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .modal-prompt {
    margin: 0;
    font-family: var(--mmm-font-body);
    font-style: italic;
    color: var(--mmm-text);
  }
  .modal input {
    padding: 0.7rem 0.8rem;
    border-radius: var(--mmm-radius);
    border: 1px solid var(--mmm-gold-deep);
    background: var(--mmm-navy-deep);
    color: var(--mmm-text);
    font-family: var(--mmm-font-display);
    font-size: 1.1rem;
    width: 100%;
  }
  .modal input:focus-visible {
    outline: 2px solid var(--mmm-gold);
  }
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.6rem;
  }
  .modal-actions button {
    padding: 0.55rem 1rem;
    border-radius: var(--mmm-radius);
    font-family: var(--mmm-font-display);
    cursor: pointer;
  }
  .ghost {
    background: none;
    border: 1px solid var(--mmm-gold-deep);
    color: var(--mmm-text-dim);
  }
  .confirm {
    background: var(--mmm-gold);
    border: 1px solid var(--mmm-gold);
    color: var(--mmm-navy-deep);
    font-weight: 700;
  }
  .confirm:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  @media (prefers-reduced-motion: reduce) {
    .choices button {
      transition: none;
    }
  }
</style>
