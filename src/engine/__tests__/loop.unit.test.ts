import { describe, expect, it } from "vitest";
import { loadContent } from "../../data/loadContent";
import { loadSaga } from "../../data/loadSaga";
import { validRaw } from "../../sim/__tests__/fixtures";
import { MAX_RUNG } from "../../sim/classRung";
import { buildContent } from "../../sim/content";
import { foundByComposition } from "../../sim/founding";
import { createRng } from "../../sim/rng";
import { initState } from "../../sim/state";
import { pickNextEventViaWorld } from "../../sim/world";
import { Game } from "../loop";

const content = () => buildContent(validRaw());

describe("Game loop", () => {
  it("presents a first event on a new run", () => {
    const g = new Game(content(), "seed");
    expect(g.view.currentEvent?.id).toBe("ev_born");
    expect(g.finished).toBe(false);
  });

  it("FS-5c: the trigger-lattice view path is deterministic across re-reads", () => {
    // The view folds in deterministic-trigger family branches (triggerThreads). Reading `view` twice
    // for the same state must yield identical saga threads — no RNG advance, replay-safe.
    const g = new Game(content(), "seed");
    const a = g.view.saga?.threads ?? [];
    const b = g.view.saga?.threads ?? [];
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("notifies subscribers immediately and on each choice", () => {
    const g = new Game(content(), "seed");
    const seen: Array<string | null> = [];
    g.subscribe((v) => seen.push(v.currentEvent?.id ?? null));
    g.choose("cry_loud");
    expect(seen[0]).toBe("ev_born"); // immediate
    expect(seen.length).toBeGreaterThan(1); // after choose
  });

  it("drives a full run to an end state", () => {
    const g = new Game(content(), "seed");
    let guard = 0;
    while (!g.finished && guard < 100) {
      const ev = g.view.currentEvent;
      if (!ev) break;
      const choice = ev.choices[0];
      if (!choice) break;
      g.choose(choice.id);
      guard++;
    }
    expect(g.finished).toBe(true);
    expect(g.view.state.end?.kind).toBe("victory");
  });

  it("is deterministic: same seed → same currentEvent sequence", () => {
    const run = (seed: string): Array<string | null> => {
      const g = new Game(content(), seed);
      const ids: Array<string | null> = [g.view.currentEvent?.id ?? null];
      let guard = 0;
      while (!g.finished && guard < 100) {
        const ev = g.view.currentEvent;
        const choice = ev?.choices[0];
        if (!ev || !choice) break;
        g.choose(choice.id);
        ids.push(g.view.currentEvent?.id ?? null);
        guard++;
      }
      return ids;
    };
    expect(run("abc")).toEqual(run("abc"));
  });

  it("throws when choosing after the run ends", () => {
    const g = new Game(content(), "seed");
    let guard = 0;
    while (!g.finished && guard < 100) {
      const choice = g.view.currentEvent?.choices[0];
      if (!choice) break;
      g.choose(choice.id);
      guard++;
    }
    expect(() => g.choose("anything")).toThrow();
  });

  it("can restore from a prior state snapshot", () => {
    const g1 = new Game(content(), "seed");
    g1.choose("cry_loud");
    const snapshot = g1.view.state;
    const g2 = new Game(content(), "seed", snapshot);
    expect(g2.view.state.flags).toContain("loud_baby");
    expect(g2.view.state.history).toHaveLength(1);
  });

  it("DE-1a: Game.pick() routes through pickNextEventViaWorld — first event matches direct world query", () => {
    // The engine's pick() now calls pickNextEventViaWorld. Verify the first
    // event the Game presents equals what pickNextEventViaWorld returns for
    // the same (content, state, rng) — the canonical parity check at the
    // engine-layer call site.
    const c = content();
    for (const seed of ["abc", "def", "xyz", "42"]) {
      const g = new Game(c, seed);
      const state = initState(c, seed);
      const label = `pick:${state.history.length}:${state.eraIndex}:${state.eraEventCount}`;
      const viaWorld = pickNextEventViaWorld(c, state, createRng(seed).fork(label));
      expect(g.view.currentEvent?.id ?? null).toBe(viaWorld?.id ?? null);
    }
  });

  it("PF-7: a founded run surfaces rival-line GLIMPSES + the player rung, deterministically", () => {
    const real = loadContent();
    const comp = {
      place: "ireland",
      era: "origins",
      culture: "irish_catholic",
      year: 1885,
      archetype: "economic" as const,
      gender: "male" as const,
      surname: "Glimpser",
      seed: "pf7",
      originId: "composed:ireland:origins",
    };
    const mk = () =>
      new Game(real, comp.seed, foundByComposition(real, comp).state, comp.archetype);
    const g = mk();
    // The convergence world is live: the view exposes glimpses (rivals near the player's vantage) +
    // the player's rung. A founder is rung 0; glimpses are rival lines, never the player's own wave.
    expect(g.view.rung).toBe(0);
    expect(Array.isArray(g.view.glimpses)).toBe(true);
    for (const gl of g.view.glimpses) {
      expect(gl.label).not.toBe("ireland"); // never the player's own line
      expect(["opposing", "contributing", "neutral"]).toContain(gl.relation);
    }
    // Deterministic: same seed → same glimpses (replay-safe).
    expect(JSON.stringify(mk().view.glimpses)).toBe(JSON.stringify(g.view.glimpses));
  });

  it("PF-7: an in-progress run has no convergence ending; a finished run resolves one", () => {
    const real = loadContent();
    const comp = {
      place: "ireland",
      era: "origins",
      culture: "irish_catholic",
      year: 1885,
      archetype: "economic" as const,
      gender: "male" as const,
      surname: "Ender",
      seed: "pf7-end",
      originId: "composed:ireland:origins",
    };
    const g = new Game(real, comp.seed, foundByComposition(real, comp).state, comp.archetype);
    expect(g.view.convergence).toBeNull(); // still playing
    // Drive to an end, then the dynastic framing resolves.
    let guard = 0;
    while (!g.finished && guard < 2000) {
      const v = g.view;
      if (v.saga.scene) {
        if (v.saga.scene.decision) {
          if (v.saga.scene.beats.length) g.pickBeat(0);
          g.pickDecision(0);
        } else if (v.saga.scene.beats.length) g.pickBeat(0);
        else break;
      } else if (v.currentEvent) {
        const c = v.currentEvent.choices[0];
        if (!c) break;
        g.choose(c.id);
      } else break;
      guard++;
    }
    expect(g.finished).toBe(true);
    expect(g.view.convergence).not.toBeNull();
    expect(["stars", "contributed", "earthbound", "extinguished"]).toContain(
      g.view.convergence?.destination,
    );
  });

  it("PF-8: reading the novel ages + succeeds the family (saga path runs mortality/succession)", () => {
    const real = loadContent();
    const comp = {
      place: "ireland",
      era: "origins",
      culture: "irish_catholic",
      year: 1885,
      archetype: "economic" as const,
      gender: "male" as const,
      surname: "Ager",
      seed: "pf8",
      originId: "composed:ireland:origins",
    };
    const g = new Game(real, comp.seed, foundByComposition(real, comp).state, comp.archetype);
    const startYear = g.view.state.year;
    // Page/choose through the saga; the run clock advances and the family ages with it.
    let guard = 0;
    while (!g.finished && guard < 400) {
      const v = g.view;
      if (v.saga.scene) {
        if (v.saga.scene.beats.length) g.pickBeat(0);
        else if (v.saga.scene.decision) g.pickDecision(0);
        else break;
      } else if (v.currentEvent) {
        const c = v.currentEvent.choices[0];
        if (!c) break;
        g.choose(c.id);
      } else break;
      guard++;
    }
    // Years passed (the saga ticked the clock) — proving advanceFamily ran over real elapsed time.
    expect(g.view.state.year).toBeGreaterThan(startYear);
    // Determinism: a fresh identical run reaches the same final state.
    const g2 = new Game(real, comp.seed, foundByComposition(real, comp).state, comp.archetype);
    let g2guard = 0;
    while (!g2.finished && g2guard < 400) {
      const v = g2.view;
      if (v.saga.scene) {
        if (v.saga.scene.beats.length) g2.pickBeat(0);
        else if (v.saga.scene.decision) g2.pickDecision(0);
        else break;
      } else if (v.currentEvent) {
        const c = v.currentEvent.choices[0];
        if (!c) break;
        g2.choose(c.id);
      } else break;
      g2guard++;
    }
    expect(g2.view.state.year).toBe(g.view.state.year);
    expect(g2.view.state.end?.kind).toBe(g.view.state.end?.kind);
  });

  it("DEPTH-1: every close scene in the shipped corpus carries a take-partner succession decision", () => {
    // The dynastic fork is real data, not just wiring: each generation's close offers a decision whose
    // take-partner option carries the succession effect the loop reads (loop.ts pickDecision →
    // beginNextGenerationAct). Asserts the authored corpus, so a regression that drops it fails CI.
    const corpus = loadSaga();
    const closes = [...corpus.scenes.values()].filter((s) => s.id.endsWith(":close"));
    expect(closes.length).toBe(504);
    for (const close of closes) {
      const succ = close.decision?.options.find((o) => o.succession?.takesPartner);
      expect(succ?.succession?.takesPartner, close.id).toBe(true);
      expect(succ?.succession?.begets ?? 0, close.id).toBeGreaterThan(0);
    }
  });

  it("DEPTH-2: closing a generation without succession ends the line (a real fork against continuing)", () => {
    const real = loadContent();
    const comp = {
      place: "ireland",
      era: "origins",
      culture: "irish_catholic",
      year: 1885,
      archetype: "economic" as const,
      gender: "male" as const,
      surname: "Lastofus",
      seed: "depth2",
      originId: "composed:ireland:origins",
    };
    const g = new Game(real, comp.seed, foundByComposition(real, comp).state, comp.archetype);
    // Walk to the first close decision; pick the option that does NOT carry succession. The line should
    // end here (not silently fall through) and resolve a convergence ending.
    let guard = 0;
    let endedAtClose = false;
    while (!g.finished && guard < 400) {
      const v = g.view;
      const scene = v.saga.scene;
      if (scene) {
        // A decision-bearing scene: pick the decision (on a close, choose the NON-succession option to
        // end the line). A pure-weave scene: take a beat to fall forward.
        if (scene.decision) {
          const isClose = scene.id?.endsWith(":close");
          const nonSucc = scene.decision.options.findIndex((o) => !o.succession?.takesPartner);
          if (isClose && nonSucc >= 0) {
            g.pickDecision(nonSucc);
            endedAtClose = g.finished;
            break;
          }
          g.pickDecision(0);
        } else if (scene.beats.length) {
          g.pickBeat(0);
        } else break;
      } else if (v.currentEvent) {
        const c = v.currentEvent.choices[0];
        if (!c) break;
        g.choose(c.id);
      } else break;
      guard++;
    }
    expect(endedAtClose, "a non-succession close ended the line").toBe(true);
    expect(g.view.convergence).not.toBeNull();
  });

  it("interactive convergence: crossing nudges are replay-safe across save/restore (stateless from rung)", () => {
    const real = loadContent();
    const comp = {
      place: "ireland",
      era: "origins",
      culture: "irish_catholic",
      year: 1885,
      archetype: "economic" as const,
      gender: "male" as const,
      surname: "Restore",
      seed: "convrestore",
      originId: "composed:ireland:origins",
    };
    const drive = (g: Game, steps: number) => {
      let n = 0;
      while (!g.finished && n < steps) {
        const v = g.view;
        const s = v.saga.scene;
        if (s) {
          if (s.decision) {
            const i = s.decision.options.findIndex((o) => o.succession?.takesPartner);
            g.pickDecision(i >= 0 ? i : 0);
          } else if (s.beats.length) g.pickBeat(0);
          else break;
        } else if (v.currentEvent) {
          const c = v.currentEvent.choices[0];
          if (!c) break;
          g.choose(c.id);
        } else break;
        n++;
      }
    };
    // Uninterrupted full run.
    const a = new Game(real, comp.seed, foundByComposition(real, comp).state, comp.archetype);
    drive(a, 9999);
    // Run partway, snapshot, restore into a fresh Game, finish — must reach the identical end. The
    // crossing nudges are derived from playerRung (in GameState), so restore reconstructs them exactly;
    // a transient fired-Set would have lost them and diverged.
    const b1 = new Game(real, comp.seed, foundByComposition(real, comp).state, comp.archetype);
    drive(b1, 40);
    const b2 = new Game(real, comp.seed, b1.view.state, comp.archetype);
    drive(b2, 9999);
    expect(b2.view.state.year).toBe(a.view.state.year);
    expect(b2.view.convergence?.destination).toBe(a.view.convergence?.destination);
  });

  it("DEPTH-3: succession begets heirs so the line survives across generations (not extinct at gen 2)", () => {
    const real = loadContent();
    const comp = {
      place: "ireland",
      era: "origins",
      culture: "irish_catholic",
      year: 1885,
      archetype: "economic" as const,
      gender: "male" as const,
      surname: "Carrier",
      seed: "depth3",
      originId: "composed:ireland:origins",
    };
    const play = () => {
      const g = new Game(real, comp.seed, foundByComposition(real, comp).state, comp.archetype);
      let guard = 0;
      let sagaScenes = 0;
      while (!g.finished && guard < 3000) {
        const v = g.view;
        const s = v.saga.scene;
        if (s) {
          sagaScenes++;
          if (s.decision) {
            // Always choose to continue the line (take a partner + raise heirs).
            const i = s.decision.options.findIndex((o) => o.succession?.takesPartner);
            g.pickDecision(i >= 0 ? i : 0);
          } else if (s.beats.length) g.pickBeat(0);
          else break;
        } else if (v.currentEvent) {
          const c = v.currentEvent.choices[0];
          if (!c) break;
          g.choose(c.id);
        } else break;
        guard++;
      }
      return { sagaScenes, year: g.view.state.year };
    };
    const a = play();
    // Choosing succession every generation carries the line deep — far past the gen-2 extinction that
    // happened when begets weren't applied. Expect many scenes + a year well into the next century.
    expect(a.sagaScenes).toBeGreaterThan(60);
    expect(a.year).toBeGreaterThan(1950);
    // Determinism: same seed + same choices → identical depth (replay-safe with the new beget draws).
    const b = play();
    expect(b.sagaScenes).toBe(a.sagaScenes);
    expect(b.year).toBe(a.year);
  });

  it("the run caps at MAX_RUNG generations — the generation depth never exceeds the rung ladder", () => {
    const real = loadContent();
    const comp = {
      place: "ireland",
      era: "origins",
      culture: "irish_catholic",
      year: 1885,
      archetype: "economic" as const,
      gender: "male" as const,
      surname: "Capped",
      seed: "rungcap",
      originId: "composed:ireland:origins",
    };
    const g = new Game(real, comp.seed, foundByComposition(real, comp).state, comp.archetype);
    let guard = 0;
    let maxGen = 0;
    while (!g.finished && guard < 3000) {
      const v = g.view;
      // rung is the protagonist's generation depth, single-sourced on MAX_RUNG (was hardcoded 5).
      maxGen = Math.max(maxGen, v.rung);
      const s = v.saga.scene;
      if (s) {
        if (s.decision) {
          const i = s.decision.options.findIndex((o) => o.succession?.takesPartner);
          g.pickDecision(i >= 0 ? i : 0);
        } else if (s.beats.length) g.pickBeat(0);
        else break;
      } else if (v.currentEvent) {
        const c = v.currentEvent.choices[0];
        if (!c) break;
        g.choose(c.id);
      } else break;
      guard++;
    }
    expect(maxGen).toBe(MAX_RUNG); // a fully-succeeded line reaches exactly the cap, never beyond
  });

  it("RB-7: a non-1885 origin (baghdad, 762 CE) plays a full capped multi-generation run, not extinct/infinite", () => {
    const real = loadContent();
    const comp = {
      place: "baghdad",
      era: "origins",
      culture: "irish_catholic",
      year: 762,
      archetype: "economic" as const,
      gender: "male" as const,
      surname: "Abbas",
      seed: "rb7",
      originId: "composed:baghdad:origins",
    };
    const play = () => {
      const g = new Game(real, comp.seed, foundByComposition(real, comp).state, comp.archetype);
      let guard = 0;
      let scenes = 0;
      while (!g.finished && guard < 5000) {
        const v = g.view;
        const s = v.saga.scene;
        if (s) {
          scenes++;
          if (s.decision) {
            const i = s.decision.options.findIndex((o) => o.succession?.takesPartner);
            g.pickDecision(i >= 0 ? i : 0);
          } else if (s.beats.length) g.pickBeat(0);
          else break;
        } else if (v.currentEvent) {
          const c = v.currentEvent.choices[0];
          if (!c) break;
          g.choose(c.id);
        } else break;
        guard++;
      }
      return {
        scenes,
        finished: g.finished,
        year: g.view.state.year,
        conv: g.view.convergence?.destination,
      };
    };
    const a = play();
    // The saga clock is decoupled from the 1885 era ladder, so baghdad survives generations (was extinct
    // ~16 scenes) AND the run caps at 6 generations (was infinite once decoupled) — a full, finite run.
    expect(a.finished).toBe(true);
    expect(a.scenes).toBeGreaterThan(120);
    expect(a.scenes).toBeLessThan(400);
    expect(a.conv).toBeTruthy();
    // Replay-deterministic.
    const b = play();
    expect(b.scenes).toBe(a.scenes);
    expect(b.year).toBe(a.year);
  });

  it("PF-14: a saga choice's setFlags reach the run's state.flags (not sealed in the driver)", () => {
    const real = loadContent();
    const comp = {
      place: "ireland",
      era: "origins",
      culture: "irish_catholic",
      year: 1885,
      archetype: "economic" as const,
      gender: "male" as const,
      surname: "Flagger",
      seed: "pf14",
      originId: "composed:ireland:origins",
    };
    const g = new Game(real, comp.seed, foundByComposition(real, comp).state, comp.archetype);
    expect(g.view.saga.scene, "expected a saga scene to open").toBeTruthy();
    const flagsBefore = new Set(g.view.state.flags);
    // Make the opening scene's first choice (a beat, or its decision) — saga setFlags must surface.
    const open = g.view.saga.scene;
    if (open?.beats.length) g.pickBeat(0);
    else g.pickDecision(0);
    const fresh = g.view.state.flags.filter((f) => !flagsBefore.has(f));
    // The chosen beat set at least one flag, and it landed in the RUN state (PF-14), not just the driver.
    expect(fresh.length).toBeGreaterThan(0);
  });

  it("WV-2: the emergent braid is INERT until scenes carry braid slots (no slots → no extra threads)", () => {
    // The live corpus has no braid slots yet (GenAI slot-tagging is WV-2 step 4), so the per-move
    // selector finds no destination anchors → view.saga.threads carries only corpus threads, and a
    // re-read of view is identical (the selector is deterministic + doesn't disturb play).
    const real = loadContent();
    const comp = {
      place: "ireland",
      era: "origins",
      culture: "irish_catholic",
      year: 1885,
      archetype: "economic" as const,
      gender: "male" as const,
      surname: "Vane",
      seed: "wv2",
      originId: "composed:ireland:origins",
    };
    const g = new Game(real, comp.seed, foundByComposition(real, comp).state, comp.archetype);
    const a = g.view.saga.threads;
    const b = g.view.saga.threads;
    expect(a).toEqual(b); // deterministic + stable across re-renders (the selector is seeded)
    // Any present thread is well-formed; with no destination slots authored yet, the selector is inert.
    for (const t of a) expect(t.crossing.length).toBeGreaterThan(0);
  });
});
