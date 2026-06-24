/**
 * GA-MAP-ART (GM-1) — pure prompts for the era-progressing CARTOGRAPHIC BASE under the MapView journey.
 * The journey runs founding → the stars across the 8 era bands; the base shouldn't be a fixed 1700s chart the
 * whole way. This generates a period-true map base PER era band (a colonial coast chart → an industrial rail
 * survey → a mid-century road atlas → a digital satellite globe → a stellar star-chart), swapped as the line
 * advances. Generated OFFLINE (Imagen) and cached as an asset; the MapView loads it under its data-overlay with
 * a graceful fallback (sim purity — no API at render time). Reuses the engraving-chronicle register so the base
 * coheres with the portraits/dossiers/cinematics. Spec: docs/.../genai-surface-audit + directive GA-MAP-ART.
 *
 * Pure prompt strings + a stable key; the live Imagen client + offline runner do the generation.
 */

import { ERA_BAND_ORDER, type EraBand } from "./portrait";

/** The cartographic register per era band — WHAT the period would draw, and HOW that society rendered a map. */
const ERA_MAP: Record<EraBand, string> = {
  founding_1700s:
    "a late-1700s hand-engraved coastal chart of the new republic — ink-wash coastline, a compass rose, " +
    "soundings and a cartouche, the unmapped interior left open",
  federal_1800s:
    "an early-19th-century surveyor's map of a young expanding nation — turnpikes and canals, county lines " +
    "freshly drawn, copperplate lettering",
  industrial_late1800s:
    "a Gilded-Age railroad and industry survey map — rail lines fanning across the continent, smoke-stack " +
    "cities marked, dense engraved hatching",
  early_1900s:
    "an early-20th-century atlas plate — electrified cities, shipping lanes and early air routes, the modern " +
    "century's grid taking shape",
  midcentury:
    "a mid-century printed road atlas — highways and interchanges, clean two-color cartography, a confident " +
    "postwar continental sweep",
  digital_modern:
    "a contemporary satellite-imagery globe — coastlines from orbit, city lights at night, a data-layer sheen " +
    "over real terrain",
  near_future:
    "a refined near-future cartography — orbital and lunar waypoints joined to Earth, quiet high-technology " +
    "rendering, clean luminous linework",
  stellar:
    "a stellar-age star-chart — colonized systems and transit lanes among the stars, a celestial atlas of the " +
    "line's reach across the cosmos",
};

/** The locked MAP STYLE — the engraving-chronicle signature applied to cartography, cohesive with the still art. */
export const MAP_STYLE =
  "Rendered as a plate in a dynastic chronicle's atlas: a muted, limited palette with a single gold-ochre and " +
  "oxblood accent on aged parchment, painterly and period-grounded. A clean cartographic BASE with NO route " +
  "lines, NO modern labels, NO on-screen text, NO real-person likeness, NO logos — atmosphere a data-overlay sits atop.";

/** The deterministic asset key for an era's map base (the png stem the MapView loads). */
export function mapKey(eraBand: EraBand): string {
  return `map:${eraBand}`;
}

/** Build the Imagen prompt for an era band's cartographic base (GM-1). Pure. */
export function buildMapPrompt(eraBand: EraBand): string {
  return [`A period cartographic map base: ${ERA_MAP[eraBand]}.`, MAP_STYLE].join(" ");
}

/** Every era band's map job (key + prompt) — the offline runner's default full set. Pure. */
export function allMapJobs(): Array<{ eraBand: EraBand; key: string; prompt: string }> {
  return ERA_BAND_ORDER.map((eraBand) => ({
    eraBand,
    key: mapKey(eraBand),
    prompt: buildMapPrompt(eraBand),
  }));
}
