# DYNASTY

A dynastic **life-simulator**: FOUND your own family line and steer it across the
centuries — from an immigrant birth to the first Martian base and beyond. Hybrid
narrative + management sim, JSON-config-driven, shipped to Android via Capacitor.

> Private / stealth project.

## What it is

- **Found your own dynasty — no presets.** New Game drops you straight into a
  diegetic, BitLife-style **birth**: you *discover* your origin through sensory and
  social cues ("you emerge kicking and screaming into the… desert heat and a market
  stall" → Baghdad; "fish and salt air" → Ireland), your gender is revealed, and
  your line is named in-fiction. The origin is **dealt from the seed** — you don't
  configure it, you're dealt a hand (a reroll is a new birth).
- **Orthogonal identity fabric.** A line is composed from independent axes —
  **PLACE** (geography: ireland, bavaria, baghdad, the coasts, the frontier…) ×
  **CULTURE** (ethnic naming / onomastics) × **ERA** (when you're founded) ×
  **ARCHETYPE** (the power base you're built on). The old literal families are
  fully dissolved into reusable archetypes and tropes; the founded line's own name
  renders everywhere via `{given_name}`/`{surname}`/`{full_name}` tokens.
- **Six power archetypes** — economic, political, technological, religious,
  entertainment, athletic. Each is a distinct foundation a dynasty can be built on;
  events declare which archetype(s) they serve and the pool filters by the run's.
- **Eras by PLACE × TIME.** Content lives in `eras/<place>/<period>/`, glob-loaded;
  alt-history branches (an occupied-America, a theocratic state, …) are flag-gated
  world-states woven into one timeline per scope, not bespoke files.
- **Live family tree** — beget, partner, death (Gompertz mortality), and
  succession carry the line generation to generation; calling + the four Epoch-0
  axes (faith / ideology / sociology / tech) are LIVED childhood beats that bias
  the line for generations.
- **6 meters** — Money 💰, Power 🏛️, Reputation 📣, Loyalty 🤝, Health ❤️, Heat 🔥.
- **Butterfly engine** — a visible cause→effect ledger *plus* a seeded chaos engine
  of weighted ripples, so timelines diverge across playthroughs and the full chain
  renders as a D3 force-DAG on the end screen.
- **Deterministic** — the whole sim is a pure function of `(seed, choices)`, so
  saves are tiny (seed + composition + history) and every run is reproducible. A
  dev harness traces, dumps, and validates the bespoke post-birth timeline for
  consistency, linear time, zero literal leaks, and clean progression.

## Stack

Vite + TypeScript + **Svelte 5** + Capacitor (Android) + Biome + Vitest
(node + browser mode via Playwright) + Playwright e2e. seedrandom, Tone.js +
Howler (audio), Motion One, D3 (force/scale/shape), uPlot, open-props, zod.

## Commands

```sh
pnpm install
pnpm dev                 # vite dev server
pnpm build               # tsc + vite build
pnpm typecheck           # tsc + svelte-check
pnpm lint                # biome
pnpm test                # node unit tests
pnpm test:browser        # real-Chromium component/visual tests
pnpm test:e2e            # Playwright full playthroughs
pnpm cap:sync            # sync web build into android/
pnpm cap:run:android     # run on device/emulator
```

## Assets

All shipped assets are freely licensed — see [ASSETS.md](ASSETS.md). Portraits
are cartoon derivatives of public-domain photos (our own work);
icons are OpenMoji (CC BY-SA); era audio is CC0 (Kenney) and licensed itch.io
packs. Source photos and raw audio archives are gitignored; only curated
keepers ship.

## Docs

- **Current architecture + state:** [docs/STATE.md](docs/STATE.md) — the canonical
  description of the found-your-own / diegetic-birth model, the orthogonal identity
  fabric, archetypes, the place×time era tree, and the dev harness.
- Design specs (historical record of each design decision) live under
  `docs/superpowers/specs/` — e.g. the founding-control-panel spec carries the full
  pivot to the diegetic birth + the bespoke→slot dissolution decisions.
- Runtime verification: `docs/verification/G3-runtime-verification.md`
