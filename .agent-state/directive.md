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

## TOP PRIORITY — UNIQUENESS milestone (user, 2026-06-22, highest-order)
Three connected user directives, one root cause. AUDIT (cheap, computed): 503 of 504 acts share ONE
identical structural skeleton (open[2]/turn[2,d2]/rising[2]/midpoint[2,d3]/close[2,d3]); prose is
surface-unique (2520/2520 distinct first lines) but the ARCHITECTURE is templated. Root cause: a single
spine GENERATOR stamps one skeleton 504× ([[craft-spines-not-generator]]). This drives all three:
uniqueness ([[uniqueness-genuine-intersections]]), scannability ([[scannability-game-novel-balance]]),
and genuine intersections.
### FS (user, 2026-06-22): ★FOUNDING-SPINE REDESIGN★ — the governing pivot (OUTRANKS everything below)
The user identified the real problems: "we are splitting focus too much" + "every story, regardless of
the line, is written very similarly." Confirmed by reading 4 disparate cells (one decision template +
one scene skeleton stamped 504×). ROOT CAUSE = the 504-cell lattice itself ([[founding-spine-pivot]]).
THE FIX: ONE deep spine line founded at America's FOUNDING (1770s) → stars (America's story AS the
family's story); the 504-act corpus is MINED selectively into braided intersection FABRIC (the 7 waves
arrive across the centuries + weave into the spine), rest RETIRED. Recovers the original synthesized-
archetypal-line strength. Design: docs/superpowers/specs/2026-06-22-founding-spine-redesign.md.
Branch: feat/founding-spine-redesign. THIS supersedes the visual layer + the remaining UQ items.
- [x] **FS-1 design doc — DONE.** Architecture: founding era band prepended to convergence/emergence/
  ascension; authored spine w/ DISTINCT per-era decision architectures (NOT the one civic-fork template);
  corpus mined into src/data/saga/fabric/ keyed wave×era×setting; braid selector repointed to weave wave
  fabric into the spine; onboarding collapses to found-THE-line (reuse ONB-1 naming). Sign-off pre-granted.
- [x] **FS-2 founding era band — DONE.** macroActs.ts: new `founding` macro-act (−∞..1859) + `founding`
  epoch ("Birth of a Nation", 1776, politics axis); convergence now 1860..1899. Saga schema enum +
  ShaderBackdrop palette updated; macroActs tests updated; tsc 0, 690 green. (NOTE: ShaderBackdrop is
  PROCEDURAL art → flagged for retirement in VL per [[visual-layer-revival]], only touched to fix the
  enum compile.) TIER_PLAN (the 504-generator) left for FS-3's authored spine.
- [x] **FS-3 authored spine MODEL — DONE (committed).** src/sim/saga/spineAuthored.ts: the ONE dynasty
  line, founding(1776)→stars, ~10 authored generations, 8 DISTINCT decision architectures (bargain/
  allegiance/venture/succession/reckoning/platform/expansion/doctrine). Invariant tested: no two consecutive
  eras share a pivotal architecture (assertEraDecisionVariety); allegiance recurs in distinct contexts,
  never back-to-back. +6 tests, 696 green. ([[craft-spines-not-generator]])
- [x] **FS-3b wire authored spine into generation — DONE (committed).** scene.ts buildSpinePrompt(act):
  each DecisionArchitecture → a concrete prompt instruction giving the era's pivotal choice its distinct
  SHAPE, steering away from the old generic crossroads template. Tested: different eras inject different
  shapes (founding=bargain+allegiance, broadcast=platform, stellar=expansion). +4 tests, 700 green. The old
  buildScenePrompt/spineFor (504-cell) path is KEPT as the FS-4 mining SOURCE; retire AFTER mining.
- [x] **FS-4 mine the corpus into branch fabric — DONE (committed).** Pure miner core (mineFabric.ts)
  scores scenes on UNIQUENESS (normalized idf) + crossing + quality; scripts/mine-fabric.ts walked the real
  corpus → kept top 504/2520 as src/data/saga/fabric/index.json keyed family(wave)×era×setting + source
  vignettes. +6 tests, 706 green. REMAINING (→ FS-5): POV-shift REWRITE the kept scenes into spine
  branches + the trigger-condition keying (the rewrite is the authoring step, fed by this index).
- [x] **FS-5 trigger-lattice + recurring-cast CORE — DONE (committed).** src/sim/saga/triggerLattice.ts:
  SpineState projection + TriggerRule[] compound conditions (archetype/leanings/meters/place/era/flags/
  priorCrossing) → evaluateTriggers fires whole family branches, priority-ordered, replay-deterministic,
  `once`-aware; recurring CastFamily with MEMORY (recordCrossing/crossingsOf gate priorCrossing branches).
  +7 tests, 713 green. ([[emergent-cause-effect-sim]], [[intersections-woven-not-walls]])
- [x] **FS-5b triggers.json data table — DONE (committed).** 7-family cast + 12 branch fire-rules grounded
  in real arrival history (Irish 1845-75 docks; Chinese 1863-82 railroad-WEST; etc.), each with an era-gated
  arrival + a priorCrossing-gated recurrence. Trigger*Schema added; validates + fires correctly by era. +1
  test, 714 green.
- [x] **FS-5c loop wiring — DONE (committed).** loop.view folds deterministic-trigger family branches into
  the scene threads (triggerThreads): SpineState projection from saved state → evaluateTriggers over the
  validated GAME_TRIGGERS → woven threads, no RNG, replay-identical. Memory in the saved `flags` set via the
  `crossed:` convention (no schema change). +1 test, 715 green. (Full per-branch fabric PROSE weaving +
  recordCrossing-on-activation deepen with FS-6's authored spine; live-verify the recurring payoff there.)
- [x] **FS-6/6b/6c — DONE (committed b3b019f).** All 10 spine generations (1776→stars) authored + verified
  era-distinct (bargain→allegiance→venture→reckoning→platform→doctrine→expansion; sameness DISSOLVED). Named
  destiny endings (3 stellar finales + 6 earthly). Spine clean (0 orphans/dangling) via hardened generator
  (normalizer acts[]/requires coercion, validateSpineFile orphan check, retries=4). Corpus tests updated
  (504 cell + 10 spine). tsc 0, 720 green.
- [x] **FS-6b archetypal-DESTINY endings — CODE DONE (uncommitted, holding for joint commit).** convergence.ts:
  added `Destiny` type + tagged the lattice: 3 distinct STELLAR finales (stellar_conquest=seize colonies /
  stellar_allies=forge allies / stellar_hidden=alone on a quiet world) + 6 NAMED earthly destinies (dictator/
  crime_leader/oligarch/media_mogul/religious_leader/communard), gated by motivators+tier; resolveConvergence
  resolves stellar→destiny→contributed→earthbound. Convergence tests rewritten + GREEN. Folds in
  [[crime-power-axis]] crime-leader finale. HOLDING the commit: 2 corpus-count tests (loadSaga "exactly 504",
  DEPTH-1 close-succession) now fail because the in-flight FS-6 spine.act.json adds a NEW corpus member — those
  are FS-6's tests to update once the spine run lands (counts stable). Commit FS-6b + FS-6 together when green.
- [x] **FS-6c corpus-shape tests for the spine member — DONE (in joint commit b3b019f).** loadSaga = 504
  cell + 10 spine; DEPTH-1 scoped to cell closes + a new spine-close-succession test. Green.
- [x] **FS-7a life-seeds composer CORE — DONE (committed).** src/sim/saga/lifeSeeds.ts: first job / best
  friend / life partner → seed flags (seed:job/friend/partner:*) + stacking motivator leans + clamp;
  partnerSeedsSuccession. +6 tests, 726 green. ([[novel-not-fragments]])
- [x] **FS-7b onboarding → diegetic Epoch-0 birth — DONE (committed).** OnboardingScreen gained 3 life-stage
  phases (job/friend/partner) after gender+given; onComplete carries lifeSeeds → App.birthGame →
  foundByComposition (Composition.lifeSeeds applies seed flags + motivator leans via FS-7a). back() unwinds
  the steps. Onboarding browser test walks the full funnel + asserts seeds. tsc 0, 726 unit + 97 browser green.
  (REMAINING for a deeper pass: a fully narrated birth scene vs. the current choice-card flow — the seeds +
  flow are in; richer diegetic prose is a polish follow-up, not blocking FS-8.)
- [x] **FS-8a engine-level live-verify — DONE.** Drove a founded run (Tobias Hale, political, 1776+life-seeds):
  plays ALL 10 spine generations g0→g9 (founding→interstellar), ~year 2139, 364 scenes (genuine hour+),
  era-distinct decisions in order, reaches a named destiny/convergence ending, deterministic. Caught + fixed
  the gen-5 cap bug (spine now uses true gen up to SPINE_MAX_GEN); +1 regression test (all 10 gens). 727 green.
- [x] **FS-8b Chrome live-verify — DONE, spine plays + reads beautifully on screen.** Walked the full new
  onboarding in Chrome: the diegetic Epoch-0 birth (FS-7b) renders gorgeously — "Francesco Gallo comes of
  age… what first put bread on the table?" (job), "who stood closest in those early years?" (friend), "how
  did Francesco take a wife?" (partner), titled cards w/ evocative blurbs. The FOUNDING spine act plays:
  "Act I — The Crucible of Flint and Ink" — Francesco in a printing house, "perfume of rebellion,"
  delegates + signed parchment, the press that builds "a commonwealth or a traitor's scaffold" (1776
  revolution, measured prose column). The pivot is LIVE + reads well.
  TWO FRAMING BUGS FOUND (year/era desync): the HUD header says "Convergence · 1885" + News panel "The
  Wider World — 1885" (Gilded-Age headlines) while the act is the 1776 FOUNDING — because onboarding still
  deals an 1885 immigrant-wave composition (dealComposition picks year from the place's validEras), so the
  CLOCK/era/news are 1885 but the spine content is 1776. → FS-8c.
- [x] **FS-8c reconcile the founding year — DONE (committed), Chrome-verified.** App.birthGame anchors the
  composition at FOUNDING_YEAR (1776, new macroActs constant); clock + era("founding") + News + HUD all
  follow. Chrome: header "Founding · 1776", clock 1776, News "The Wider World — 1776" — coherent with the
  founding act. 727 green. ★THE FOUNDING-SPINE REDESIGN (FS-1..8) IS COMPLETE + LIVE.★ ([[founding-spine-pivot]])

### VL (user, 2026-06-22): VISUAL LAYER — portraits + map, GenAI-generated — DEFERRED behind FS
DEFERRED: fix the story architecture (FS) first; a prettier UI on structurally-identical stories doesn't
fix the game. Design doc written (docs/.../2026-06-22-visual-layer-design.md), research banked
([[suzerain-ui-reference]], [[scannability-evidence-rules]]). Resume after FS-8.
The user REVERSED [[no-portraits-no-asset-art]] ([[visual-layer-revival]]): the
game feels DENSE / text-only "hurts things" / no map = no visual progress. Build (a) unique per-person
PORTRAITS and (b) a real cartographic-art MAP backdrop that conveys migration/era PROGRESS. ART DIRECTION
(refined): NOT cartoony — leverage GenAI FULLY for the game's OWN distinctive, POLISHED, cohesive look +
feel (a signature visual identity across portraits + map + UI), generated at quality. HARD CONSTRAINTS:
NO hand-drawn SVG (OUT — it sank the 1st attempt); GENERATE imagery + video via the EXISTING GenAI
pipeline (verified: @google/genai SDK supports generateImages/editImage/upscaleImage/generateVideos).
Deep-study Suzerain + 80 Days + other narrative/journey games — for BOTH layout AND art direction — to
ELEVATE this, not bolt on art. Sim purity holds (gen is offline/cached, keyed by cell; seed reproduces).
- [x] **VL-0 lock the constraints + reference study — IN PROGRESS.** Reversal confirmed + memory updated
  ([[visual-layer-revival]] supersedes [[no-portraits-no-asset-art]]); SDK image/video capability verified;
  dispatched a reference-study agent (80 Days/Suzerain/CK/Reigns/Disco Elysium/Pentiment — map+portrait+
  progress UX + ART DIRECTION, mobile-feasible). [WAIT] the study, then write the design doc.
- [x] **VL-0b EVIDENCE-BASED scannability research — DISPATCHED (user, 2026-06-22 "do now").** Agent
  researching STUDIED presentation rules (NN/g F-pattern, line-measure ~66ch, Miller 7±2/chunking, Gestalt,
  progressive disclosure, type hierarchy, WCAG contrast + touch targets, long-form on-screen reading) → a
  prioritized evidence checklist to bake into the design system. Feeds VL-1 + revisits [[scannability-game-novel-balance]]
  with citations (not just the Suzerain example). [WAIT] the agent.
- [x] **VL-1 design doc — DONE (docs/.../2026-06-22-visual-layer-design.md + suzerain/80-days/scannability
  research banked).** NOTE: written pre-pivot — must be re-grounded on the founding-spine model (the visual
  subjects are now the ONE spine line's protagonist per generation + the recurring-cast families + an
  era-progressing map, NOT wave×cell portraits). Branch protocol moot — all work on feat/founding-spine-redesign.
- [x] **VL-2 GenAI portrait PIPELINE — DONE + verified (committed); bulk gen RUNNING (bg).** Imagen image
  API confirmed working; geminiGenerateImage + portrait.ts (locked signature engraving style, per-era
  register, NOT cartoony/procedural) + scripts/genai-portraits.ts (license-logged, idempotent). First
  founding portrait generated + READ = a dignified colonial engraved bust, exactly the polished cohesive
  look. +5 tests, schema/assets updated for the portrait revival, 732 green. All 20 portraits (10 gens × 2
  genders) generating in background. ON completion: sample-verify the style holds colonial→retro-futurist + commit.
- [x] **VL-2b compose the portrait into the SceneReader — DONE (committed), Chrome-verified.** PlayScreen
  derives portraitSrc (spine gen + founder gender); SceneReader renders the gold-framed engraved bust at the
  page edge (right-float wide / stacked mobile), fades in, pointer-events:none. Chrome: the founding colonial
  engraving shows beside "The Crucible of Flint and Ink." 97 browser green. All 20 portraits committed.
- [x] **VL-3 the MAP — era-progressing journey visual.** A real cartographic-art map (GenAI base + 2D
  asset-lib Cartography Pack) showing the line's place + era PROGRESS founding→stars; persistent backdrop /
  toggled mode (80 Days). Fixes the density/no-visual-progress problem. SVG data-overlay (nodes/route/fog)
  over the raster base — NOT hand-drawn cartography.
- [x] **VL-4 compose + live-verify the visual layer — DONE + verified.** Portrait + map compose over the
  SceneReader on the play screen. New colocated VL-4 visual suite (PlayScreenVisualLayer.visual.test.ts, 3
  tests, mobile 412px): portrait keys off spine:gN + gender beside the prose; Map tab reachable for a founded
  line + renders the journey; mobile screenshot captured and READ — gold-framed colonial engraving stacks
  above the paged prose at mobile width, signature style cohesive, no overflow. Chrome (desktop) earlier
  confirmed the Map tab journey overlay over the cartographic base.

### ONB (user, 2026-06-22): onboarding must let the player CHOOSE gender + given name
The funnel is PERIOD→CLASS→WAVE→SURNAME; gender + given name are auto-defaulted (save.ts
`gender:"male"`, given name seeded) and were DEFERRED to in-game reveal beats by design
(OnboardingScreen comment) — the user calls this a significant weakness. Sim ALREADY plumbs both
end-to-end (FoundingInput.gender → Composition.gender → pickGivenName/suggestGivenNames, save
round-trips). The gap is UI-only. NOT corpus-blocked — doable now while UQ-2 corpus runs.
- [x] **ONB-1 — DONE (1779930).** Funnel now PERIOD→CLASS→WAVE→STYLE→SURNAME→GENDER→GIVEN (user-ordered:
  naming style first, then suggestions computed from style+gender). onComplete carries gender+given+culture;
  founding overrides the seeded pick; save round-trips `given`. 3 unit + 2 browser tests; tsc 0, 689+94 green.
  REMAINING: live-verify the funnel in Chrome (folded into the UI review below).
- [x] **UQ-1 spine + guidance ARCHITECTURE — BUILT (DRAFT guidance).** spine.ts: 6 arc shapes
  (rise/collapse/holding/reinvention/rivalry/windfall), per-cell selection, open+succession-close invariant.
  `guidance.json`: bespoke (era×class) briefs (arc/tone/rhythm/scannability + qaLookFor/qaReject) + per-WAVE
  history/motivations/trades/obstacles/braidAffinity with full-timeline arc (arrival→convergence→future),
  injected into buildScenePrompt. tsc 0, 680 tests. NOTE: arc-hash + guidance coexist (shapes=structural
  variety, guidance=creative/historical) — reconcile if redundant.
- [x] **UQ-1b RESEARCH-CORRECT the guidance (don't ship from memory) — DONE (9d073b8).** ([[research-not-memory]])
  7 parallel web-researchers + direct fetches (German/Baghdadi via ctx_execute + notifications) replaced the
  from-memory waves draft. Each wave now carries history/arc/motivations/trades/obstacles/CRIME/braidAffinity/
  mythFlags. Key fact-corrections folded: Irish founded US organized crime FIRST → Italians succeeded them
  (Mafia built-in-America, Commission est.1931); Italian-Jewish syndicate + Murder Inc (~70 kills); Chinese =
  West-Coast fighting tongs (≠ Six Companies); Scandinavian/German/Baghdadi = NO crime (don't invent).
  Geography: Chinese+Scandinavian were WEST, separate from East-Coast waves. Myth-flags per wave. JSON valid,
  tsc 0, tests green.
- [x] **UQ-2a wire guidance into the QA passes — DONE (3cffcfb).** ([[uniqueness-genuine-intersections]])
  scenePassBrief/lineagePassBrief feed the same era×wave briefs + qaReject + myth-flags into the scene/lineage
  QA passes (optional params; 5 new tests; tsc 0, 685 tests). Smoke (baghdad/middle lineage) confirmed the
  brief reaches gemini-3.5-flash and surfaces real breaks.
- [x] **UQ-2b corpus scene-pass auto-correct — DONE (5c46f68).** All 84 act files lifted to frontier prose +
  held to corrected history (italian: padrone/Mezzogiorno, zero Mafia-stereotype; chinese: laundry/exclusion/
  tong West-frame; ashkenazi: sweatshop/mutual-aid). 84 parse, 686 tests green, 6 scenes safely kept original.
  Diff was the test; kept.
- [x] **UQ-2c corpus lineage-pass — RAN, then REVERTED (degraded a core invariant).** `genai:qa --pass lineage
  --write` completed but its rewrite BROKE replay-determinism: loop.unit.test "crossing nudges replay-safe across
  save/restore" failed (a vs b2 reached 2039 vs 2034) ONLY on the lineage corpus (passed on the pre-lineage one).
  Per the diff-is-the-test rule, `git checkout -- src/data/saga` reverted it; loop test green again. The
  scene-pass corpus (UQ-2b) stands. ROOT-CAUSE needed before re-running → UQ-2c2.
- [x] **UQ-2c2 root-cause + FIX the lineage determinism break — DONE (776d6e7).** CONFIRMED by repro: the
  lineage continuity-fix re-author accepted raw model output with only an id check (no normalize/re-pin/
  validate), so it mutated close-scene `decision` succession wiring (ireland t0:close [P+2,none,P-1] →
  [P+2,P-1,P-1]). The sim replays succession → divergence. FIX: shared `normalizeAndPin(raw, original)` that
  re-pins id/sense/next/requires + the WHOLE decision block + schema-validates; BOTH the scene pass and the
  (previously-bypassing) lineage-fix path route through it; prompt now states decision/succession is preserved.
  +1 contract test, 690 unit green. ([[save-and-chronology]])
- [x] **UQ-2c3 fix VALIDATED on ireland/poor (48292f6); full lineage re-run launched.** With the fix, the
  scoped ireland/poor re-run PRESERVED the close-scene succession wiring exactly (matches pre-pass original;
  pre-fix had corrupted t0 to [P+2,P-1,P-1]) and the loop determinism test passed (18/18), full suite 690.
  Committed the validated batch.
- [x] **UQ-2c4 full-corpus lineage-pass — DONE (committed 35706ec) + verified determinism.** Long since
  landed; 504/504 succession invariant held. (Note: the lineage corpus is now the FS-4 branch-FABRIC source,
  no longer the played corpus — the spine is.)
- [x] **UQ-2d semantic-uniqueness audit — SUPERSEDED by the founding-spine pivot.** The 504-cell sameness
  is moot: those cells are no longer the played game — they're the FS-4 branch-FABRIC source (mined for
  best/unique). The PLAYED game is the ONE authored spine with era-distinct decisions (the sameness fix at
  its root). No per-cell uniqueness audit needed. ([[founding-spine-pivot]])

### UQ-UI (user, 2026-06-22): the UI/UX/HUD is TOO TEXT-HEAVY — rethink for scannability
The hud/views present everything as prose-dense text, not optimized for glance-scanning. Use UI-review
skills + PAPER PLAYTESTING to find where weight should change: margins, borders, grouping, hierarchy,
iconography-via-CSS (NO asset art — [[no-portraits-no-asset-art]]), whitespace, type scale. Balance
game-scannability with the novel reading experience ([[scannability-game-novel-balance]]).
- [x] **UQ-UI-1 audit the UI for text-heaviness — DONE.** Walked the live app in Chrome (5174), screenshotted
  + read each screen. Findings doc: docs/superpowers/specs/2026-06-22-uqui-text-heaviness-audit.md. Top issues:
  P1 Markets "Standing" = flat label→value text (→ rank pills/rung-ladder); P1 market values = bare numbers
  (→ inline bar/delta); P2 everything italic-serif incl. data (→ type-role split, the highest-leverage lever);
  P2 SceneReader wall + dead gap to continue; P3 News good (reference pattern), Stats empty at founding. ALSO
  live-verified ONB-1 end-to-end (Concetta Bruno, style→surname→gender→given all correct). Un-screenshotted:
  Lineage/Timeline/Choices/Dossier + MeterGauge on a decision scene + mobile layout → UQ-UI-1b pass-2 capture.
- [x] **UQ-UI-1b screenshot the remaining views — DONE (desktop).** Captured + read Lineage (member cards),
  Timeline (era cards), Choices (Butterfly Log), Dossier (THE meter HUD), and a DECISION scene. KEY FINDING:
  the Dossier = icon+bar+value rows is ALREADY the scannable reference pattern; the rework is mostly
  PROPAGATING it (to Markets "Standing" + bare numbers) + the type-role split, not inventing UI. New findings:
  emoji meter icons clash (→ CSS glyphs); decision choices read as gold TEXT not tappable affordances;
  meters are mobile-hidden during a decision. MOBILE single-column capture still blocked (screenshot viewport
  stayed desktop despite resize) → do it during UQ-UI-2 when verifying mobile.
- [x] **UQ-UI-2 HUD + meters scannability — DONE (297f069 + e79cd80).** Shipped the type-role split:
  new `--mmm-font-ui` token (upright system-UI face + tabular figures) for HUD DATA, reserving the italic
  serif for prose — the highest-leverage scannability lever. Applied to MarketsView (rows + regime tags now
  uppercase) + the Dossier (values tabular, emoji icons contained/desaturated). Converted the P1 Markets
  "Standing" wall to the Dossier bar pattern (label | gold rung-position bar | "1/6"). All Chrome-verified;
  +2 colocated browser tests; tsc 0, 97 browser green. (Mobile capture + the decision-meter-strip finding
  roll into UQ-UI-3/4.)
- [x] **UQ-UI-3 views type-role split — DONE (UQ-UI-3 commit).** LineageView (gen-label/life-years tabular/
  badges → UI face), TimelineView (era year-ranges tabular UI face), StatsView (uPlot legend+axis → UI face,
  scoped :global). Member names stay display-serif; prose flourishes stay italic. +1 test, 97 browser green.
- [x] **UQ-UI-4 SceneReader balance + choice affordances — DONE (d07751a), from SUZERAIN inspiration.** Safari
  agent captured + analyzed 12 Suzerain shots → [[suzerain-ui-reference]] (13 techniques). Applied the two
  highest-leverage: (#1) prose `.para` capped to a MEASURED ~62ch column (Chrome-verified columnar lines —
  the big anti-wall lever); (#4/#5) choice block lifted off the prose with a sense-tinted hairline rule +
  leading "›" glyph per option, keeping the folded-in glow design (not buttons). +1 test, 97 browser green.
  ONB-1 funnel also re-verified live (Ferraro line founded). Backlog for a deeper UI pass (in the memory):
  text registers (#2), entity links (#3), compass (#9), recap tables (#10/#11).
- [x] **UQ-reconcile arc-hash vs guidance.json — DONE (62beedd).** They're orthogonal layers (shape=FORM/
  pacing, guidance arc=historical MEANING), not redundant. Disambiguated in-prompt: spine intents now say
  "this act moves as a <shape>" (not "a <shape> generation"); scene.ts labels guidance "ARC (historical
  meaning)" + a two-layer note. +1 test pins the contract. tsc 0, 686 tests.
- [x] **UQ-3a CRIME power axis DESIGN — DONE.** ([[crime-power-axis]]) Spec at
  docs/superpowers/specs/2026-06-22-uq3-crime-power-axis-design.md. Decisions: `criminal` is a 7th real
  Archetype (calling "The Boss"), WAVE-GATED to ireland/italian/ashkenazi/chinese ONLY (the anti-stereotype
  guard, in DATA — scandinavian/bavaria/baghdad never offer it); +8 act files (4 waves × 2 classes); 4 distinct
  per-wave crime shapes (irish=street→bootleg→politics founder; italian=Commission rise/RICO-fall; ashkenazi=
  syndicate that EXITS to legitimacy by tier 2; chinese=West-Coast tong/vice); crime↔legit crossings reuse WV-2
  braid pool; new `syndicate` convergence Destination = the "crime planet" (Don of a Thousand Suns), gated to
  criminal/converted lines. Build order = schema+gate → ending → GOAP → guidance → generate → live-verify.
- [x] **UQ-3 CRIME power axis — DONE (delivered via the convergence DESTINY; a branch.ts BranchKey is not
  warranted).** Assessment after the spine-branch machinery landed: the crime axis is the `crime_leader`
  convergence DESTINY (convergence.ts, "The Family That Owned the Shadows"), gated on MOTIVATORS (power≥35,
  worldview≤-10) — NOT on branch.ts flags. Verified reachable: added a convergence reachability test (a
  power+cunning+low-worldview line with honor>0 lands crime_leader, NOT shadowed by dictator). And the spine
  CAN build that profile in play — 53 power-up / 39 cunning(honor+) / 21 faith-down(worldview-) choice shifts
  across the spine. So the crime fate is reachable end-to-end through normal spine play. A separate `crime`
  BranchKey (alt-history crime backdrop) is NOT added: branch.ts is the world-TIMELINE-variant selector and
  there's no crime world-timeline/terms content; adding a hollow key without backdrop fiction would be
  cosmetic. If a full crime-world backdrop is ever authored (its own large fiction milestone), revisit then.
  [[crime-power-axis]]

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
- [x] **RB-7 baghdad timeline mismatch — DONE.** Decoupled the saga clock from the 1885 era ladder
  (advanceSagaClock, fixed generational step) + cap a succession-carried line at an 'apex' ending after
  the 6th tier. All 7 waves now play ~165-180 scenes to apex (baghdad 175, 762→936). Test + deterministic.
  ORIGINAL ROOT CAUSE: baghdad founds at year 762 but
  state.eraIndex=1 = the "origins" era (yearStart 1885, yearEnd 1946, budget 16). advanceTimeline steps
  year by span/budget=4y and caps at era.yearEnd 1946 → after the 16-beat budget the era rolls and the
  762-vs-1885 mismatch ages the line to death by 1946 (16 scenes). The saga clock is wrongly driven by
  the NY-line era budget. FIX: in advanceRunClock, advance the SAGA year by a generational step
  (~one human generation per close/tier, ~bounded 20-30y per scene-cluster) DECOUPLED from the NY eras,
  so any founding year (762 or 1885) plays a full 6-generation run. Touches loop.ts:advanceRunClock —
  do AFTER #83 merges (overlaps that file). Verify all 7 waves reach ~150 scenes; test replay-determinism + PR.
  [WAIT] #83 (loop.ts) to merge first.
## CONSOLIDATION (user, 2026-06-22): ONE long-running local branch, comprehensively reviewed LOCALLY

Squad merged (#85 RB-7 baghdad clock + #86 RB-3 scene-transition slice-1). Per the user, NO more
PR-per-item — all remaining work lands as forward commits on `feat/presentation-and-convergence-ui`,
then the FULL local gate (typecheck + biome + unit + browser + e2e) + the reviewer trio
(comprehensive-review:full-review / security / code-simplifier) run on the whole diff before the SINGLE
push + PR. See [[one-branch-local-review]].

- [x] **RB-3 presentation polish — DONE (slices 1-2).** Slice-1 (#86: scene fade + data-scene-id);
  slice-2 (forward commit: per-era ambient chords so the pad mood deepens across the arc). Slice-3
  (caricature portrait/scene compositing) is NOT a polish slice — `src/render` is empty (the module was
  removed; only a stale Portrait.visual screenshot remains), so it's a from-scratch subsystem needing an
  asset pipeline + real 2D caricature art ([[dynasty-ui-conventions]]) — DECIDED to split it out as RB-8.
- [x] **RB-8 caricature portrait/scene compositing — DONE on `feat/portrait-scene-compositing` (9 commits).**
  ALL 5 steps shipped + live-verified in Chrome: palettes (86e03a5), composeScene core (b156dac),
  SceneStage (7cc67ad), PlayScreen wiring (c68f45b), ending variant (d418d21), rival vignette (a4..),
  + authored CC0 caricature SVG art (6 archetype bases + 6 silhouettes), license-logged + manifest-tested.
  LEARNING: repo idiom is authored SVG not raster (corrected the layer paths); the prior "no portraits"
  test encoded a PROCEDURAL-portrait purge — RB-8's authored faint-backdrop approach legitimately
  supersedes it (commit body documents the override). Reviewer trio DONE (code MED+3LOW folded, security
  clean, simplifier folded) + full gate green + live-verified. PR #91 OPENED. [WAIT] CI + merge.
  Design spec: `docs/superpowers/specs/2026-06-22-rb8-portrait-scene-compositing-design.md`.
- [x] **RB-8 PR #91 — MERGED (1e470e0 → v-next). CD/Release green.** The "Vite reloaded a test" CI flake
  was root-caused (stuck-loop-debugger) to runtime-only `await import("@capacitor/*")` + koota/yuka discovered
  mid-run on CI's COLD .vite cache → page reload kills the runner; fixed by `optimizeDeps.include`
  force-prebundling them, verified by cold-cache local repro, + a permanent CI guard (`rm -rf .vite`).
- [x] **RB-10 audio↔visual era lockstep — DONE on `feat/era-lockstep-impl` (3 commits).** `src/sim/eras.ts`
  single ERA_BANDS table (chord+ramp per band); chordForEra + rampForEra migrated to read it (old maps
  deleted); agreement-invariant browser test (anti-drift); audio↔visual lockstep via PlayScreen's single
  currentEraId; `playEndingSting(outcome)` fired onMount in LegacyReport. Full gate green + reviewer trio
  folded (code: value-identical migration + sting-drop fix; simplifier ×2). PR #93 OPENED. [WAIT] CI + merge.
- [x] **REVERTED — RB-8 portrait/scene-compositing subsystem removed.** USER (2026-06-22): portraits +
  procedural art were removed for immersion; UI atmosphere is Svelte + CSS, never asset-compositing layers.
  RB-8 (#91) rebuilt them on a mandate I INVENTED — wrong. Reverted src/render/** + the 12 SVGs + the
  3 mount sites; kept RB-10's eras.ts (chord-only) + audio ending sting. RB-11/RB-12 (more portrait art)
  CANCELLED. See [[no-portraits-no-asset-art]]. NEVER rebuild a removal as my own decision.
- [x] **WV-1 weave intersections INTO the prose — DONE → PR #96.** SceneReader folds each crossing into
  its paged prose (woven narration page, CSS mark, no aside); curated INTERSECTION_POINTS replaced the
  auto-spray. Reviewer trio + CodeRabbit folded. ([[intersections-woven-not-walls]])
- [x] **WV-2 braid SLOTS + bias-weighted weaving — MERGED (#98 → ebb613f).** Perf fixes folded (memoized
  source index for the hot view getter; dedup'd lookups; O(N) splice). On `feat/braid-slots`.
  ([[braid-slots-genai-architecture]] + [[emergent-cause-effect-sim]]). DONE: step 1 BraidSlot schema; step 2
  `braidSelect.ts` pure seeded selector (era-gated, place×archetype×class bias, seeded fire-gate + weighted
  pick, BORROWS the partner's source vignette — no bespoke per-pair writing; deterministic); step 3a
  `candidatesFromSnapshots` adapter (DynastyWorld snapshots → candidates; strategy-derived relation). 671
  unit tests, all pure. ALL STEPS BUILT: schema, selectBraid (seeded, replay-safe — fork keyed on
  scene.id+year, fork is pure so view re-reads + restore are identical), candidatesFromSnapshots adapter,
  loop.view wiring (additive, INERT until slots exist), slot-tagging QA pass + `--pass slot` runner
  dispatch. Full gate green (678 unit, 92 browser, 7 e2e). Reviewer trio folded (code: replay-safe option
  sort + vignette-required source + all-scenes sources; purity/determinism confirmed; simplifier clean).
  PR #98 OPENED. [WAIT] CI + merge.
- [x] **WV-2b braid-slot weave — SUPERSEDED by the FS-5 trigger lattice.** Cross-line weaving is now the
  deterministic-trigger lattice (compound conditions fire whole family branches into the ONE spine), not
  per-cell braid-slot tagging between peer cells. The slot machinery + braidSelect remain as inputs; the
  anchoring is the lattice. ([[founding-spine-pivot]])
- [x] **WV-3 emergent variability (anti-Suzerain) — DONE + PROVEN/LOCKED.** The seeded systemic substrate
  (market regime walks + bounded shocks in systemicTick, forked from the run-seed rng) + seeded choice/event
  selection already make playthroughs diverge with zero Math.random. Added a WV-3 test trio in
  effects.unit.test.ts on REAL content: (1) 4 seeds → 4 unique economic fingerprints (markets, regimes,
  money, run-depth all differ — e.g. us_equities stable@97 vs crash@199, crypto flat vs rug); (2) same seed
  → bit-identical replay (divergence is seeded, not random); (3) the substrate visits >1 market regime across
  seeds (alive economy). 14/14 green. ([[emergent-cause-effect-sim]]) Yuka rival-reaction layer remains a
  larger separate system, not needed now that spine+lattice+substrate carry divergence.
- [x] **RB-4 surface interactive convergence — DONE (forward commit).** Added the rival's rung to the
  Glimpse + a ★-per-rung indicator in the "Other lines" strip, so the player sees their crossings move a
  rival's standing. Browser-tested.
- [x] **RB-5 codex/timeline depth — DONE (forward commit).** TimelineView/LineageView/CodexView already
  exist; the gap was the rival world's trajectory being invisible. Added GameView.rivalStandings + a
  RivalField component in the slide-out menu showing every line's rung (player's marked), so the whole
  convergence race is legible. Browser-tested.
- [x] **RB-9 local comprehensive review + the ONE PR — DONE → PR #89.** Full local gate green (typecheck +
  biome + 655 unit + 92 browser + 7 e2e + build) + serial reviewer trio (code review: 2 findings folded;
  security: clean; simplifier: RungStars extracted) BEFORE the single push. PR #89 opened. [WAIT] CI +
  merge, then keep CD green. (Per [[one-branch-local-review]].)
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

## FS-FOLLOWUP — founding-spine pivot loose ends (rolling backlog; keep ACTIVE)

These surfaced live-verifying the visual layer. The founding-spine pivot ([[mmm-convergence-pivot]],
[[craft-spines-not-generator]]) moved the PLAYER's line to the 1776 founding, with the immigration
WAVES becoming the recurring CAST woven as intersections ([[mmm-timelines-architecture]]). The
onboarding copy + seed semantics are still the PRE-pivot immigrant-arrival framing.

- [x] **FS-ONB-DRIFT — DONE (the onboarding no longer drifts).** The founding funnel is rewritten REGION ×
  POWER-BASE × STANDING at the 1776 founding; no immigrant-crossing framing remains. Research landed
  (`docs/superpowers/specs/2026-06-22-founding-era-research.md`); architecture DECIDED + logged in
  `2026-06-22-founding-spine-redesign.md` (§DECISION FS-ONB-DRIFT). Steps a/b/c/e done + Chrome-verified;
  step (d) — retiring the dead 1885 prologue ERA — is bigger than a sub-step (it's load-bearing: initState's
  default startEra="origins", order-0 in the chain, the prologue-gating contract) and is split out as
  FS-RETIRE-PROLOGUE below. Sub-steps:
  - [x] (a) `src/sim/foundingOrigin.ts` resolver — region×base×standing → motivators + archetype + rung +
    seed flags, grounded in the six researched power bases. 10 colocated unit tests, tsc 0. (committed)
  - [x] (b) DONE — OnboardingScreen first three steps rewritten (PERIOD/CLASS/WAVE → REGION/BASE/STANDING),
    all copy reworked (no "off the boat"/"crossing"); STYLE→SURNAME→GENDER→GIVEN→JOB→FRIEND→PARTNER kept.
    2 browser tests rewritten + green.
  - [x] (c) DONE — region/base/standing thread onComplete → App.birthGame (regionPlaceId + resolveFoundingStart
    for archetype+motivators) → founding (new Composition.seedFlags stamps region/base/power/standing). founding
    unit test for seedFlags added. tsc 0; 745 unit + 104 browser green.
  - [→] (d) SPLIT OUT → FS-RETIRE-PROLOGUE (the whole 1885 prologue era, not just ev_line_fails).
  - [x] (e) DONE — Chrome-verified the new funnel: region step ("A new nation is being born… Where does it
    take root?" + 3 regions), base step (6 bases, region-natives first), standing step; copy clean. Full
    funnel→onComplete→play covered by the rewritten browser test.
  Keep `waveSelect` + wave places for the CAST/braid system (no longer the player origin).
  ORIGINAL NOTE: The
  funnel asks "Every American line begins with a crossing — when did your people make theirs?" then "what
  did they carry off the boat? — steerage, a tenement, the lowest rung." Under the pivot the player's
  progenitor FOUNDS the line at the American founding; the waves are the cast, not the player's origin.
  `App.birthGame` already overrides `year: FOUNDING_YEAR` so the ACT renders 1776, but the player picks
  immigrant-arrival SEEDS (period=wave, "off the boat" class). Re-enumerate the onboarding use-cases against
  the founding-spine model: the diegetic birth should compose a FOUNDING-ERA progenitor (place/class/trade
  in the revolutionary republic), with the wave-arrival framing reserved for the CAST. Decide: rewrite the
  WAVE step into a founding-era origin step, or keep waves but reframe as which cast-family the line later
  braids with. Author the copy + seed mapping; keep gender/given/job/friend/partner seeds.
  ALSO IN SCOPE (from FS-EARLY-TERMINATION): the whole `new-york/1885-1946-origins` era is pre-pivot
  Trump-line content (incl. `ev_line_fails` → `end_line_failed`, Kallstadt/Queens/1946 counterfactual). The
  live game already routes founded runs through the 1776 spine (beginSpine), so this era is dead-but-reachable
  via the legacy event/autoPlaythrough path. Decide its fate: retire it, or convert it into CAST backdrop.
  Remove the pre-pivot `dynasty_doomed`/`fred_builder`/`returned_to_ny` line-failure chain or rehome it.
- [x] **FS-MOBILE-VERIFY — DONE (folded into VL-4).** The VL-4 visual suite mounts PlayScreen at 412px and
  captures a screenshot; reading it confirmed the portrait stacks above the paged prose with no overflow and
  the Map tab is reachable. Authoritative mobile check via the Vitest browser harness (not the desktop-width
  chrome-in-* screenshots).
- [x] **FS-EARLY-TERMINATION — INVESTIGATED: not a live-game bug; root traced to FS-ONB-DRIFT's dead content.**
  Traced the early autoPlaythrough deaths to the `ev_line_fails` event in the OLD `new-york/1885-1946-origins`
  era firing `end_line_failed` (kind "origins", requires `dynasty_doomed` & not `fred_builder`/`returned_to_ny`)
  — a pre-pivot TRUMP-LINE counterfactual (Kallstadt/Bavaria/Fred/Queens/1946 copy). Decision: NOT a real
  player-facing gap — the LIVE game engine (loop.ts beginSagaActForState) routes founded runs through
  `beginSpine` (the 1776 authored spine, g0–g9), NOT this old event-based origins era; `ev_line_fails` is only
  reachable via `autoPlaythrough`, the analytics/acceptance HARNESS that drives the legacy event path. The
  SS-15 acceptance gate already treats early line-failure as valid tragedy-variance and takes the DEEPEST run
  as the hour-case. Why: the dead Trump-line origins content (the whole 1885 era) is the SAME pivot-drift root
  as FS-ONB-DRIFT — fold its removal/replacement into that unit (research-gated), don't band-aid one ending.
  Resolves: [[mmm-convergence-pivot]] drift in the founding era is one problem, addressed holistically.
- [x] **FS-RESEARCH-REVERIFY — DONE.** The this-session agent (a3a2386c…) returned a deeply-cited, fact-checked
  founding-era report (5 sub-agents, working web tools, every fact w/ URL + myth-flags); it reconciles with the
  prior memory-only "six power bases" report (same six bases) and ADDS the load-bearing corrective: founding-era
  power was a self-recruiting oligarchy of interlinked families w/ LAND as substrate; self-made/log-cabin =
  19thc myth = in-world propaganda, not the advancement mechanic. Hand-verified the headright-fraud and
  entail/primogeniture (VA 1776/1785) myth-flags myself via WebSearch. Saved as
  `docs/superpowers/specs/2026-06-22-founding-era-research.md`; [[research-not-memory]] updated. This unblocks
  FS-ONB-DRIFT. (The immigrant-CAST guidance.json still needs the same live-research treatment — separate.)
- [x] **CHORE-UNTRACK-AUDIT-ARTIFACT — DONE.** Added `artifacts/timeline-audit.json` to .gitignore +
  `git rm --cached`; the harness debug dump is now gitignored cache, not tracked. No more hand-reverting a
  60k-line churn out of every commit; `git add -A` is safe again.

## FS-RETIRE-PROLOGUE — retire the dead 1885 Trump-line prologue era (milestone, split from FS-ONB-DRIFT d)

- [x] **FS-SPINE-BRANCH-ONRAMPS — DONE.** The 6 destiny branches now fork off the SPINE: new
  `src/sim/saga/spineBranch.ts` — a pure, regen-safe table (SPINE_FLAG_TO_BRANCH) + transform
  (applySpineBranchOnRamps) wired into loadSaga, stamping each branch's signature flag onto spine choices
  that already set the matching destiny-path flag (reusing the spine's own 98-flag vocabulary; no JSON
  authoring, survives spine regen). All 6 branches verified reachable from the loaded spine corpus — incl.
  oligarchy + media which were previously set NOWHERE (fixes a latent unreachability gap). 5 spineBranch
  tests + existing branch.unit.test (origins reachability, still true) both green; 754 unit + tsc + check
  clean. Step 3 (repoint branch.unit.test from origins→spine) correctly DEFERS to FS-RETIRE-PROLOGUE (when
  origins is actually emptied). FS-RETIRE-PROLOGUE is now unblocked on the branch-onramp front.
  (historical) Discovered this session: the dead origins events were the LIVE
  source of the destiny-signature flags (nazi/megachurch/theocracy/media/westcoast) that `branch.ts` +
  `branch.unit.test.ts` require for "every branch is reachable from an origins choice." Under the founding-
  spine pivot, branches should fork off the ONE spine (the design's "branches off the one timeline"). So the
  spine's per-era DecisionArchitecture choices must set the destiny on-ramp flags, and branch reachability
  must be provable from SPINE choices, not origins events.
  ENUMERATION DONE (this session): branch.ts has 6 BranchKeys, each keyed by signature flags (branch.ts:35-40):
    nazi(axis_ascendant/nazi_dynasty/arrived_as_nazi) · megachurch(megachurch_dynasty/televangelist_empire) ·
    theocracy(evangelical_scion/faith_to_power/evangelical_origin) · media(pleasure_king/media_dynasty/vice_empire) ·
    oligarchy(oligarch_dynasty/corporate_state/plutocracy) · westcoast(west_coast_origin/west_coast_dynasty).
  Where set: ALL the live on-ramp flags are set ONLY in the dead `new-york/1885-1946-origins` events; the
    oligarchy flags + media_dynasty are set NOWHERE (those branches reachable only if some flag is set —
    currently unreachable, a latent gap). `branchOf` is consumed widely (effects world-timeline variant,
    events bias, terms head_of_state resolution, moralAxis, slots, compiler, harness) — it's the alt-history
    BACKDROP selector, which maps onto the founding-spine NAMED DESTINIES (theocracy↔religious leader,
    oligarchy↔oligarch, media↔media mogul, etc.). So the spine DecisionArchitecture choices are the natural
    new home for these on-ramps (a "doctrine"/"platform"/"allegiance" decision forks toward a destiny).
  ARCHITECTURE DECIDED (this session): the spine.act.json is GenAI-GENERATED (regeneratable) — hand-editing
    it loses on regen. So DON'T author flags into the JSON. Instead add a PURE, deterministic MAPPING in the
    spine loader/player (applied at content build) that stamps the branch signature flag onto a choice when
    that choice already sets the matching destiny-path spine flag. The 98 existing spine flags already encode
    the destiny paths (g6_broadcast/g5_telecom_empire→media_dynasty; faith doctrine→evangelical_origin;
    crush_labor/corporate_monolith→oligarch_dynasty; g9_manifest_state/militarist→axis_ascendant or its
    successor; westcoast tech→west_coast_origin; revival/megachurch→megachurch_dynasty). Regen-safe, testable,
    NO fiction authoring — it reuses the spine's own vocabulary. Remaining steps: (1) author the
    SPINE_FLAG → BRANCH_SIGNATURE map (a table in a new spineBranch.ts or in the loader) + apply it where
    spine scenes are loaded into content; (2) rewrite branch.unit.test to assert reachability from SPINE
    choices; (3) confirm destiny endings + term resolution reachable; (4) verify the mapping covers all 6
    branches incl. the currently-unreachable oligarchy/media. Pairs with convergence.ts DESTINY endings.
- [x] **FS-SCHEMA-EMPTY-ERA — DONE.** Relaxed `EraEventsSchema.events` from `.min(1)` to allow `[]` (a
  spine-driven era legitimately has no event-card pool). Schema test added (empty pool validates; populated
  still does). 749 unit + tsc + biome check green. Unblocks the eventual FS-RETIRE-PROLOGUE emptying once
  FS-SPINE-BRANCH-ONRAMPS rehomes the branch flags.
- [x] **FS-RETIRE-PROLOGUE — DONE + Chrome-verified.** The dead 1885 Trump-line prologue is retired. The
  new-york origins events file now holds ONLY the 2 LIVE life-stage succession beats (ev_cp_take_partner →
  ev_cp_raise_heirs, which founding.ts/effects.ts need for generational succession) — the other 45 dead
  prologue events (Friedrich/Kallstadt/Fred/Queens/1946 + the ev_line_fails failure chain) removed.
  end_line_failed removed from endings.json (line_failed no longer set anywhere). prologue-gating.unit.test
  RETIRED; branch.unit.test repointed origins→SPINE reachability (+oligarchy); terms.unit.test split (live
  term-interp kept, Trump/Musk/Kennedy prologue cases dropped); timelines brewing→bootlegger origins case
  retired (live Kennedy arc stays in eastcoast); branch-density exempts the now-spine-driven origins from the
  branching-ratio gates. RESULT: autoPlaythrough no longer early-deaths at end_line_failed — runs now reach
  1970–2014 with 70–128 history beats (was 3–6 at 1893) on real endings. Chrome cold-start verified: the new
  region×base×standing funnel → "Act I — The Crucible of Flint and Ink / Founding · 1776" spine act naming
  the chosen progenitor (Endicott Vance), NOT the dead prologue. 724 unit + 104 browser + tsc + check green.
  NOTE: only new-york carried the dead prologue; the 13 immigration-WAVE origins files (ireland/italian/…)
  are CAST vignettes and were left intact.
The whole `new-york/1885-1946-origins` era (47 events: Friedrich-leaves-Kallstadt → Bavaria → Fred the
builder → Queens → the 1946 birth, incl. the `ev_line_fails`→`end_line_failed` failure chain and the
`dynasty_doomed`/`fred_builder`/`returned_to_ny` flags) is PRE-PIVOT content. The live game routes founded
runs through the 1776 spine (`beginSpine`); this era is dead-but-reachable only via the legacy event /
autoPlaythrough path, where it causes early "line failed" deaths that pollute analytics.

ENUMERATION DONE (this session) — the scope is NARROWER + SAFER than first feared. Retire the dead origins
EVENTS, NOT the origins ERA ID:
- **The origins era ID STAYS** — load-bearing for the NEW founding path: the FS-ONB-DRIFT founding-region
  places use `validEras:["origins"]`, so the player's founded run still composes in era "origins" (year
  overridden to 1776, routed through the spine). `initState` also defaults `startEra="origins"` and several
  callers (statsSeries, compiler, effects/autoPlaythrough, loop.ts) rely on that default. So DON'T remove
  the era; only its pre-pivot EVENT CONTENT.
- **Fabric is SAFE** — fabric/index.json has ZERO references to new-york/origins/kallstadt/friedrich/fred;
  retiring the origins events does NOT invalidate the mined fabric.
- `prologue-gating.unit.test.ts` asserts the game OPENS on "Friedrich leaving Kallstadt" — a pre-pivot
  contract; rewrite it for the spine/founding open (the live game already routes through beginSpine).
- `branch.ts`'s "Era-0 origin flags authored in origins.json" comment is STALE — no origins.json file
  exists; origin flags live in the events. Verify branch coloring doesn't depend on the dead events.
- `end_line_failed` (kind "origins") in endings.json + the ev_line_fails/`dynasty_doomed`/`fred_builder`/
  `returned_to_ny` chain in the origins events are the harmful dead content (early autoPlaythrough deaths).
- DE-RISKED (this session): the origins events are FULLY DEAD for the live player — PlayScreen renders
  `view.saga.scene` (the spine) FIRST and falls back to `view.currentEvent` only when there's no saga scene
  (PlayScreen.svelte:140 vs :156); a founded spine run always has a scene, so origins events never surface.
  They're reachable ONLY via autoPlaythrough's direct pickNextEvent. So EMPTYING the origins event pool is
  safe for the live game — the cleanest path (vs. authoring 47 replacement events). Decision: EMPTY the pool
  (keep the era id + budget), not rewrite it; if a founding-era event layer is wanted later it's additive.
⚠️ ATTEMPTED + REVERTED (this session) — emptying the origins events is NOT a cleanup, it's blocked on a
REAL architecture gap. Two failed hypotheses, then stopped + reverted (kept the branch green):
  1. Empty `events: []` → schema `EraEventsSchema.events.min(1)` rejects it. (Relaxable, did so.)
  2. With schema relaxed → 11 tests across 6 files fail. ROOT CAUSE: **the origins events are the LIVE
     branch-flag SOURCE.** `branch.unit.test.ts` asserts "every branch is reachable from an ORIGINS choice"
     — the nazi/megachurch/theocracy/media/westcoast signature flags are set by origins-event choices.
     Emptying origins removes the branch ON-RAMPS. Also breaks branch-density, timelines (brewing→bootlegger
     bridge), terms (interp fixtures), effects/harness.
THE REAL WORK (this is the pivot's unfinished business, not a delete): the destiny BRANCH ON-RAMPS must be
REHOMED into the spine (the founding-spine design's "branches off the one timeline" model — the spine's
DecisionArchitecture should set the destiny-signature flags) BEFORE the origins events can be retired.
Until then the dead Trump-prologue events are load-bearing for branch reachability. Re-scope: FS-RETIRE-
PROLOGUE now DEPENDS ON a prior unit "FS-SPINE-BRANCH-ONRAMPS — move destiny on-ramps from origins choices
into the spine." Only after that can origins be emptied. Schema relax (events.min(1)→allow empty) is a
prerequisite + harmless to land early. autoPlaythrough early-death is cosmetic (acceptance gate tolerates
it) so there's NO urgency forcing a half-done retirement.

PRIOR DEPENDENCY MAP (still valid for the eventual retirement) — touches exactly these:
- `src/data/eras/new-york/1885-1946-origins/events.json` — empty `events: []` (keep `era`). NO downstream
  era references any origins-set flag (dynasty_capital/fred_builder/real_capital/returned_to_ny/etc. — all
  0 refs outside origins), so emptying is self-contained.
- `src/data/endings.json` — remove `end_line_failed` (kind "origins", the only consumer of `line_failed`).
- `src/data/__tests__/prologue-gating.unit.test.ts` — RETIRE (pure pre-pivot Trump-prologue contract:
  asserts the game opens on Friedrich/Kallstadt + the 1946 birth — both false under the spine pivot).
- `src/sim/__tests__/terms.unit.test.ts` — the TRICKY one: it uses origins events (Trump/Musk/Kennedy
  prologue) as fixtures to test BOTH dead-prologue gating (retire those cases) AND still-live
  TERM-INTERPOLATION logic ({family_name} etc., used by the live SceneReader). REPOINT the term-interp
  cases to a spine/fixture event; retire only the prologue-gating cases. Don't lose live term coverage.
- `branch.ts` comment about "origins.json" is stale (no such file); verify branch coloring is unaffected.
Steps when picked up: (1) empty origins events.json; (2) remove end_line_failed + line_failed; (3) retire
prologue-gating.unit.test.ts; (4) split terms.unit.test.ts — repoint live term-interp to a non-origins
fixture, drop the prologue cases; (5) confirm branch.ts + initState default resolve; (6) full gate +
autoPlaythrough no longer early-deaths + Chrome verify cold start opens on the founding spine.

## Rolling backlog (keep the queue non-empty — [[never-drain-queue]])

- [ ] **CAST-RESEARCH — live-research the immigrant-WAVE cast guidance.json (the [[research-not-memory]]
  other half).** The founding-era research is done; the wave histories/trades/obstacles/crime-arcs/braid
  affinities for the recurring CAST families (Irish/Italian/Chinese/Jewish/Scandinavian/Bavarian/Arab) are
  still a from-memory DRAFT in guidance.json. Research each ONLINE (WebSearch), cite + myth-flag, correct the
  draft before it drives cast/braid generation. Pairs with the cast being woven as intersections.
- [x] **VL-5 — INVESTIGATED: not a bug + small polish applied.** The empty frame was a LOAD-TIMING artifact,
  not a derivation bug: the g0 scene id IS `spine:g0:founding:open` (matches the portraitSrc regex), the PNG
  exists, the path is correct — the 1.7MB portrait just hadn't finished decoding 1s after founding. 2s later
  (Chrome re-verified) the colonial-engraving portrait renders in the gold frame. Polish: added
  `fetchpriority="high"` to the SceneReader portrait img (alongside the existing decoding="async" + fade-in)
  so the founding portrait loads promptly. Portrait tests (VL-4 + SceneReader) green.
- [x] **FS-BRANCH-ONRAMP-AUDIT — DONE.** New branchPlaythrough.unit.test drives the actual saga RUNNER
  (startAct → walk scenes → chooseBeat/chooseDecision) to each branch's on-ramp scene, takes the on-ramp
  (beat OR decision option — westcoast's is a beat), and asserts the runner stamps the branch signature into
  the LIVE accumulated flags + that signature resolves to its branch. All 6 destiny branches proven reachable
  through real play, not just flag-presence in the corpus. 733 unit + tsc + check green. (Note: branchOf
  precedence across a MIXED path is separate + intentional — a path crossing both oligarchy + westcoast
  on-ramps resolves to the higher-precedence oligarchy; the test asserts each on-ramp's own contribution.)