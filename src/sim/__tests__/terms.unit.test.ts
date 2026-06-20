import { describe, expect, it } from "vitest";
import boyhoodJson from "../../data/eras/boyhood.json";
import originsJson from "../../data/eras/origins.json";
import termsJson from "../../data/terms.json";
import { meetsRequires } from "../events";
import { EraEventsSchema, TermsFileSchema } from "../schema";
import { applyTerms, isNamedHeir, resolveFullName, resolveGivenName, resolveTerm } from "../terms";

const terms = TermsFileSchema.parse(termsJson).terms;

describe("branch-aware terms (alt-history AH1)", () => {
  it("the real terms.json validates and carries the example titles", () => {
    expect(terms.head_of_state?.default).toBe("President");
    expect(terms.head_of_state?.nazi).toBe("Reichskommissar");
  });

  it("resolveTerm falls back to default for branches without an override", () => {
    const t = { default: "President", nazi: "Reichskommissar" };
    expect(resolveTerm(t, "default")).toBe("President");
    expect(resolveTerm(t, "nazi")).toBe("Reichskommissar");
    expect(resolveTerm(t, "westcoast")).toBe("President"); // no override → default
  });

  it("applyTerms interpolates {tokens} per branch", () => {
    const text = "The {head_of_state} addressed {the_nation}.";
    expect(applyTerms(text, terms, "default")).toBe("The President addressed the United States.");
    expect(applyTerms(text, terms, "nazi")).toBe(
      "The Reichskommissar addressed the American Reichskommissariat.",
    );
  });

  it("leaves unknown tokens and plain text untouched", () => {
    expect(applyTerms("Hello {name}, no terms here.", terms, "nazi")).toBe(
      "Hello {name}, no terms here.",
    );
    expect(applyTerms("plain", terms, "default")).toBe("plain");
  });

  it("honors {{ }} as literal-brace escapes", () => {
    expect(applyTerms("a {{literal}} {head_of_state}", terms, "default")).toBe(
      "a {literal} President",
    );
  });

  it("resolves the branch-aware surname/patronymic (AH8): Trump default, Drumpf on the German/Nazi branch", () => {
    expect(terms.surname?.default).toBe("Trump");
    expect(terms.surname?.nazi).toBe("Drumpf");
    expect(applyTerms("The {family_name} built it.", terms, "default")).toBe(
      "The Trumps built it.",
    );
    expect(applyTerms("The {family_name} built it.", terms, "nazi")).toBe("The Drumpfs built it.");
    expect(applyTerms("{surname} of New York", terms, "default")).toBe("Trump of New York");
    expect(applyTerms("{surname} of the Reich", terms, "nazi")).toBe("Drumpf of the Reich");
    // A branch without a surname override keeps the default (the family anglicized).
    expect(applyTerms("{surname}", terms, "media")).toBe("Trump");
  });

  it("resolves the branch-aware GIVEN name (AH8c): Donald default, Friedrich on proud-tradition German branches", () => {
    expect(applyTerms("{given_name}", terms, "default")).toBe("Donald");
    expect(applyTerms("{full_name}", terms, "default")).toBe("Donald Trump");
    // Military/religious German dynasties carry the patriarch's name.
    expect(applyTerms("{given_name}", terms, "nazi")).toBe("Friedrich");
    expect(applyTerms("{full_name}", terms, "nazi")).toBe("Friedrich Drumpf III");
    expect(applyTerms("{given_name}", terms, "theocracy")).toBe("Friedrich");
    // The media/West-Coast branches keep Donald (no proud-name tradition imposed).
    expect(applyTerms("{given_name}", terms, "media")).toBe("Donald");
  });
});

describe("birth-order given-name resolution (AH8d / de-4a)", () => {
  it("a firstborn/only-child heir carries the patriarch's name even on a Donald branch", () => {
    // Default branch's given name is Donald, but a firstborn heir is named for the patriarch.
    expect(resolveGivenName(terms, "default", [])).toBe("Donald");
    expect(resolveGivenName(terms, "default", ["fourth_child"])).toBe("Donald");
    expect(resolveGivenName(terms, "default", ["firstborn_heir"])).toBe("Friedrich");
    expect(resolveGivenName(terms, "default", ["only_child"])).toBe("Friedrich");
  });

  it("full name gains the dynastic suffix only for a named heir", () => {
    expect(resolveFullName(terms, "default", ["fourth_child"])).toBe("Donald Trump");
    expect(resolveFullName(terms, "default", ["firstborn_heir"])).toBe("Friedrich Trump III");
    // On the Nazi branch the surname is Drumpf; a firstborn is Friedrich Drumpf III.
    expect(resolveFullName(terms, "nazi", ["firstborn_heir"])).toBe("Friedrich Drumpf III");
  });

  it("isNamedHeir reflects firstborn/only-child, not fourth-child", () => {
    expect(isNamedHeir(["firstborn_heir"])).toBe(true);
    expect(isNamedHeir(["only_child"])).toBe(true);
    expect(isNamedHeir(["fourth_child"])).toBe(false);
    expect(isNamedHeir([])).toBe(false);
  });
});

describe("birth-order lever — ev_the_children prologue event (de-4a)", () => {
  const origins = EraEventsSchema.parse(originsJson);
  const boyhood = EraEventsSchema.parse(boyhoodJson);

  // Throwing lookups so the tests narrow types without non-null assertions.
  const eventById = (evs: typeof origins.events, id: string) => {
    const e = evs.find((x) => x.id === id);
    if (!e) throw new Error(`no event ${id}`);
    return e;
  };
  const theChildren = eventById(origins.events, "ev_the_children");
  const brothersShadow = eventById(boyhood.events, "ev_brothers_shadow");
  const contentHeir = eventById(boyhood.events, "ev_content_heir_dream");
  const choiceById = (ev: typeof theChildren, id: string) => {
    const c = ev.choices.find((x) => x.id === id);
    if (!c) throw new Error(`no choice ${id} in ${ev.id}`);
    return c;
  };

  it("ev_the_children carries all four birth-order choices", () => {
    const ids = theChildren.choices.map((c) => c.id);
    expect(ids).toContain("firstborn_groomed_heir");
    expect(ids).toContain("only_child_sole_heir");
    expect(ids).toContain("fourth_child_accidental_heir");
    expect(ids).toContain("fourth_child_brother_dies");
  });

  it("firstborn_groomed_heir sets firstborn_heir + fred_jr_present + groomed_heir", () => {
    const ch = choiceById(theChildren, "firstborn_groomed_heir");
    expect(ch.setFlags).toContain("firstborn_heir");
    expect(ch.setFlags).toContain("fred_jr_present");
    expect(ch.setFlags).toContain("groomed_heir");
    expect(ch.setFlags).not.toContain("only_child");
    expect(ch.setFlags).not.toContain("accidental_heir");
  });

  it("only_child_sole_heir sets only_child + firstborn_heir + groomed_heir (no fred_jr_present)", () => {
    const ch = choiceById(theChildren, "only_child_sole_heir");
    expect(ch.setFlags).toContain("only_child");
    expect(ch.setFlags).toContain("firstborn_heir");
    expect(ch.setFlags).toContain("groomed_heir");
    expect(ch.setFlags).not.toContain("fred_jr_present");
    expect(ch.setFlags).not.toContain("accidental_heir");
  });

  it("fourth_child_accidental_heir sets fourth_child + fred_jr_present + accidental_heir (not died)", () => {
    const ch = choiceById(theChildren, "fourth_child_accidental_heir");
    expect(ch.setFlags).toContain("fourth_child");
    expect(ch.setFlags).toContain("fred_jr_present");
    expect(ch.setFlags).toContain("accidental_heir");
    expect(ch.setFlags).not.toContain("fred_jr_died");
    expect(ch.setFlags).not.toContain("groomed_heir");
  });

  it("fourth_child_brother_dies sets fourth_child + fred_jr_died + accidental_heir (not present)", () => {
    const ch = choiceById(theChildren, "fourth_child_brother_dies");
    expect(ch.setFlags).toContain("fourth_child");
    expect(ch.setFlags).toContain("fred_jr_died");
    expect(ch.setFlags).toContain("accidental_heir");
    expect(ch.setFlags).not.toContain("fred_jr_present");
    expect(ch.setFlags).not.toContain("groomed_heir");
  });

  /** Minimal stub satisfying meetsRequires's flag/meter/personality checks. */
  const stubState = (flags: string[]) =>
    ({
      flags,
      meters: {},
      personality: { ideology: 0, grandiosity: 0, outward: 0, inward: 0 },
      age: 20,
      // biome-ignore lint/suspicious/noExplicitAny: test stub, not a full GameState
    }) as any;

  it("ev_brothers_shadow gates on fred_jr_present — fires for fourth-child runs only", () => {
    const req = brothersShadow.requires;
    if (!req) throw new Error("ev_brothers_shadow has no requires");
    // fourthChild run with fred_jr alive: eligible
    expect(meetsRequires(stubState(["fourth_child", "fred_jr_present"]), req)).toBe(true);
    // firstborn run: Fred Jr. never born, event must not fire
    expect(meetsRequires(stubState(["firstborn_heir"]), req)).toBe(false);
    // only_child run: same — no elder brother
    expect(meetsRequires(stubState(["only_child", "firstborn_heir"]), req)).toBe(false);
    // fourth_child with Freddy already dead (origins path): blocked — no living elder brother
    // to cast a shadow in 1955. The early-death framing in 'fourth_child_brother_dies' sets
    // fred_jr_died WITHOUT fred_jr_present, so the gate correctly suppresses this event.
    expect(meetsRequires(stubState(["fourth_child", "fred_jr_died"]), req)).toBe(false);
  });

  it("ev_content_heir_dream gates only on at_nyma — past-tense Freddy reflection fires on fred_jr_died path too (de-4a)", () => {
    // The scene uses past-tense ("Freddy wanted to fly planes") — historically accurate even
    // when Freddy died before boyhood. Gate is at_nyma only, not fred_jr_present.
    const req = contentHeir.requires;
    if (!req) throw new Error("ev_content_heir_dream has no requires");
    // Historical fourth-child run with Freddy alive: eligible (at_nyma is the real gate)
    expect(meetsRequires(stubState(["fourth_child", "fred_jr_present", "at_nyma"]), req)).toBe(
      true,
    );
    // fourth_child with Freddy dead early: ALSO eligible — past-tense reflection still works
    expect(meetsRequires(stubState(["fourth_child", "fred_jr_died", "at_nyma"]), req)).toBe(true);
    // Without at_nyma: never eligible regardless of birth order
    expect(meetsRequires(stubState(["fourth_child", "fred_jr_present"]), req)).toBe(false);
    // Only-child run WITH at_nyma: fires — past-tense scene works for any birth order
    expect(meetsRequires(stubState(["only_child", "at_nyma"]), req)).toBe(true);
    // Without at_nyma even on only_child: blocked
    expect(meetsRequires(stubState(["only_child"]), req)).toBe(false);
  });
});

describe("Musk prologue structure — de-5b", () => {
  const origins = EraEventsSchema.parse(originsJson);

  const eventById = (id: string) => {
    const e = origins.events.find((x) => x.id === id);
    if (!e) throw new Error(`no event ${id} in origins`);
    return e;
  };

  it("ev_dynasty_founding_choice exists with trump + musk choices", () => {
    const ev = eventById("ev_dynasty_founding_choice");
    const choiceIds = ev.choices.map((c) => c.id);
    expect(choiceIds).toContain("choose_trump_dynasty");
    expect(choiceIds).toContain("choose_musk_dynasty");
  });

  it("choose_musk_dynasty sets musk_dynasty_active + musk_prologue", () => {
    const ev = eventById("ev_dynasty_founding_choice");
    const c = ev.choices.find((x) => x.id === "choose_musk_dynasty");
    if (!c) throw new Error("no choose_musk_dynasty");
    expect(c.setFlags).toContain("musk_dynasty_active");
    expect(c.setFlags).toContain("musk_prologue");
    expect(c.setFlags).not.toContain("trump_prologue");
  });

  it("choose_trump_dynasty sets trump_prologue, NOT musk_dynasty_active", () => {
    const ev = eventById("ev_dynasty_founding_choice");
    const c = ev.choices.find((x) => x.id === "choose_trump_dynasty");
    if (!c) throw new Error("no choose_trump_dynasty");
    expect(c.setFlags).toContain("trump_prologue");
    expect(c.setFlags).not.toContain("musk_dynasty_active");
  });

  it("ev_friedrich_leaves_kallstadt is gated by trump_prologue and blocks musk_dynasty_active", () => {
    const ev = eventById("ev_friedrich_leaves_kallstadt");
    expect(ev.requires?.flags ?? []).toContain("trump_prologue");
    expect(ev.requires?.notFlags ?? []).toContain("musk_dynasty_active");
  });

  it("Musk prologue chain: walter → errol → elon, each gated correctly", () => {
    const walter = eventById("ev_walter_musk_cape_colony");
    expect(walter.requires?.flags ?? []).toContain("musk_prologue");
    expect(walter.requires?.notFlags ?? []).toContain("trump_prologue");

    const errol = eventById("ev_errol_musk_builds");
    expect(errol.requires?.flags ?? []).toContain("musk_south_africa_roots");
    expect(errol.requires?.notFlags ?? []).toContain("trump_prologue");

    const elon = eventById("ev_elon_musk_born");
    expect(elon.requires?.flags ?? []).toContain("musk_technical_lineage");
    expect(elon.requires?.notFlags ?? []).toContain("trump_prologue");
  });

  it("walter's aviator choice sets musk_south_africa_roots (seeds errol gate)", () => {
    const ev = eventById("ev_walter_musk_cape_colony");
    const c = ev.choices.find((x) => x.id === "walter_the_aviator");
    if (!c) throw new Error("no walter_the_aviator");
    expect(c.setFlags).toContain("musk_south_africa_roots");
    expect(c.setFlags).toContain("musk_frontier_spirit");
  });

  it("errol's hard-businessman choice sets musk_technical_lineage (seeds elon gate)", () => {
    const ev = eventById("ev_errol_musk_builds");
    const c = ev.choices.find((x) => x.id === "errol_the_hard_businessman");
    if (!c) throw new Error("no errol_the_hard_businessman");
    expect(c.setFlags).toContain("musk_technical_lineage");
    expect(c.setFlags).toContain("dynasty_capital");
  });

  it("ev_elon_musk_born has two capstone choices both setting born_advantaged", () => {
    const ev = eventById("ev_elon_musk_born");
    for (const c of ev.choices) {
      expect(c.setFlags, `choice ${c.id}`).toContain("born_advantaged");
      expect(c.setFlags, `choice ${c.id}`).toContain("musk_origin");
    }
  });

  it("all four Musk prologue events are within origins era year bounds [1885..1946]", () => {
    const muskEventIds = [
      "ev_dynasty_founding_choice",
      "ev_walter_musk_cape_colony",
      "ev_errol_musk_builds",
      "ev_elon_musk_born",
    ];
    for (const id of muskEventIds) {
      const ev = eventById(id);
      expect(ev.year, `${id} year`).toBeGreaterThanOrEqual(1885);
      expect(ev.year, `${id} year`).toBeLessThanOrEqual(1946);
    }
  });
});
