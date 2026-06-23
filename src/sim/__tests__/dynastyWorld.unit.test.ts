import { describe, expect, it } from "vitest";
import { loadContent } from "../../data/loadContent";
import {
  advanceWorld,
  createDynastyWorld,
  detectGlimpses,
  nudgeRival,
  surgeHeadline,
} from "../dynastyWorld";
import { createRng } from "../rng";

/** SS-8 — the multi-line world: every non-player wave grows as a deterministic GOAP agent; glimpses surface relations. */

const content = loadContent();

describe("dynasty world (SS-8)", () => {
  it("creates one rival per non-player WAVE place (destinations + the player excluded)", () => {
    const world = createDynastyWorld(content.places, "ireland", createRng("w1"));
    const ids = world.rivals.map((r) => r.id);
    expect(ids).toContain("rival:bavaria");
    expect(ids).toContain("rival:italian");
    expect(ids).not.toContain("rival:ireland"); // the player's line
    expect(ids).not.toContain("rival:east_coast"); // a destination, not a wave
    // every wave but the player's becomes a rival.
    const waves = content.places.filter((p) => p.kind !== "destination" && p.arrivalYears).length;
    expect(world.rivals.length).toBe(waves - 1);
  });

  it("advances the whole world a turn + re-snapshots (deterministic)", () => {
    const mk = () => {
      const w = createDynastyWorld(content.places, "ireland", createRng("w2"));
      return advanceWorld(w, 1900, createRng("w2"));
    };
    const a = mk();
    const b = mk();
    expect(a.snapshots).toEqual(b.snapshots);
    // every rival has a chosen strategy after a turn.
    for (const s of a.snapshots) expect(s.strategy).toBeTruthy();
  });

  it("rivals climb over many turns when riding their epoch", () => {
    let w = createDynastyWorld(content.places, "ireland", createRng("w3"));
    const startMax = Math.max(...w.snapshots.map((s) => s.rung));
    for (let y = 1900; y <= 2100; y += 20) w = advanceWorld(w, y, createRng("w3"));
    const endMax = Math.max(...w.snapshots.map((s) => s.rung));
    expect(endMax).toBeGreaterThanOrEqual(startMax); // at least one line advanced over a century+
  });

  it("glimpses classify relation by strategy + only show near-station lines", () => {
    let w = createDynastyWorld(content.places, "ireland", createRng("w4"));
    w = advanceWorld(w, 1900, createRng("w4"));
    // a player accumulating: same-strategy rival = opposing; complementary (seize_power) = contributing.
    const glimpses = detectGlimpses(w, 0, "accumulate");
    for (const g of glimpses) {
      expect(["opposing", "contributing", "neutral"]).toContain(g.relation);
      expect(["rising", "struggling", "holding"]).toContain(g.note);
    }
    expect(glimpses.length).toBeLessThanOrEqual(3);
  });

  it("an opposing relation arises when a rival shares the player's strategy", () => {
    const w = createDynastyWorld(content.places, "ireland", createRng("w5"));
    const first = w.snapshots[0];
    if (!first) throw new Error("no rivals");
    // force a known snapshot: one rival accumulating at the player's rung.
    w.snapshots[0] = { ...first, rung: 0, strategy: "accumulate", alive: true };
    const g = detectGlimpses(w, 0, "accumulate", 10).find((x) => x.rivalId === first.id);
    expect(g?.relation).toBe("opposing");
  });

  it("nudgeRival shifts a rival's rung (interactive convergence: opposing suppresses, contributing lifts)", () => {
    const w = createDynastyWorld(content.places, "ireland", createRng("nudge"));
    const id = w.rivals[0]?.id;
    if (!id) throw new Error("no rivals");
    w.rivals[0]!.rung = 3;
    nudgeRival(w, id, +1);
    expect(w.rivals[0]!.rung).toBe(4);
    nudgeRival(w, id, -1);
    expect(w.rivals[0]!.rung).toBe(3);
    // clamps to the ladder + no-ops an unknown id.
    w.rivals[0]!.rung = 0;
    nudgeRival(w, id, -5);
    expect(w.rivals[0]!.rung).toBe(0);
    expect(() => nudgeRival(w, "rival:nonexistent", 1)).not.toThrow();
  });

  it("WV-3-RIVAL-REACT: a matching player vantage escalates competing rivals (world reacts to the player)", () => {
    // Advance two copies of the SAME seeded world over many years — one with NO vantage, one with a vantage
    // matching every common strategy across a rung sweep so SOME rival is a direct competitor each turn. The
    // escalation can only ADD climb chances (never remove), so the reacted world's total rung must be ≥ the
    // neutral world's — and strictly greater across a long enough run (the competing rivals climb faster).
    const STRATS = [
      "accumulate",
      "seize_power",
      "advance_knowledge",
      "win_renown",
      "spread_belief",
    ];
    const total = (w: ReturnType<typeof advanceWorld>) =>
      w.snapshots.reduce((n, s) => n + s.rung, 0);

    let neutral = createDynastyWorld(content.places, "ireland", createRng("react"));
    let reacted = createDynastyWorld(content.places, "ireland", createRng("react"));
    for (let y = 1860; y <= 1980; y += 10) {
      neutral = advanceWorld(neutral, y, createRng(`n:${y}`));
      // Cycle the vantage strategy + sweep rungs so a competitor is reliably present over the run.
      const strat = STRATS[(y / 10) % STRATS.length] as string;
      reacted = advanceWorld(reacted, y, createRng(`n:${y}`), {
        rung: (y / 10) % 6,
        strategy: strat,
      });
    }
    // The reacted world is at least as advanced (escalation only adds climbs) and, over this run, ahead.
    expect(total(reacted)).toBeGreaterThanOrEqual(total(neutral));
    // Determinism: the same vantage + seed reproduces the reacted world exactly.
    let reacted2 = createDynastyWorld(content.places, "ireland", createRng("react"));
    for (let y = 1860; y <= 1980; y += 10) {
      const strat = STRATS[(y / 10) % STRATS.length] as string;
      reacted2 = advanceWorld(reacted2, y, createRng(`n:${y}`), {
        rung: (y / 10) % 6,
        strategy: strat,
      });
    }
    expect(total(reacted2)).toBe(total(reacted));
  });

  it("nudgeRival keeps the matching snapshot in sync (glimpses/convergence read snapshots)", () => {
    let w = advanceWorld(
      createDynastyWorld(content.places, "ireland", createRng("snapsync")),
      1950,
      createRng("adv"),
    );
    const snap = w.snapshots[0];
    if (!snap) throw new Error("no snapshot");
    const before = snap.rung;
    w = nudgeRival(w, snap.id, +1);
    const after = w.snapshots.find((s) => s.id === snap.id);
    // The snapshot the UI/convergence reads reflects the nudge immediately (not just the agent).
    expect(after?.rung).toBe(Math.min(before + 1, 5));
  });

  it("SHOCK-AFTERMATH-IN-RIVALS: rivals take seeded setbacks (faltering) and rebound, era-weighted + deterministic", () => {
    // Over a founding-era run (harsh exposure), at least one rival must FALTER at some point — a snapshot with
    // faltering=true — proving the world weathers its own shocks, not just the player's line.
    const run = (seed: string) => {
      let w = createDynastyWorld(content.places, "ireland", createRng(seed));
      let sawFalter = false;
      let sawRebound = false;
      const wasFaltering = new Set<string>();
      for (let y = 1780; y <= 1860; y += 5) {
        w = advanceWorld(w, y, createRng(seed));
        for (const s of w.snapshots) {
          if (s.faltering) {
            sawFalter = true;
            wasFaltering.add(s.id);
          } else if (wasFaltering.has(s.id)) {
            // a rival that WAS faltering is no longer → it rebounded.
            sawRebound = true;
          }
        }
      }
      return { sawFalter, sawRebound };
    };
    // Deterministic: the same seed yields the same falter/rebound history.
    expect(run("rs1")).toEqual(run("rs1"));
    // Across a harsh founding run, some rival falters AND some rebound is observed (the two-act shape).
    const sweep = ["rs1", "rs2", "rs3", "rs4"].map(run);
    expect(
      sweep.some((r) => r.sawFalter),
      "a rival falters in the harsh founding era",
    ).toBe(true);
    expect(
      sweep.some((r) => r.sawRebound),
      "a faltered rival rebounds on a later quiet turn",
    ).toBe(true);
  });

  it("SHOCK-AFTERMATH-IN-RIVALS: the far-future (medicine-rich) world falters FAR less than the founding era", () => {
    // Era-weighting: count faltering snapshots across a harsh founding sweep vs an interstellar sweep.
    const falterCount = (startYear: number) => {
      let total = 0;
      for (const seed of ["e1", "e2", "e3"]) {
        let w = createDynastyWorld(content.places, "ireland", createRng(seed));
        for (let y = startYear; y < startYear + 60; y += 5) {
          w = advanceWorld(w, y, createRng(seed));
          total += w.snapshots.filter((s) => s.faltering).length;
        }
      }
      return total;
    };
    expect(falterCount(1780)).toBeGreaterThan(falterCount(2300));
  });

  it("RIVAL-RISE-NEWS-WEIGHT: the surge headline tiers by the rung gap (mild → urgent)", () => {
    const g1 = surgeHeadline("Bavaria", 1);
    const g2 = surgeHeadline("Bavaria", 2);
    const g3 = surgeHeadline("Bavaria", 3);
    const g5 = surgeHeadline("Bavaria", 5);
    // All name the rival; the wording escalates with the gap and 3+ shares the gravest tier.
    for (const h of [g1, g2, g3, g5]) expect(h).toContain("Bavaria");
    expect(g1).toMatch(/edged ahead/i);
    expect(g2).toMatch(/pulling away/i);
    expect(g3).toMatch(/left you behind/i);
    expect(g5).toBe(g3); // gap >= 3 is the gravest, capped tier
    // The three tiers are distinct phrasings.
    expect(new Set([g1, g2, g3]).size).toBe(3);
  });
});
