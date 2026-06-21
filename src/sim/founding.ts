import { axisByKind, axisIntensityFor, axisOptionById, resolveAxisChoice } from "./axes";
import type { Content } from "./content";
import { seedFamily } from "./family";
import { applyDelta } from "./meters";
import { getCulture, pickGivenName } from "./onomastics";
import { applyPersonality } from "./personality";
import { createRng } from "./rng";
import type { AxisKind, StartMoment } from "./schema";
import type { Archetype } from "./slots";
import { type GameState, initState, withFlag } from "./state";
import { resolveStack } from "./worldStacks";

/**
 * FD-6.2 — the "found your own dynasty" founding flow. `foundDynasty` turns a
 * start-moment + a player surname + a seed into an initial GameState: it begins
 * the run in the moment's era (deep-history starts in its prefix era), stamps the
 * founding year as the progenitor's birth year, seeds the moment's founding flags
 * plus archetype/place/deep-history markers, picks a period+culture-accurate
 * progenitor given name via onomastics, and records the founding metadata that
 * FD-7 (world-stacks, keyed by place) and FD-8 (birth mechanics, keyed by culture)
 * build on. Pure + seeded — the same (moment, surname, seed) reconstructs the same
 * founding on replay.
 */

export interface FoundingInput {
  /** The chosen start-moment's id (must exist in content.startMoments). */
  momentId: string;
  /** The player-chosen surname for the line. */
  surname: string;
  /** The run seed. */
  seed: string;
  /** The founding CALLING id (CP-2), optional — a durable generational lens. */
  calling?: string;
  /** Progenitor gender (CP-3) — overrides the moment's default progenitorSex. */
  gender?: "male" | "female";
  /** Succession mode (CP-3) — defaults to absolute (eldest regardless of sex). */
  successionMode?: "absolute" | "primogeniture" | "matriarchal";
  /** Epoch-0 axis stances (CP-4): per-axis chosen option id (faith/ideology/…). */
  axisChoices?: Partial<Record<AxisKind, string>>;
}

/**
 * COMPOSED ORIGIN (CP-R2) — the diegetic founding model. An origin is composed
 * INDEPENDENTLY from PLACE × ERA × CULTURE × ARCHETYPE rather than picked from a
 * fixed start-moment. The diegetic birth (CP-R4) builds this from sensory cues;
 * start-moments are now just one convenient SOURCE of a composition, not the only
 * entry. `foundByComposition` is the single pure founding seam the UI feeds.
 */
export interface Composition {
  /** Geography (FD-7 world-stack key). */
  place: string;
  /** The era id the run begins in (matches eras/index.json). */
  era: string;
  /** Onomastics culture id (given-name lane + conventions). */
  culture: string;
  /** The founding year (the progenitor's birth year). */
  year: number;
  /** Power archetype the line is built on (6 power bases). */
  archetype: Archetype;
  /** Progenitor sex (drives the onomastic given-name pool). */
  gender: "male" | "female";
  /** Deep-history origin (centuries back) — flags reach handling. */
  deepHistory?: boolean;
  /** A stable origin id for flags/save (e.g. a moment id, or `composed:<place>:<era>`). */
  originId?: string;
  /** The player-chosen surname for the line. */
  surname: string;
  /** The run seed. */
  seed: string;
  /** The founding CALLING id (CP-2), optional. */
  calling?: string;
  /** Succession mode (CP-3) — defaults to absolute. */
  successionMode?: "absolute" | "primogeniture" | "matriarchal";
  /** Epoch-0 axis stances (CP-4). */
  axisChoices?: Partial<Record<AxisKind, string>>;
}

/** The progenitor's given name + the founding state, for the UI + the run. */
export interface FoundingResult {
  state: GameState;
  /** The seeded progenitor given name (e.g. "Patrick", "Friedrich"). */
  progenitorGiven: string;
  /** The full progenitor name "<given> <surname>". */
  progenitorName: string;
  /** The start-moment a moment-founded run came from (absent for a pure composition). */
  moment?: StartMoment;
}

function findMoment(content: Content, momentId: string): StartMoment {
  const m = content.startMoments.find((x) => x.id === momentId);
  if (!m) throw new Error(`foundDynasty: unknown start-moment "${momentId}"`);
  return m;
}

/** Expand a start-moment + the player's choices into a composed origin (CP-R2). */
export function compositionFromMoment(moment: StartMoment, input: FoundingInput): Composition {
  return {
    place: moment.place,
    era: moment.startEra,
    culture: moment.culture,
    year: moment.year,
    archetype: moment.archetype,
    gender: input.gender ?? moment.progenitorSex,
    deepHistory: moment.deepHistory,
    originId: moment.id,
    surname: input.surname,
    seed: input.seed,
    ...(input.calling ? { calling: input.calling } : {}),
    ...(input.successionMode ? { successionMode: input.successionMode } : {}),
    ...(input.axisChoices ? { axisChoices: input.axisChoices } : {}),
  };
}

/**
 * Found a dynasty from a COMPOSED ORIGIN (CP-R2) — the single pure founding seam.
 * Begins the run in the composition's era + archetype baseline, stamps the founding
 * year as the progenitor's birth year, seeds the structural founding flags
 * (founded_line + founded/archetype/place/culture markers + deep-history), applies
 * the Epoch-0 axis stances scaled by the place×era stack, picks a period+culture-
 * accurate progenitor given name, and seeds the live family tree. Pure + seeded:
 * the same composition reconstructs the same founding on replay.
 */
export function foundByComposition(content: Content, c: Composition): FoundingResult {
  const originId = c.originId ?? `composed:${c.place}:${c.era}`;

  // Base state in the composition's era + archetype (FD-3.5 — no literal preset key).
  const base = initState(content, c.seed, c.archetype, c.era);

  // Progenitor given name from the culture + gender (seeded, deterministic).
  const culture = getCulture({ cultures: content.onomastics }, c.culture);
  const nameRng = createRng(`${c.seed}::founding:${originId}:given`);
  const progenitorGiven = pickGivenName(culture, c.gender, nameRng);
  const progenitorName = `${progenitorGiven} ${c.surname}`;

  const birthYear = c.year;

  // Founding flags: structural markers so place/archetype-gated content is reachable
  // from turn one (the founding's own first choice happens in-game).
  let flags = [...base.flags];
  for (const f of [
    "founded_line", // generic marker: this is a found-your-own run
    `founded:${originId}`,
    `archetype:${c.archetype}`,
    `place:${c.place}`,
    `culture:${c.culture}`,
    // PL-3: the diegetic ONBOARDING already played the consciousness-emergence and
    // bestowed the surname, so the in-game emergence-cue + naming beats are done. Seed
    // their flags here so the in-game Epoch-0 opens at the genuine GENDER reveal and
    // flows on to the calling — no redundant "what does it feel like?" cue that could
    // contradict the already-dealt place, no re-naming a line the player just named.
    "emerged",
    "named",
    ...(c.deepHistory ? ["deep_history_line"] : []),
  ]) {
    flags = withFlag(flags, f);
  }

  // EPOCH-0 AXIS CHOICES (CP-4): each stance sets durable flags + meter/personality
  // deltas SCALED by the founding place×era stack's intensity on that axis.
  let meters = base.meters;
  let personality = base.personality;
  const stack = resolveStack(content.worldStacks, c.place, c.era);
  for (const [axisKind, optionId] of Object.entries(c.axisChoices ?? {}) as [AxisKind, string][]) {
    const axis = axisByKind(content.axes, axisKind);
    const option = axis && axisOptionById(axis, optionId);
    if (!axis || !option) continue;
    const resolved = resolveAxisChoice(option, axisIntensityFor(stack, axisKind));
    for (const f of resolved.setFlags) flags = withFlag(flags, f);
    meters = applyDelta(content.meters, meters, resolved.effects);
    personality = applyPersonality(personality, resolved.personality);
  }

  // Seed the LIVE family tree (FD-8) with the progenitor.
  const family = seedFamily({
    given: progenitorGiven,
    surname: c.surname,
    sex: c.gender,
    born: c.year,
  });

  const state: GameState = {
    ...base,
    flags,
    meters,
    personality,
    birthYear,
    year: c.year,
    age: c.year - birthYear,
    lastEventYear: c.year,
    founding: {
      momentId: originId,
      surname: c.surname,
      culture: c.culture,
      place: c.place,
      // Composed-origin fields (CP-R2) so a save reconstructs via foundByComposition.
      era: c.era,
      year: c.year,
      archetype: c.archetype,
      ...(c.deepHistory ? { deepHistory: true } : {}),
      ...(c.calling ? { calling: c.calling } : {}),
      gender: c.gender,
      ...(c.successionMode ? { successionMode: c.successionMode } : {}),
      ...(c.axisChoices ? { axisChoices: c.axisChoices } : {}),
    },
    family,
  };

  return { state, progenitorGiven, progenitorName };
}

/**
 * Found a dynasty at a start-moment (the thin convenience over `foundByComposition`,
 * CP-R2). Expands the moment + the player's choices into a composition, then founds.
 * Pure + seeded — the same (moment, surname, seed) reconstructs the same founding.
 */
export function foundDynasty(content: Content, input: FoundingInput): FoundingResult {
  const moment = findMoment(content, input.momentId);
  const result = foundByComposition(content, compositionFromMoment(moment, input));
  return { ...result, moment };
}
