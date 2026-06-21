import { axisByKind, axisIntensityFor, axisOptionById, resolveAxisChoice } from "./axes";
import type { Content } from "./content";
import { seedFamily } from "./family";
import { applyDelta } from "./meters";
import { getCulture, pickGivenName } from "./onomastics";
import { applyPersonality } from "./personality";
import { createRng } from "./rng";
import type { AxisKind, StartMoment } from "./schema";
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

/** The progenitor's given name + the founding state, for the UI + the run. */
export interface FoundingResult {
  state: GameState;
  /** The seeded progenitor given name (e.g. "Patrick", "Friedrich"). */
  progenitorGiven: string;
  /** The full progenitor name "<given> <surname>". */
  progenitorName: string;
  moment: StartMoment;
}

function findMoment(content: Content, momentId: string): StartMoment {
  const m = content.startMoments.find((x) => x.id === momentId);
  if (!m) throw new Error(`foundDynasty: unknown start-moment "${momentId}"`);
  return m;
}

/**
 * Found a dynasty at a start-moment. The run uses the generic "trump" dynasty key
 * as the engine baseline (the preset key is irrelevant to a founded line — the
 * `founding` metadata drives place/culture), starts in the moment's era, and is
 * seeded with the moment's founding flags + archetype/place markers.
 */
export function foundDynasty(content: Content, input: FoundingInput): FoundingResult {
  const moment = findMoment(content, input.momentId);

  // Base state in the moment's era; the founded line's identity is the moment's
  // ARCHETYPE (FD-3.5 — no literal preset key), refined by the `founding` metadata.
  const base = initState(content, input.seed, moment.archetype, moment.startEra);

  // Progenitor gender (CP-3): the player's choice overrides the moment default.
  const gender = input.gender ?? moment.progenitorSex;

  // Progenitor given name from the moment's culture + gender (seeded, deterministic).
  const culture = getCulture({ cultures: content.onomastics }, moment.culture);
  const nameRng = createRng(`${input.seed}::founding:${moment.id}:given`);
  const progenitorGiven = pickGivenName(culture, gender, nameRng);
  const progenitorName = `${progenitorGiven} ${input.surname}`;

  // Birth year + age track from the founding year, not the preset baseline.
  const birthYear = moment.year;

  // Founding flags: the moment's own founding choice happens in-game, but we seed
  // the structural markers so the moment's opener + place/archetype-gated content
  // is reachable from turn one.
  let flags = [...base.flags];
  for (const f of [
    `founded:${moment.id}`,
    `archetype:${moment.archetype}`,
    `place:${moment.place}`,
    `culture:${moment.culture}`,
    ...(moment.deepHistory ? ["deep_history_line"] : []),
  ]) {
    flags = withFlag(flags, f);
  }

  // EPOCH-0 AXIS CHOICES (CP-4): each chosen stance sets durable flags + meter/
  // personality deltas SCALED by the founding place×era stack's intensity on that
  // axis — so the same stance lands differently by place/time.
  let meters = base.meters;
  let personality = base.personality;
  const stack = resolveStack(content.worldStacks, moment.place, moment.startEra);
  for (const [axisKind, optionId] of Object.entries(input.axisChoices ?? {}) as [
    AxisKind,
    string,
  ][]) {
    const axis = axisByKind(content.axes, axisKind);
    const option = axis && axisOptionById(axis, optionId);
    if (!axis || !option) continue;
    const resolved = resolveAxisChoice(option, axisIntensityFor(stack, axisKind));
    for (const f of resolved.setFlags) flags = withFlag(flags, f);
    meters = applyDelta(content.meters, meters, resolved.effects);
    personality = applyPersonality(personality, resolved.personality);
  }

  // Seed the LIVE family tree (FD-8) with the progenitor — the root the line grows
  // from via beget/death/succession. Deterministic from the founding inputs.
  const family = seedFamily({
    given: progenitorGiven,
    surname: input.surname,
    sex: gender,
    born: moment.year,
  });

  const state: GameState = {
    ...base,
    flags,
    meters,
    personality,
    birthYear,
    year: moment.year,
    age: moment.year - birthYear,
    lastEventYear: moment.year,
    founding: {
      momentId: moment.id,
      surname: input.surname,
      culture: moment.culture,
      place: moment.place,
      ...(input.calling ? { calling: input.calling } : {}),
      gender,
      ...(input.successionMode ? { successionMode: input.successionMode } : {}),
      ...(input.axisChoices ? { axisChoices: input.axisChoices } : {}),
    },
    family,
  };

  return { state, progenitorGiven, progenitorName, moment };
}
