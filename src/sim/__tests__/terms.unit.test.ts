import { describe, expect, it } from "vitest";
import termsJson from "../../data/terms.json";
import { TermsFileSchema } from "../schema";
import type { GameState } from "../state";
import { applyTerms, runTerms } from "../terms";

const terms = TermsFileSchema.parse(termsJson).terms;

/** A founded-line state stub: the founded line names the protagonist (CP-R1). */
function foundedState(given: string, surname: string, sex: "male" | "female" = "male"): GameState {
  return {
    family: {
      protagonistId: "m0",
      nextSeq: 1,
      members: [
        {
          id: "m0",
          given,
          surname,
          sex,
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
    expect(
      applyTerms("a {{literal}} {head_of_state}", runTerms(terms, "default", unfoundedState)),
    ).toBe("a {literal} President");
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

  it("EI-5: {child_kind} resolves to son/daughter from the founded protagonist's sex (gender spoken in-fiction)", () => {
    expect(
      applyTerms("a {child_kind}", runTerms(terms, "default", foundedState("Tom", "Vane", "male"))),
    ).toBe("a son");
    expect(
      applyTerms(
        "a {child_kind}",
        runTerms(terms, "default", foundedState("Tess", "Vane", "female")),
      ),
    ).toBe("a daughter");
    // Un-founded → unresolved (no preset).
    expect(applyTerms("a {child_kind}", runTerms(terms, "default", unfoundedState))).toBe(
      "a {child_kind}",
    );
  });
});
