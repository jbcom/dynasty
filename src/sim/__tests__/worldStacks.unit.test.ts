import { describe, expect, it } from "vitest";
import { loadContent } from "../../data/loadContent";
import { foundDynasty } from "../founding";
import { buildExpandContext } from "../procgen";
import { createRng } from "../rng";
import type { WorldStack } from "../schema";
import { resolveStack } from "../worldStacks";

/**
 * FD-7 — world stacks: per-place standing context loads, the resolver matches by
 * place (era-specific wins over era-less), every start-moment's place has a stack,
 * and the procgen ExpandContext draws place + perils from the resolved stack.
 */

const content = loadContent();

describe("FD-7 world-stack content", () => {
  it("loads a stack for every start-moment's place", () => {
    const stackPlaces = new Set(content.worldStacks.map((s) => s.place));
    for (const m of content.startMoments) {
      expect(stackPlaces.has(m.place), `${m.id} place ${m.place} has no stack`).toBe(true);
    }
  });

  it("each stack carries all four context layers + perils", () => {
    for (const s of content.worldStacks) {
      expect(s.geography.length, s.place).toBeGreaterThan(0);
      expect(s.politics.length, s.place).toBeGreaterThan(0);
      expect(s.religion.length, s.place).toBeGreaterThan(0);
      expect(s.ideology.length, s.place).toBeGreaterThan(0);
      expect(s.perils.length, s.place).toBeGreaterThan(0);
    }
  });

  it("CP-1: the immigration-destination places exist as geography (decoupled from culture)", () => {
    const places = new Set(content.worldStacks.map((s) => s.place));
    for (const p of ["canada", "american_midwest", "american_south", "east_coast", "west_coast"]) {
      expect(places.has(p), `place ${p}`).toBe(true);
    }
  });

  it("CP-1: culture is now pure ethnic-naming (no place baked into the conflated WASP label)", () => {
    // The conflated `wasp_east_coast` is gone; the ethnicity is `anglo_protestant`,
    // and the East-Coast geography lives only in the place axis.
    expect(content.onomastics.wasp_east_coast).toBeUndefined();
    expect(content.onomastics.anglo_protestant).toBeDefined();
  });
});

describe("FD-7 resolveStack", () => {
  const stacks: WorldStack[] = [
    {
      place: "p",
      label: "P (default)",
      placeLabel: "P",
      geography: "g",
      politics: "po",
      religion: "r",
      ideology: "i",
      perils: ["x"],
    },
    {
      place: "p",
      era: "mogul",
      label: "P (mogul)",
      placeLabel: "P",
      geography: "g2",
      politics: "po2",
      religion: "r2",
      ideology: "i2",
      perils: ["y"],
    },
  ];

  it("prefers an era-specific stack over the era-less default", () => {
    expect(resolveStack(stacks, "p", "mogul")?.label).toBe("P (mogul)");
  });

  it("falls back to the era-less stack when no era match", () => {
    expect(resolveStack(stacks, "p", "boyhood")?.label).toBe("P (default)");
  });

  it("returns undefined for an unknown place or empty place", () => {
    expect(resolveStack(stacks, "nowhere")).toBeUndefined();
    expect(resolveStack(stacks, "")).toBeUndefined();
  });
});

describe("FD-7 procgen context uses the resolved stack", () => {
  it("a founded line's procgen context draws place + perils from its stack", () => {
    const founded = foundDynasty(content, {
      momentId: "irish_famine_1847",
      surname: "Vane",
      seed: "s",
    }).state;
    const era = content.eras[founded.eraIndex];
    if (!era) throw new Error("no era");
    const ctx = buildExpandContext(content, founded, era, createRng("c"));
    const stack = content.worldStacks.find((s) => s.place === "ireland");
    if (!stack) throw new Error("no ireland stack");
    expect(ctx.place).toBe(stack.placeLabel);
    expect(stack.perils).toContain(ctx.perils[0]);
  });
});
