import { describe, expect, it } from "vitest";
import { createRng } from "../rng";
import {
  applyFamilyDeathShock,
  dreadForeshadowText,
  FORESHADOW_TONES,
  foreshadowWeight,
  omenBadgeLabel,
  recoveryForeshadow,
  recoveryForeshadowText,
  rollSagaRecovery,
  rollSagaShock,
  type SagaShock,
  shockExposure,
  shockForeshadow,
  shockLedger,
  shockMeterFlag,
  shockNote,
} from "../sagaShock";
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

  it("SHOCK-CLUSTERING-GUARD: a recently-shocked line fires FEWER shocks (the cooldown dampens a death spiral)", () => {
    let normal = 0;
    let cooled = 0;
    for (let i = 0; i < 400; i++) {
      const seed = createRng(`cd${i}`);
      // Same era/seed, only the recentlyShocked flag differs → the dampened roll fires strictly less often.
      if (
        rollSagaShock(family(), 1820, "founding", seed.fork(`n:${i}`), undefined, false).kind !==
        "none"
      )
        normal++;
      if (
        rollSagaShock(family(), 1820, "founding", seed.fork(`c:${i}`), undefined, true).kind !==
        "none"
      )
        cooled++;
    }
    expect(cooled).toBeLessThan(normal);
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

  it("SHOCK-FAMILY-SUCCESSION-PRESSURE: a family_death can take the GROOMED heir, flagging tookHeir", () => {
    // With c1 named as the groomed heir, across seeds SOME family_death must strike c1 with tookHeir + the
    // heir_lost note (the raised heir-targeting probability), and any non-heir death must NOT set tookHeir.
    let sawHeirLoss = false;
    for (let i = 0; i < 300; i++) {
      const shock = rollSagaShock(
        family(),
        1810,
        "founding",
        createRng(`hl${i}`).fork("sagashock"),
        "c1",
      );
      if (shock.kind !== "family_death") continue;
      if (shock.memberId === "c1") {
        expect(shock.tookHeir, "striking the named heir flags tookHeir").toBe(true);
        expect(shock.note).toBe("heir_lost");
        sawHeirLoss = true;
      } else {
        expect(shock.tookHeir).toBeFalsy();
      }
    }
    expect(sawHeirLoss, "the groomed heir is struck in at least one seeded roll").toBe(true);
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
    // SHOCK-FAMILY-SUCCESSION-PRESSURE: a tookHeir family_death reads the SHARPER groomed-heir line.
    const heirLoss = shockNote({
      kind: "family_death",
      memberId: "c1",
      note: "heir_lost",
      tookHeir: true,
    });
    expect(heirLoss?.text).toMatch(/groomed heir|succession/i);
    expect(heirLoss?.text).not.toBe(death?.text); // distinct from the generic family death
  });
});

describe("rollSagaRecovery (WV-3-SHOCK-RECOVERY)", () => {
  it("returns null when no meter is outstanding (nothing to rebound)", () => {
    expect(rollSagaRecovery(new Set(), 1900, createRng("r0").fork("sagarecover:1900"))).toBeNull();
  });

  it("rebounds an outstanding blown meter with a POSITIVE delta + the flag to clear", () => {
    // money was blown → its shock_meter flag is outstanding; sweep seeds to find a firing recovery.
    const outstanding = new Set([shockMeterFlag("money")]);
    let got = null;
    for (let i = 0; i < 50 && !got; i++) {
      got = rollSagaRecovery(outstanding, 1900, createRng(`r${i}`).fork("sagarecover:1900"));
    }
    expect(got, "a recovery eventually fires for an outstanding blow").not.toBeNull();
    expect(got?.meter).toBe("money");
    expect(got?.delta).toBeGreaterThan(0); // a rebound is a GAIN
    expect(got?.clearFlag).toBe(shockMeterFlag("money"));
  });

  it("is deterministic — same (outstanding, year, seed) → identical recovery", () => {
    const outstanding = new Set([shockMeterFlag("reputation")]);
    const a = rollSagaRecovery(outstanding, 1950, createRng("rd").fork("sagarecover:1950"));
    const b = rollSagaRecovery(outstanding, 1950, createRng("rd").fork("sagarecover:1950"));
    expect(a).toEqual(b);
  });

  it("only rebounds meters that were actually blown (heat is never recovered here)", () => {
    // heat has no recovery marker (it cools via the systemic tick), so an outstanding heat flag is ignored.
    const outstanding = new Set([shockMeterFlag("heat")]);
    for (let i = 0; i < 50; i++) {
      const r = rollSagaRecovery(outstanding, 1900, createRng(`h${i}`).fork("sagarecover:1900"));
      expect(r).toBeNull();
    }
  });

  it("RECOVERY-CHOICE: an INVESTED roll fires MORE often and rebounds LARGER than an un-invested one", () => {
    const outstanding = new Set([shockMeterFlag("money")]);
    let plain = 0;
    let invested = 0;
    let plainMag = 0;
    let investedMag = 0;
    let plainN = 0;
    let investedN = 0;
    for (let i = 0; i < 200; i++) {
      const p = rollSagaRecovery(
        outstanding,
        1900,
        createRng(`p${i}`).fork("sagarecover:1900"),
        false,
      );
      const v = rollSagaRecovery(
        outstanding,
        1900,
        createRng(`p${i}`).fork("sagarecover:1900"),
        true,
      );
      if (p) {
        plain++;
        plainMag += p.delta;
        plainN++;
      }
      if (v) {
        invested++;
        investedMag += v.delta;
        investedN++;
      }
    }
    // Invested fires more often (boosted chance) …
    expect(invested).toBeGreaterThan(plain);
    // … and, when both fire on the same seed, the invested magnitude averages larger (1.5× factor).
    expect(investedMag / investedN).toBeGreaterThan(plainMag / plainN);
  });

  it("RECOVERY-CHOICE: invested recovery stays deterministic (same seed+invested → identical)", () => {
    const outstanding = new Set([shockMeterFlag("reputation")]);
    const a = rollSagaRecovery(outstanding, 1950, createRng("rd").fork("sagarecover:1950"), true);
    const b = rollSagaRecovery(outstanding, 1950, createRng("rd").fork("sagarecover:1950"), true);
    expect(a).toEqual(b);
  });
});

describe("shockExposure + shockForeshadow (SHOCK-FORESHADOW)", () => {
  it("exposure is high in the founding era and floored low in the far future (monotone with medicine)", () => {
    const founding = shockExposure("founding");
    const ascension = shockExposure("ascension");
    expect(founding).toBeGreaterThan(ascension);
    expect(ascension).toBeGreaterThanOrEqual(0.15); // never fully safe
    expect(founding).toBeLessThanOrEqual(1);
  });

  it("foreshadows in a harsh era when there's strain OR kin to lose; silent when safe or nothing at stake", () => {
    // Harsh founding era + outstanding strain → omen.
    expect(shockForeshadow("founding", [shockMeterFlag("money")], false)).toBe(true);
    // Harsh era + kin to lose (no strain) → omen.
    expect(shockForeshadow("founding", [], true)).toBe(true);
    // Harsh era but NOTHING at stake (no strain, no kin) → silent.
    expect(shockForeshadow("founding", ["base:press"], false)).toBe(false);
    // Medicine-rich far future (low exposure) → silent even with strain + kin.
    expect(shockForeshadow("ascension", [shockMeterFlag("money")], true)).toBe(false);
  });

  it("FORESHADOW-WEIGHT: the omen tiers by hazard — grave (strain) > marginal (kin only) > none", () => {
    // Harsh era + un-recovered strain → GRAVE (the worst is plausibly near).
    expect(foreshadowWeight("founding", [shockMeterFlag("money")], false)).toBe("grave");
    // Harsh era + kin to lose but NO active strain → MARGINAL (a fainter unease).
    expect(foreshadowWeight("founding", [], true)).toBe("marginal");
    // Harsh era, nothing at stake → NONE.
    expect(foreshadowWeight("founding", ["base:press"], false)).toBe("none");
    // Safe era → NONE even with strain + kin.
    expect(foreshadowWeight("ascension", [shockMeterFlag("money")], true)).toBe("none");
    // Strain DOMINATES kin: a strained line reads grave whether or not it has kin.
    expect(foreshadowWeight("founding", [shockMeterFlag("reputation")], true)).toBe("grave");
  });

  it("RECOVERY-FORESHADOW-TONE: a HOPEFUL rebound omen fires iff the line carries an outstanding blown meter", () => {
    // An un-recovered blow → a rebound is plausibly near (hope), regardless of era (it keys on strain, not
    // exposure — the recovery roll itself isn't era-gated the way the shock omen's dread is).
    expect(recoveryForeshadow([shockMeterFlag("money")])).toBe(true);
    expect(recoveryForeshadow([shockMeterFlag("reputation"), "base:press"])).toBe(true);
    // No outstanding strain → no hope omen (nothing to rebound from).
    expect(recoveryForeshadow([])).toBe(false);
    expect(recoveryForeshadow(["base:press", "loud_baby"])).toBe(false);
  });

  it("HOPE-OMEN-COPY-VARIETY: the hope omen text is keyed to the strained meter (specific, not boilerplate)", () => {
    // Each recognized meter reads in its own voice — fortune / name / health / bonds.
    const money = recoveryForeshadowText([shockMeterFlag("money")]);
    const rep = recoveryForeshadowText([shockMeterFlag("reputation")]);
    const health = recoveryForeshadowText([shockMeterFlag("health")]);
    const loyalty = recoveryForeshadowText([shockMeterFlag("loyalty")]);
    expect(money).toMatch(/coffers|fortune|rebuilt/i);
    expect(rep).toMatch(/scandal|name|grace/i);
    expect(health).toMatch(/sickness|strength|health/i);
    expect(loyalty).toMatch(/rift|bonds|reforged/i);
    // The four variants are distinct lines, not the same boilerplate.
    expect(new Set([money, rep, health, loyalty]).size).toBe(4);
    // The FIRST outstanding meter flag wins (deterministic flag order → replay-stable).
    expect(recoveryForeshadowText([shockMeterFlag("money"), shockMeterFlag("reputation")])).toBe(
      money,
    );
    // An absent / unrecognized strain falls back to the generic line (still hopeful, non-empty).
    const fallback = recoveryForeshadowText([]);
    expect(fallback.length).toBeGreaterThan(0);
    expect(fallback).not.toBe(money);
    // `heat` has no recovery (a heat spike cools systemically, not via a windfall) → generic fallback.
    expect(recoveryForeshadowText([shockMeterFlag("heat")])).toBe(fallback);
  });

  it("OMEN-DREAD-COPY-VARIETY: the dread omen text is keyed to the macro-act (era-specific, not boilerplate)", () => {
    const founding = dreadForeshadowText("founding");
    const convergence = dreadForeshadowText("convergence");
    const emergence = dreadForeshadowText("emergence");
    const ascension = dreadForeshadowText("ascension");
    // The founding era leans toward LOSS OF LIFE; the later eras toward fortune/standing/market reversals.
    expect(founding).toMatch(/fever|winter|life/i);
    expect(emergence).toMatch(/market|mood|age/i);
    // All four bands read distinctly (not one boilerplate line).
    expect(new Set([founding, convergence, emergence, ascension]).size).toBe(4);
    // An unrecognized band falls back to the generic dread line (still non-empty, still a "shadow").
    const fallback = dreadForeshadowText("unknown-band");
    expect(fallback.length).toBeGreaterThan(0);
    expect(fallback).toMatch(/shadow/i);
    expect([founding, convergence, emergence, ascension]).not.toContain(fallback);
  });

  it("OMEN-A11Y-AUDIT: EVERY foreshadow tone maps to a non-empty, distinct badge label (no blank fall-through)", () => {
    // Exhaustive over the canonical tone set — a future tone added without a badge label would fail here, so the
    // a11y layer can't silently regress to a blank badge (WCAG 1.4.1 relies on the TEXT carrying the valence).
    const labels = FORESHADOW_TONES.map((t) => omenBadgeLabel(t));
    for (const label of labels) {
      expect(label.trim().length, "every tone has a non-empty badge label").toBeGreaterThan(0);
    }
    // Each tone reads distinctly (a colorblind player tells them apart by text).
    expect(new Set(labels).size).toBe(FORESHADOW_TONES.length);
    // The labels carry recognizable valence words (not just an icon).
    expect(omenBadgeLabel("hope")).toMatch(/recovering/i);
    expect(omenBadgeLabel("dread")).toMatch(/warning/i);
  });
});

describe("shockLedger (DOSSIER-SHOCK-LEDGER)", () => {
  it("parses shock:* flags into a chronological disaster log + ignores other flags", () => {
    const flags = [
      "base:press",
      "shock:meter_blow:1920",
      "shock:family_death:1885",
      "succession_occurred",
      "shock:meter_blow:1885",
      "crossed:italian:syndicate",
    ];
    const led = shockLedger(flags);
    // Only the shock:* flags, sorted by year then kind (family_death < meter_blow at 1885).
    expect(led.map((e) => `${e.year}:${e.kind}`)).toEqual([
      "1885:family_death",
      "1885:meter_blow",
      "1920:meter_blow",
    ]);
    expect(led[0]?.label).toMatch(/death/i);
    expect(led[2]?.label).toMatch(/reversal/i);
  });

  it("returns an empty ledger when the run has had no shocks", () => {
    expect(shockLedger(["base:land", "succession_occurred"])).toEqual([]);
  });

  it("skips malformed shock flags (no year / unknown kind)", () => {
    expect(
      shockLedger(["shock:meter_blow:notayear", "shock:weird:1900", "shock:family_death"]),
    ).toEqual([]);
  });

  it("de-duplicates repeated shock flags (a duplicate would crash the Svelte #each on its key)", () => {
    // A flag list with an exact duplicate must yield ONE entry — TimelineView keys #each on year+kind.
    const led = shockLedger([
      "shock:family_death:1885",
      "shock:family_death:1885",
      "shock:meter_blow:1885",
    ]);
    expect(led.map((e) => `${e.year}:${e.kind}`)).toEqual(["1885:family_death", "1885:meter_blow"]);
  });

  it("SHOCK-LEDGER-RECOVERIES: records `recovered:*` flags as comeback entries, sorted AFTER same-year shocks", () => {
    // A blow at 1920 that rebounds at 1920 must read loss-then-comeback within the year; a later recovery sorts late.
    const led = shockLedger([
      "shock:meter_blow:1920",
      "recovered:money:1920",
      "recovered:reputation:1948",
      "base:press",
    ]);
    expect(led.map((e) => `${e.year}:${e.kind}`)).toEqual([
      "1920:meter_blow",
      "1920:recovery",
      "1948:recovery",
    ]);
    // The comeback label is METER-AWARE (names what was clawed back), not the generic fallback.
    expect(led[1]?.label).toMatch(/fortune/i);
    expect(led[2]?.label).toMatch(/name|redeem/i);
  });

  it("SHOCK-LEDGER-RECOVERIES: an unknown recovered-meter falls back to the generic comeback label", () => {
    const led = shockLedger(["recovered:power:1900"]);
    expect(led).toHaveLength(1);
    expect(led[0]?.kind).toBe("recovery");
    expect(led[0]?.label).toMatch(/recovered/i);
  });

  it("SHOCK-LEDGER-RECOVERIES: skips malformed recovered flags (no year)", () => {
    expect(shockLedger(["recovered:money", "recovered::1900"])).toEqual([]);
  });

  it("RECOVERY-INVEST-IN-LEDGER: an :invested recovery reads distinctly (by your own hand) + carries invested", () => {
    const led = shockLedger(["recovered:money:1910:invested", "recovered:reputation:1920"]);
    expect(led).toHaveLength(2);
    const investedEntry = led.find((e) => e.year === 1910);
    const luckyEntry = led.find((e) => e.year === 1920);
    // The invested rebound is flagged + reads "by your own hand"; the lucky one is plain.
    expect(investedEntry?.kind).toBe("recovery");
    expect(investedEntry?.invested).toBe(true);
    expect(investedEntry?.label).toMatch(/your own hand/i);
    expect(luckyEntry?.invested).toBeFalsy();
    expect(luckyEntry?.label).not.toMatch(/your own hand/i);
  });
});
