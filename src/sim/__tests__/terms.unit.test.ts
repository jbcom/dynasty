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
});
