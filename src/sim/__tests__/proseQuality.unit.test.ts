import { describe, expect, it } from "vitest";
import { auditProseQuality } from "../proseQuality";

describe("KP-1 prose quality gate", () => {
  it("passes clear varied narrative prose", () => {
    const report = auditProseQuality("clear", [
      "The harbor bells rang before dawn. Mara crossed the quay with the family ledger under her coat.",
      "By noon, the clerk had named the price. She could buy the lot outright, or bind the house to a partner who wanted half the future.",
      "The choice was plain enough to read, and bitter enough to matter.",
    ]);

    expect(report.pass, JSON.stringify(report.findings, null, 2)).toBe(true);
    expect(report.scanScore).toBeGreaterThanOrEqual(0.45);
    expect(report.clarityScore).toBeGreaterThanOrEqual(0.45);
  });

  it("flags dense repetitive prose that would fatigue repeated play", () => {
    const report = auditProseQuality("dense", [
      "In the cold clarity of the morning the family considered the difficult and institutionally overdetermined consequences of the strategically ambiguous compact that had been drafted by committees, revised by subcommittees, recited by counsel, and returned to the table with additional clauses whose implications stretched beyond any ordinary reader's patience. In the cold clarity of the morning the family considered another similarly overburdened sentence that keeps postponing its actual stake until the player has already lost the thread.",
    ]);

    expect(report.pass).toBe(false);
    expect(report.findings.map((f) => f.kind)).toEqual(
      expect.arrayContaining(["sentence-load", "repeated-leads"]),
    );
  });
});
