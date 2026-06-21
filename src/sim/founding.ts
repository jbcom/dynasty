import type { Content } from "./content";
import { getCulture, pickGivenName } from "./onomastics";
import { createRng } from "./rng";
import type { StartMoment } from "./schema";
import { type GameState, initState, withFlag } from "./state";

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

  // Progenitor given name from the moment's culture (seeded, deterministic).
  const culture = getCulture({ cultures: content.onomastics }, moment.culture);
  const nameRng = createRng(`${input.seed}::founding:${moment.id}:given`);
  const progenitorGiven = pickGivenName(culture, moment.progenitorSex, nameRng);
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

  const state: GameState = {
    ...base,
    flags,
    birthYear,
    year: moment.year,
    age: moment.year - birthYear,
    lastEventYear: moment.year,
    founding: {
      momentId: moment.id,
      surname: input.surname,
      culture: moment.culture,
      place: moment.place,
    },
  };

  return { state, progenitorGiven, progenitorName, moment };
}
