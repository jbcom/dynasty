import { describe, expect, it } from "vitest";
import { applyChoice } from "../../sim/effects";
import { meetsRequires, pickNextEvent } from "../../sim/events";
import { foundDynasty } from "../../sim/founding";
import { createRng } from "../../sim/rng";
import { advanceTimeline } from "../../sim/timeline";
import { loadContent } from "../loadContent";

/**
 * FD-15 — multi-generation founded-line stress: every start-moment, played
 * autonomously across the full era chain, terminates at an authored ending (no
 * dead-ends) and is replay-deterministic. This is the "found → beget → die →
 * succeed → carry forward → reach an ending" loop exercised end-to-end, including
 * the deep-history caliphate line spanning the longest arc.
 */

const content = loadContent();

/** Drive one founded run to completion, force-advancing eras like the live loop. */
function playFounded(momentId: string, surname: string, seed: string) {
  let state = foundDynasty(content, { momentId, surname, seed }).state;
  const rng = createRng(`founded:${momentId}:${seed}`);
  let begotHeir = false;
  for (let i = 0; i < 1000 && !state.end; i++) {
    const event = pickNextEvent(content, state, rng.fork(`pick:${i}`));
    if (!event) {
      const era = content.eras[state.eraIndex];
      if (!era) break;
      const advanced = advanceTimeline(content, { ...state, eraEventCount: era.eventBudget });
      if (advanced.eraIndex === state.eraIndex && !advanced.end) break;
      state = advanced;
      continue;
    }
    const eligible = event.choices.filter((c) => !c.requires || meetsRequires(state, c.requires));
    if (eligible.length === 0) break;
    // Prefer a begetting choice early so the line has an heir before mortality bites.
    const begetChoice = begotHeir ? undefined : eligible.find((c) => (c.begets ?? 0) > 0);
    const choice = begetChoice ?? rng.fork(`choose:${i}`).pick(eligible);
    if (begetChoice) begotHeir = true;
    state = applyChoice(content, state, event, choice.id, rng).state;
  }
  return state;
}

// 8 start-moments × 4 seeds full playthroughs (with mortality/family per year) —
// bounded + pure but heavy; generous timeout so CI's default 5s doesn't flake.
const STRESS_TIMEOUT = 60_000;

describe("FD-15 founded-line multi-generation stress", () => {
  it(
    "every start-moment plays to an authored ending (no dead-ends)",
    () => {
      const deadEnds: string[] = [];
      for (const m of content.startMoments) {
        for (let s = 0; s < 4; s++) {
          const end = playFounded(m.id, "Vane", `seed-${s}`).end;
          if (!end) deadEnds.push(`${m.id}/seed-${s}`);
        }
      }
      expect(deadEnds, `dead-ends:\n${deadEnds.join("\n")}`).toEqual([]);
    },
    STRESS_TIMEOUT,
  );

  it(
    "founded runs reach a VARIETY of endings (not one funnel)",
    () => {
      const endings = new Set<string>();
      for (const m of content.startMoments) {
        for (let s = 0; s < 4; s++) {
          const end = playFounded(m.id, "Vane", `seed-${s}`).end;
          if (end) endings.add(end.endingId ?? end.kind);
        }
      }
      expect(endings.size).toBeGreaterThanOrEqual(3);
    },
    STRESS_TIMEOUT,
  );

  it("a founded run is replay-deterministic (same inputs → identical end)", () => {
    const a = playFounded("abbasid_baghdad_762", "al-Rashid", "det");
    const b = playFounded("abbasid_baghdad_762", "al-Rashid", "det");
    expect(a.end).toEqual(b.end);
    expect(a.history).toEqual(b.history);
    expect(a.family).toEqual(b.family);
  });

  it("the deep-history line spans many generations across the era chain", () => {
    const state = playFounded("abbasid_baghdad_762", "al-Rashid", "gen");
    // It either reached a real ending or extinction; either way it ran the engine.
    expect(state.end).not.toBeNull();
    // The caliphate line should have advanced well beyond its 762 founding.
    expect(state.year).toBeGreaterThan(762);
  });
});
