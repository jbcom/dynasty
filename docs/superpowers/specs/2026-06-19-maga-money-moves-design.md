# MAGA Money Moves — Design Spec

**Date:** 2026-06-19
**Status:** Approved (brainstorming) — pending spec review → implementation plan

A satirical **life-simulator** game: play the life of Donald Trump from birth to
the founding of the first sustained Martian base, governing a unified Earth as an
immortal patriarch of a two-world civilization. Hybrid narrative + management sim,
JSON-config-driven, shipped to Android via Capacitor.

---

## 1. Vision & Tone

- **Genre:** Hybrid — branching narrative interactive-fiction *spine* + lightweight
  per-era management layer (six meters).
- **Tone:** Satirical caricature / political-cartoon. Exaggerated, stylized, never
  photographic — both for tone and to stay clear of likeness/copyright issues.
- **Span:** 1946 → 2080+, across **10 eras**, the later ones explicitly
  extrapolated, with eras 8–9 drawing on the *Star Trek* future-history timeline
  (post-atomic horror, WWIII / Eugenics-War upheaval, Colonel-Green-style anarchy,
  the founding of a unified Earth) as referenced by Q during the tribunal.
- **Research-backed vs. fiction line is explicit in the data:** every event carries
  a `research_note`; speculative content carries `extrapolated: true`; Trek-lineage
  content carries `startrek_inspired: true`.

## 2. Stack

Follows the **arcade-game profile**: Vite + TypeScript + Capacitor (Android) +
Biome + Playwright + **pnpm**, release-please, `<repo>/.agent-state/` continuous-work
system.

**Runtime libraries (each justified by a specific need):**

| Concern | Library | Why |
|---|---|---|
| UI framework | **Svelte 5** | Compile-time reactivity, tiny mobile bundle, no vDOM overhead; stores map onto pure sim state |
| Determinism | **seedrandom** | Wrapped by `createRng(seed)` facade; reproducible playthroughs |
| Audio | **Tone.js** | Era ambient beds, choice stingers, meter blips (gated `src/audio/**`) |
| Animation | **Motion One** (`motion`) | ~5kb WAAPI-based; meter fills, card/era transitions |
| Butterfly graph | **D3 modules** (d3-scale, d3-shape, d3-force) | Force-directed/DAG cause-effect graph |
| Stat history | **uPlot** | Fastest/tiniest time-series; net-worth & meter trends over decades |
| Chronology | **vis-timeline** | Scrollable era/event timeline (hand-rolled fallback if too heavy) |
| Design primitives | **open-props** | Spacing/typography scales; bespoke gold/red/navy token system on top |
| Validation | **zod** (or hand-rolled) | Validate all JSON content on load; fail fast in tests |
| Mobile | **@capacitor/haptics, preferences, status-bar** | Tactile feedback, save/load, edge-to-edge |
| Icons/art | **OpenMoji (CC-BY)** + CC0 caricature sprites | Meter/flag icons; composited portraits |

Meters themselves are hand-rolled SVG/CSS gauges (full brand control, no lib).

## 3. Architecture

Strict layer separation per profile doctrine. **Sim is pure**: no DOM, no DOM
types, no `Math.random`, no `performance.now`.

```
src/
  sim/                  # PURE TS deterministic state machine
    rng.ts                # createRng(seed) — seedrandom facade
    state.ts              # GameState: 6 meters, flags, era, age, butterfly ledger, history
    meters.ts             # clamp/apply deltas (Money log-scaled)
    events.ts             # eligibility filter → seeded weighted pick-next
    butterfly.ts          # flag chains (B) + seeded weighted ripple engine (C)
    effects.ts            # choice outcome → new state + ledger entries
    timeline.ts           # era progression, age/health gating, end conditions
    schema.ts             # zod schemas for all JSON content
    __tests__/            # *.unit.test.ts (+ schema validation, deterministic replay)
  engine/
    clock.ts              # clock facade (no performance.now in sim)
    save.ts               # Capacitor Preferences; autosave; seed+history reconstructs any state
    loop.ts
    __tests__/
  audio/                  # Tone.js graph; gated
    __tests__/            # *.audio.test.ts (Vitest browser mode, real WebAudio)
  render/                 # portrait/scene compositing, caricature layers
    __tests__/            # *.visual.test.ts (Vitest browser mode)
  ui/                     # Svelte — never touches sim internals except via bridge
    screens/, MeterHud, EventCard, ButterflyLog, TimelineView, StatsView, Dossier
    __tests__/            # *.browser.test.ts / *.visual.test.ts (Vitest browser mode)
  data/                   # ALL CONTENT AS JSON
    eras/index.json       # era order, spans, titles, flags, audio, palette
    eras/<era>.json       # event pools per era
    meters.json
    butterfly-rules.json
    assets.json           # every asset: path, source URL, license, attribution
e2e/                      # standalone Playwright — full cross-cutting playthroughs
```

**Test layout:** colocated `__tests__/` dirs; test *type* distinguished by filename
suffix (`*.unit.test.ts`, `*.browser.test.ts`, `*.visual.test.ts`, `*.audio.test.ts`).
**Vitest browser mode** (`@vitest/browser` + Playwright provider) runs all
visual/component/audio tests in real Chromium in isolation. Standalone Playwright
(`e2e/`) runs whole-app playthroughs. The profile's `gates.json` coverage globs are
rewritten to this colocated convention.

**Sim contract:** `(GameState, seed, choiceId) → { state, ledgerEntries }`, pure and
deterministic. Same seed + same choice history reconstructs any state — this is what
makes butterfly chains verifiable and saves tiny.

## 4. Meters

Six meters, 0–100 unless noted, defined in `data/meters.json` (id, label, icon,
scale, crit thresholds, color):

| Meter | Icon | Notes |
|---|---|---|
| Money 💰 | headline; **log-scaled**, displayed as net worth (unbounded) |
| Power 🏛️ | political/institutional influence |
| Reputation 📣 | public image / brand / media (**can go negative**) |
| Loyalty 🤝 | strength of inner circle / allies |
| Health ❤️ | stamina/longevity; gates run length; 0 = death |
| Drama/Heat 🔥 | legal & scandal pressure; high → investigations/coup risk |

## 5. Eras (10)

1. **Birth & Boyhood** (1946–1964)
2. **Apprentice Mogul** (1964–1987)
3. **Boom, Bust & Brand** (1988–2003)
4. **Prime Time** (2004–2014)
5. **The Ascent** (2015–2020)
6. **Interregnum & Return** (2021–2028)
7. **Total Victory** (2029–2040) — *extrapolated*
8. **The Atomic Horror** (2041–2053) — *extrapolated, startrek_inspired*: WWIII /
   Eugenics-War upheaval, post-atomic tribunal, Colonel-Green-style anarchy
9. **The Unification** (2054–2079) — *extrapolated, startrek_inspired*: life-extension
   keeps you alive; rebuild & govern a unified Earth; First-Contact-era recovery
10. **Red Planet & Beyond** (2080+) — *extrapolated*: Musk partnership, first
    sustained Martian base, immortal two-world patriarch — endgame

Each era: 7–12 pivotal events, ambient track, palette accent, flags.

## 6. Content Schema (JSON)

**Event** (`data/eras/<era>.json`):
```jsonc
{
  "id": "ev_trump_tower_1983",
  "era": "apprentice_mogul",
  "year": 1983,
  "title": "Build Trump Tower",
  "scene": "Fifth Avenue. A run-down store and the air rights above it...",
  "research_note": "Trump Tower opened 1983; the atrium's pink marble...",
  "extrapolated": false,
  "startrek_inspired": false,
  "tags": ["real_estate", "branding"],
  "portrait": "young_mogul",
  "requires": { "flags": ["has_seed_money"], "meters": { "money": ">=20" } },
  "weight": 10,
  "choices": [
    {
      "id": "go_big",
      "text": "Demolish the Bonwit Teller friezes, build the tallest tower.",
      "effects": { "money": -15, "reputation": 8, "power": 5, "heat": 6 },
      "setFlags": ["tower_built", "destroyed_art"],
      "ripples": [{ "to": "media_relationship", "weight": 0.7, "polarity": -1 }],
      "outcome": "The friezes are smashed. The press howls. The skyline is yours."
    }
  ]
}
```

**Butterfly rule** (`data/butterfly-rules.json`): maps flags + ripples to future
event eligibility/weighting; stores human-readable chain templates for the log
("Because you *{cause}*, the *{effect}* now {verb}").

Ripples live in **both** places: inline on choices (immediate emission) and in the
central rules file (cross-era chains).

**Meters** (`data/meters.json`), **Era index** (`data/eras/index.json`), **Assets**
(`data/assets.json`) as described above. All validated on load via zod schemas.

## 7. Butterfly Engine (B + C)

- **(B) Visible ledger:** choices set named flags shown in a **Butterfly Log**; when
  a past choice causes a future event, the game surfaces the chain explicitly.
- **(C) Chaos engine:** each choice emits **seeded weighted ripples**; ripples
  amplify/dampen future event weights so timelines diverge across playthroughs even
  with identical choices (variety driven by the run seed, still fully deterministic).
- Rendered as a **D3 force-DAG** in the Butterfly Graph view.

## 8. Graphics & Assets

Caricature / political-cartoon style, **all freely-licensed**:
- OpenMoji (CC-BY) icons for meters/flags
- CC0 backgrounds (Wikimedia PD, Pexels, Unsplash), public-domain political-cartoon
  textures
- CC0 Trump-likeness caricature sprites sourced where available; otherwise
  generated vector/pixel caricatures
- **Every asset** logged in `data/assets.json` with path, source URL, license,
  attribution. `ASSETS.md` summarizes attributions for distribution compliance.

## 9. Game Flow

1. **Title / New Game** — seed entry or random; gilded-tower menu.
2. **Era intro card** — span, ambient track fades in, palette shifts.
3. **Event cycle** — eligibility filter → seeded weighted pick → read scene +
   research note → choose.
4. **Resolution** — Motion One animates meter deltas, haptic on big swings, outcome
   text, ripples emitted, ledger entries created.
5. **Era advance** — when pool exhausted or age/health gate trips; net-worth
   sparkline updates.
6. **Inter-era views** (tab/swipe): Timeline (vis-timeline), Butterfly Graph
   (D3), Stats (uPlot), Dossier (meters + flags).
7. **End states** — death (health→0), assassination/coup (high heat + low loyalty),
   or **victory** (reach Era 10 endgame). Each shows a **legacy report** + the full
   butterfly chain that led there.

**Save/load:** Capacitor Preferences; autosave each event; seed + choice-history
reconstructs any state.

## 10. Testing & Definition of Done

**Tests (colocated `__tests__/`, suffix-tagged, Vitest browser mode for visuals):**
- `*.unit.test.ts` — meter math, eligibility, ripple propagation, **deterministic
  replay** (same seed+choices → same state), JSON schema validation of all 10 eras.
- `*.browser.test.ts` / `*.visual.test.ts` — real-Chromium component/visual
  regression (event card, meter HUD, butterfly graph).
- `*.audio.test.ts` — Tone.js graph wiring (real WebAudio).
- `e2e/` — standalone Playwright full playthrough to each end state on mobile
  viewport.

**Definition of done** (global rules): Docs→Tests→Code; sim purity (no
`Math.random`/`performance.now` in sim); brand-hex ban-gate; `pnpm cap:sync` after
Android changes; app verified **running** (Chromium screenshot of a real
playthrough); single feature branch → squash-merge PR with reviewer trio + visuals
check.

## 11. Milestone Scoping

The **first implementation plan** builds the full engine + UI shell + **Eras 1–2
fully authored** as a vertical slice exercising every system (meters, butterfly
chains B+C, timeline, audio, save/load, Android build, all test types). Eras 3–10
are authored as follow-on content milestones against the proven engine.

## 12. Project Initialization

Initialize the repo as an **arcade-game profile** project (thin `<repo>/CLAUDE.md`
including arcade-game + mobile-android + agent-state profiles via `@<abs-path>`),
with `<repo>/.agent-state/directive.md` queueing the milestones, and
`<repo>/.claude/gates.json` rewritten for the colocated `__tests__/` convention.

**Repository:** **`jbcom/maga-money-moves`**, created **private** — developed in
**stealth mode** (no public visibility, no public-facing announcements). Keep the
repo private through all milestones.
