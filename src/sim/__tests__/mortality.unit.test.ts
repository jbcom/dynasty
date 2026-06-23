import { describe, expect, it } from "vitest";
import { loadContent } from "../../data/loadContent";
import { applyChoice } from "../effects";
import { beget, childrenOf, kinFor, seedFamily } from "../family";
import { foundDynasty } from "../founding";
import { applyMortality, deathHazard, eraMedicine, isAlive, macroActMedicine } from "../mortality";
import { getCulture } from "../onomastics";
import { createRng } from "../rng";
import type { GameEvent } from "../schema";
import { isLineExtinct, succeed } from "../succession";

/**
 * FD-9/FD-10 — mortality + succession: the death hazard rises with age and falls
 * with medicine/vigor; the per-year pass is seeded/deterministic; succession
 * promotes the eldest living heir (or a named one), and an heirless death ends
 * the line.
 */

describe("macroActMedicine (WV-3 saga-clock band medicine)", () => {
  it("rises founding → ascension and returns 0 for an unknown band (no NaN)", () => {
    // The saga clock runs on macro-act bands, not the fine era ladder — the shock hazard tempers off these.
    expect(macroActMedicine("founding")).toBeLessThan(macroActMedicine("convergence"));
    expect(macroActMedicine("convergence")).toBeLessThan(macroActMedicine("emergence"));
    expect(macroActMedicine("emergence")).toBeLessThan(macroActMedicine("ascension"));
    // Unknown id → 0 (Gemini #108: prevents 1 - undefined = NaN disabling the hazard tempering).
    expect(macroActMedicine("not-a-band")).toBe(0);
    expect(macroActMedicine("origins")).toBe(0); // a fine ERA id is NOT a macro-act band → 0
  });
});

const content = loadContent();
const culture = getCulture({ cultures: content.onomastics }, "bavarian_german");

describe("FD-9 deathHazard", () => {
  it("rises monotonically with age", () => {
    expect(deathHazard(30, 0, 50)).toBeLessThan(deathHazard(60, 0, 50));
    expect(deathHazard(60, 0, 50)).toBeLessThan(deathHazard(90, 0, 50));
  });

  it("medicine and vigor lower the hazard", () => {
    expect(deathHazard(70, 0.8, 50)).toBeLessThan(deathHazard(70, 0, 50));
    expect(deathHazard(70, 0, 90)).toBeLessThan(deathHazard(70, 0, 10));
  });

  it("stays a probability in [0,1]", () => {
    for (const age of [0, 50, 100, 200]) {
      const p = deathHazard(age, 0, 50);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });

  it("later eras have stronger medicine", () => {
    expect(eraMedicine("caliphate")).toBeLessThan(eraMedicine("interstellar"));
  });
});

describe("FD-9 applyMortality", () => {
  it("is deterministic for a given (family, year, rng)", () => {
    const f = seedFamily({ given: "Otto", surname: "Vane", sex: "male", born: 1850 });
    const a = applyMortality(f, 1930, "origins", createRng("m"));
    const b = applyMortality(f, 1930, "origins", createRng("m"));
    expect(a.family).toEqual(b.family);
    expect(a.died).toEqual(b.died);
  });

  it("records died=year and never resurrects the dead", () => {
    // A very old member across many years will eventually die; once dead, stays dead.
    let f = seedFamily({ given: "Methuselah", surname: "Vane", sex: "male", born: 1700 });
    let deathYear: number | undefined;
    for (let y = 1780; y <= 1820 && deathYear === undefined; y++) {
      const r = applyMortality(f, y, "caliphate", createRng(`s${y}`));
      f = r.family;
      if (r.died.length) deathYear = y;
    }
    expect(deathYear).toBeDefined();
    const m = f.members[0];
    expect(m?.died).toBe(deathYear);
    expect(isAlive(f, "m0", (deathYear ?? 0) + 1)).toBe(false);
  });
});

describe("FD-10 succeed", () => {
  function lineWithChildren() {
    let f = seedFamily({ given: "Otto", surname: "Vane", sex: "male", born: 1850 });
    f = beget(f, "m0", 1875, culture, kinFor(f, "m0"), createRng("c1")).family;
    f = beget(f, "m0", 1878, culture, kinFor(f, "m0"), createRng("c2")).family;
    return f;
  }

  it("promotes the eldest living child to protagonist", () => {
    const f = lineWithChildren();
    const r = succeed(f, 1920);
    expect(r.heirId).toBe("m1");
    const heir = r.family.members.find((m) => m.id === "m1");
    expect(heir?.isProtagonist).toBe(true);
    expect(r.family.protagonistId).toBe("m1");
    // The late protagonist is no longer flagged.
    expect(r.family.members.find((m) => m.id === "m0")?.isProtagonist).toBe(false);
  });

  it("honors a named heir when alive", () => {
    const f = lineWithChildren();
    const r = succeed(f, 1920, "m2");
    expect(r.heirId).toBe("m2");
  });

  it("skips a dead heir and falls to the next living child", () => {
    let f = lineWithChildren();
    f = { ...f, members: f.members.map((m) => (m.id === "m1" ? { ...m, died: 1910 } : m)) };
    const r = succeed(f, 1920);
    expect(r.heirId).toBe("m2");
  });

  it("an heirless death ends the line (extinct)", () => {
    const f = seedFamily({ given: "Otto", surname: "Vane", sex: "male", born: 1850 });
    const dead = { ...f, members: f.members.map((m) => ({ ...m, died: 1900 })) };
    expect(isLineExtinct(dead, 1901)).toBe(true);
    expect(succeed(dead, 1901).heirId).toBeNull();
  });

  it("CP-3 succession mode picks the heir by sex preference (eldest daughter m1, eldest son m2)", () => {
    // Founder m0 with an elder daughter (m1, 1875) and a younger son (m2, 1878).
    let f = seedFamily({ given: "Otto", surname: "Vane", sex: "male", born: 1850 });
    f = beget(f, "m0", 1875, culture, kinFor(f, "m0"), createRng("d")).family;
    f = beget(f, "m0", 1878, culture, kinFor(f, "m0"), createRng("s")).family;
    f = {
      ...f,
      members: f.members.map((m) =>
        m.id === "m1" ? { ...m, sex: "female" } : m.id === "m2" ? { ...m, sex: "male" } : m,
      ),
    };
    // absolute → eldest regardless of sex (m1).
    expect(succeed(f, 1920, undefined, "absolute").heirId).toBe("m1");
    // primogeniture → eldest SON first (m2) even though m1 is older.
    expect(succeed(f, 1920, undefined, "primogeniture").heirId).toBe("m2");
    // matriarchal → eldest DAUGHTER first (m1).
    expect(succeed(f, 1920, undefined, "matriarchal").heirId).toBe("m1");
  });

  it("never selects a not-yet-born child as heir (review HIGH/MEDIUM regression)", () => {
    // Protagonist dies in 1900; one child born 1880 (eligible), one born 1905 (not
    // yet born at the death year — the beget stagger can place a birth past death).
    let f = seedFamily({ given: "Otto", surname: "Vane", sex: "male", born: 1850 });
    f = beget(f, "m0", 1880, culture, kinFor(f, "m0"), createRng("born1")).family;
    f = beget(f, "m0", 1905, culture, kinFor(f, "m0"), createRng("born2")).family;
    const r = succeed(f, 1900);
    expect(r.heirId).toBe("m1"); // the 1880 child, never the 1905 one
    expect(isLineExtinct(f, 1900)).toBe(false);

    // A DEAD protagonist whose only child is born after the death year → no heir,
    // line extinct (the unborn child cannot inherit).
    let g = seedFamily({ given: "Otto", surname: "Vane", sex: "male", born: 1850 });
    g = beget(g, "m0", 1905, culture, kinFor(g, "m0"), createRng("late")).family;
    g = { ...g, members: g.members.map((m) => (m.id === "m0" ? { ...m, died: 1900 } : m)) };
    expect(succeed(g, 1900).heirId).toBeNull();
    expect(isLineExtinct(g, 1900)).toBe(true);
  });
});

describe("FD-9/FD-10 mortality + succession through applyChoice (multi-generation)", () => {
  it("a century-hopping run buries the progenitor and continues as the heir, or ends extinct", () => {
    // Found a line, beget an heir, then a big forward hop so the progenitor's
    // mortality pass fires across many years.
    const founded = foundDynasty(content, {
      momentId: "bavaria_1885",
      surname: "Vane",
      seed: "gen-seed",
    }).state;
    const era = content.eras[founded.eraIndex];
    const eraId = era?.id ?? "origins";

    const begetEv: GameEvent = {
      id: "ev_gen_beget",
      era: eraId,
      year: 1905,
      title: "Heir",
      scene: "An heir is raised.",
      researchNote: "t",
      extrapolated: false,
      startrekInspired: false,
      tags: [],
      requires: { flags: [], notFlags: [], meters: {}, personality: {} },
      weight: 1,
      repeatable: false,
      choices: [
        {
          id: "raise",
          text: "Raise an heir",
          effects: {},
          personality: {},
          setFlags: [],
          clearFlags: [],
          ripples: [],
          outcome: "An heir.",
          begets: 1,
        },
      ],
    };
    // A choice that hops ~120 years forward so the founder (born 1885) certainly dies.
    const hopEv: GameEvent = {
      ...begetEv,
      id: "ev_gen_hop",
      year: 1910,
      title: "The long years",
      choices: [
        {
          id: "endure",
          text: "Endure the decades",
          effects: {},
          personality: {},
          setFlags: [],
          clearFlags: [],
          ripples: [],
          outcome: "Time passes.",
          jumpTo: { yearAdvance: 120 },
        },
      ],
    };
    const c = { ...content, allEvents: [...content.allEvents, begetEv, hopEv] };

    let s = applyChoice(c, founded, begetEv, "raise", createRng("gen-seed")).state;
    const heirId = childrenOf(s.family!, "m0")[0]?.id;
    expect(heirId).toBeDefined();

    s = applyChoice(c, s, hopEv, "endure", createRng("gen-seed")).state;

    // The founder is dead after 120 years.
    expect(s.family?.members.find((m) => m.id === "m0")?.died).toBeDefined();
    // Either the heir took over, or the line ended extinct if the heir also died.
    if (s.end) {
      expect(s.end.kind).toBe("line-extinct");
    } else {
      expect(s.family?.protagonistId).toBe(heirId);
      expect(s.flags).toContain("succession_occurred");
    }
  });
});
