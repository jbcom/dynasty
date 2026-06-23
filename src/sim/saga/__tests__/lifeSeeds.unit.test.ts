import { describe, expect, it } from "vitest";
import { applyMotivators, initMotivators } from "../../motivators";
import {
  applyLifeSeeds,
  type LifeSeedChoices,
  partnerSeedsSuccession,
  seedFlags,
  seedMotivatorShift,
} from "../lifeSeeds";

/**
 * FS-7: the diegetic Epoch-0 birth composer. The founder's first job / best friend / life partner are
 * story SEEDS — flags the spine reads + motivator leans. These tests pin the mapping + determinism.
 */

describe("life-seeds composer (FS-7)", () => {
  it("sets a seed flag per chosen life-stage (none-friend sets nothing)", () => {
    const choices: LifeSeedChoices = {
      firstJob: "printers_devil",
      bestFriend: "an_ambitious_rival",
      lifePartner: "marry_for_love",
    };
    expect(seedFlags(choices)).toEqual([
      "seed:job:printers_devil",
      "seed:friend:an_ambitious_rival",
      "seed:partner:marry_for_love",
    ]);
    expect(seedFlags({ firstJob: "farmhand", bestFriend: "none" })).toEqual(["seed:job:farmhand"]);
  });

  it("each choice leans the founder's motivators (printer's devil → worldview+reach)", () => {
    const shift = seedMotivatorShift({ firstJob: "printers_devil" });
    expect(shift.worldview).toBeGreaterThan(0);
    expect(shift.reach).toBeGreaterThan(0);
    // a dock laborer leans honor up + power down (community over domination).
    const dock = seedMotivatorShift({ firstJob: "dock_laborer" });
    expect(dock.honor).toBeGreaterThan(0);
    expect(dock.power).toBeLessThan(0);
  });

  it("leans STACK across job + friend + partner", () => {
    const shift = seedMotivatorShift({
      firstJob: "shop_clerk", // wealth+8
      bestFriend: "an_ambitious_rival", // wealth+4
      lifePartner: "marry_for_advantage", // wealth+8
    });
    expect(shift.wealth).toBe(20);
  });

  it("applyLifeSeeds tilts a base motivator vector + clamps to ±100", () => {
    const base = applyMotivators(initMotivators(), { wealth: 95 });
    const out = applyLifeSeeds(base, {
      firstJob: "shop_clerk",
      lifePartner: "marry_for_advantage",
    });
    expect(out.wealth).toBe(100); // 95 + 16, clamped
  });

  it("partner choice seeds the first succession only when a partner is taken", () => {
    expect(partnerSeedsSuccession({ lifePartner: "marry_for_love" })).toBe(true);
    expect(partnerSeedsSuccession({ lifePartner: "marry_for_advantage" })).toBe(true);
    expect(partnerSeedsSuccession({ lifePartner: "remain_unwed" })).toBe(false);
    expect(partnerSeedsSuccession({})).toBe(false);
  });

  it("is deterministic — same choices → same seeds", () => {
    const c: LifeSeedChoices = { firstJob: "apprentice_tradesman", bestFriend: "a_mentor_elder" };
    expect(seedMotivatorShift(c)).toEqual(seedMotivatorShift(c));
    expect(seedFlags(c)).toEqual(seedFlags(c));
  });
});
