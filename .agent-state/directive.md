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

**NEVER ASK THE USER FOR DIRECTION (user, 2026-06-22, emphatic).** Do NOT call AskUserQuestion
to pick the next unit, choose between approaches, or confirm scope — the loop handles EVERYTHING
autonomously: discover the highest-value gap, decide, design, build, test, PR, merge, keep CD green,
then pick the next. "Let the loop decide" is the standing answer to every "where next" question. The
ONLY legitimate stops are the true blockers (interactive credential entry; a spend needing the user's
payment auth; physical hardware) — never a design/scope/priority choice. When a unit is a genuine
scope-flip, DECIDE IT and record the decision in the directive + decisions.ndjson; do not surface it.
**NEVER DRAIN THE QUEUE TO ZERO (user, 2026-06-22).** The Stop hook keeps the loop working ONLY while
≥1 actionable (non-WAIT) `[ ]` item remains AND Status is ACTIVE — an empty queue or a flipped Status
lets the session stop, which is the leak that made the loop idle/ask. RULES: (a) Status stays ACTIVE
indefinitely — never flip it to RELEASED while autonomous. (b) The ROLLING BACKLOG below always holds
several concrete actionable items; BEFORE marking the last one `[x]`, APPEND the next 1-3 discovered
units so the count never reaches 0. (c) If you ever can't think of a next unit, that itself is the
task: add a `[ ] AUDIT: enumerate the next depth units` item and do it. The queue is self-replenishing
by construction.

## ROLLING BACKLOG — always non-empty, work top-down, append before draining

- [x] **RB-2 per-tier content depth — DONE.** Audit showed prose depth already uniform (every scene
  2-4 paras); only 2 under-generated cells had <2 beats — regenerated to the full weave (0 thin-beat).
  Fixed a real passSuccession skip bug (skipped any-decision closes, not just succession-bearing ones).
  504/504 closes have succession; integrity intact.
- [x] **RB-6 verify hour+ run end-to-end — DONE (engine-level; Chrome MCP was disconnected).** Drove a
  full founded playthrough reading the novel across ALL 7 waves: 6/7 (ireland/bavaria/italian/ashkenazi/
  scandinavian/chinese) play the full ~150 scenes / ~90 decisions / 30 crossings to 2054 with a
  convergence ending — the hour+ run is real. FOUND A GAP → RB-7: baghdad (the only non-1885 origin,
  founds 762 CE) goes extinct ~1946 after 16 scenes because the timeline eras are calibrated for the
  1885 waves, so advanceFamily ages the line across century-gaps between tiers and the heirs die out.
- [ ] **RB-7 baghdad timeline mismatch.** ROOT CAUSE (analyzed): baghdad founds at year 762 but
  state.eraIndex=1 = the "origins" era (yearStart 1885, yearEnd 1946, budget 16). advanceTimeline steps
  year by span/budget=4y and caps at era.yearEnd 1946 → after the 16-beat budget the era rolls and the
  762-vs-1885 mismatch ages the line to death by 1946 (16 scenes). The saga clock is wrongly driven by
  the NY-line era budget. FIX: in advanceRunClock, advance the SAGA year by a generational step
  (~one human generation per close/tier, ~bounded 20-30y per scene-cluster) DECOUPLED from the NY eras,
  so any founding year (762 or 1885) plays a full 6-generation run. Touches loop.ts:advanceRunClock —
  do AFTER #83 merges (overlaps that file). Verify all 7 waves reach ~150 scenes; test replay-determinism + PR.
  [WAIT] #83 (loop.ts) to merge first.
- [ ] **RB-3 presentation polish** — wire per-act caricature portrait/scene compositing (src/render),
  per-era ambient audio depth, and animated scene transitions in SceneReader; live-verify + PR.
- [ ] **RB-4 surface interactive convergence in the UI** — show the player when a crossing shifted a
  rival (the slide-out "OTHER LINES" should reflect nudges); a brief in-scene cue. PR.
- [ ] **RB-5 codex/timeline depth** — the CodexView + a timeline view of the line's generations + the
  rival world's trajectory; PR.
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
SAGA POLISH milestone (PF-3→PF-18) RELEASED as v0.10.1 (PR #70); CI/CD hardened (PRs #72/#73/#75:
braid-pool, STATE docs, automerge actor→branch-prefix + fork-spoof guard). See [[mmm-scoped-qa-pipeline]].

## DEPTH ARC — hour+ playthrough ACHIEVED (PRs #76/#78/#80, all merged + CD-green)

The dynasty saga now plays as the real game — three compounding units turned a 1-scene fall-through into
a ~150-scene, six-generation saga to year ~2054 ("to the stars across the centuries"), deterministic +
gate-verified. See [[mmm-scoped-qa-pipeline]].
- **DEPTH-1** (#76): authored the close-scene succession decision (the dynastic fork) into all 504 closes.
- **TRAVERSAL FIX** (#78, the critical bug): 1008/2012 scene `next` pointers were malformed (dropped class
  segment) → the novel dead-ended after its OPENING scene. Repaired all + hardened nextScene + DEPTH-2
  (non-succession close ends the line with a convergence ending). Novel went 1 scene → 38+.
- **DEPTH-3** (#80): the succession decision now actually begets heirs (applySuccessionToFamily), so the
  line survives generations instead of going extinct at gen 2. Run: ~150 scenes / 6 acts / year 2054.
- NEXT CANDIDATES (loop self-pick): per-tier content depth (more scenes/beats), richer convergence
  interaction (act on rival glimpses), or presentation polish (portraits/audio/transitions).

- [x] **DEPTH-1 close-scene succession decision — DONE.** 504/504 close scenes now carry a take-partner
  succession decision (corpus + DEPTH-1 test). Two genai fixes hardened every pass: normalizeSceneFile
  coerces setFlags object→array; passSuccession validates+writes per-scene (was whole-file all-or-nothing).
  Full gate green (646 unit + 89 browser + biome + typecheck). PR next.
  ORIGINAL: 0/504 close scenes carried
  a `succession` effect, so the core dynastic choice (take a partner + raise heirs → advance the line)
  was never a player fork — only the dev clock advanced generations. The consuming chain already exists
  (spine close slot, sagaDriver.applyDecision → advanceFamily). FIX: (1) spine close slot now carries a
  `decision: "major"` (the dynastic fork); (2) new `genai:qa --pass succession` authors a 3-option
  close decision per act (exactly one option takesPartner+begets, gate-enforced) in the family's voice;
  builders + applySuccession in qa.ts, pure-tested. RUNNING the full pass over all 84 files (bg, monitor
  bx7sngaub). ON DONE: verify every close scene has a succession-bearing decision + integrity intact;
  full gate; live-verify the fork advances a generation in Chrome; PR.

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

## ACTIVE milestone — NARRATIVE ACTS (the NOVEL) — branch `feat/narrative-acts`

Spec: docs/superpowers/specs/2026-06-21-narrative-acts-design.md. Memory: [[mmm-novel-acts-model]].
Mandate (user, verbatim spirit): the played content must read as NOVELS, not sentence fragments —
"immersive set of effectively novels… titled acts for each family and their possibilities in life
and intersections"; the OLD Epoch-0 is WRONG ("we ALREADY know when we are and where we are… you
were supposed to write STORIES"); "take it all the way… an hour or more of gameplay" (genai+author
no limit). Grounded in Suzerain + ink research. This SUPERSEDES the LIVED-IN-FEEL / authored-Epoch-0
direction (those re-confirmed known facts — the rejected approach). NOT a WAIT-USER item: the vision
is locked, execute autonomously, self-pace, own the full PR loop.

### Queue
- [x] **NA-1 model** — saga/schema (Act/Scene/Beat/Decision/Thread/Codex zod) + player
  (buildCorpus/applyBeat/applyDecision/nextScene/openingScene) + loader (loadSaga glob) +
  authored exemplar. (commit 14ed87c)
- [x] **NA-2 SceneReader** — Suzerain page: serif multi-paragraph prose, drop-letter, sense-tint,
  beats as alternatives, tiered decision; term-fn tokens; onbeat/ondecision. Browser-tested. (1c967df)
- [x] **NA-3 runner** — ActState walk (startAct/chooseBeat/chooseDecision); deterministic = save/replay
  invariant; beats are ALTERNATIVES. (8280fd5)
- [x] **NA-4 spine reframe** — retired Epoch-0 life-arc; scene-slot spine (titled acts, 5 sensory
  scenes, opening forbids re-stating when/where, major+secondary per act). (07f77a6)
- [x] **NA-5 genai scene mode** — `genai:expand --type scene` + `--all` lattice sweep; SagaFileSchema-
  gated; normalizeSceneFile coerces model drift; 3× retry on validation failure. (35bf80d/fix/retry)
- [x] **NA-6 engine cut-over** — Game drives SagaDriver (cell=wave×archetype×tier-from-generation),
  GameView.saga frame, PlayScreen renders SceneReader (fallback to EventCard when no act); GameStore
  +App wired. (7a46a34)
- [x] **NA-7 succession step** — DecisionOption.succession schema; driver/Game step the act to the next
  tier on a partner/heirs option. Model tests on a fixture (decoupled from generated corpus). (committed)
- [x] **NA-8 GenAI lattice sweep — DONE** (commit f82ed20). 252 acts, 1263 scenes; 0 leaks/dangling/
  fragments/when-where; all 42 cells complete across 6 tiers.
- [x] **NA-9 targeted regen** — regenerated the 6 cells that failed all 3 sweep attempts
  (bavaria:economic:t0, italian:political:t5, italian:entertainment:t0, ashkenazi_jewish:technological:t5,
  scandinavian:religious:t1, scandinavian:athletic:t5) — all ACCEPTED 1/1 (/tmp/regen.log). Commit with NA-10.
- [x] **NA-9 + NA-10 — DONE** (commit f82ed20). Regenerated the failed cells; pruned 3 orphan exemplar
  scenes; loadSaga integrity tests (no dangling/orphan + 252-act lattice coverage) added.
- [x] **NA-11 retire Epoch-0 — DONE** (commit a0ee9bb). Harness regression root-caused by
  stuck-loop-debugger (year-normalization was gated on the `epoch0` tag; retag to `life-stage`
  dropped it → begets stamped children ~70yr in the past → extinction). Fixed: normalization now
  fires for `epoch0`||`life-stage`; millennium run reaches interstellar; unit regression guard added.
  Done: deleted all 9 epoch0.json; deleted the 3 narrative
  ev_birth_* from new-york; retagged the 2 succession events epoch0→life-stage; content.ts
  epoch0Events→lifeStageEvents (dropped authoredEpoch0Places); events.ts injects lifeStageEvents;
  founding sets emerged/named/calling_chosen at founding (onboarding already locked them) so the
  surviving succession beats fire; rewrote ob6-all-origins (saga-act coverage) + dropped the
  onboardingFounding epoch0 suite. BLOCKER (dispatched stuck-loop-debugger): the millennium harness
  test now goes line-extinct ~2000 (era order 3-4) for all 18 — the leaner per-gen event pool no
  longer carries a line to era≥9. Awaiting root-cause + fix; do NOT re-pad with narrative beats.
- [x] **NA-12 live-verify — DONE** (chrome, localhost:4173). Played a founded Ireland/poor line:
  onboarding (period→class→wave w/ sensory cues→surname MacCarthy) → PLAY renders the NOVEL: titled
  "Act I — The Crossing" with chapter drop-letter, multi-paragraph SMELL-framed prose ("the stench of
  salt… the phantom scent of the churning Atlantic still invaded Siobhan MacCarthy's nostrils"), {surname}
  token resolved, given-name generated, NO when/where re-confirm. Weave = 2 alternative beats (italic
  framing + choice); picking one ADVANCES to the next sensory (touch) scene. HUD shows Convergence/1885 +
  motivators + news backdrop. 0 app console errors (only a benign chrome-extension artifact). Reads as a
  NOVEL exactly per the mandate.
- [x] **NA-13 cross-family intersections (threads)** — resolveThreads(corpus,scene) resolves a
  scene's ThreadRef[] to the rival wave's act-opening fragment (archetype-agnostic; dead ref → no
  fire); SagaFrame.threads + PlayScreen "Elsewhere — another line" braided aside. Unit + browser
  green. (committed) — authoring thread refs INTO the corpus is a content step (genai/author) post-sweep.
- [x] **NA-14 PR + merge — DONE.** PR #65 squash-MERGED to main 2026-06-22 (commit 35b80f5), branch
  deleted. CI green (build-and-test + Analyze + CodeRabbit), 0 unresolved threads, mergeStateStatus
  CLEAN. First CI was RED (e2e on old EventCard selector + run never ended on the saga surface) →
  fixed (87a03f3): saga picks advance the run clock + resume event flow on act-end; e2e drives the
  SceneReader. Post-merge Release + CD green (Monitor b58fk15pv confirming the final main runs).

**🎉 NARRATIVE ACTS (the NOVEL) milestone COMPLETE** (NA-1…NA-14, PR #65). The played content is now
titled-act NOVELS: 252 acts / 1263 sensory multi-paragraph scenes across all 7 waves × 6 archetypes ×
6 tiers; SceneReader (Suzerain page); deterministic runner; scene-slot spine; GenAI scene authoring;
engine cut-over (saga drives play, advances the run clock, succession steps generations); cross-family
thread intersections; Epoch-0 narrative retired (succession mechanic kept). 0 leaks; full gate + post-
merge workflows green; live-verified in Chrome.

After NA-14 merges, RETURN to the standing autonomous POLISH & FEATURES mandate (top of file):
self-pace the highest-value improvement, own the full PR loop, keep the directive living.

## POLISH milestone (post-narrative-acts, autonomous)

**ONE long-running branch `feat/saga-polish`** holds ALL polish work (no parallel-branch juggling —
USER directive 2026-06-22). Layer PF-2/PF-3/… as forward commits here; open ONE PR at the end.

- [x] **PF-1 activate cross-family intersections — DONE + MERGED (PR #68).** buildCorpus weaves each
  act's midpoint thread to a sibling wave at the same tier; resolveThreads + PlayScreen aside render it.

- [~] **PF-2 class in the saga cell + middle-class corpus** (on feat/saga-polish).
  (a)+(b) DONE (commit ce77a2f): act id `act:<wave>:<archetype>:<cls>:t<tier>`, file
  `<wave>/<archetype>.<cls>.act.json`; ActChapter.cls (default "poor"); spine/scene-gen/loader/driver
  class-aware; actsForTier falls back to "poor"; driver derives the track from Wealth
  (sagaClassForWealth: climb → middle); migrated 42 files → `.poor.act.json`. 609 unit + gate green.
  (c) [WAIT] middle sweep `--all --cls middle --write` IN PROGRESS (bg beo7mfy8q, /tmp/sweep-middle.log).
  ON DONE: verify health (0 leaks/dangling, 252 middle acts), regen failures, commit on this branch.

- [~] **PF-3 reader UX overhaul (USER, 2026-06-22)** (on feat/saga-polish) — the play surface wastes
  space: huge top HUD band of centrist motivators/meters; too much text per page; unwieldy buttons.
  Redesign (Suzerain-style paged prose):
  1. HUD: ONLY the act-chapter (meso) headline + year stay always-visible (slim strip). Meters, 8
     motivators, utopia–tyranny axis, in-game settings → slide-out menu from a TOP-RIGHT hamburger.
  2. Prose: ONE paragraph at a time; tap ANYWHERE → next (paged, NOT a growing scroll stack).
  3. Options folded INTO the story: ≥1 choice → render option(s) as GLOWING PULSING text, bigger than
     body, no buttons. Choice-less paragraph = tap anywhere → next. With options: tapping a non-option
     area makes options PULSE FASTER (don't advance) to say "pick one".
  4. Goal: more story presentation area, more focus on options.
  5. SCOPE HIERARCHY (USER): MACRO (Convergence/Emergence/Ascension) = focus of a ~100-YEAR span, NOT
     the act title — show it as subtle context. ACT title = MESO, a SPECIFIC chapter of THIS family's
     story (GenAI authors a distinct per-act title; spine's "The Crossing"/etc become prompt-seed/
     fallback). CHOICES + their impact (opposing/orthogonal lines) = MICRO.
  Touches SceneReader.svelte + PlayScreen.svelte (HUD/menu) + spine/scene-gen (author act titles).
  Mobile-first; browser-test paged reveal + pulse-on-tap-away + menu + distinct titles; live-verify Chrome.
  STATUS: items 1-4 DONE + LIVE-VERIFIED in Chrome (commits 1410794 paged SceneReader, e91be71 slim
  header + SlideOutMenu). Item 5: scene-gen now authors distinct titles (committed); retitle tooling +
  tests committed; [WAIT] the retitle RUN over the corpus waits for the middle sweep to finish (file-
  write race + must cover both tracks). 11 genai + 86 browser + 7 e2e + 609 unit green.

- [x] **PF-4 dominant-pole deadzone fix — DONE** (live-verify catch). A near-zero wealth made the
  SagaPanel headline say "A poor line" while the strip said "centrist"; shared CENTRIST_DEADZONE(12)
  now governs both dominantMotivator + axisLabel. Unit-tested. 613 unit green.

### GAP-CLOSURE QUEUE — work contiguously through ALL of this (USER, 2026-06-22)

Full audit of remaining / incomplete / partially-wired / dead-but-built. Do them IN ORDER on
feat/saga-polish; each is a forward commit + reviewer trio; one PR at the end. Don't stop between items.

- [x] **PF-5 middle-class corpus COMPLETE — DONE** (corpus commit on feat/saga-polish). The whole
  corpus is now generated on **gemini-3.5-flash** (was a stale 2.5-flash default — user caught it):
  252 poor + 252 middle = 504 acts / 2520 scenes, 0 leaks, 0 dangling refs, every cell 6 tiers.
  Filled the missing chinese/baghdad cells + 11 individually-failed tier-acts; loadSaga now asserts
  BOTH tracks complete (504) + per-cell tier completeness. HARDENED the gen gate: validateSceneFile
  enforces scene-ref integrity (caught the model dropping/mis-naming scenes — a defect shape+leak
  validation missed). See [[mmm-scoped-qa-pipeline]].

- [x] **PF-18 SCOPE-DELINEATED QA SWEEP — DONE** (spec 2026-06-22; feat/saga-polish). User directive:
  QA delineated by IMPACT SCOPE, fix the whole affected unit. New src/sim/genai/qa.ts + scripts/
  genai-qa.ts; leak floor false positives fixed + extracted to shared src/sim/leak.ts. All three scopes
  ran over the whole 504-act corpus on 3.5-flash: (a) scene polish — 504 acts lifted, 0 kept-on-fail;
  (b) lineage continuity — 80/84 chains had cross-tier breaks, all re-authored, 0 rejected; (c) braid —
  504 pair-specific cross-storyline crossings authored into midpoint thread[] (weaveThreads honors),
  0 rejected. Final corpus: 504 acts / 2520 scenes / 0 dangling / 0 leaks / 0 backtick artifacts; 641
  unit tests green, biome clean. KNOWN-COST FOLLOWUP (optional): pool passBraid like scene/lineage (it's
  serial) for ~4× speedup. See [[mmm-scoped-qa-pipeline]].

- [x] **PF-6 ROOT GAP: class threaded through onboarding → founding — DONE** (commit 4b0318e). The
  chosen ArrivalClass now flows OnboardingScreen.onComplete → App.birthGame → resolveWaveStart(place,
  cls) → seedMotivators, so poor vs middle found with different wealth + the saga driver picks the
  right track. resolveWaveStart returns the resolved cls. e2e updated for the PF-3 paged reader/HUD
  (saga-head signal + advancePlay paging). waveSelect test pins the override. (Live-verify of poor-vs-
  middle divergence folds into PF-13's full run.)

- [x] **PF-7 WIRE THE DEAD CONVERGENCE LAYER — DONE** (commits 4e6fce1 glimpses, 010602e endings).
  Game creates + advances a DynastyWorld (separate rng stream, replay bit-identical); GameView.glimpses
  + rung feed projectSaga → SagaPanel "Other lines" + class readout populate; Game.convergenceEnding()
  resolves the dynastic destination at run-end (tier + motivators + rivalsReachedStars) → GameView.
  convergence → LegacyReport framing. Unit-tested + deterministic. (Live-verify folds into PF-13.)

- [x] **PF-8 saga succession drives REAL family advancement — DONE** (commit ecd42ca). Extracted the mortality/succeed/continue-as-heir block from applyChoice into pure exported advanceFamily(content,state,fromYear,rng); applyChoice + the saga advanceRunClock both call it (separate rng stream, replay-safe). Reading the novel now ages + succeeds the line. Event path unchanged (18 tests); saga-driven run advances year + deterministic.

- [x] **PF-9 act titles: retitle pass — DONE** (committed). Replaced the 6 reused spine cues with per-act
  meso titles rooted in each act's opening prose: 163 → 496 distinct of 504, 0 dangling, 0 leaks. Caught
  + fixed a real bug — the model returned 254 titles wrapped in JSON ({"title":"…"}) that shipped raw;
  repaired all on disk + hardened normalizeTitle to unwrap JSON at the source (tested). The 8 remaining
  near-dupes are acceptable cross-family echoes. Live-verify folds into PF-13.

- [x] **PF-10 cross-family intersection PROSE — DONE** (commit 465043c). Each woven midpoint thread carries a PAIR-SPECIFIC crossing line (crossingLine names both peoples, deterministic); ThreadRef.crossing optional override; PlayScreen renders "Where paths cross" + the line + the rival fragment. Unit + browser green. (A fuller per-pair GenAI crossing corpus can ride a future sweep; the deterministic named crossing ships now.)

- [x] **PF-11 Codex — DONE** (commit b91dcc1). Authored src/data/saga/codex/codex.json (7 waves + 3 macro-acts, leak-free) + CodexView (collapse/expand) in the slide-out menu. loadCodex + CodexView tests green. (Live-verify folds into PF-13.)

- [~] **PF-12 docs + STATE refresh.** docs/STATE.md refreshed for the novel model + PF-3 play surface +
  gap list (commit, PF-12 docs done). CHANGELOG is release-please-managed (already current — do NOT
  hand-edit). REMAINING: a final docs pass in PF-13 once PF-7/8/11 land (update the "still being wired"
  list as gaps close).

- [x] **PF-13 final pass: gate + live-verify + PR + merge — DONE.** GATE GREEN: typecheck + biome + 642
  unit + 89 browser + 7 e2e + build all pass. LIVE-VERIFY DONE (Chrome, screenshots READ): poor Italian
  line founded → diegetic onboarding → distinct meso title "Between Salt and Iron" (not the generic cue) →
  QA-lifted sensory steerage prose → paged reader advances → inline GLOWING options fold into the story →
  slide-out "THE LINE" menu (8 motivators, OTHER LINES glimpses, codex, meters, personality) → multi-gen
  play → convergence-aware LegacyReport ("Toppled", muddled middle, House of Romano stats). All PF
  surfaces confirmed working with the QA'd corpus. PR #70 OPENED (jbcom/dynasty, feat/saga-polish → main).
  CI went green first pass; addressed 4 CodeRabbit threads in a forward commit (unhandled promise in
  sound.start(), urge-timer unmount leak in SceneReader, empty-acts guard ×2 in genai-qa) — all 4
  resolved. CI green on the fix commit; **SQUASH-MERGED as PR #70** (commit 4ccb8fa). Post-merge
  workflows on main all GREEN: CD ✓, Release ✓, CodeQL ✓. Milestone shipped + deployed clean.

### DEEPER GAP AUDIT (2026-06-22, round 2) — more partial/unwired surfaces, do contiguously

- [x] **PF-14 saga choices' setFlags reach state.flags — DONE** (commit 34bd669). syncSagaFlags unions the driver flags into state.flags on each pick (append-new, replay-safe). Unit-tested.
- [x] **PF-15 AUDIO wired — DONE** (commit 8d3bbf6). src/ui/sound.ts singleton plays click on page-turn + stinger on choice, gated by a new Sound setting (default on); SettingsScreen toggle. Settings + tests green.
- [x] **PF-16 audit pass — DONE.** Round-2 audit findings: (a) ambient MUSIC unwired → PF-17 below;
  (b) axes/worldStacks have 0 direct engine/ui importers but are sim-internal (used transitively) — NOT
  dead; (c) shader backdrop is live (PlayScreen renders it per macroAct); (d) Sfx now wired (PF-15).

- [x] **PF-17 ambient MUSIC — DONE** (commit e3dce65). AudioEngine starts on first reader tap (autoplay-safe); setMusicEra crossfades the bed per era; gated by the Sound setting; browser-guarded + tested.

After all PF items merge, return to the standing autonomous polish mandate (top of file) for the next gap.

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

**COMPLETE + MERGED — all 16 tasks [x]; PR #62 squash-merged to main (66ee633).**
586 unit + 78 browser + 7 e2e green; 0 leaks; hour+ acceptance; live-verified in Chrome. CI e2e
fix folded in (ShaderBackdrop renders a static frame under automation/no-GPU); review threads (15)
resolved (the {family_name} 'double-the' was a false positive; bare-noun usages → {surname}).

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
- [x] SS-13 bridge exposes macro-act/rung/motivators/act-chapter/glimpses; pure; tests
### SS-14 UI novel presentation
- [x] SS-14 acts/chapters + motivators + rung + glimpses + register shift; mobile-first; browser tests; live-verified.
  USER STEER (2026-06-21): a MUCH more polished use of Svelte — incl. SHADERS (WebGL/GLSL for
  atmospheric backdrops/transitions per era register) — and significantly BETTER ORGANIZATION of
  the whole UI layer (clean component architecture, not a thin port of the old HUD). A real UI
  rebuild, not a reskin. Keep luxury "Dynasty" tokens + real-2D-asset icons
  ([[dynasty-ui-conventions]]); mid-tier render budget ([[mobile-android]]). Live-verify via
  chrome-devtools-mcp OR the claude-for-safari skill OR claude-in-chrome (whichever is free).
### SS-15 Determinism + acceptance gate
- [x] SS-15 full playthrough hour+ beat count, bit-identical replay incl all lines, 0 leaks, harness 0-findings; remove ALL dead old-model code; full gate green
### SS-16 Docs + PR
- [x] SS-16 STATE.md+ARCHITECTURE.md updated; PR opened; CI green; post-merge Release/CD green
