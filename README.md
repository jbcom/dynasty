# MAGA Money Moves

A satirical **life-simulator** game: play the life of Donald Trump from birth in
Queens (1946) to founding the first sustained Martian base as the immortal
patriarch of a two-world civilization. Hybrid narrative + management sim,
JSON-config-driven, shipped to Android via Capacitor.

> Private / stealth project.

## What it is

- **10 eras**, ~99 researched, branching events from boyhood → mogul → brand →
  prime time → ascent → interregnum → total victory → the atomic horror →
  the unification → red planet. Later eras are explicitly *extrapolated*; the
  atomic/unification eras draw on the *Star Trek* future-history timeline.
- **6 meters** — Money 💰, Power 🏛️, Reputation 📣, Loyalty 🤝, Health ❤️, Heat 🔥.
- **Butterfly engine** — a visible cause→effect ledger *plus* a seeded chaos
  engine of weighted ripples, so timelines diverge across playthroughs and the
  full chain is rendered as a D3 force-DAG on the end screen.
- **Deterministic** — the whole sim is a pure function of `(seed, choices)`, so
  saves are tiny (seed + history) and every run is reproducible.

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

- Design spec: `docs/superpowers/specs/2026-06-19-maga-money-moves-design.md`
- Runtime verification: `docs/verification/G3-runtime-verification.md`
