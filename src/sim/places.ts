import type { Composition } from "./founding";
import { createRng, type Rng } from "./rng";
import type { Era, Place } from "./schema";
import { ARCHETYPES, type Archetype } from "./slots";

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
  // Surname is optional: the onboarding bestows it before founding; callers that already
  // know it pass it directly.
  surname = "",
  // OB-3: the PLACE may be CHOSEN by the player (geography is the one pre-founding choice).
  // When given, found there; otherwise pick a place from the seed (legacy / tests). Era,
  // gender, and archetype are still seed-dealt here — the authored Epoch-0 lets the player
  // override gender + calling(=archetype) in-game; these are the starting defaults. Placed
  // BEFORE rng so callers can specify a place without passing rng explicitly (review).
  place: Place | undefined = undefined,
  rng: Rng = createRng(`${seed}::birth`),
): Composition {
  if (places.length === 0) throw new Error("dealComposition: empty places catalog");
  // When no place is given (tests / legacy random deal), exclude the FS-ONB-DRIFT founding regions
  // (kind:"founding") — those are chosen explicitly via onboarding, never randomly dealt. This keeps the
  // legacy random pool (wave + destination) intact. The production path (App.birthGame) passes a place.
  const pool = places.filter((p) => p.kind !== "founding");
  const chosen = place ?? rng.pick(pool.length > 0 ? pool : places);
  // The schema enforces validEras.min(1), but guard defensively so a malformed
  // catalog fails loudly here rather than picking from an empty array (Q review).
  if (chosen.validEras.length === 0) {
    throw new Error(`dealComposition: place "${chosen.id}" has no validEras`);
  }
  const era = rng.fork("era").pick(chosen.validEras);
  const eraDef = eras.find((e) => e.id === era);
  // Birth year: the era's opening year (the line is founded at the era's dawn).
  const year = eraDef?.yearStart ?? 1900;
  const gender: "male" | "female" = rng.fork("gender").next() < 0.5 ? "male" : "female";
  const archetype: Archetype = rng.fork("archetype").pick(ARCHETYPES);
  return resolveComposition(chosen, { era, year, archetype, gender, surname, seed });
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
