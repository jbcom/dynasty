import { describe, expect, it } from "vitest";
import { loadContent } from "../../data/loadContent";
import { applyChoice } from "../effects";
import { pickNextEvent } from "../events";
import { createRng } from "../rng";
import type { GameState } from "../state";
import { initState } from "../state";
import { advanceTimeline, applyJump } from "../timeline";

/**
 * LINEAR TIME — runtime invariant half of the chronology pair.
 *
 * The sacred-timeline data test proves the authored content is sound; this one
 * proves no SEQUENCE OF PLAY can bend it. Every transition the engine can make
 * — a choice, a timeline hop, an era roll-over — must leave the four temporal
 * fields (`year`, `eraIndex`, `age`, `lastEventYear`) non-decreasing. Time only
 * ever moves forward or stands still; it NEVER rewinds. Replay reconstructs the
 * exact same chronology from seed + history.
 *
 * If this fails: some new jump/advance/effect path moved the clock backward.
 * That breaks determinism, the consequence scheduler (which fires on due year),
 * and the player's basic trust that history doesn't un-happen. Fix the engine.
 */

const content = loadContent();

/** The four fields that define "where/when we are". None may ever decrease. */
const temporal = (s: GameState) => ({
  year: s.year,
  eraIndex: s.eraIndex,
  age: s.age,
  lastEventYear: s.lastEventYear,
});

function assertForward(prev: GameState, next: GameState, label: string) {
  expect(next.year, `${label}: year went backward`).toBeGreaterThanOrEqual(prev.year);
  expect(next.eraIndex, `${label}: eraIndex went backward`).toBeGreaterThanOrEqual(prev.eraIndex);
  expect(next.age, `${label}: age went backward`).toBeGreaterThanOrEqual(prev.age);
  expect(
    next.lastEventYear,
    `${label}: lastEventYear (the time floor) went backward`,
  ).toBeGreaterThanOrEqual(prev.lastEventYear);
}

describe("linear time — full seeded playthroughs never rewind the clock", () => {
  // A spread of seeds explores different branches/jumps/endings.
  const seeds = ["a", "b", "c", "trump", "musk", "kennedy", "42", "nazi-ish", "theo", "zzz"];
  for (const seed of seeds) {
    it(`seed "${seed}": every step moves time forward or holds, never back`, () => {
      let state = initState(content, seed);
      const rng = createRng(seed);
      let stepped = false;
      for (let i = 0; i < 600 && !state.end; i++) {
        const event = pickNextEvent(content, state, rng.fork(`pick:${i}`));
        if (!event) {
          const before = state;
          const advanced = advanceTimeline(content, {
            ...state,
            eraEventCount: Number.MAX_SAFE_INTEGER,
          });
          assertForward(before, advanced, `seed ${seed} force-advance #${i}`);
          if (advanced.eraIndex === state.eraIndex && !advanced.end) break;
          state = advanced;
          continue;
        }
        const eligible = event.choices;
        const choice = rng.fork(`choose:${i}`).pick(eligible);
        const before = state;
        const after = applyChoice(content, state, event, choice.id, rng).state;
        assertForward(before, after, `seed ${seed} choice ${event.id}/${choice.id} #${i}`);
        state = after;
        stepped = true;
      }
      // The run actually did something (guards against a vacuous pass).
      expect(stepped || state.end).toBeTruthy();
    });
  }
});

describe("linear time — the engine resists explicit backward moves", () => {
  it("a jumpTo an EARLIER era is ignored (forward-only hop)", () => {
    // Put the player in a late era, then offer a hop back to era 0.
    const lateIdx = content.eras.length - 2;
    const lateEra = content.eras[lateIdx];
    expect(lateEra).toBeDefined();
    const earlyEra = content.eras[0];
    const state: GameState = {
      ...initState(content, "seed"),
      eraIndex: lateIdx,
      year: lateEra?.yearStart ?? 2100,
      lastEventYear: lateEra?.yearStart ?? 2100,
    };
    const backHop = {
      id: "x",
      text: "",
      effects: {},
      personality: {},
      setFlags: [],
      clearFlags: [],
      ripples: [],
      outcome: "",
      jumpTo: { era: earlyEra?.id },
    };
    const hopped = applyJump(content, state, backHop);
    expect(hopped.eraIndex).toBe(lateIdx); // unchanged — cannot rewind to era 0
    expect(hopped.year).toBeGreaterThanOrEqual(state.year);
  });

  it("yearAdvance only ever raises the time floor (never lowers it)", () => {
    const base = initState(content, "seed");
    const fwd = {
      id: "x",
      text: "",
      effects: {},
      personality: {},
      setFlags: [],
      clearFlags: [],
      ripples: [],
      outcome: "",
      jumpTo: { yearAdvance: 10 },
    };
    const after = applyJump(content, base, fwd);
    expect(after.year).toBeGreaterThanOrEqual(base.year);
    expect(after.lastEventYear).toBeGreaterThanOrEqual(base.lastEventYear);
    expect(after.age).toBeGreaterThanOrEqual(base.age);
  });

  it("advanceTimeline rolling into the next era never lands before the current year", () => {
    // Walk era by era; each roll-over must land at-or-after the prior year.
    let state = initState(content, "seed");
    for (let guard = 0; guard < 50 && !state.end; guard++) {
      const before = state;
      const next = advanceTimeline(content, {
        ...state,
        eraEventCount: Number.MAX_SAFE_INTEGER,
      });
      assertForward(before, next, `roll-over from era ${before.eraIndex}`);
      if (next.eraIndex === state.eraIndex && !next.end) break;
      state = next;
    }
  });
});

describe("linear time — replay reconstructs an identical chronology", () => {
  it("the same seed + history yields the same temporal trace twice", () => {
    const trace = (seed: string) => {
      let state = initState(content, seed);
      const rng = createRng(seed);
      const stamps: ReturnType<typeof temporal>[] = [temporal(state)];
      for (let i = 0; i < 200 && !state.end; i++) {
        const event = pickNextEvent(content, state, rng.fork(`pick:${i}`));
        if (!event) {
          const advanced = advanceTimeline(content, {
            ...state,
            eraEventCount: Number.MAX_SAFE_INTEGER,
          });
          if (advanced.eraIndex === state.eraIndex && !advanced.end) break;
          state = advanced;
          stamps.push(temporal(state));
          continue;
        }
        const choice = rng.fork(`choose:${i}`).pick(event.choices);
        state = applyChoice(content, state, event, choice.id, rng).state;
        stamps.push(temporal(state));
      }
      return stamps;
    };
    expect(trace("replay-seed")).toEqual(trace("replay-seed"));
  });
});
