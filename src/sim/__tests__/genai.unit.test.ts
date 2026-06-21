import { describe, expect, it } from "vitest";
import { loadContent } from "../../data/loadContent";
import { parseGenerated } from "../genai/client";
import { generateForTarget } from "../genai/generate";
import { buildPrompt, systemInstruction } from "../genai/prompt";
import { validateGenerated } from "../genai/validate";

/**
 * EX-4 — the GenAI breadth toolkit, exercised end-to-end with a STUB generator (no
 * key, no network). Proves the validation gate accepts good generated events and
 * rejects every bad kind, so live generation can only ever add harness-clean content.
 */

const content = loadContent();
const ctx = {
  era: "origins",
  eraIds: new Set(content.eras.map((e) => e.id)),
  tropes: content.tropes,
  places: content.places,
  existingIds: new Set(content.allEvents.map((e) => e.id)),
};

const goodEvent = {
  id: "ev_gen_test_clean",
  era: "origins",
  place: "ireland",
  year: 1890,
  title: "A Test of the Line",
  scene:
    "The {surname} line faces a choice that will echo. Your father watches to see what you are made of.",
  researchNote: "synthetic test event.",
  historicity: "personal",
  tags: ["trope:tenant-and-landlord"],
  requires: { flags: ["founded_line"], notFlags: [], meters: {}, personality: {} },
  weight: 12,
  choices: [
    {
      id: "a",
      text: "Stand firm",
      effects: { reputation: 3 },
      personality: {},
      setFlags: [],
      outcome: "You hold.",
    },
    {
      id: "b",
      text: "Yield",
      effects: { money: 2 },
      personality: {},
      setFlags: [],
      outcome: "You bend.",
    },
  ],
};

describe("EX-4 genai validation gate", () => {
  it("accepts a clean, schema-valid, founded-line, trope-tagged event", () => {
    const v = validateGenerated(goodEvent, ctx);
    expect(v.accepted, JSON.stringify(v.reasons)).toBe(true);
    expect(v.event?.id).toBe("ev_gen_test_clean");
  });

  it("rejects a preset-person literal leak", () => {
    const bad = { ...goodEvent, id: "ev_gen_leak", scene: "Donald Trump signs the deed." };
    const v = validateGenerated(bad, ctx);
    expect(v.accepted).toBe(false);
    expect(v.reasons.some((r) => r.includes("preset-person literal"))).toBe(true);
  });

  it("rejects an unknown trope tag", () => {
    const bad = { ...goodEvent, id: "ev_gen_badtrope", tags: ["trope:not-a-real-trope"] };
    const v = validateGenerated(bad, ctx);
    expect(v.accepted).toBe(false);
    expect(v.reasons.some((r) => r.includes("unknown trope"))).toBe(true);
  });

  it("rejects a corridor (fewer than 2 choices) and a missing founded_line gate", () => {
    const corridor = { ...goodEvent, id: "ev_gen_corridor", choices: [goodEvent.choices[0]] };
    expect(validateGenerated(corridor, ctx).reasons.some((r) => r.includes("2 choices"))).toBe(
      true,
    );
    const ungated = {
      ...goodEvent,
      id: "ev_gen_ungated",
      requires: { flags: [], notFlags: [], meters: {}, personality: {} },
    };
    expect(validateGenerated(ungated, ctx).reasons.some((r) => r.includes("founded_line"))).toBe(
      true,
    );
  });

  it("rejects an unknown place / archetype / wrong era", () => {
    expect(
      validateGenerated({ ...goodEvent, id: "p", place: "atlantis" }, ctx).reasons.some((r) =>
        r.includes("unknown place"),
      ),
    ).toBe(true);
    expect(
      validateGenerated({ ...goodEvent, id: "a", archetypes: ["wizard"] }, ctx).reasons.some((r) =>
        r.includes("unknown archetype"),
      ),
    ).toBe(true);
    expect(
      validateGenerated({ ...goodEvent, id: "e", era: "nonexistent" }, ctx).reasons.some((r) =>
        r.includes("era"),
      ),
    ).toBe(true);
  });

  it("rejects a duplicate id (collision with the existing corpus)", () => {
    const existing = content.allEvents[0]?.id ?? "ev_birth_emergence";
    const dup = { ...goodEvent, id: existing };
    expect(validateGenerated(dup, ctx).reasons.some((r) => r.includes("duplicate"))).toBe(true);
  });
});

describe("EX-4 prompt builder", () => {
  it("embeds the rules, the catalog, and place/archetype scoping", () => {
    const sys = systemInstruction();
    expect(sys).toMatch(/NEVER write a real person/);
    expect(sys).toMatch(/founded_line/);
    const prompt = buildPrompt(
      { place: "baghdad", era: "origins", year: 1885, archetypes: ["religious"], count: 2 },
      content.tropes,
      content.places,
    );
    // baghdad is now the 1880s Arab/Levantine wave (label "the Levant").
    expect(prompt).toMatch(/Levant/);
    expect(prompt).toMatch(/religious/);
    // The catalog tropes are listed for the model to choose from.
    expect(prompt).toMatch(/trope/);
    const firstTrope = content.tropes[0];
    if (!firstTrope) throw new Error("no tropes");
    expect(prompt).toContain(firstTrope.id);
  });
});

describe("EX-4 orchestrator with a stub generator (no key, no network)", () => {
  it("generates → validates → returns only accepted events", async () => {
    // A stub model that returns one clean event + one leaking event.
    const leak = { ...goodEvent, id: "ev_gen_stub_leak", scene: "Fred builds the empire." };
    const stub = async () => JSON.stringify([goodEvent, leak]);
    const res = await generateForTarget(
      content,
      { place: "ireland", era: "origins", year: 1890, count: 2 },
      stub,
    );
    expect(res.accepted.map((e) => e.id)).toEqual(["ev_gen_test_clean"]);
    expect(res.rejected).toHaveLength(1);
    expect(res.rejected[0]?.reasons.some((r) => r.includes("preset-person literal"))).toBe(true);
  });

  it("parseGenerated tolerates markdown fences / surrounding prose", () => {
    expect(parseGenerated('```json\n[{"x":1}]\n```')).toEqual([{ x: 1 }]);
    expect(parseGenerated("here you go: [1,2,3] done")).toEqual([1, 2, 3]);
    expect(parseGenerated("not json at all")).toEqual([]);
  });
});
