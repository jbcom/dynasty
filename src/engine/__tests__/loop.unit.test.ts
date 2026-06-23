import { describe, expect, it } from "vitest";
import { loadContent } from "../../data/loadContent";
import { loadSaga } from "../../data/loadSaga";
import { validRaw } from "../../sim/__tests__/fixtures";
import { MAX_RUNG } from "../../sim/classRung";
import { buildContent } from "../../sim/content";
import { foundByComposition } from "../../sim/founding";
import { createRng } from "../../sim/rng";
import { shockLedger } from "../../sim/sagaShock";
import { initState } from "../../sim/state";
import { SAGA_GENERATION_SPAN } from "../../sim/timeline";
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

  it("DEPTH-1: every CELL-act close carries a take-partner succession decision", () => {
    // The dynastic fork is real data, not just wiring: each generation's close offers a decision whose
    // take-partner option carries the succession effect the loop reads (loop.ts pickDecision →
    // beginNextGenerationAct). Asserts the authored corpus, so a regression that drops it fails CI.
    // FS-6: scope to the 504 CELL-act closes (the spine has its own close shape, asserted separately).
    const corpus = loadSaga();
    const closes = [...corpus.scenes.values()].filter(
      (s) => s.id.endsWith(":close") && !s.id.startsWith("spine:"),
    );
    expect(closes.length).toBe(504);
    for (const close of closes) {
      const succ = close.decision?.options.find((o) => o.succession?.takesPartner);
      expect(succ?.succession?.takesPartner, close.id).toBe(true);
      expect(succ?.succession?.begets ?? 0, close.id).toBeGreaterThan(0);
    }
  });

  it("FS-6: each SPINE close carries succession, except the terminal stellar act (ends in expansion)", () => {
    const corpus = loadSaga();
    const spineCloses = [...corpus.scenes.values()].filter(
      (s) => s.id.startsWith("spine:") && s.id.endsWith(":close"),
    );
    // 9 of the 10 generations close on a succession fork; the terminal g9 act resolves into the ending.
    expect(spineCloses.length).toBeGreaterThanOrEqual(8);
    for (const close of spineCloses) {
      if (close.id.startsWith("spine:g9:")) continue; // terminal stellar act — no succession
      const succ = close.decision?.options.find((o) => o.succession?.takesPartner);
      expect(succ?.succession?.takesPartner, close.id).toBe(true);
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
    // happened when begets weren't applied. With the saga clock decoupled from scene COUNT (texture beats
    // pass no in-world years; a generation's span is advanced once at its succession decision), the line
    // plays all ten spine generations and ages a full ~25y per generation — so it reaches deep into the
    // future regardless of how many decisionless beats each act carries.
    expect(a.sagaScenes).toBeGreaterThan(40);
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
    // ~16 scenes) AND the run caps + finishes (was infinite once decoupled) — a full, finite run.
    // FS-8: the engine now plays the AUTHORED SPINE (10 generations × ~3-5 scenes ≈ 40-110 base scenes,
    // before woven branches), denser-but-shorter than the old 504-cell lattice. Assert a full finite run.
    expect(a.finished).toBe(true);
    expect(a.scenes).toBeGreaterThan(30);
    expect(a.scenes).toBeLessThan(400);
    expect(a.conv).toBeTruthy();
    // Replay-deterministic.
    const b = play();
    expect(b.scenes).toBe(a.scenes);
    expect(b.year).toBe(a.year);
  });

  it("FS-8: a founded run plays ALL 10 spine generations founding→stars (not capped at gen 5)", () => {
    const real = loadContent();
    const comp = {
      place: "ireland",
      era: "origins",
      culture: "anglo_protestant",
      year: 1776,
      archetype: "political" as const,
      gender: "male" as const,
      surname: "Hale",
      given: "Tobias",
      seed: "fs8e",
      originId: "composed:ireland:origins",
      // The diegetic life-seeds (FS-7) ground the founder so the line can carry to the stars — a realistic
      // founding, not a bare one.
      lifeSeeds: {
        firstJob: "printers_devil" as const,
        bestFriend: "an_ambitious_rival" as const,
        lifePartner: "marry_for_love" as const,
      },
    };
    const g = new Game(real, comp.seed, foundByComposition(real, comp).state, comp.archetype);
    const gens = new Set<string>();
    let n = 0;
    while (!g.finished && n < 20000) {
      const v = g.view;
      const s = v.saga.scene;
      const m = s?.id.match(/spine:(g\d)/);
      if (m?.[1]) gens.add(m[1]);
      if (s?.decision) {
        const i = s.decision.options.findIndex((o) => o.succession?.takesPartner);
        g.pickDecision(i >= 0 ? i : 0);
      } else if (s?.beats.length) g.pickBeat(0);
      else if (v.currentEvent?.choices[0]) g.choose(v.currentEvent.choices[0].id);
      else break;
      n++;
    }
    // The spine must advance PAST gen 5 — the gen-cap bug (clamp at MAX_RUNG=5) replayed g5 forever and
    // never reached the broadcast/orbital/stellar acts (g6-g9). Reaching any g6+ proves the cap is fixed
    // (exactly which terminal generation a given path reaches depends on survival; g0 + a g6+ is the
    // capability assertion). Founding → beyond the old cap is the whole point of the spine.
    expect(gens.has("g0")).toBe(true);
    expect(gens.has("g9"), `gens reached: ${[...gens].sort().join(",")}`).toBe(true); // the stars
    expect(gens.size).toBe(10);
    expect(g.finished).toBe(true);
  });

  it("SAGA-CLOCK-DECOUPLE: extra decisionless texture beats do NOT age the line (span is driven by decisions, not scene count)", () => {
    const real = loadContent();
    const comp = {
      place: "ireland",
      era: "origins",
      culture: "irish_catholic",
      year: 1885,
      archetype: "economic" as const,
      gender: "male" as const,
      surname: "Texture",
      seed: "clockdecouple",
      originId: "composed:ireland:origins",
    };
    // Walk to the first saga scene, then exhaust ITS decisionless beats while recording the year before
    // and after each beat. Every texture beat must leave the in-world year UNCHANGED — so deepening an act
    // with interstitial scenes can never age the protagonist faster (the bug being fixed: 1 year per beat
    // killed a deep run of old age before the final generation).
    const g = new Game(real, comp.seed, foundByComposition(real, comp).state, comp.archetype);
    let beatsTaken = 0;
    let guard = 0;
    while (!g.finished && guard < 200) {
      const s = g.view.saga.scene;
      if (!s) break;
      if (s.decision) break; // stop at the generational fork — that's where years are allowed to pass
      if (!s.beats.length) break;
      const before = g.view.state.year;
      g.pickBeat(0);
      const after = g.view.state.year;
      expect(after, "a decisionless texture beat must pass NO in-world years").toBe(before);
      beatsTaken++;
      guard++;
    }
    expect(
      beatsTaken,
      "expected at least one decisionless texture beat to exercise the clock",
    ).toBeGreaterThan(0);
  });

  it("SAGA-CLOCK-DECOUPLE: a succession decision advances exactly one generation's span and steps the generation", () => {
    const real = loadContent();
    const comp = {
      place: "ireland",
      era: "origins",
      culture: "irish_catholic",
      year: 1885,
      archetype: "economic" as const,
      gender: "male" as const,
      surname: "Span",
      seed: "spanstep",
      originId: "composed:ireland:origins",
    };
    const g = new Game(real, comp.seed, foundByComposition(real, comp).state, comp.archetype);
    // Drive to the first succession decision, clearing the decisionless beats (which pass no years).
    let guard = 0;
    while (!g.finished && guard < 500) {
      const s = g.view.saga.scene;
      if (!s) break;
      if (s.decision?.options.some((o) => o.succession?.takesPartner)) break;
      if (s.beats.length) g.pickBeat(0);
      else if (s.decision) g.pickDecision(0);
      else break;
      guard++;
    }
    const s = g.view.saga.scene;
    const yearBefore = g.view.state.year;
    const rungBefore = g.view.rung;
    expect(s?.decision, "expected to reach a succession decision").toBeTruthy();
    const i = s?.decision?.options.findIndex((o) => o.succession?.takesPartner) ?? -1;
    expect(i, "expected a take-partner succession option").toBeGreaterThanOrEqual(0);
    g.pickDecision(i);
    // The generation must have stepped (deterministic per-decision, not a probabilistic mortality roll),
    // and the in-world year must have advanced by exactly one generation's span (SAGA_GENERATION_SPAN=25).
    expect(g.view.rung, "the succession decision steps the generation").toBe(rungBefore + 1);
    expect(g.view.state.year - yearBefore).toBe(SAGA_GENERATION_SPAN);
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

  it("SAGA-RESTORE-CURSOR: a save mid-act RESUMES at the exact scene, not the act opening", () => {
    const real = loadContent();
    const comp = {
      place: "ireland",
      era: "origins",
      culture: "irish_catholic",
      year: 1885,
      archetype: "economic" as const,
      gender: "male" as const,
      surname: "Cursor",
      seed: "sagacursor",
      originId: "composed:ireland:origins",
    };
    // Advance a few WEAVE BEATS within the FOUNDING act WITHOUT crossing a generational decision, so the
    // walk is genuinely paused mid-act (a non-opening scene, or beatCursor > 0).
    const g = new Game(real, comp.seed, foundByComposition(real, comp).state, comp.archetype);
    const openingSceneId = g.view.saga.scene?.id ?? null;
    expect(openingSceneId).toBeTruthy();
    let advanced = false;
    for (let i = 0; i < 6; i++) {
      const s = g.view.saga.scene;
      if (!s) break;
      if (s.decision) break; // stop before the generational fork — we want a pure mid-act pause
      if (!s.beats.length) break;
      g.pickBeat(0);
      advanced = true;
      // Once we've left the opening scene (or moved the beat cursor on it), we're paused mid-act.
      const cur = g.view.state.saga;
      if (cur && (cur.sceneId !== openingSceneId || cur.beatCursor > 0)) break;
    }
    expect(advanced, "drove at least one weave beat").toBe(true);

    const saved = g.view.state;
    // The cursor was persisted into the run state — actId + a live scene position.
    expect(saved.saga, "saga cursor persisted in GameState").toBeTruthy();
    expect(saved.saga?.actId).toBeTruthy();
    const savedSceneId = saved.saga?.sceneId ?? null;
    const savedYear = saved.year;

    // Restore into a fresh Game. The resumed reader sits on the SAVED scene — NOT the act opening — and
    // the clock did not jump (no replay of already-read scenes).
    const restored = new Game(real, comp.seed, saved, comp.archetype);
    expect(restored.view.saga.scene?.id).toBe(savedSceneId);
    expect(restored.view.state.year).toBe(savedYear);
  });

  it("TRIGGER-CROSSING-RECORD: engaging a scene that fires a trigger stamps the crossing flag (memory)", () => {
    const real = loadContent();
    const comp = {
      place: "ireland",
      era: "origins",
      culture: "irish_catholic",
      year: 1845,
      archetype: "economic" as const,
      gender: "male" as const,
      surname: "Cross",
      seed: "crossrec",
      originId: "composed:ireland:origins",
    };
    // A founded ireland line in the convergence/1845-1875 window fires the famine-docks ARRIVAL trigger
    // (a `once` rule). Drive saga moves; once a scene surfaces the thread, advancing it must STAMP a
    // `crossed:ireland:*` flag — the Turtledove cast-memory — so the once-rule won't re-fire and a later
    // priorCrossing-gated return can unlock.
    const g = new Game(real, comp.seed, foundByComposition(real, comp).state, comp.archetype);
    let sawCrossing = false;
    let guard = 0;
    while (!g.finished && guard < 200) {
      const v = g.view;
      const s = v.saga.scene;
      if (s) {
        if (s.decision) g.pickDecision(0);
        else if (s.beats.length) g.pickBeat(0);
        else break;
      } else if (v.currentEvent?.choices[0]) {
        g.choose(v.currentEvent.choices[0].id);
      } else break;
      if (g.view.state.flags.some((f) => f.startsWith("crossed:"))) {
        sawCrossing = true;
        break;
      }
      guard++;
    }
    // At least one crossing was recorded as a flag — the memory is real + persisted in state.flags.
    expect(sawCrossing, "a fired trigger branch stamped a crossed: flag").toBe(true);
    // The crossing flag is idempotent: it appears at most once (no duplicate stamping on re-render).
    const crossFlags = g.view.state.flags.filter((f) => f.startsWith("crossed:"));
    expect(new Set(crossFlags).size).toBe(crossFlags.length);
  });

  it("WV-3-SHOCK-SCENES: a disruption shock surfaces in view.shock for one move, then clears", () => {
    const real = loadContent();
    const comp = {
      place: "ireland",
      era: "origins",
      culture: "anglo_protestant",
      year: 1776,
      archetype: "political" as const,
      gender: "male" as const,
      surname: "Shock",
      seed: "shockview",
      originId: "composed:ireland:origins",
    };
    // Drive the run; a `shock:*` flag stamped means a shock fired that move — and view.shock must carry its
    // one-line aftermath on that turn. (The founding-era hazard is ~0.9 exposure, so a multi-gen run hits one.)
    const g = new Game(real, comp.seed, foundByComposition(real, comp).state, comp.archetype);
    let sawShockView = false;
    let clearedAfter = false;
    let prevHadShock = false;
    let guard = 0;
    while (!g.finished && guard < 400) {
      const v = g.view;
      // When the shock note is present, a matching shock:* flag must exist (the view reflects real state).
      if (v.shock) {
        sawShockView = true;
        expect(v.state.flags.some((f) => f.startsWith("shock:"))).toBe(true);
        prevHadShock = true;
      } else if (prevHadShock) {
        clearedAfter = true; // a later move cleared the one-turn note
        prevHadShock = false;
      }
      const s = v.saga.scene;
      if (s) {
        if (s.decision) g.pickDecision(0);
        else if (s.beats.length) g.pickBeat(0);
        else break;
      } else if (v.currentEvent?.choices[0]) {
        g.choose(v.currentEvent.choices[0].id);
      } else break;
      guard++;
    }
    expect(sawShockView, "a shock surfaced in view.shock during the run").toBe(true);
    expect(clearedAfter, "the one-turn aftermath note cleared on a later move").toBe(true);
  });

  it("WV-3-SHOCK-RECOVERY: a recovery eventually surfaces as view.shock.kind=recovery (positive note)", () => {
    const real = loadContent();
    // Sweep a few seeds; a meter blow followed by a quiet-tick rebound surfaces a recovery-kind note. The
    // recovery kind (distinct from the loss kinds) is what the UI accents positive (Gemini #114).
    let sawRecovery = false;
    for (const seed of ["rec1", "rec2", "rec3", "rec4", "rec5", "rec6"]) {
      const comp = {
        place: "ireland",
        era: "origins",
        culture: "anglo_protestant",
        year: 1776,
        archetype: "political" as const,
        gender: "male" as const,
        surname: "Rec",
        seed,
        originId: "composed:ireland:origins",
      };
      const g = new Game(real, comp.seed, foundByComposition(real, comp).state, comp.archetype);
      let guard = 0;
      while (!g.finished && guard < 400) {
        if (g.view.shock?.kind === "recovery") {
          sawRecovery = true;
          // SHOCK-LEDGER-RECOVERIES: the rebound must leave a PERSISTENT `recovered:<meter>:<year>` marker
          // (not just clear the transient shock_meter flag) so the ledger can show the comeback.
          const recoveredFlag = g.view.state.flags.find((f) => /^recovered:[a-z]+:\d+$/.test(f));
          expect(recoveredFlag, "a recovery stamps a recovered:<meter>:<year> flag").toBeTruthy();
          // …and that flag must surface in the ledger as a comeback entry.
          const led = shockLedger(g.view.state.flags);
          expect(led.some((e) => e.kind === "recovery")).toBe(true);
          break;
        }
        const s = g.view.saga.scene;
        if (s) {
          if (s.decision) g.pickDecision(0);
          else if (s.beats.length) g.pickBeat(0);
          else break;
        } else if (g.view.currentEvent?.choices[0]) {
          g.choose(g.view.currentEvent.choices[0].id);
        } else break;
        guard++;
      }
      if (sawRecovery) break;
    }
    expect(sawRecovery, "a recovery surfaced with kind=recovery across the seed sweep").toBe(true);
  });

  it("RIVAL-RACE-PRESENCE: view.rivalNews dispatches a faltered (window) and/or surged (pressure) line over a run", () => {
    const real = loadContent();
    // Drive several founding-era seeds; a near-vantage rival that falters yields a "faltered" dispatch, one
    // surging above the player yields "surged". At least one kind must appear across the sweep (the race is
    // surfaced in-run, not silent — which kind fires is seed-dependent, so we don't require BOTH), and every
    // dispatch's kind+headline must be well-formed (only "faltered"/"surged", no raw rival: ids, non-empty).
    const kinds = new Set<string>();
    for (const seed of ["rn1", "rn2", "rn3", "rn4", "rn5", "rn6"]) {
      const comp = {
        place: "ireland",
        era: "origins",
        culture: "anglo_protestant",
        year: 1776,
        archetype: "political" as const,
        gender: "male" as const,
        surname: "Rn",
        seed,
        originId: "composed:ireland:origins",
      };
      const g = new Game(real, comp.seed, foundByComposition(real, comp).state, comp.archetype);
      let guard = 0;
      while (!g.finished && guard < 400) {
        for (const item of g.view.rivalNews) {
          kinds.add(item.kind);
          expect(["faltered", "surged"]).toContain(item.kind);
          expect(item.headline.length).toBeGreaterThan(0);
          expect(item.headline).not.toContain("rival:"); // place is humanized
        }
        const s = g.view.saga.scene;
        if (s) {
          if (s.decision) g.pickDecision(0);
          else if (s.beats.length) g.pickBeat(0);
          else break;
        } else if (g.view.currentEvent?.choices[0]) {
          g.choose(g.view.currentEvent.choices[0].id);
        } else break;
        guard++;
      }
    }
    // At least one dispatch kind fired across the sweep (the race is surfaced in-run, not silent).
    expect(kinds.size, `kinds seen: ${[...kinds].join(",")}`).toBeGreaterThan(0);
  });

  it("RIVAL-CROSSING-EXPLOIT: pressing a faltering rival deepens its stumble + costs heat + records a side-log entry", () => {
    const real = loadContent();
    const mkGame = (seed: string) => {
      const comp = {
        place: "ireland",
        era: "origins",
        culture: "anglo_protestant",
        year: 1776,
        archetype: "political" as const,
        gender: "male" as const,
        surname: "Px",
        seed,
        originId: "composed:ireland:origins",
      };
      return new Game(real, comp.seed, foundByComposition(real, comp).state, comp.archetype);
    };
    // Find a seed + step where a "faltered" dispatch is available, press it, and verify the effects.
    let pressed = false;
    for (const seed of ["px1", "px2", "px3", "px4", "px5", "px6", "px7", "px8"]) {
      const g = mkGame(seed);
      let guard = 0;
      while (!g.finished && guard < 400) {
        const falter = g.view.rivalNews.find((n) => n.kind === "faltered");
        if (falter) {
          const before = g.view.rivalStandings.find((s) => s.id === falter.id)?.rung ?? 0;
          const heatBefore = g.view.state.meters.heat;
          g.pressRival(falter.id);
          const after = g.view.rivalStandings.find((s) => s.id === falter.id)?.rung ?? 0;
          // The press deepens the stumble (rung down, clamped ≥0) and costs heat, and is recorded once.
          expect(after).toBeLessThanOrEqual(before);
          if (before > 0) expect(after).toBe(before - 1);
          expect(g.view.state.meters.heat).toBeGreaterThan(heatBefore);
          expect(g.view.state.presses?.some((p) => p.rivalId === falter.id)).toBe(true);
          // Pressing a NON-faltered / unknown rival is a no-op (no extra record, no heat change).
          const presses = g.view.state.presses?.length ?? 0;
          const heat2 = g.view.state.meters.heat;
          g.pressRival("rival:nonexistent");
          expect(g.view.state.presses?.length ?? 0).toBe(presses);
          expect(g.view.state.meters.heat).toBe(heat2);
          // EXPLOIT GUARD (Gemini #128): a SECOND press of the SAME rival in the same step is ignored — no
          // extra record, no extra heat, no further rung drop (else the player could drain it to 0 instantly).
          g.pressRival(falter.id);
          expect(g.view.state.presses?.length ?? 0).toBe(presses);
          expect(g.view.state.meters.heat).toBe(heat2);
          expect(g.view.rivalStandings.find((s) => s.id === falter.id)?.rung ?? 0).toBe(after);
          pressed = true;
          break;
        }
        const s = g.view.saga.scene;
        if (s) {
          if (s.decision) g.pickDecision(0);
          else if (s.beats.length) g.pickBeat(0);
          else break;
        } else if (g.view.currentEvent?.choices[0]) {
          g.choose(g.view.currentEvent.choices[0].id);
        } else break;
        guard++;
      }
      if (pressed) break;
    }
    expect(pressed, "a faltering rival became pressable across the seed sweep").toBe(true);
  });

  it("RIVAL-CROSSING-EXPLOIT: a press REPLAYS bit-identically through reconstruct (save-invariant side-log)", () => {
    const real = loadContent();
    const found = (seed: string) =>
      foundByComposition(real, {
        place: "ireland",
        era: "origins",
        culture: "anglo_protestant",
        year: 1776,
        archetype: "political" as const,
        gender: "male" as const,
        surname: "Px",
        seed,
        originId: "composed:ireland:origins",
      }).state;
    // Drive a run, pressing every faltering rival as it appears, recording the choice log + the press log.
    for (const seed of ["pr1", "pr2", "pr3", "pr4", "pr5", "pr6"]) {
      const base = found(seed);
      const g = new Game(real, seed, base, "political");
      let guard = 0;
      let didPress = false;
      while (!g.finished && guard < 300) {
        const falter = g.view.rivalNews.find((n) => n.kind === "faltered");
        if (falter) {
          g.pressRival(falter.id);
          didPress = true;
        }
        const s = g.view.saga.scene;
        if (s) {
          if (s.decision) g.pickDecision(0);
          else if (s.beats.length) g.pickBeat(0);
          else break;
        } else if (g.view.currentEvent?.choices[0]) {
          g.choose(g.view.currentEvent.choices[0].id);
        } else break;
        guard++;
      }
      if (!didPress) continue;
      const live = g.view.state;
      // Reconstruct from the SAME base + the recorded history + the press side-log.
      const rebuilt = Game.reconstruct(real, base, live.history, live.presses ?? []);
      // The reconstructed run must match the live run on the press-affected surfaces: meters (heat cost),
      // the press side-log, and the rival world (rebuilt world + interleaved presses → same standings).
      expect(rebuilt.meters.heat).toBe(live.meters.heat);
      expect(rebuilt.presses).toEqual(live.presses);
      // Sanity: reconstruct is itself deterministic — same inputs twice → identical presses + heat.
      const again = Game.reconstruct(real, base, live.history, live.presses ?? []);
      expect(again.presses).toEqual(rebuilt.presses);
      expect(again.meters.heat).toBe(rebuilt.meters.heat);
      return; // one pressing run is enough to prove the replay
    }
    throw new Error("no pressing run produced across the sweep");
  });

  it("SHOCK-FORESHADOW: view.foreshadow surfaces an omen in a harsh era + is deterministic (no roll)", () => {
    const real = loadContent();
    const found = (seed: string) =>
      foundByComposition(real, {
        place: "ireland",
        era: "origins",
        culture: "anglo_protestant",
        year: 1776,
        archetype: "political" as const,
        gender: "male" as const,
        surname: "Fs",
        seed,
        originId: "composed:ireland:origins",
      }).state;
    let sawOmen = false;
    for (const seed of ["fs1", "fs2", "fs3", "fs4"]) {
      const base = found(seed);
      const g = new Game(real, seed, base, "political");
      // Determinism: the same state yields the same foreshadow on a second engine (no RNG consumed).
      const g2 = new Game(real, seed, base, "political");
      expect(g.view.foreshadow).toBe(g2.view.foreshadow);
      let guard = 0;
      while (!g.finished && guard < 200) {
        if (g.view.foreshadow) {
          expect(g.view.foreshadow).toMatch(/season|house|hard/i);
          sawOmen = true;
          break;
        }
        const s = g.view.saga.scene;
        if (s) {
          if (s.decision) g.pickDecision(0);
          else if (s.beats.length) g.pickBeat(0);
          else break;
        } else if (g.view.currentEvent?.choices[0]) {
          g.choose(g.view.currentEvent.choices[0].id);
        } else break;
        guard++;
      }
      if (sawOmen) break;
    }
    expect(sawOmen, "a foreshadow omen surfaced in a founding-era run").toBe(true);
  });
});
