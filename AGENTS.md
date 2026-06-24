<!-- profile: arcade-game,mobile-android,agent-state,standard-repo v1 -->
# dynasty

A dynastic-saga life-simulator: FOUND one family line through a diegetic, seed-dealt
birth and steer it from America's founding generation to the stars. The current game
is one authored dynasty story as old as America itself; class/rung/culture material
is texture, encounter fabric, and people met along the way, not a separate playable
class lattice. Hybrid narrative + management sim, JSON-config-driven, Vite + Svelte 5
+ Capacitor (Android). **Private / stealth — keep the repo private.**

Current architecture + state: **docs/STATE.md** (canonical). The specs below are
historical design records. Current pillar direction: **docs/pillars/key-pillars.md**.

## Profiles loaded

@/Users/jbogaty/.Codex/profiles/arcade-game.md
@/Users/jbogaty/.Codex/profiles/mobile-android.md
@/Users/jbogaty/.Codex/profiles/agent-state.md
@/Users/jbogaty/.Codex/profiles/standard-repo.md

## Repo-specific

- **Run:** `pnpm dev`
- **Test:** `pnpm test` (node units) · `pnpm test:browser` (Vitest browser mode) · `pnpm test:e2e` (Playwright)
- **Build:** `pnpm build`
- **Android sync:** `pnpm cap:sync` · **Run on device:** `pnpm cap:run:android`
- **GenAI spine:** `pnpm genai:spine` (uses repo `.env` via `scripts/env.ts`)
- **Prose audit:** `pnpm prose:audit`
- **Design spec:** `docs/superpowers/specs/2026-06-19-maga-money-moves-design.md` (original, historical)
- **Batch plan:** `docs/plans/maga-money-moves.prq.md` (original, historical)

## Architecture (see docs/STATE.md for the current model)

- `src/sim/**` — PURE TS deterministic state machine. No DOM, no `Math.random`,
  no `performance.now`/`Date.now`. RNG via `createRng(seed)` (seedrandom).
- `src/engine/**` — clock facade, save/load (Capacitor Preferences), loop.
- `src/audio/**` — Tone.js graph (gated).
- `src/render/**` — caricature portrait/scene compositing.
- `src/ui/**` — Svelte 5; never touches sim internals except via the bridge.
- `src/data/**` — ALL content as JSON (10 eras, meters, butterfly-rules, assets),
  validated on load via zod schemas.

## Conventions

- **Tests colocated** in `__tests__/` dirs; type by filename suffix:
  `*.unit.test.ts` (node), `*.browser.test.ts` / `*.visual.test.ts` /
  `*.audio.test.ts` (Vitest browser mode, Playwright provider). Cross-cutting
  Playwright playthroughs live in top-level `e2e/`.
- Brand palette gold/red/navy as design tokens (open-props base). Caricature art
  and GenAI raster art only — never photographic, never hand-drawn SVG people.
  Every asset license-logged in `src/data/assets.json`.
- pnpm only, Biome only, Conventional Commits, release-please, squash-merge.

## Notes

Coverage gates in `.Codex/gates.json` are rewritten for the colocated
`__tests__/` convention and include sim-purity ban patterns.
