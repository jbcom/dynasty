import { describe, expect, it } from "vitest";
import { createRng } from "../rng";
import { applyFamilyDeathShock, rollSagaShock, type SagaShock, shockNote } from "../sagaShock";
import type { FamilyState, LiveMember } from "../state";

/**
 * WV-3-MORTALITY — the seeded saga disruption hazard. These tests pin: determinism (same family/year/era/
 * seed → identical shock), era-weighting (harsh founding era fires more than the medicine-rich future), the
 * protagonist is never the family_death victim, and applyFamilyDeathShock marks exactly the struck member.
 */

const member = (id: string, born: number, isProtagonist = false): LiveMember => ({
  id,
  given: id,
  surname: "Test",
  sex: "male",
  born,
  generation: isProtagonist ? 2 : 3,
  traits: { ambition: 50, cunning: 50, vigor: 50, piety: 50 },
  isProtagonist,
});

const family = (): FamilyState => ({
  protagonistId: "p",
  nextSeq: 4,
  members: [member("p", 1850, true), member("c1", 1875), member("c2", 1878)],
});

describe("rollSagaShock (WV-3-MORTALITY)", () => {
  it("is deterministic — same (family, year, era, seed) → identical shock", () => {
    const a = rollSagaShock(family(), 1885, "founding", createRng("s1").fork("sagashock:1885"));
    const b = rollSagaShock(family(), 1885, "founding", createRng("s1").fork("sagashock:1885"));
    expect(a).toEqual(b);
  });

  it("fires MORE often in a harsh era than a medicine-rich future era (era-weighting)", () => {
    let harsh = 0;
    let future = 0;
    for (let i = 0; i < 200; i++) {
      const seed = createRng(`seed${i}`);
      if (rollSagaShock(family(), 1820, "founding", seed.fork(`h:${i}`)).kind !== "none") harsh++;
      if (rollSagaShock(family(), 2300, "ascension", seed.fork(`f:${i}`)).kind !== "none") future++;
    }
    // Founding-era exposure (~0.9) far exceeds interstellar (floored ~0.15), so harsh fires more often.
    expect(harsh).toBeGreaterThan(future);
  });

  it("never strikes the protagonist as the family_death victim", () => {
    // Sweep many seeds; every family_death victim must be a non-protagonist member.
    for (let i = 0; i < 300; i++) {
      const shock = rollSagaShock(family(), 1810, "founding", createRng(`v${i}`).fork("sagashock"));
      if (shock.kind === "family_death") {
        expect(shock.memberId).not.toBe("p");
        expect(["c1", "c2"]).toContain(shock.memberId);
      }
    }
  });

  it("a meter_blow carries a meter + a delta (a loss, or +heat)", () => {
    for (let i = 0; i < 300; i++) {
      const shock = rollSagaShock(family(), 1810, "founding", createRng(`m${i}`).fork("sagashock"));
      if (shock.kind === "meter_blow") {
        expect(shock.meter).toBeTruthy();
        expect(typeof shock.delta).toBe("number");
        // health/money/reputation/loyalty are losses (negative); heat is a rise (positive).
        if (shock.meter === "heat") expect(shock.delta).toBeGreaterThan(0);
        else expect(shock.delta).toBeLessThan(0);
        break;
      }
    }
  });

  it("applyFamilyDeathShock marks exactly the struck member died", () => {
    const shock: SagaShock = { kind: "family_death", memberId: "c1" };
    const after = applyFamilyDeathShock(family(), shock, 1885);
    expect(after.members.find((m) => m.id === "c1")?.died).toBe(1885);
    expect(after.members.find((m) => m.id === "c2")?.died).toBeUndefined();
    expect(after.members.find((m) => m.id === "p")?.died).toBeUndefined();
  });

  it("applyFamilyDeathShock is a no-op for a non-death shock", () => {
    const fam = family();
    const after = applyFamilyDeathShock(
      fam,
      { kind: "meter_blow", meter: "money", delta: -10 },
      1885,
    );
    expect(after).toEqual(fam);
  });

  it("shockNote builds a one-line aftermath for each shock kind, null for none (WV-3-SHOCK-SCENES)", () => {
    expect(shockNote({ kind: "none" })).toBeNull();
    const death = shockNote({ kind: "family_death", memberId: "c1", note: "plague" });
    expect(death?.kind).toBe("family_death");
    expect(death?.text).toMatch(/death|family/i);
    const fire = shockNote({ kind: "meter_blow", meter: "money", delta: -20, note: "fire" });
    expect(fire?.kind).toBe("meter_blow");
    expect(fire?.text).toMatch(/fire|loss/i);
    // An unknown note still yields a sensible fallback line (never empty).
    const odd = shockNote({ kind: "meter_blow", meter: "power", delta: -5, note: "mystery" });
    expect(odd?.text.length).toBeGreaterThan(0);
  });
});
