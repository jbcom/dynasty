# DYNASTY

A dynastic **life-simulator**: inherit a family's ambitions, navigate three
playable dynastic sagas — Trump, Musk, Kennedy — from immigrant origins to the
first Martian base. Hybrid narrative + management sim, JSON-config-driven,
shipped to Android via Capacitor.

> Private / stealth project.

## What it is

- **Three playable dynasties** — each a full narrative arc from a distinct
  founding moment: the Drumpf/Trump commercial dynasty (Queens, 1946), the
  Musk technological dynasty (South Africa), the Kennedy political dynasty
  (Irish Famine, 1823).
- **10 eras**, ~99 researched, branching events per house — boyhood → mogul →
  brand → prime time → ascent → interregnum → total victory → the atomic
  horror → the unification → red planet. Later eras are explicitly
  *extrapolated*; the atomic/unification eras draw on the *Star Trek*
  future-history timeline.
- **6 meters** — Money 💰, Power 🏛️, Reputation 📣, Loyalty 🤝, Health ❤️, Heat 🔥.
- **Birth-order lever** — prologue choices (sibling count, birth position) set
  flags that reshape the given name, inheritance framing, and which events fire
  across the whole run.
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
