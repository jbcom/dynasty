import { describe, expect, it } from "vitest";
import boyhoodJson from "../../data/eras/boyhood.json";
import originsJson from "../../data/eras/origins.json";
import termsJson from "../../data/terms.json";
import { meetsRequires } from "../events";
import { EraEventsSchema, TermsFileSchema } from "../schema";
import type { GameState } from "../state";
import { applyTerms, runTerms } from "../terms";

const terms = TermsFileSchema.parse(termsJson).terms;

/** A founded-line state stub: the founded line names the protagonist (CP-R1). */
function foundedState(given: string, surname: string): GameState {
  return {
    family: {
      protagonistId: "m0",
      nextSeq: 1,
      members: [
        {
          id: "m0",
          given,
          surname,
          sex: "male",
          born: 1900,
          generation: 0,
          traits: { ambition: 50, cunning: 50, vigor: 50, piety: 50 },
          isProtagonist: true,
        },
      ],
    },
    // biome-ignore lint/suspicious/noExplicitAny: minimal stub for term resolution
  } as any;
}
/** An un-founded state stub (no family) — identity tokens stay unresolved. */
// biome-ignore lint/suspicious/noExplicitAny: minimal stub for term resolution
const unfoundedState = {} as any as GameState;

describe("branch-aware institutional terms (alt-history AH1)", () => {
  it("the real terms.json validates and carries the institutional titles", () => {
    expect(terms.head_of_state?.default).toBe("President");
    expect(terms.head_of_state?.nazi).toBe("Reichskommissar");
  });

  it("runTerms resolves institutional tokens per branch", () => {
    const def = runTerms(terms, "default", unfoundedState);
    expect(def.head_of_state).toBe("President");
    expect(def.the_nation).toBe("the United States");
    const nazi = runTerms(terms, "nazi", unfoundedState);
    expect(nazi.head_of_state).toBe("Reichskommissar");
    expect(nazi.the_nation).toBe("the American Reichskommissariat");
  });

  it("applyTerms interpolates {tokens} from a resolved table", () => {
    const text = "The {head_of_state} addressed {the_nation}.";
    expect(applyTerms(text, runTerms(terms, "default", unfoundedState))).toBe(
      "The President addressed the United States.",
    );
    expect(applyTerms(text, runTerms(terms, "nazi", unfoundedState))).toBe(
      "The Reichskommissar addressed the American Reichskommissariat.",
    );
  });

  it("leaves unknown tokens and plain text untouched", () => {
    const t = runTerms(terms, "nazi", unfoundedState);
    expect(applyTerms("Hello {name}, no terms here.", t)).toBe("Hello {name}, no terms here.");
    expect(applyTerms("plain", t)).toBe("plain");
  });

  it("honors {{ }} as literal-brace escapes", () => {
    expect(applyTerms("a {{literal}} {head_of_state}", runTerms(terms, "default", unfoundedState))).toBe(
      "a {literal} President",
    );
  });
});

describe("founded-line identity tokens (CP-R1)", () => {
  it("given_name/surname/full_name/family_name resolve from the founded line, not a preset", () => {
    // An Irish-Catholic founded line — the player's OWN name, not Donald/Trump.
    const t = runTerms(terms, "default", foundedState("Patrick", "Donnelly"));
    expect(applyTerms("{given_name}", t)).toBe("Patrick");
    expect(applyTerms("{surname}", t)).toBe("Donnelly");
    expect(applyTerms("{full_name}", t)).toBe("Patrick Donnelly");
    expect(applyTerms("The {family_name} built it.", t)).toBe("The Donnellys built it.");
  });

  it("a different founded origin yields a different name from the SAME content string", () => {
    const abbasid = runTerms(terms, "default", foundedState("Harun", "al-Rashid"));
    expect(applyTerms("{full_name} is born.", abbasid)).toBe("Harun al-Rashid is born.");
    const bavarian = runTerms(terms, "default", foundedState("Friedrich", "Eberhardt"));
    expect(applyTerms("{full_name} is born.", bavarian)).toBe("Friedrich Eberhardt is born.");
  });

  it("the founded identity overrides the branch term even on an alt-history branch", () => {
    // On the Nazi branch institutional tokens shift, but the LINE keeps its own name.
    const t = runTerms(terms, "nazi", foundedState("Síle", "Donnelly"));
    expect(applyTerms("{surname}", t)).toBe("Donnelly"); // NOT "Drumpf"
    expect(applyTerms("{head_of_state}", t)).toBe("Reichskommissar"); // institutional still shifts
  });

  it("an un-founded state leaves identity tokens unresolved (no literal fallback)", () => {
    // No family → no override; terms.json no longer carries literal Donald/Trump defaults,
    // so the identity tokens are left verbatim rather than rendering a preset name.
    const t = runTerms(terms, "default", unfoundedState);
    expect(applyTerms("{given_name}", t)).toBe("{given_name}");
    expect(applyTerms("{surname}", t)).toBe("{surname}");
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

  it("ev_donald_is_born blocks on musk_dynasty_active (Trump/Musk birth events mutually exclusive)", () => {
    // ev_donald_is_born has no required flags — it fires on any run without notFlags hits.
    // On a Musk run, none of its original notFlags (line_failed, never_emigrated, etc.) are set,
    // so without this guard it would fire alongside ev_elon_musk_born. Both must not fire.
    const ev = eventById("ev_donald_is_born");
    expect(ev.requires?.notFlags ?? []).toContain("musk_dynasty_active");
  });

  it("errol's inventor choice also seeds musk_technical_lineage (both errol paths reach ev_elon_musk_born)", () => {
    const ev = eventById("ev_errol_musk_builds");
    const inventor = ev.choices.find((x) => x.id === "errol_the_inventor");
    if (!inventor) throw new Error("no errol_the_inventor");
    // Without musk_technical_lineage, a player who picks errol_the_inventor is dead-ended:
    // ev_elon_musk_born requires musk_technical_lineage and can never fire.
    expect(inventor.setFlags).toContain("musk_technical_lineage");
  });

  it("Musk mid-chain events (errol, elon) also block kennedy_dynasty_active — symmetric guards (de-5d review)", () => {
    // Reviewer found: errol + elon only had notFlags:[trump_prologue], not kennedy.
    // kennedy_dynasty_active is now added so Kennedy runs can't accidentally trigger
    // Musk mid-chain events (which gate only on Musk-derived flags that Kennedy runs
    // wouldn't have, but belt-and-suspenders isolation matters for future flag drift).
    const errol = eventById("ev_errol_musk_builds");
    expect(errol.requires?.notFlags ?? []).toContain("kennedy_dynasty_active");

    const elon = eventById("ev_elon_musk_born");
    expect(elon.requires?.notFlags ?? []).toContain("kennedy_dynasty_active");
  });
});

describe("Kennedy prologue structure — de-5c", () => {
  const origins = EraEventsSchema.parse(originsJson);

  const eventById = (id: string) => {
    const e = origins.events.find((x) => x.id === id);
    if (!e) throw new Error(`no event ${id} in origins`);
    return e;
  };

  it("ev_dynasty_founding_choice has all three dynasty choices", () => {
    const ev = eventById("ev_dynasty_founding_choice");
    const ids = ev.choices.map((c) => c.id);
    expect(ids).toContain("choose_trump_dynasty");
    expect(ids).toContain("choose_musk_dynasty");
    expect(ids).toContain("choose_kennedy_dynasty");
  });

  it("ev_dynasty_founding_choice is suppressed when any dynasty is already seeded — no double-prompt (de-5d carousel fix)", () => {
    // The carousel calls initState(content, seed, dynasty) which seeds trump_prologue /
    // musk_dynasty_active / kennedy_dynasty_active from turn zero. The in-game selector
    // must never fire when any of these is present, or the player gets asked twice.
    const ev = eventById("ev_dynasty_founding_choice");
    const nf = ev.requires?.notFlags ?? [];
    expect(nf).toContain("trump_prologue");
    expect(nf).toContain("musk_dynasty_active");
    expect(nf).toContain("kennedy_dynasty_active");
  });

  it("choose_kennedy_dynasty sets kennedy_dynasty_active + kennedy_prologue", () => {
    const ev = eventById("ev_dynasty_founding_choice");
    const c = ev.choices.find((x) => x.id === "choose_kennedy_dynasty");
    if (!c) throw new Error("no choose_kennedy_dynasty");
    expect(c.setFlags).toContain("kennedy_dynasty_active");
    expect(c.setFlags).toContain("kennedy_prologue");
    expect(c.setFlags).not.toContain("trump_prologue");
    expect(c.setFlags).not.toContain("musk_dynasty_active");
  });

  it("Kennedy prologue chain: Patrick → PJ → JPK, each gated correctly", () => {
    const patrick = eventById("ev_patrick_kennedy_famine");
    expect(patrick.requires?.flags ?? []).toContain("kennedy_prologue");
    expect(patrick.requires?.notFlags ?? []).toContain("trump_prologue");
    expect(patrick.requires?.notFlags ?? []).toContain("musk_dynasty_active");

    const pj = eventById("ev_pj_kennedy_ward_boss");
    expect(pj.requires?.flags ?? []).toContain("kennedy_irish_roots");
    expect(pj.requires?.notFlags ?? []).toContain("trump_prologue");
    expect(pj.requires?.notFlags ?? []).toContain("musk_dynasty_active");

    const jpk = eventById("ev_jpk_the_patriarch");
    expect(jpk.requires?.flags ?? []).toContain("kennedy_political_dynasty");
    expect(jpk.requires?.notFlags ?? []).toContain("trump_prologue");
    expect(jpk.requires?.notFlags ?? []).toContain("musk_dynasty_active");
  });

  it("Patrick's choices both set kennedy_irish_roots (seeds PJ gate)", () => {
    const ev = eventById("ev_patrick_kennedy_famine");
    for (const c of ev.choices) {
      expect(c.setFlags, `choice ${c.id}`).toContain("kennedy_irish_roots");
    }
  });

  it("PJ's choices both set kennedy_political_dynasty (seeds JPK gate)", () => {
    const ev = eventById("ev_pj_kennedy_ward_boss");
    for (const c of ev.choices) {
      expect(c.setFlags, `choice ${c.id}`).toContain("kennedy_political_dynasty");
    }
  });

  it("JPK's choices both set kennedy_dynasty_sons (seeds mid-game Kennedy arc)", () => {
    const ev = eventById("ev_jpk_the_patriarch");
    for (const c of ev.choices) {
      expect(c.setFlags, `choice ${c.id}`).toContain("kennedy_dynasty_sons");
    }
  });

  it("ev_donald_is_born also blocks kennedy_dynasty_active (all three dynasties mutually exclusive)", () => {
    const ev = eventById("ev_donald_is_born");
    expect(ev.requires?.notFlags ?? []).toContain("kennedy_dynasty_active");
  });

  it("all three Kennedy prologue events are within origins era year bounds [1885..1946]", () => {
    const kennedyEventIds = [
      "ev_patrick_kennedy_famine",
      "ev_pj_kennedy_ward_boss",
      "ev_jpk_the_patriarch",
    ];
    for (const id of kennedyEventIds) {
      const ev = eventById(id);
      expect(ev.year, `${id} year`).toBeGreaterThanOrEqual(1885);
      expect(ev.year, `${id} year`).toBeLessThanOrEqual(1946);
    }
  });
});
