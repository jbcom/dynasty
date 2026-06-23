/**
 * EI-6a — bridge the lived Epoch-0 EMERGENCE to the founding seam (EMERGENT-INFANCY ONBOARDING).
 *
 * The Epoch-0 opening (EI-2…EI-5) accumulates the founding facets as FLAGS rather than a card menu:
 *  - region  : the `attend:<sense>` flags resolve via EI-2 resolvePlace (senses → one place).
 *  - base    : the `power_lean:<base>` flags from the formative beats — the most-leaned base wins.
 *  - standing: the `epoch0:standing_established` / `epoch0:standing_rising` flag from the childhood beat.
 *
 * This pure resolver turns that accumulated state into the `{region, base, standing}` the existing
 * `resolveFoundingStart` consumes — so the lived opening feeds `foundByComposition` with no menu. Spec:
 * docs/superpowers/specs/2026-06-23-emergent-infancy-onboarding-design.md. Pure + deterministic.
 */

import type { FoundingOriginChoice, FoundingRegion, PowerBase, Standing } from "../foundingOrigin";
import { resolvePlace, type Sense, type SenseCue } from "./senseEmergence";

const POWER_BASES: readonly PowerBase[] = [
  "land",
  "commerce",
  "pulpit",
  "law",
  "press",
  "military",
];

/** The attended senses (from `attend:<sense>` flags), in a stable order, for resolvePlace. */
function attendedSenses(flags: Iterable<string>): Sense[] {
  const out: Sense[] = [];
  for (const f of flags) {
    if (f.startsWith("attend:")) out.push(f.slice("attend:".length) as Sense);
  }
  return out;
}

/** The power base the formative beats leaned toward most (count `power_lean:<base>`); ties break by the fixed
 *  POWER_BASES order. Defaults to "land" (the era's substrate base) when no lean was set. */
function leanedBase(flags: Iterable<string>): PowerBase {
  const tally: Record<PowerBase, number> = {
    land: 0,
    commerce: 0,
    pulpit: 0,
    law: 0,
    press: 0,
    military: 0,
  };
  for (const f of flags) {
    if (f.startsWith("power_lean:")) {
      const base = f.slice("power_lean:".length) as PowerBase;
      if (base in tally) tally[base] += 1;
    }
  }
  let best: PowerBase = "land";
  for (const b of POWER_BASES) {
    if (tally[b] > tally[best]) best = b;
  }
  return best;
}

/** The standing the childhood beat read (established vs rising); defaults to "rising" (the immigrant-origin
 *  default — the line reaching, owed nothing) when neither flag is present. */
function readStanding(flags: ReadonlySet<string>): Standing {
  if (flags.has("epoch0:standing_established")) return "established";
  return "rising";
}

/**
 * Resolve the founding origin choice from the Epoch-0 emergence's accumulated flags + the dealt sense cues.
 * `cues` are EI-2's dealSenseCues for this seed (so the attend taps resolve to the right place). Pure.
 */
export function resolveEmergentFounding(
  cues: readonly SenseCue[],
  flags: Iterable<string>,
): FoundingOriginChoice {
  const flagSet = new Set(flags);
  const region: FoundingRegion = resolvePlace(cues, attendedSenses(flagSet));
  const base: PowerBase = leanedBase(flagSet);
  const standing: Standing = readStanding(flagSet);
  return { region, base, standing };
}
