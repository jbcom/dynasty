import type { Composition } from "./founding";
import { createRng, type Rng } from "./rng";
import type { Era, Place } from "./schema";
import { type Archetype, ARCHETYPES } from "./slots";

/**
 * PLACES RESOLVER (CP-R3). Helpers over the places catalog: look a place up by id,
 * resolve the diegetic birth's chosen sensory cue → place, and compose an origin
 * (place × era × culture × archetype) the founding seam (foundByComposition) takes.
 * Pure + deterministic — the catalog is validated at content-build time, so these
 * never need to defend against a place that fails to resolve.
 */

/** Find a place by id, or undefined. */
export function placeById(places: readonly Place[], id: string): Place | undefined {
  return places.find((p) => p.id === id);
}

/** The place whose sensory cue the birth chose, by exact cue match (CP-R4 birth). */
export function placeForCue(places: readonly Place[], cue: string): Place | undefined {
  return places.find((p) => p.sensoryCue === cue);
}

/** Every (place, era) pair a founding may begin in (the offered composition space). */
export function placeEraSpace(places: readonly Place[]): Array<{ place: string; era: string }> {
  return places.flatMap((p) => p.validEras.map((era) => ({ place: p.id, era })));
}

/**
 * DEAL a birth (CP-R4) — the seed-dealt origin the diegetic birth then DISCOVERS.
 * New Game doesn't configure an origin; it deals one deterministically from the seed
 * (place from the catalog, era from the place's validEras, gender, archetype, year
 * floored in the era window) and the player recognizes it through the birth events.
 * The surname is the one player-chosen field. Pure + seeded: same (seed, surname) →
 * same birth, replayable. A reroll is simply a new seed (a new hand dealt).
 */
export function dealComposition(
  places: readonly Place[],
  eras: readonly Era[],
  seed: string,
  surname: string,
  rng: Rng = createRng(`${seed}::birth`),
): Composition {
  if (places.length === 0) throw new Error("dealComposition: empty places catalog");
  const place = rng.pick(places);
  const era = rng.fork("era").pick(place.validEras);
  const eraDef = eras.find((e) => e.id === era);
  // Birth year: the era's opening year (the line is founded at the era's dawn).
  const year = eraDef?.yearStart ?? 1900;
  const gender: "male" | "female" = rng.fork("gender").next() < 0.5 ? "male" : "female";
  const archetype: Archetype = rng.fork("archetype").pick(ARCHETYPES);
  return resolveComposition(place, { era, year, archetype, gender, surname, seed });
}

/** Inputs the diegetic birth gathers around the resolved place (CP-R4). */
export interface CompositionInput {
  era: string;
  year: number;
  archetype: Archetype;
  gender: "male" | "female";
  surname: string;
  seed: string;
  /** Override the place's default culture (place ≠ culture is allowed). */
  culture?: string;
  calling?: string;
  successionMode?: "absolute" | "primogeniture" | "matriarchal";
  axisChoices?: Composition["axisChoices"];
}

/**
 * Compose an origin from a resolved place + the birth's gathered inputs (CP-R3 →
 * CP-R4). The era must be one of the place's validEras; the culture defaults to the
 * place's defaultCulture. Throws on an off-catalog (place, era) so a bad composition
 * is caught at construction, not silently founded wrong.
 */
export function resolveComposition(place: Place, input: CompositionInput): Composition {
  if (!place.validEras.includes(input.era)) {
    throw new Error(`resolveComposition: era "${input.era}" not valid for place "${place.id}"`);
  }
  return {
    place: place.id,
    era: input.era,
    culture: input.culture ?? place.defaultCulture,
    year: input.year,
    archetype: input.archetype,
    gender: input.gender,
    originId: `composed:${place.id}:${input.era}`,
    surname: input.surname,
    seed: input.seed,
    ...(input.calling ? { calling: input.calling } : {}),
    ...(input.successionMode ? { successionMode: input.successionMode } : {}),
    ...(input.axisChoices ? { axisChoices: input.axisChoices } : {}),
  };
}
