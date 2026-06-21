import { describe, expect, it } from "vitest";
import { applyChoice } from "../../sim/effects";
import { meetsRequires, pickNextEvent } from "../../sim/events";
import { createRng } from "../../sim/rng";
import type { Choice, GameEvent } from "../../sim/schema";
import type { Archetype } from "../../sim/slots";
import type { GameState } from "../../sim/state";
import { initState } from "../../sim/state";
import { advanceTimeline } from "../../sim/timeline";
import { loadContent } from "../loadContent";

/**
 * DE-6b — PERSONA PLAYTEST SWEEP (serial, deterministic — no agents).
 *
 * Instead of fanning out LLM agents (which inherit the directive machinery and
 * collide), this drives the pure sim with a set of distinct PERSONA STRATEGIES —
 * different choice-selection policies modelling how different human players play —
 * across all three dynasties, and asserts the coverage invariants the persona
 * sweep is meant to protect:
 *   • NO DEAD-ENDS: every persona × dynasty run terminates with an authored ending.
 *   • NO SINGLE DOMINANT ENDING: across the sweep, outcomes are varied (a healthy
 *     decision space, not one strategy funnelling everyone to the same screen).
 *   • DETERMINISM: a persona+seed+dynasty run is reproducible to the bit.
 */

const content = loadContent();
const ARCHETYPES: Archetype[] = ["economic", "technological", "political", "religious"];

/** A persona is a deterministic policy: rank the eligible choices; the best is
 *  picked. `score` higher = more preferred. The caller guarantees a non-empty
 *  list, so argmax always returns a real Choice. */
type Persona = {
  name: string;
  score: (c: Choice, rngPick: () => number) => number;
};

/** Sum of a choice's positive meter payoff (heat counts against). */
function payoff(c: Choice): number {
  let s = 0;
  for (const [k, v] of Object.entries(c.effects)) s += k === "heat" ? -v : v;
  return s;
}

const PERSONAS: Persona[] = [
  // The optimizer: highest net-payoff choice.
  { name: "min-maxer", score: (c) => payoff(c) },
  // The chaos tester: stable order (button-masher takes the first listed).
  { name: "button-masher", score: () => 0 },
  // The moralist: leans toward the utopian axis (low outward/ideology).
  {
    name: "moralist",
    score: (c) => -((c.personality.outward ?? 0) + (c.personality.ideology ?? 0)),
  },
  // The villain: most grandiose / tyrannical.
  {
    name: "villain",
    score: (c) => (c.personality.grandiosity ?? 0) + (c.personality.outward ?? 0),
  },
  // The roleplayer: seeded-random among eligible.
  { name: "roleplayer", score: (_c, rngPick) => rngPick() },
];

/** Argmax over a non-empty choice list by the persona's score (stable: first wins ties). */
function pickByPersona(persona: Persona, choices: Choice[], rngPick: () => number): Choice {
  let best = choices[0] as Choice;
  let bestScore = persona.score(best, rngPick);
  for (let i = 1; i < choices.length; i++) {
    const c = choices[i] as Choice;
    const s = persona.score(c, rngPick);
    if (s > bestScore) {
      best = c;
      bestScore = s;
    }
  }
  return best;
}

/** Drive one persona run; returns the terminal state. Deterministic per (persona,seed,dynasty).
 *  Mirrors autoPlaythrough's progression: when no event is eligible, force-advance the
 *  timeline (so an era that ran dry rolls forward / ends) rather than stalling. */
function runPersona(persona: Persona, seed: string, archetype: Archetype): GameState {
  let state = initState(content, seed, archetype);
  const rng = createRng(`${persona.name}:${seed}:${archetype}`);
  for (let i = 0; i < 600 && !state.end; i++) {
    const event: GameEvent | null = pickNextEvent(content, state, rng.fork(`pick:${i}`));
    if (!event) {
      const advanced = advanceTimeline(content, {
        ...state,
        eraEventCount: Number.MAX_SAFE_INTEGER,
      });
      if (advanced.eraIndex === state.eraIndex && !advanced.end) break; // truly stuck
      state = advanced;
      continue;
    }
    const eligible = event.choices.filter((c) => !c.requires || meetsRequires(state, c.requires));
    if (eligible.length === 0) break;
    const pickRng = rng.fork(`pick-val:${i}`);
    const choice = pickByPersona(persona, eligible, () => pickRng.float(0, 1));
    state = applyChoice(content, state, event, choice.id, rng).state;
  }
  return state;
}

// Heavy deterministic sweeps: 5 personas × 4 archetypes × 6 seeds = 120 full
// playthroughs each (incl. mortality/family per-year passes). Generous timeout so
// CI's default 5s doesn't flake on a slower runner — the work is bounded + pure.
const SWEEP_TIMEOUT = 60_000;

describe("DE-6b persona playtest sweep", () => {
  it(
    "no persona × dynasty run dead-ends — every run reaches an authored ending",
    () => {
      const deadEnds: string[] = [];
      for (const persona of PERSONAS) {
        for (const archetype of ARCHETYPES) {
          for (let s = 0; s < 6; s++) {
            const end = runPersona(persona, `seed-${s}`, archetype).end;
            if (!end) deadEnds.push(`${persona.name}/${archetype}/seed-${s}`);
          }
        }
      }
      expect(deadEnds, `dead-ends:\n${deadEnds.join("\n")}`).toEqual([]);
    },
    SWEEP_TIMEOUT,
  );

  it(
    "the sweep produces a VARIETY of endings (no single dominant outcome)",
    () => {
      const endings = new Set<string>();
      for (const persona of PERSONAS) {
        for (const archetype of ARCHETYPES) {
          for (let s = 0; s < 6; s++) {
            const end = runPersona(persona, `seed-${s}`, archetype).end;
            if (end?.endingId) endings.add(end.endingId);
            else if (end) endings.add(end.kind);
          }
        }
      }
      // Across the persona × archetype × seed matrix the decision space should
      // yield several distinct endings — not funnel everyone to one screen.
      expect(endings.size).toBeGreaterThanOrEqual(4);
    },
    SWEEP_TIMEOUT,
  );

  it("a persona run is deterministic (same persona+seed+dynasty → identical end)", () => {
    const a = runPersona(PERSONAS[0] as Persona, "det", "technological");
    const b = runPersona(PERSONAS[0] as Persona, "det", "technological");
    expect(a.end).toEqual(b.end);
    expect(a.history).toEqual(b.history);
  });
});
