import { describe, expect, it } from "vitest";
import { applyChoice } from "../../sim/effects";
import { eligibleEvents, pickNextEvent } from "../../sim/events";
import { createRng } from "../../sim/rng";
import { initState } from "../../sim/state";
import { advanceTimeline } from "../../sim/timeline";
import { loadContent } from "../loadContent";

/**
 * PROLOGUE GATING — Epoch 0 must PLAY, not be skipped (user bug, 2026-06-20).
 *
 * Regression for a real playability bug: a fresh Trump game could pick
 * ev_donald_is_born (1946) on the very first turn, skipping the entire
 * Friedrich/Fred dynastic prologue (1885-1945) that determines branch, capital,
 * heir framing, etc. Root cause: the birth event had `requires.flags: []`, so it
 * sat in the eligible pool from turn one. Fix: gate the birth on dynasty_capital
 * (the family-fortune-established milestone, reliably reached by deliberate play)
 * so the prologue must run first.
 */

const content = loadContent();

describe("Epoch-0 prologue is not skippable (Trump dynasty)", () => {
  it("the birth is NOT eligible on turn one — only the prologue opener is", () => {
    const start = initState(content, "seed", "economic");
    const ids = eligibleEvents(content, start).map((e) => e.id);
    expect(ids).not.toContain("ev_donald_is_born");
    // The dynastic prologue opens the game (Friedrich leaving Kallstadt).
    expect(ids).toContain("ev_friedrich_leaves_kallstadt");
  });

  it("the birth IS reachable via deliberate dynasty-building play (every seed)", () => {
    // A player who builds the family fortune reaches the birth — the prologue is a
    // completable corridor, not a soft-lock. (Pure-random play may miss it; that's
    // fine — random play makes incoherent choices. Deliberate play must always work.)
    const dynastyFlags = new Set([
      "dynasty_capital",
      "fred_builder",
      "real_capital",
      "married_elizabeth",
      "married_mary_anne",
      "returned_to_ny",
      "fled_bavaria",
    ]);
    let reached = 0;
    const SEEDS = 8;
    for (let s = 0; s < SEEDS; s++) {
      let state = initState(content, `d${s}`, "economic");
      const rng = createRng(`d${s}`);
      for (let i = 0; i < 300 && !state.end; i++) {
        const event = pickNextEvent(content, state, rng.fork(`p${i}`));
        if (!event) {
          const advanced = advanceTimeline(content, {
            ...state,
            eraEventCount: Number.MAX_SAFE_INTEGER,
          });
          if (advanced.eraIndex === state.eraIndex && !advanced.end) break;
          state = advanced;
          continue;
        }
        if (event.id === "ev_donald_is_born") {
          reached++;
          break;
        }
        // Prefer a choice that advances the dynasty toward the birth.
        const choice =
          event.choices.find((c) => (c.setFlags ?? []).some((f) => dynastyFlags.has(f))) ??
          event.choices[0];
        if (!choice) break;
        state = applyChoice(content, state, event, choice.id, rng).state;
      }
    }
    expect(reached).toBe(SEEDS);
  });
});
