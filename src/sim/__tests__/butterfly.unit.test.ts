import { describe, expect, it } from "vitest";
import { applyRipples, buildLedgerEntries, firedRules, renderChain } from "../butterfly";
import { buildContent } from "../content";
import { createRng } from "../rng";
import type { Choice, GameEvent } from "../schema";
import { validRaw } from "./fixtures";

const content = () => buildContent(validRaw());

describe("renderChain", () => {
  it("fills placeholders and leaves unknown ones intact", () => {
    expect(renderChain("Because you {cause}, {effect} happened", { cause: "X", effect: "Y" })).toBe(
      "Because you X, Y happened",
    );
    expect(renderChain("a {missing} b", {})).toBe("a {missing} b");
  });
});

describe("applyRipples (chaos field)", () => {
  it("accumulates polarized, jittered pressure and is pure", () => {
    const field = { existing: 1 };
    const next = applyRipples(field, [{ to: "media", weight: 0.8, polarity: 1 }], createRng("r1"));
    expect(next.existing).toBe(1);
    expect(next.media).toBeGreaterThan(0);
    expect(next.media).toBeLessThanOrEqual(0.8); // jitter is <= nominal
    expect(field).toEqual({ existing: 1 }); // original untouched
  });

  it("is deterministic for a given seed but varies across seeds", () => {
    const ripples = [{ to: "media", weight: 0.8, polarity: 1 as const }];
    const a = applyRipples({}, ripples, createRng("same")).media;
    const b = applyRipples({}, ripples, createRng("same")).media;
    const c = applyRipples({}, ripples, createRng("diff")).media;
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  it("negative polarity reduces a channel", () => {
    const next = applyRipples({}, [{ to: "media", weight: 1, polarity: -1 }], createRng("n"));
    expect(next.media).toBeLessThan(0);
  });
});

describe("firedRules + buildLedgerEntries (visible chains)", () => {
  it("fires a rule when a choice sets its cause flag", () => {
    const c = content();
    const choice: Choice = {
      id: "excel",
      text: "Win every drill.",
      effects: {},
      setFlags: ["disciplined"],
      clearFlags: [],
      ripples: [],
      outcome: "ok",
    };
    const rules = firedRules(c, choice, {});
    expect(rules.map((r) => r.id)).toContain("br_discipline");
  });

  it("does not fire when the cause flag is absent", () => {
    const c = content();
    const choice: Choice = {
      id: "lazy",
      text: "Skip it.",
      effects: {},
      setFlags: [],
      clearFlags: [],
      ripples: [],
      outcome: "ok",
    };
    expect(firedRules(c, choice, {})).toHaveLength(0);
  });

  it("produces ledger entries with rendered chain text and sequential seq", () => {
    const c = content();
    const event = c.allEvents.find((e) => e.id === "ev_military_school") as GameEvent;
    const choice = event.choices[0] as Choice;
    const entries = buildLedgerEntries(c, event, choice, {}, 7);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.seq).toBe(7);
    expect(entries[0]?.ruleId).toBe("br_discipline");
    expect(entries[0]?.sourceEvent).toBe("ev_military_school");
    expect(entries[0]?.text).toContain("academy");
  });
});
