import { describe, expect, it } from "vitest";
import termsJson from "../../data/terms.json";
import { TermsFileSchema } from "../schema";
import { applyTerms, resolveTerm } from "../terms";

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
