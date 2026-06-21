import type { Composition } from "./founding";
import type { Archetype } from "./slots";
import type { Place } from "./schema";

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
