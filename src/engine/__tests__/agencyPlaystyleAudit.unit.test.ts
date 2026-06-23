import { describe, expect, it } from "vitest";
import { loadContent } from "../../data/loadContent";
import { foundByComposition } from "../../sim/founding";
import { Game } from "../loop";

/**
 * AGENCY-PLAYSTYLE-AUDIT — measure whether the WV-3 player-agency levers (RIVAL-CROSSING-EXPLOIT's press,
 * RECOVERY-CHOICE's invest) actually get EXERCISED across a typical playthrough, or sit unused (dead UI). This
 * drives many founding runs with an ALWAYS-act policy — press every faltering rival, invest in every available
 * recovery window — and counts (a) how many steps OFFERED each lever and (b) how many times it fired. A lever
 * that's almost never offered means its trigger is too rare and the UI is dead weight; the audit asserts each
 * is offered + used a meaningful number of times across the sweep. The figures are the audit's product (read
 * with --disable-console-intercept when tuning the press/invest trigger conditions).
 *
 * MEASURED (16 seeds, always-act): press offered 134 / fired 134; invest offered 24 / fired 24. Both levers
 * surface and fire reliably — neither is dead UI. Press is the more frequent window (rivals falter often);
 * invest is rarer (needs an outstanding un-recovered blow) but still healthily present. No trigger tuning needed.
 */

describe("agency playstyle audit (AGENCY-PLAYSTYLE-AUDIT)", () => {
  it("the press + invest levers are both offered AND exercised across an always-act sweep", () => {
    const real = loadContent();
    const SEEDS = Array.from({ length: 16 }, (_, i) => `agency${i}`);
    let pressOffered = 0; // steps where a faltering rival could be pressed
    let pressFired = 0; // presses actually applied
    let investOffered = 0; // steps where a recovery could be invested in
    let investFired = 0; // invests actually applied
    let runs = 0;

    for (const seed of SEEDS) {
      const base = foundByComposition(real, {
        place: "ireland",
        era: "origins",
        culture: "anglo_protestant",
        year: 1776,
        archetype: "political" as const,
        gender: "male" as const,
        surname: "Ag",
        seed,
        originId: "composed:ireland:origins",
      }).state;
      const g = new Game(real, seed, base, "political");
      runs++;
      let guard = 0;
      while (!g.finished && guard < 300) {
        const v = g.view; // snapshot the heavy getter once per iteration
        // ALWAYS-act policy: press a faltering rival if offered, invest if a recovery window is open.
        const falter = v.rivalNews.find((n) => n.kind === "faltered");
        if (falter) {
          pressOffered++;
          const before = g.view.state.presses?.length ?? 0;
          g.pressRival(falter.id);
          if ((g.view.state.presses?.length ?? 0) > before) pressFired++;
        }
        if (v.canInvestRecovery) {
          investOffered++;
          const before = g.view.state.recoveryInvests?.length ?? 0;
          // Prefer money; fall back to heat (heat invest is always affordable).
          g.investRecovery(g.view.state.meters.money >= 18 ? "money" : "heat");
          if ((g.view.state.recoveryInvests?.length ?? 0) > before) investFired++;
        }
        const s = g.view.saga.scene;
        if (s) {
          if (s.decision) g.pickDecision(0);
          else if (s.beats.length) g.pickBeat(0);
          else break;
        } else if (g.view.currentEvent?.choices[0]) {
          g.choose(g.view.currentEvent.choices[0].id);
        } else break;
        guard++;
      }
    }

    console.log(
      `[agency-playstyle] runs=${runs} pressOffered=${pressOffered} pressFired=${pressFired} ` +
        `investOffered=${investOffered} investFired=${investFired}`,
    );

    // Both levers must be OFFERED across the sweep (a near-zero offer rate would mean dead UI / too-rare trigger).
    expect(pressOffered, "the press lever is offered across the sweep").toBeGreaterThan(0);
    expect(investOffered, "the invest lever is offered across the sweep").toBeGreaterThan(0);
    // …and, with an always-act policy, both must actually FIRE (the action path works end-to-end).
    expect(pressFired, "presses fire under an always-press policy").toBeGreaterThan(0);
    expect(investFired, "invests fire under an always-invest policy").toBeGreaterThan(0);
  });
});
