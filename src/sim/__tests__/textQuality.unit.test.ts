import { describe, expect, it } from "vitest";
import { loadContent } from "../../data/loadContent";
import type { Content } from "../content";
import type { GameEvent } from "../schema";
import { auditTextQuality } from "../textQuality";

/**
 * PL-13 — the text-quality dev check. The writing is the game, so this gate catches the
 * mechanical copy defects an editor would flag: unresolved/typo slot tokens, doubled words,
 * placeholders, unbalanced braces, sloppy whitespace/punctuation. Two duties: detect each
 * defect on synthetic input, and keep the SHIPPED corpus clean (0 findings).
 */

function evWith(over: Partial<GameEvent>): GameEvent {
  return {
    id: "ev_tq",
    era: "origins",
    year: 1900,
    title: "A Clean Title",
    scene: "A clean scene with a {surname} slot that resolves.",
    researchNote: "r",
    extrapolated: false,
    startrekInspired: false,
    tags: [],
    requires: { flags: [], notFlags: [], meters: {}, personality: {} },
    weight: 1,
    repeatable: false,
    choices: [
      {
        id: "a",
        text: "A clean choice.",
        effects: {},
        personality: {},
        setFlags: [],
        clearFlags: [],
        ripples: [],
        outcome: "A clean outcome.",
      },
    ],
    ...over,
  } as GameEvent;
}

function auditOne(ev: GameEvent) {
  const content = { allEvents: [ev] } as unknown as Content;
  return auditTextQuality(content);
}

describe("PL-13 text-quality analyzer", () => {
  it("passes clean copy with valid slots", () => {
    expect(auditOne(evWith({}))).toEqual([]);
  });

  it("flags an unknown/typo slot token (renders literally to the player)", () => {
    const f = auditOne(evWith({ scene: "The {plce} is cold." }));
    expect(f.some((x) => x.kind === "unknown-slot")).toBe(true);
  });

  it("accepts every real slot token", () => {
    const f = auditOne(
      evWith({ scene: "{given_name} {surname} {full_name} {family_name} endure." }),
    );
    expect(f).toEqual([]);
  });

  it("flags a hyphenated/typo slot as unknown-slot, not unbalanced-brace (review)", () => {
    const f = auditOne(evWith({ scene: "The {some-slot} is odd." }));
    expect(f.some((x) => x.kind === "unknown-slot")).toBe(true);
    expect(f.some((x) => x.kind === "unbalanced-brace")).toBe(false);
  });

  it("still flags a run-on where an abbreviation isn't sentence-final (Mr.Smith) (review)", () => {
    const f = auditOne(evWith({ scene: "He met Mr.Smith at noon." }));
    expect(f.some((x) => x.kind === "punctuation")).toBe(true);
  });

  it("flags a doubled word", () => {
    const f = auditOne(evWith({ title: "The the End" }));
    expect(f.some((x) => x.kind === "doubled-word")).toBe(true);
  });

  it("flags placeholder scaffolding", () => {
    const f = auditOne(evWith({ scene: "TODO write this scene." }));
    expect(f.some((x) => x.kind === "placeholder")).toBe(true);
  });

  it("flags an unbalanced brace", () => {
    const f = auditOne(evWith({ scene: "A stray { brace." }));
    expect(f.some((x) => x.kind === "unbalanced-brace")).toBe(true);
  });

  it("flags whitespace + space-before-punctuation", () => {
    const f = auditOne(evWith({ scene: "Two  spaces and a word ." }));
    expect(f.some((x) => x.kind === "whitespace")).toBe(true);
    expect(f.some((x) => x.kind === "punctuation")).toBe(true);
  });

  it("does NOT flag legitimate abbreviations/initials/decimals as punctuation typos", () => {
    const f = auditOne(
      evWith({ scene: "At 3 a.m., George H.W. Bush polled 89% with 'Y.M.C.A.' playing." }),
    );
    expect(f.filter((x) => x.kind === "punctuation")).toEqual([]);
  });
});

describe("PL-13 shipped corpus is text-clean", () => {
  it("every authored event passes the text-quality audit (0 findings)", () => {
    const findings = auditTextQuality(loadContent());
    expect(findings, JSON.stringify(findings.slice(0, 10), null, 2)).toEqual([]);
  });
});
