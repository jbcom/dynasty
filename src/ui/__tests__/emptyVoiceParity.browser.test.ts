import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { validRaw } from "../../sim/__tests__/fixtures";
import { buildContent } from "../../sim/content";
import { initState } from "../../sim/state";
import RivalDossier from "../saga/RivalDossier.svelte";
import LegacyReport from "../screens/LegacyReport.svelte";
import { applyBrandTokens, makeHost } from "./visualHarness";

/**
 * DOSSIER-EMPTY-VOICE-A11Y-PARITY — the two empty-state grace notes (the dossier's "still finding their feet" and
 * the finale's "spared the worst") should read as the SAME quiet-grace voice: dim, italic, same size. This mounts
 * both and asserts their computed font-style / color / font-size match, so a future style tweak to one can't
 * silently drift the two apart.
 */

const content = buildContent(validRaw());

let host: HTMLElement;
// biome-ignore lint/suspicious/noExplicitAny: opaque Svelte component instance
let dossierC: any;
// biome-ignore lint/suspicious/noExplicitAny: opaque Svelte component instance
let reportC: any;

beforeEach(() => {
  applyBrandTokens();
  host = makeHost();
});
afterEach(() => {
  if (dossierC) unmount(dossierC);
  if (reportC) unmount(reportC);
  host.remove();
});

describe("empty-voice parity (DOSSIER-EMPTY-VOICE-A11Y-PARITY)", () => {
  it("the empty-field note and the spared-ledger note share the quiet-grace register", () => {
    const dossierHost = document.createElement("div");
    const reportHost = document.createElement("div");
    host.append(dossierHost, reportHost);

    // 1. The dossier's empty-field grace note (no rivals yet).
    dossierC = mount(RivalDossier, {
      target: dossierHost,
      props: { standings: [], playerRung: 0 },
    });
    const fieldNote = dossierHost.querySelector(
      '[data-testid="rival-dossier-empty"] .field-empty',
    ) as HTMLElement;
    expect(fieldNote, "the empty-field grace note renders").not.toBeNull();

    // 2. The finale's "spared the worst" note (a charmed multi-generation run with no shock flags).
    const mk = (id: string, born: number, generation: number, isProtagonist: boolean) => ({
      id,
      given: "X",
      surname: "Vane",
      sex: "male" as const,
      born,
      generation,
      traits: { ambition: 50, cunning: 50, vigor: 50, piety: 50 },
      isProtagonist,
    });
    const sparedState = {
      ...initState(content, "seed"),
      flags: ["base:land"],
      family: {
        members: [mk("m0", 1885, 0, false), mk("m1", 1915, 1, true)],
        protagonistId: "m1",
        nextSeq: 2,
      },
      end: { kind: "death" as const, year: 1980, reason: "x" },
    };
    reportC = mount(LegacyReport, {
      target: reportHost,
      props: { content, state: sparedState, end: sparedState.end, onRestart: () => {} },
    });
    const sparedNote = reportHost.querySelector(
      '[data-testid="legacy-ledger-spared"] .spared-line',
    ) as HTMLElement;
    expect(sparedNote, "the spared-ledger grace note renders").not.toBeNull();

    // The two grace notes read as one voice: same italic, same dim color, same size.
    const a = getComputedStyle(fieldNote);
    const b = getComputedStyle(sparedNote);
    expect(b.fontStyle, "same font-style (italic)").toBe(a.fontStyle);
    expect(a.fontStyle).toBe("italic");
    expect(b.color, "same dim color").toBe(a.color);
    expect(b.fontSize, "same size").toBe(a.fontSize);

    // EMPTY-VOICE-WORDING-DISTINCT-AUDIT: shared REGISTER, but the two notes say DIFFERENT things — the early-game
    // "finding their feet" vs the charmed-run "spared the worst" — so the parity styling never invites a
    // copy-paste that repeats one line in two places.
    const fieldText = fieldNote.textContent?.trim() ?? "";
    const sparedText = sparedNote.textContent?.trim() ?? "";
    expect(fieldText.length, "the empty-field note has copy").toBeGreaterThan(0);
    expect(sparedText.length, "the spared note has copy").toBeGreaterThan(0);
    expect(sparedText, "the two empty-state notes say distinct things").not.toBe(fieldText);
    expect(fieldText).toMatch(/finding their feet/i);
    expect(sparedText).toMatch(/spared the worst/i);
  });
});
