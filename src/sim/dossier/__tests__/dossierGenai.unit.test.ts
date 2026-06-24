import { describe, expect, it } from "vitest";
import { SIGNATURE_STYLE } from "../../genai/portrait";
import {
  buildDossierBriefPrompt,
  buildDossierFigurePrompt,
  type DossierState,
  dossierBriefSystem,
} from "../dossierGenai";

/**
 * VD-5 — the dossier GenAI prompt builders: a path-voice BRIEF (analytical prose) + an atmospheric FIGURE
 * (a no-people plate in the signature style). Pure, deterministic, leak-safe.
 */

const state = (over: Partial<DossierState> = {}): DossierState => ({
  familyName: "Calloway",
  rung: 3,
  topMeters: [
    { label: "Reputation", value: 55 },
    { label: "Heat", value: 20 },
  ],
  rivalsLeading: 2,
  ...over,
});

describe("VD-5 dossier brief prompt", () => {
  it("writes in the PATH VOICE + era register, grounded in the run's state", () => {
    const p = buildDossierBriefPrompt("intelligence", "industrial_late1800s", state());
    expect(p).toMatch(/INTELLIGENCE/i);
    expect(p).toMatch(/Gilded Age/);
    expect(p).toMatch(/tier 3 of 5/);
    expect(p).toMatch(/2 rival lines lead/);
    expect(p).toMatch(/Reputation 55/);
  });

  it("folds the SCARCITY stake in for far-future dossiers (EI-SCARCITY-STORIES)", () => {
    const p = buildDossierBriefPrompt(
      "rnd",
      "stellar",
      state({ scarcity: "the un-copyable physical relic" }),
    );
    expect(p).toMatch(/THE STAKE/);
    expect(p).toMatch(/un-copyable physical relic/);
    // A historical dossier carries no scarcity stake.
    expect(buildDossierBriefPrompt("rnd", "industrial_late1800s", state())).not.toMatch(
      /THE STAKE/,
    );
  });

  it("the system instruction forbids real names + meta, demands brevity + voice", () => {
    const s = dossierBriefSystem();
    expect(s).toMatch(/never write a real person's name/i);
    expect(s).toMatch(/\{family_name\}/);
    expect(s).toMatch(/briefing, not/i);
  });
});

describe("VD-5 dossier figure prompt", () => {
  it("depicts a NO-PEOPLE plate per kind, in the signature style", () => {
    const p = buildDossierFigurePrompt("intelligence", "midcentury", "crime");
    expect(p).toMatch(/NO people/i);
    expect(p).toMatch(/surveillance|district|territory/i);
    expect(p).toContain(SIGNATURE_STYLE);
  });

  it("the figure tracks the kind (R&D reads as a workshop, war-room as a campaign table)", () => {
    expect(buildDossierFigurePrompt("rnd", "early_1900s", "technological")).toMatch(
      /workshop|laboratory|schematic/i,
    );
    expect(buildDossierFigurePrompt("warroom", "early_1900s", "political")).toMatch(
      /war-room|campaign|maps/i,
    );
  });
});
