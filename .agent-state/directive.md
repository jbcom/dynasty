# Continuous Work Directive — Dynasty (maga-money-moves)

**Status:** ACTIVE
**Owner:** jbogaty (autonomous loop)
**Mandate (2026-06-21):** POLISH & FEATURES — AUTONOMOUS LOOP. Foundations done:
found-your-own / diegetic birth / orthogonal identity (PR #31), 1000-year dynasty breadth
+ GenAI toolkit + millennium run (PRs #34/#35). User directive (`/loop`): "add features
and improvements, polish the UI and UX, expand and compress directives — do this
AUTONOMOUSLY, make decisions, mutate your own loop prompt as you discover new content to
go in the direction of." So: self-pace; pick the highest-value improvement each cycle;
own the full PR loop; keep the directive a living plan (expand when discovery reveals
work, compress when items resolve). Work SERIALLY, no agent swarm
([[agent-swarm-discipline]]). Every change stays 0-leak + 0-harness-findings + green CI.
ALSO OWN (user, 2026-06-21): merge the release-please PRs, and keep ALL workflows green —
not just feature-PR CI, but the post-merge CD/Release on main too. PR #47 fixed a
long-standing CD APK break (proguard-android.txt → -optimize.txt for Gradle 9.6/R8). Release
+ dependabot PRs auto-merge via `.github/workflows/automerge.yml` (approve + --auto --squash).
PRIVATE REPO (user): keep it private. CodeQL = GitHub default-setup
(`dynamic/github-code-scanning/codeql`), NOT a repo workflow file — user wants it DELETED
(low value on a private repo). [BLOCKER — needs the user]: disable it in repo Settings →
Code security → Code scanning → CodeQL default setup; the `gh api code-scanning/default-setup`
call returns 403, so the agent can't toggle it via tools.
EXPANSION milestone (EX-1→EX-6) RELEASED — see git history / directive-archive.md.

## What CONTINUOUS means
1. Never stop for status reports the user didn't ask for. 2. Never stop for scope
caution. 3. Never stop to summarize. 4. Never stop on context pressure. 5. Never stop
because a task feels big. 6. Only stop on: explicit user halt, red CI blocking, or a
genuine scope-flip design question (ask, then continue).

## Operating loop
while queue has [ ] items: enumerate use-cases → docs/tests/code → verify (typecheck +
biome check + full suite + harness audit at 0 findings, screenshot/live-verify UI) →
commit (Conventional Commit, one per item) → dispatch reviewers → mark [x] → next.

## Forbidden phrases / behaviors
"deferred" | "v2+" | "out of scope" | "future work" | "follow-up" | "TODO" | "FIXME" |
"stub" | "placeholder" | "mock for now" | "pause point" | "next session" | "stopping
point" | "clean handoff". No Math.random/Date.now in src/sim (purity). No commit to main.
Squash-merge only. Stubs/`as any`/`it.todo` are bugs. Run `pnpm format` + `biome check`
(not just `pnpm lint`) before push — CI gates on format + import-sort.

---

## Milestone — ONBOARDING REWORK → AUTHORED EPOCH-0 (batch-20260621-epoch0)

Spec: docs/superpowers/specs/2026-06-21-onboarding-rework.md. SUPERSEDES the PL-3
consciousness-phase onboarding (the user rejected it as confusing).

GOAL (user): Epoch-0 is the FIRST STAGE OF THE STORY, not a control panel — a fully-written
birth → man/womanhood → first turn of the calling → finding a partner → branch-fork, with
the player choosing EVERYTHING (location, gender, family + given name, calling). Each choice
diegetically SETS A CAUSAL ANCHOR the butterfly/world/pool engines read to generate this
line's unique storyline. The seed is a HIDDEN random draw (world only). Geography (place) ≠
chronology (era/date): the doctor draws a seed-random month/day, narrates the full date,
which frames the era. Calling IS the archetype (diegetic title). EACH place × era needs its
OWN fully-written Epoch-0. Polish sweep (PL-1..PL-13) shipped — see git history.

### Queue
- [x] **OB-1 spec** (34d7c41/a837c41/533ada1) — Epoch-0-as-story scope, geography≠chronology,
  calling=archetype, causal-anchor purpose.
- [x] **OB-2 seam + helpers** (3f3bf9b) — suggestGivenNames; ARCHETYPE_CALLINGS
  (archetype→diegetic title+summons); drawBirthDate/formatBirthDate (seed-drawn {month,day},
  year from era); 6 unit tests. (`birthDate` field on composition + the Epoch-0 flag chain
  land with OB-3/OB-4 where they're wired into the founding seam + authored beats.)
- [x] **OB-3 DONE** (commit 08ded25) — consciousness phase removed (seedComposer + seed-words
  deleted); New Game → OnboardingScreen does the LOCATION pick (discernible place-cue cards:
  "fish and salt air…" → Ireland) → family-name bestowal → founds. Hidden random seed
  (crypto); chosen place threads through dealComposition. e2e rewired; live-verified (Ireland
  cue → Gallagher/Brennan/MacCarthy → game). NOTE: era/gender/archetype still seed-dealt as
  starting defaults — OB-4's authored beats convert these to player choices in-game; and the
  founding `emerged`/`named` pre-set still needs revisiting in OB-4 so the birth/naming beats
  actually play (currently they're skipped, holdover from PL-3).
- [x] **OB-4 VERTICAL SLICE DONE** (commits afc1e9c + 31a8c7d, branch feat/ob4-ireland-epoch0)
  — Ireland/origins Epoch-0 authored end-to-end: "Born to the Rain" (birth + the doctor's
  seed-drawn date via {birth_date}) → first cry (gender) → "A Name at the Font" (given-naming)
  → "What the Parish Teaches" (class/station emerges from observing tenant-and-landlord
  Ireland) → "The Hedge and the Master" (schooling + an inspiring/embittered teacher) → "What
  You Are For" (the calling CRYSTALLIZES into the archetype via the new setsArchetype choice
  field) → partner → heirs. Chronology seam (birthDate) wired through composition/state/terms;
  founding emerged/named pre-set dropped so the beats play; place-agnostic ev_birth_generic
  fallback for non-custom origins (excluded for Ireland). 0 leaks; 510 unit + 73 browser + 7
  e2e green; textQuality corpus-clean. NOTE: starting meters ($1K/low) already read as a poor
  tenant family; a deeper "family money vs your money" mechanic is a future refinement, not
  blocking. A richer partner beat + an explicit branch-fork beat can be added in OB-5 polish.
- [x] **OB-5 REPLICATE — COMPLETE + MERGED (9/9 on main).** Full Epoch-0 authored + merged
  for every origin: ireland (#52), bavaria + south_africa (#53), west_coast (#54), east_coast
  (#55), canada (#56), american_midwest (#57), american_south (#58), baghdad/caliphate (#59 —
  the only non-1885 slice, era-correct Abbasid 762 CE). #53 review fold: all authored callings
  offer ALL SIX archetypes (Star + Champion); SA naming flag fixed. The per-place generic-beat
  notFlags exclusion smell is REFACTORED OUT (#54): content.authoredEpoch0Places derived at
  build, founding stamps single has_authored_epoch0, generic beats self-exclude — slices 5–9
  added with ZERO generic-beat edits. RECURRING FALSE-POSITIVE REVIEW VERDICTS (settled, don't
  re-litigate; reply + resolve): (1) money is a log-scale currency (meters.json scale:log,
  start:1000, max:1e12), existing origins events use deltas up to 200,000 — +100/200/500 nudges
  are CORRECT, not "single-digit"; (2) {family_name} → bare "{surname}s" (no "the"), a real
  distinct token; (3) {given_name} IS a resolved identity token, {member} is NOT real.
- [x] **OB-6 verify — COMPLETE + MERGED (#60).** OB-6 acceptance test (ob6-all-origins) pins all
  9 origins (found leak-free, has_authored_epoch0 stamped, own birth beat fires, 6-archetype
  calling), iterating the DERIVED authored set + an exact-equality spec assertion. LIVE-VERIFY in
  Chrome caught + fixed TWO real bugs: (1) epoch0 beats displayed the beat's nominal 1885 year
  instead of the run clock (a caliphate 762 run showed 1885) — fixed in EventCard (shows
  state.year via prop) + 2 browser tests; (2) USER-caught: the birth beat's prose implied a
  question under a single passive option (baghdad's scribe "asked the hour") — corrected across
  all 9 so the birth beat is an honest EXPERIENCED moment (you OVERHEAR the date; the YEAR is the
  era anchor), not a fake choice. Captured the principle in [[mmm-epoch0-birth-beat]]: beats mix
  EXPERIENCED (sensory/passive) vs CHOSEN so a life feels lived, not a control panel. Stale PL-3
  "consciousness" comment removed. Note: the generic ev_birth_generic/ev_birth_calling beats are
  now dead-fallback (all 9 authored) — KEPT as the safety net for any future place added without
  an Epoch-0 (self-exclude via has_authored_epoch0), documented not deleted.

**🎉 ONBOARDING REWORK → AUTHORED EPOCH-0 milestone COMPLETE** (OB-1…OB-6, PRs #51–#60). All 9
origins ship a fully-written, era-correct Epoch-0; chronology (overheard year) ⊥ geography
(chosen place) are the twin anchors; the calling crystallizes the archetype; 0 leaks; full gate
+ post-merge workflows green.

## Next milestone — LIVED-IN FEEL (light editorial, NOT a mechanical sweep)
- [ ] [WAIT-USER] **LF-1** — BLOCKED on the user's creative steer (genuine scope/design call,
  not agent-decidable: the user corrected the birth beat twice and said "you're getting carried
  away" — pushing a broad editorial pass now would repeat that mistake). When the user gives the
  direction, do it in SMALL story-first slices, one origin/era at a time, live-verified.
  Carry the [[mmm-epoch0-birth-beat]] principle past Epoch-0: as beats are touched,
  make the EXPERIENCED-vs-CHOSEN mix feel right and ground scenes in concrete sense detail of
  their place+time so a life feels LIVED. User's guardrails (verbatim spirit): "tell a story, a
  coherent narrative whole with causality + butterfly effect"; "a life must feel lived"; do NOT
  turn this into a one-sense-per-beat system or sweep the whole corpus mechanically ("you're
  getting carried away"). So: SMALL, story-first slices, one origin/era at a time, live-verified;
  pause for the user's steer on creative direction rather than mass-editing. This is the standing
  /loop direction until the user redirects.

## Architectural notes carried forward
- Identity = PLACE × CULTURE × ERA × ARCHETYPE; names from the live family tree via
  `runTerms`; NO literal presets (the harness validator enforces 0 preset-person leaks).
- Eras: `eras/<place>/<period>/events.json`, glob-loaded; `_shared/` for place-agnostic.
- Archetypes (6): events declare `archetypes:[...]`; empty = agnostic. Branch = a
  flag-gated world-state woven into one timeline per scope (not bespoke files).
- `foundByComposition` is the single pure founding seam; `dealComposition` deals the
  diegetic birth's origin from the seed. Save = seed + composition + history; replay
  bit-identical. `buildExpandContext` is the procgen seam — wire there, don't duplicate.
- The CP-R7 harness (`src/sim/harness.ts`) + `artifacts/timeline-audit.json` are the
  acceptance gate for all breadth. Canonical architecture: `docs/STATE.md`.

---

## Batch — convergence-saga (batch-20260621-convergence)

Source: docs/plans/convergence-saga.prq.md (sha256: 649c6a35efb4b5a65126117955a79770cd7bd8d6fda84d029a7979ac7271e2ed)
Started: 2026-06-21
Spec: docs/superpowers/specs/2026-06-21-convergence-saga-design.md (approved). Full rebuild,
ONE branch (feat/convergence-saga), NO deferrals/stubs/placeholders. Engine→roster→world→spine→
GenAI retool→GenAI writes stories→UI→gate. Per task: sim-purity + 0-leak + harness 0-findings +
full gate green + one Conventional Commit. Open PR ONCE at end; squash-merge.

### SS-1 Motivators core (8-axis model)
- [x] SS-1 src/sim/motivators.ts (8 axes, createMotivators/drift/gate); migrate personality+axes.json consumers; unit tests; gate green
### SS-2 Yuka GOAP integration
- [x] SS-2 add yuka+@types/yuka; pure src/sim/goap/ wrapper (no Math.random/Date.now reachable); toJSON/fromJSON deterministic; tests
### SS-3 DynastyAgent
- [x] SS-3 line→Think brain (motivators→characterBias, archetype/trope→evaluators); pure deterministic arbitrate+step; serializes; determinism tests
### SS-4 Macro-acts + epochs
- [x] SS-4 Convergence/Emergence/Ascension phases + epoch world-inputs every evaluator reads; tests
### SS-5 Class-rung system
- [x] SS-5 rung index + poor/middle/upper track routing; seeded misfortune drop (war/disease/collapse)+recovery+hysteresis; tests
### SS-6 Immigration-wave roster
- [x] SS-6 7 waves (period×class→culture) + destination grounds; drop SA+colonial; reshape baghdad→1880s Levantine; build validates; 0 leaks
### SS-7 Onboarding rebuild
- [x] SS-7 Period→Class→Race/Culture funnel; Epoch-0 seeds the GOAP brain; e2e; live-verified
### SS-8 Multi-line world sim
- [x] SS-8 all unplayed waves advance per turn as agents; stored state; opposing/contributing/neutral; glimpse triggers; deterministic; tests
### SS-9 Convergence + ending lattice
- [x] SS-9 ~16-20 endings (destination×coloring×sub-variant); motivator-gated reachability; other-lines fates fold in; tests
### SS-10 Spine authoring
- [x] SS-10 goal/evaluator sets + act lattice + branch/convergence per archetype×class×macro-act×wave; structural test every cell reachable
### SS-11 GenAI FULL RETOOL (expand modes)
- [x] SS-11 uniform genai:expand --type per content type, writes canonical JSON (no .gen.json), harness-gated, register-aware; stub tests
### SS-12 GenAI WRITES THE STORIES
- [x] SS-12 flesh every scaffolded act/class-track/wave via SS-11; cull weak; harness 0-findings + textQuality clean over ALL generated; no empty scaffolds
### SS-13 Read-model + bridge
- [ ] SS-13 bridge exposes macro-act/rung/motivators/act-chapter/glimpses; pure; tests
### SS-14 UI novel presentation
- [ ] SS-14 acts/chapters + motivators + rung + glimpses + register shift; mobile-first; browser tests; live-verified.
  USER STEER (2026-06-21): a MUCH more polished use of Svelte — incl. SHADERS (WebGL/GLSL for
  atmospheric backdrops/transitions per era register) — and significantly BETTER ORGANIZATION of
  the whole UI layer (clean component architecture, not a thin port of the old HUD). A real UI
  rebuild, not a reskin. Keep luxury "Dynasty" tokens + real-2D-asset icons
  ([[dynasty-ui-conventions]]); mid-tier render budget ([[mobile-android]]). Live-verify via
  chrome-devtools-mcp OR the claude-for-safari skill OR claude-in-chrome (whichever is free).
### SS-15 Determinism + acceptance gate
- [ ] SS-15 full playthrough hour+ beat count, bit-identical replay incl all lines, 0 leaks, harness 0-findings; remove ALL dead old-model code; full gate green
### SS-16 Docs + PR
- [ ] SS-16 STATE.md+ARCHITECTURE.md updated; PR opened; CI green; post-merge Release/CD green
