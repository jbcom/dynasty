# Feature: Deep Causality, Multiple Endings & Personality Vector

**Created**: 2026-06-20
**Status**: Draft (queued after release-infra merges)
**Builds on**: the shipped engine (6 meters, butterfly engine, 10 eras, deterministic sim)

## Vision

Transform MMM from a linear branch-and-meter sim into a genuinely **causal,
re-playable** life simulator with a wide outcome space. Three pillars:

1. **Massively increased causality** — web-researched timeline; every pivotal
   life point gets real cause→effect chains, and the extrapolated future is
   planned as deliberate consequence trees, not isolated events.
2. **Multiple endings** — early-good, early-bad, endgame-good, endgame-bad, plus
   named catastrophic/triumphant ends (jail, bankruptcy, assassination, coup,
   communist utopia, immortal Martian god-king, …). The game is only fun when a
   run can end many different ways.
3. **Personality vector** — a new axis layered on the 6 meters tracking *what
   kind of man he becomes*: from "stayed a liberal Democrat → communist utopia"
   through pragmatic dealmaker to "extreme megalomaniacal king." Tracks both
   **outward** (how the world perceives him) and **inward** (self-perception),
   and these can diverge.
4. **The HUD speaks** — the personality vector is communicated **visually AND
   diegetically**: the HUD continuously signals whether the run is sliding toward
   **tyranny** or **utopian ideals**, and how that **radiates outward** to the
   world's perception of Earth. Not a hidden stat — the player feels the drift in
   the chrome, palette, and copy as it happens.
5. **Two secret First-Contact endings** — gated on VERY specific technological +
   policy achievements (back science, fund SETI, launch deep-space telescopes).
   The *same* tech trigger forks on the planet's moral/personality state:
   - **First Contact — Benevolent (Vulcan-like) — THE APEX ENDING:** tech
     achieved **and** the world trends utopian / high outward-reputation →
     Earth's "perception to the universe" reads peaceful → a benevolent
     (Vulcan-inspired) race answers and **gifts humanity lightspeed / warp
     travel**, letting us reach far into the stars. This is the single most
     rewarding, far-reaching ending — it eclipses even the Martian-patriarch
     victory (which becomes a stepping-stone, not the ceiling). Ties into the
     Unification / First-Contact-2063 lore already seeded in Era 9.
   - **First Contact — Malevolent (far worse):** same tech achieved but a
     tyrannical / megalomaniac / high-heat world → a hostile, predatory race
     answers the beacon instead. Earth's nature determines who comes.

## Tasks

### Phase H — Research & Causality Model
- [ ] H1 Web-research the documented timeline (multiple sources per era); index
      pivotal events with dated causes/consequences into research notes.
- [ ] H2 Design the causality graph model: chains, prerequisites, delayed
      consequences, and compounding effects (extend butterfly-rules schema as
      needed; keep deterministic + validated).
- [ ] H3 Personality vector: schema + sim integration. Two scalars
      (ideology: -100 collectivist/left … +100 autocratic/right; and
      grandiosity/temperament), plus outward vs inward perception fields.
      Choices nudge these; events gate on them.

### Phase I — Endings
- [ ] I1 Ending system: data-driven ending definitions with trigger conditions
      over meters + personality + flags + era; replace the 3 hardcoded ends.
- [ ] I2 Author the ending set — early-good, early-bad, endgame-good,
      endgame-bad, plus named ends: jail, bankruptcy, assassination, coup,
      health/death, communist-utopia, megalomaniac-king, Martian-patriarch,
      obscurity, etc. Each with a Legacy Report variant.
- [ ] I3 Wire ending triggers throughout the 10 eras; ensure every era can
      branch toward at least one early end and contribute to late ends.
- [ ] I4 SETI / deep-space tech track: science-backing + SETI-funding +
      telescope-launch achievement flags accumulated across eras (research-,
      space-, policy-tagged events).
- [ ] I5 Two SECRET First-Contact endings gated on the I4 tech track, forked by
      the planet's moral state: Benevolent (utopian/high outward-rep → Vulcan-
      like contact) vs Malevolent (tyrannical/high-heat → hostile race). Hidden
      from the endings tracker until discovered.

### Phase J — Causal Content Pass (per era, research-driven)
- [ ] J1–J10 Revisit each era: add researched cause→effect depth, personality
      nudges, and ending hooks. Expand event pools where needed for divergence.

### Phase K — Personality & Endings UI
- [ ] K1 HUD-as-language: communicate the tyranny↔utopia drift **visually AND
      diegetically** — a personality dial/compass (ideology × grandiosity,
      outward-vs-inward), PLUS continuous ambient signals (palette/chrome shift,
      copy tone, world-perception indicator) so the player feels the slide as it
      happens, not just reads a number.
- [ ] K2 Ending-aware Legacy Report (per-ending art/copy/butterfly framing) +
      an "endings discovered" tracker on the title screen (secret endings shown
      locked until found).
- [ ] K3 First-Contact apex-ending presentation: the Benevolent/warp ending gets
      a distinct, grandest Legacy Report (lightspeed → reaching the stars).

### Phase L — Verify
- [ ] L1 Determinism + schema tests for new systems; seeded playthroughs that
      reach a spread of distinct endings; live verification + screenshots.
- [ ] L2 Reviewer trio + green PR + squash-merge.

## Constraints
- Keep the sim pure & deterministic; all new content JSON-validated on load.
- Personality reuses the existing meter machinery (new fields, same patterns).
- Research notes must cite/ground real events; extrapolation clearly flagged.
- Per-task commit, single feature branch, PR → squash-merge (jbcom rules).
