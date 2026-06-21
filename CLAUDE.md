<!-- profile: arcade-game,mobile-android,agent-state,standard-repo v1 -->
# dynasty

A dynastic-saga life-simulator: FOUND your own family line — discovered through a
diegetic, seed-dealt birth — and steer it from immigrant origins to the stars across
the centuries. No preset families: identity is composed from PLACE × CULTURE × ERA ×
ARCHETYPE (six power bases), with the literal lines dissolved into reusable tropes.
Hybrid narrative + management sim, JSON-config-driven, Vite + Svelte 5 + Capacitor
(Android). **Private / stealth — keep the repo private.**

Current architecture + state: **docs/STATE.md** (canonical). The specs below are
historical design records.

## Profiles loaded

@/Users/jbogaty/.claude/profiles/arcade-game.md
@/Users/jbogaty/.claude/profiles/mobile-android.md
@/Users/jbogaty/.claude/profiles/agent-state.md
@/Users/jbogaty/.claude/profiles/standard-repo.md

## Repo-specific

- **Run:** `pnpm dev`
- **Test:** `pnpm test` (node units) · `pnpm test:browser` (Vitest browser mode) · `pnpm test:e2e` (Playwright)
- **Build:** `pnpm build`
- **Android sync:** `pnpm cap:sync` · **Run on device:** `pnpm cap:run:android`
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
  only — never photographic. Every asset license-logged in `src/data/assets.json`.
- pnpm only, Biome only, Conventional Commits, release-please, squash-merge.

## Notes

Coverage gates in `.claude/gates.json` are rewritten for the colocated
`__tests__/` convention and include sim-purity ban patterns.
