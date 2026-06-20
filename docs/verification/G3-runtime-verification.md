---
title: G3 Runtime Verification
updated: 2026-06-20
status: current
domain: quality
---

# G3 — App Runs (real playthrough)

Verified the built app runs end-to-end in real Chromium (chrome-devtools-mcp),
not just that tests pass.

## Evidence

- **Title screen**: glowing gold wordmark, tagline "From Queens to the King.",
  seed entry, save-aware Continue. ✓
- **Play screen**: 6-gauge meter HUD, tab nav (Now/Timeline/Stats/🦋/Dossier),
  cartoonified era portrait, event card with scene + research-note + branching
  choices. Choosing applies effects and advances to the next eligible event. ✓
- **Full playthrough**: a deterministic 78-decision run (seed `g3-verify`)
  traversed all 10 eras to the **Total Victory** end state
  ("Immortal patriarch of a two-world civilization", year 2120). ✓
- **Legacy Report**: end headline, final stats (net worth, power, reputation,
  decisions), and "The chain of consequence" D3 force-DAG rendering every
  butterfly chain that fired across the run (br_fathers_lessons, br_base_built,
  br_loyalty_machine, br_consolidation, br_brinkmanship, br_musk_pact, …). ✓
- **Console**: zero errors during load + playthrough. ✓

## How to reproduce

```sh
pnpm dev
# open http://localhost:5173, New Game, play to an end screen
# or: pnpm test:e2e  (drives the same flow headless on a Pixel 7 viewport)
```
