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

- [x] **CAST-RESEARCH — DONE (2nd verification pass).** Re-fact-checked all 7 wave-cast guidance.json briefs
  via 4 parallel WebSearch/WebFetch agents against citable sources. The drafts were already strong (a prior
  pass had corrected them); this pass caught + fixed residual errors: Italian Messina-quake-as-cause debunked
  (NBER w27506), ~4M not 4.2M, return 30-50%, NYC Dept-of-Public-Works precision; Jewish Hollywood founders
  span both waves (Laemmle/Zukor German/Hungarian not Eastern-European), quotas fell 1965 not post-WWII;
  Chinese railroad ~12-15k peak/~20k total/~90% of CP, "first to bar a SPECIFIC ETHNIC group" (Page Act 1875
  first restriction), tech founders Chen/Huang/Su Taiwanese + Yuan Shandong NOT PRD-Cantonese; Scandinavian
  creameries 550+ by 1898 (the "630/1918" figure was unsupported); Baghdadi 1950-51 EXODUS not "expulsion",
  Kadoorie CLP(1901)/Peninsula(1928) predate 1949. `_waves_doc` provenance updated; JSON valid, spine test +
  biome check green. ([[research-not-memory]] both halves now done: founding-era + cast.)
- [x] **FS-SPINE-ORIGIN-FLAVOR — DONE + Chrome-verified (MVP).** Approach B realized: 5 base-flavored g0
  FOUNDING-act opening scenes (land/commerce/pulpit/law/military), each gated `requires.flags:["base:X"]` and
  diverting forward to the shared allegiance scene; the existing printing-house `open` is now the PRESS/default
  (gated notFlags the other 5). Authored in the spine voice (2 sensory paras + 2 beats each, {family_name}
  tokens). Inserted via idempotent `scripts/fs-spine-origin-flavor.mjs` (the regen-safe RE-APPLY — spine.act.json
  is GenAI-regenerated, so the script re-stamps the variants after any regen). 7-test spineOriginFlavor.unit
  proves each base founder opens on its scene + press/no-base gets the default; 740 unit + tsc + check green.
  Chrome-verified: a South/Sword founder opens on the MILITIA-MUSTER scene ("the ragged stamp of boots on the
  common… a commission was a social title… the company drilled because a founding nation would crown the men
  who could be trusted with its guns"), NOT the printing-house default — the power-base choice MATTERS in the
  prose from beat one. (Later gens can follow this pattern incrementally; g0 is the MVP.)
  NOTE (minor, separate): onomastics drew "Sterling Sterling" (given==surname) for one Anglo-Protestant male
  draw — a suggestGivenNames coincidence, not this feature; worth a dedup guard in onomastics someday.
  SUPERSEDED ORIGINAL NOTE: The spine.act.json was authored BEFORE the FS-ONB-DRIFT founding-origin model; it doesn't read the new
  region:/base:/power:/standing: seed flags. A press founder vs. a land founder vs. a military founder should
  feel different in the early spine acts (gated/flavored options, or a power-base-aware prologue beat).
  DESIGN FINDING (this session): SCENES support `requires` (runner filters scenes by flags, runner.ts:77-79)
  but DecisionOptionSchema has NO `requires` field — option-level gating isn't supported today. So the three
  approaches are: (A) add `requires` to DecisionOptionSchema + runner option-filter + author per-base option
  variants; (B) author base-GATED bonus SCENES that divert in for the matching founder (uses existing scene
  `requires`, no schema change); (C) thread the base into the spine GenAI prompt on the next regen.
  DECISION (this session): approach B. VERIFIED viable end-to-end — `resolveEligible` (runner.ts:77-82) skips
  scenes whose `requires.flags` aren't met, walking `act.scenes` in order to the next eligible; and beginSpine
  passes `state.flags` (which carry the founding `base:*` seed flags from foundByComposition) into startAct,
  so a scene gated `requires.flags:["base:press"]` sees the flag at act open. MVP: insert ONE base-flavored
  opening variant per power base into the FOUNDING act (g0) — 6 gated scenes — so the chosen base colors the
  founding scene from beat one; a 7th un-gated default stays for any uncovered case. Author via the GenAI
  spine pipeline (matches the spine voice), license/validate, then Chrome-verify a press vs. land founder sees
  different opening prose. Later gens can follow the same pattern incrementally. Make the choice MATTER in the
  prose, not just the motivator seed.
- [x] **FS-COMPLETION-REVIEW — DONE → PR #100** (https://github.com/jbcom/dynasty/pull/100). Full local gate
  green + reviewer trio (final pass CLEAN) + Chrome hour-arc verified; pushed feat/founding-spine-redesign +
  opened the single PR. The remote merge loop is FS-PR-LOOP. (orig note:) The founding-spine
  completion (VL-3/4/5, WV-3, FS-ONB-DRIFT, FS-SPINE-BRANCH-ONRAMPS, FS-RETIRE-PROLOGUE, UQ-3,
  FS-BRANCH-ONRAMP-AUDIT, CAST-RESEARCH, FS-SPINE-ORIGIN-FLAVOR) is a large body of work on the one branch.
  Before opening the single PR ([[one-branch-local-review]]): full local gate + reviewer trio over the whole
  branch diff (origin..HEAD), fold findings, full e2e (pnpm test:e2e), build, and a final Chrome playthrough
  of an hour-ish run to confirm the founding→stars arc reads as one strong story. THEN open the PR.
  PROGRESS (this session): [x] full local gate GREEN — tsc + biome check + 742 unit + 106 browser + 7 e2e +
  build (fixed the e2e onboarding walk for the new funnel + made gameStore.devFastForward saga-aware so it
  drives founded runs). [x] Chrome playthrough verified: a South/Sword founder opened on the militia-muster
  scene (FS-SPINE-ORIGIN-FLAVOR) and ONE dev +100 advanced the Sterling line g0→g3, founding 1776 → "Act IV —
  The Iron and the Ivory / Convergence 1876" (Theodore Jr. III Sterling — 3 generations of succession,
  era-distinct Gilded-Age prose, era-appropriate News) — the founding→stars arc reads as one continuous,
  advancing story. [x] Final pre-PR reviewer pass came back CLEAN ("Ready for PR") — verified UQ-3 crime
  reachability non-vacuous, branchPlaythrough genuinely exercises the runner, guidance.json valid, the
  origin-flavor script byte-idempotent + scenes schema-valid, ONO-DEDUP correct, devFastForward can't stall.
  Its one out-of-scope find (family.ts partner naming not deduped) was FOLDED. [ ] OPENING the single PR now.
- [x] **ONO-DEDUP — DONE.** Added an optional `exclude` param to `suggestGivenNames` + `pickGivenName`
  (skip/re-draw when a given name equals the chosen surname), threaded the chosen surname through
  OnboardingScreen's givenSuggestions + founding.ts's seeded pick. Falls back to the un-filtered pool only if
  the surname is the sole available name (correctness over cosmetics). 2 dedup unit tests; 742 unit + onboarding
  browser + tsc + check green. No more "Sterling Sterling".
- [x] **FS-SPINE-ORIGIN-FLAVOR-DEPTH — DONE for g1 (early republic).** Extended the base-flavored openings to
  Act II (g1 "The Crucible of the Young Republic"): 5 base-gated early-republic opening scenes (land/commerce/
  pulpit/law/military), each diverting to the g1 `doctrine` scene; the maritime/shipwright `open` stays the
  press/default. Generalized scripts/fs-spine-origin-flavor.mjs into a reusable `applyAct(actId, open, divert,
  variants)` covering both g0 + g1 (idempotent, regen-safe re-apply). spineOriginFlavor.unit generalized to
  assert BOTH acts (g0 + g1) per base. Also folded the reviewer's out-of-scope find: family.ts partner naming
  now excludes the protagonist surname (ONO-DEDUP applied uniformly — no "Sterling Sterling" in-law). 749 unit
  + 106 browser + tsc + check green. g2+ (antebellum onward) remain a future incremental pass if wanted —
  the applyAct pattern makes each act a config block + 5 authored scenes.
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
## Post-PR backlog (keep the queue non-empty — [[never-drain-queue]])

- [x] **FS-SPINE-ORIGIN-FLAVOR-DEPTH-G2 — DONE.** g2 (Act III antebellum "The Sundered Threshold") now has
  5 base-flavored openings (land/commerce/pulpit/law/military) gated on base + diverting to its allegiance
  scene; industrial/textile open is the commerce/default. Sectional-crisis voiced (King Cotton, the
  abolitionist denominational split, Dred Scott + higher law, Union-vs-section). Same idempotent applyAct()
  pattern (now g0+g1+g2); spineOriginFlavor.unit asserts all three acts per base (21 tests). 757 unit + 106
  browser + tsc + check green. On branch `feat/spine-origin-depth`.
- [x] **FS-SPINE-ORIGIN-FLAVOR-DEPTH-G3 — DONE.** g3 (Act IV Gilded Age "The Iron and the Ivory") now has 5
  base-flavored openings (land/pulpit/law/military/press; commerce is the default Broad-Street open). Gilded-Age
  voiced; same applyAct() pattern (g0–g3); spineOriginFlavor.unit generalized to per-act base sets + asserts
  all 4 acts (32 tests). 768 unit + tsc + check green. On `feat/spine-origin-depth`.
- [x] **FS-SPINE-ORIGIN-FLAVOR-DEPTH-G4+G5 — DONE.** g4 (Progressive Era "The Iron Loom of Progress") + g5
  (mid-century "The Chrome Horizon") each got 5 base-flavored openings (land/pulpit/law/military/press;
  commerce default). The origin choice now echoes across SIX generations (g0 founding 1776 → g5 mid-century).
  Same applyAct() pattern (g0–g5); spineOriginFlavor.unit asserts all 6 acts (48 tests). 784 unit + tsc +
  check green. On `feat/spine-origin-depth` — ready to ship this g2-g5 depth batch as one PR.
- [x] **FS-SPINE-DEPTH-PR — DONE → PR #102 MERGED (squash e1f6f2e).** Reviewer pass CLEAN; opened PR #102;
  addressed all 6 CodeRabbit findings (g2 commerce-default + press variant — the real one; pulpit worldview
  alignment; idempotent-filter hardening) + resolved threads → CLEAN; re-run CI green; self-squash-merged.
  Synced main, deleted the branch. Post-merge Release + CD verifying on main (monitor b0uxvdvx7).
- [x] **FS-SPINE-ORIGIN-FLAVOR-DEPTH-G6–G9 — DONE (the depth arc is COMPLETE).** g6 (broadcast), g7
  (networked), g8 (orbital), g9 (interstellar) each got 5 base-flavored openings. The founder's power-base
  choice now colors ALL TEN generations (g0 founding 1776 → g9 the stars). Idempotent applyAct() (g0-g9,
  byte-idempotent verified); spineOriginFlavor.unit asserts all 10 acts (80 tests). 816 unit + tsc + check
  green. On `feat/spine-origin-depth-g6`.
- [x] **FS-SPINE-DEPTH2-PR — DONE → PR #104 MERGED (squash 970dcda).** g6-g9 origin-flavor; reviewer CLEAN
  (folded the g8/g9 pulpit-fork nit); CI green; self-squash-merged; release-please cut 0.21.0 (#103). Synced
  main, deleted branch. Post-merge Release + CD verifying on main (monitor b8nwuo11a). The ORIGIN-FLAVOR DEPTH
  MILESTONE IS COMPLETE — the founder's power base colors all 10 generations, founding 1776 → the stars.
- [x] **SAGA-RESTORE-CURSOR — DONE (commit afcd8be on feat/spine-depth-content).** DISCOVERED building the
  act-depth interstitials. TWO layers fixed: (1) in-memory — the Game constructor's `beginSagaActForState()`
  always RESTARTED the act at its OPENING on restore, so restoring mid-act replayed already-seen scenes +
  over-advanced the decoupled saga clock (loop.unit "crossing nudges replay-safe" diverged 2166→2182 once g0
  grew 4→6 scenes; 4-scene acts only passed by luck). Fixed by persisting a SagaCursor (actId/sceneId/
  beatCursor) on GameState + SagaDriver.restore that resumes at the saved scene. (2) DEEPER root — the
  persisted save (toSave/fromSave) was seed + EVENT history only; saga walk choices were NEVER recorded, so
  fromSave rebuilt a saga-deep run back to its founded base (silent rewind). Fixed by recording saga steps in
  the ONE ordered history log (HistoryEntry gains optional saga/index) + Game.reconstruct replaying the
  interleaved event+saga sequence through the engine — preserves the seed+history invariant. Tests: loop.unit
  SAGA-RESTORE-CURSOR + save.browser saga-deep round-trip. 817 node + 107 browser green.
- [x] **SPINE-ACT-DEPTH — DONE (commits ffab94d g0 + 658c5d6 g1-g9 on feat/spine-depth-content).** All 10
  spine acts deepened with a TEXTURE interstitial (after open) + a CONSEQUENCE interstitial (after the first
  major decision) — 20 new decisionless, weave-only scenes authored in each era's voice, with family tokens
  + small motivator nudges. Every act now plays open → texture → decision → consequence → … → close (~6
  scenes), reached from EVERY opening (the idempotent script repoints origin-flavor base variants through the
  texture). Major DecisionArchitecture decisions stay the act pivots — anti-sameness invariant intact. Via
  scripts/fs-spine-act-depth.mjs (idempotent; run order origin-flavor → act-depth). Tests: spineActDepth.unit
  (all 10 acts pass both interstitials to close; interstitials are decisionless spine-voice texture). 830
  node + 107 browser green; save-safe on SAGA-RESTORE-CURSOR. Roughly doubled each act's reading toward the
  hour+ mandate. (Reviewer trio dispatched on the branch diff.)
- [x] **FS-PR-LOOP — DONE → PR #100 MERGED (squash 94c694a).** First CI pass green; addressed all 6 CodeRabbit
  findings (sort anti-symmetry ×4, mineFabric div-by-zero, genai-qa decision pin) + a regression test in a
  forward commit + resolved all 6 threads → CLEAN; re-run CI green; self-squash-merged. release-please then
  auto-cut + merged release 0.20.0 (#101). Synced local main, deleted the merged branch (remote auto-deleted).
  Post-merge Release + CD (+ CodeQL) on main all completed SUCCESS — release 0.20.0 shipped clean.
  (orig babysit-pr note kept below.) Once the PR is open: wait CI green,
  read every comment + any CHANGES_REQUESTED, address/resolve all review threads (CodeRabbit etc.), keep
  Release/CD green, then self-squash-merge once green + threads resolved + DoD met. ([[babysit-pr]],
  [[jbcom-org-ruleset]] — PR-only/squash/linear.)

## Gameplay-depth backlog (the "hour+" mandate — keep the queue non-empty, [[never-drain-queue]])

### Rolling backlog (post-WV-3 — keep this section ≥3 actionable, append before draining)

- [ ] [WAIT-REVIEW] **SHOCK-LEDGER-RECOVERIES PR #124 — wait CI green + address review, then self-squash-merge.**
  Pushed feat/shock-ledger-recoveries: recovered:<meter>:<year> stamp + gold comeback ledger line + the same
  ledger in LegacyReport (LEDGER-IN-LEGACY-REPORT) + the shockCadence.unit audit (SHOCK-CADENCE-AUDIT), all as
  forward commits. Loop: wait build-and-test + CodeQL, read CodeRabbit/Amazon-Q/Gemini, fix forward + resolve
  threads, self-squash-merge once green ([[babysit-pr]]). After merge: sync main, next branch (CONVERGENCE-RIVAL-FINALE).
- [x] **SHOCK-AFTERMATH-IN-RIVALS — DONE (forward commit on PR #124).** advanceWorld now rolls a per-rival
  seeded setback (rivalShock): a standing rival can STUMBLE (lose a rung, flagged `stumbled`/snapshot.faltering)
  at an era-weighted rate (same macroActMedicine curve as the player's shock), then REBOUND (regain the rung) on
  a later un-struck turn — the two-act blow→recover shape mirrored for the world. detectGlimpses surfaces a
  faltering rival as "struggling" so the player SEES the window. The convergence race now feels alive: rivals
  falter mid-climb, not just escalate. 879 node + 116 browser green, full gate (check/typecheck/test) clean.
- [x] **LEDGER-IN-LEGACY-REPORT — DONE (forward commit on feat/shock-ledger-recoveries / PR #124).** LegacyReport
  now renders the full shockLedger as a "The Family's Hard Seasons" section between the dynasty epitaph and the
  stats — every disaster (red) + comeback (gold) the line lived, so the close reflects the WHOLE saga's trials,
  not just the verdict. Hidden for a shock-free run. screens.browser test pins render + gold/red distinction +
  empty case. 873 node + 116 browser green, typecheck clean.
- [x] **SHOCK-CADENCE-AUDIT — DONE (forward commit on PR #124).** shockCadence.unit instruments the WV-3 shock +
  recovery cadence per macro-act over 400 seeds. MEASURED figures: founding 31.5% → convergence 17.8% →
  emergence 9.8% → ascension 4.5% shock rate (monotonic, founding 7× the future); recovery 48.5% on a quiet
  tick with one outstanding blow. All in-band — no phase starved (0%) or flooded (100%), so NO tuning needed;
  the test now guards the cadence as a regression. 877 node green.
- [x] **DOSSIER-SHOCK-LEDGER PR #122 — DONE, MERGED (squash fc8c58e; release-please cuts 0.31.0).** Wait CI,
  folded both Gemini findings forward (exhaustive `Record<ShockLedgerEntry["kind"]>` ledger label + `new Set`
  flag dedup so a repeated `shock:*` can't crash the TimelineView `#each` key) in fe34b1b + regression test,
  resolved both threads, merged CLEAN. main synced, branch deleted.
- [x] **SHOCK-LEDGER-RECOVERIES — DONE (branch feat/shock-ledger-recoveries).** applySagaRecovery now stamps a
  persistent `recovered:<meter>:<year>` flag (alongside clearing the transient shock_meter marker); shockLedger
  parses it into a `recovery`-kind entry with a METER-AWARE comeback label (the fortune rebuilt / name redeemed);
  TimelineView renders it GOLD, distinct from the red disaster, so the log reads blow→recover. 873 node + 115
  browser green, typecheck clean. PR next.
- [x] **SHOCK-FAMILY-SUCCESSION-PRESSURE PR #120 — DONE, MERGED (squash 4143a87).** Death shock can take the
  groomed heir (tookHeir + sharper heir_lost note); fixed the systemic `heir_*`-flag-not-cleared-on-succession
  bug Gemini caught. Threads resolved, merged green.

- [x] **CORPUS-MINE-INTERSECTIONS PR #118 — DONE, MERGED (squash bc548d1).** Fabric wired into resolveThreads;
  all 7 families now have mined vignettes (prose fallback when no braid-slot). Threads resolved, merged green.

- [x] **SAGA-AUDIO-ATMOSPHERE PR #116 — DONE, MERGED (squash cf2aecc).** Ambient bed now shifts by saga
  macro-act (ERA_BANDS aligned to convergence→mogul / emergence→ascent). Threads resolved, merged green.

- [x] **WV-3-SHOCK-RECOVERY PR #114 — DONE, MERGED.** The blow→rebound two-act arc (rollSagaRecovery, gold
  recovery note, SagaNoteKind). Threads resolved, merged green.

- [x] **CONVERGENCE-ENDING-DEPTH PR #112 — DONE, MERGED (squash 7be3df2).** Reachability audit + earned-finale
  prose shipped. CI green; CodeRabbit pass; Gemini medium (hoist initMotivators in the test) FIXED + thread
  resolved; self-squash-merged. Post-merge Release + CD + CodeQL all SUCCESS (deployed). Synced main, deleted
  branch. Now on feat/wv3-shock-recovery for the next backlog item.

- [x] **WV-3-SHOCK-SCENES PR #110 — DONE, MERGED (squash 1452750).** Narrated-loss aftermath shipped. CI
  green; CodeRabbit pass; Gemini high finding (lastShock not cleared on the event-flow choose() path) FIXED +
  thread resolved; self-squash-merged. Post-merge Release + CD + CodeQL on main all SUCCESS (deployed). Synced
  main, deleted branch. Now on feat/convergence-ending-depth for the rolling backlog.
- [x] **WV-3-SHOCK-RECOVERY — DONE (commit 71cdd79).** A meter blow now marks a stable shock_meter:<meter>
  flag (heat excluded); on a QUIET saga tick rollSagaRecovery has a seeded chance to partially REBOUND one
  outstanding blown meter (rebuilt/redeemed/convalescence/reconciled), apply the gain, clear the marker, and
  surface a recovery note — the loss gets a blow→recover two-act shape, a missed recovery compounds. Pure +
  seeded, replay bit-identical. Tests: sagaShock.unit rollSagaRecovery. 858 node + 112 browser green. PR next.
- [x] **CONVERGENCE-ENDING-DEPTH — DONE (commit 40fdee0).** Reachability audit (convergenceReachability.unit)
  proves all 15 endings are reachable across a wide motivator×tier grid — caught + fixed a sweep blind spot
  (contributed_ally's reach[20,44] window shadowed by media_mogul). Every ending gained a distinct 1-2
  sentence earned-finale `prose`, rendered in LegacyReport beneath the title (italic body). 854 node + 112
  browser green. PR loop next.
- [x] **SAGA-AUDIO-ATMOSPHERE — DONE (commit ecc770c).** The audio engine + era-banded ambient bed already
  existed but was driven by the FROZEN event-era ladder (state.eraIndex), so a founded saga run heard one
  unchanging bed. Fixed: while a saga scene shows, drive setMusicEra from the saga MACRO-ACT (founding →
  convergence → emergence → ascension) + added convergence/emergence keywords to ERA_BANDS so all four map to
  distinct chord moods (origins/mogul/ascent/stars). The bed now crossfades across the founding→stellar
  journey. Test: eras.unit (4 macro-acts → 4 distinct bands). 860 node + 113 browser green. PR next.
- [x] **CORPUS-MINE-INTERSECTIONS — DONE (commit 8d6b835).** AUDIT: the mined fabric (fabric/index.json) was
  GENERATED but NEVER READ — resolveThreads wove crossings from the family's plain act-open, not the curated
  vignettes; and only italian+ireland had vignettes (the other 5 families had entries but 0 vignettes, as
  braid-slot tagging only ran on 2). FIXED both: new fabricCrossing.ts loads the index + picks the top-scored
  vignette per (wave,tier), and resolveThreads now uses it (bespoke → fabric → generic); mine-fabric.ts falls
  back to scene PROSE when a kept scene has no braid-slot vignette → all 7 families now 100% vignette
  coverage. Re-mined (idempotent). Tests: fabricCrossing.unit. 864 node + 113 browser green. PR next.
- [x] **SHOCK-FAMILY-SUCCESSION-PRESSURE — DONE (commit f8fe757).** A family_death shock now targets the
  GROOMED heir (the heir_<id> flag) at a raised 50% probability when one is named+alive; striking them flags
  tookHeir, the engine clears the heir_<id> flag → the next succession falls back to the eldest living child
  (weaker, unplanned), and the aftermath reads the sharper "groomed heir is dead — the succession you planned
  is undone" line. Pure+seeded. Tests: sagaShock.unit. 865 node + 113 browser green. PR next.
- [x] **DOSSIER-SHOCK-LEDGER — DONE (commit 0839c49).** shockLedger() parses the persisted shock:<kind>:<year>
  flags into a chronological disaster list; TimelineView renders a "What Befell the Family" log beneath the
  era strip — the deaths + reversals the line lived through, inspectable across the hour. Pure read-model.
  Tests: sagaShock.unit shockLedger + Views.browser render. 869 node + 114 browser green. PR next.
- [x] **CONVERGENCE-RIVAL-FINALE — DONE (forward commit on PR #124).** LegacyReport now renders "The Other
  Lines" — every rival's humanized place + a one-line fate read off its final rung + faltering state (reached
  the stars / rose high / made its mark / faltered at the last), so the close is the whole field's reckoning,
  not just the player's. rivalStandings now carries `faltering` (engine + App wire-through). screens.browser
  pins render + humanized labels + star/faltered fates + empty case. 879 node + 117 browser green, gate clean.
- [x] **SPINE-DEPTH-PLAYTEST-2 — DONE (forward commit on PR #124).** Added a 5-seed instrument to
  spineDepthPlaytest.unit measuring the WV-3 dynamic surface ON TOP of the ~48-min authored floor. MEASURED:
  29 shock beats + 42 ledger events across 5 seeds, median ~76s added/run (range 64–80s), firing EVERY run. So
  floor ~48 min + dynamic layer + a careful player's deliberation (95 beats / 22 decisions vs the fast path)
  clears the hour mandate comfortably — NO extra prose/4th-act beat needed. Test guards median ≥30s. Gate clean.
**RIVAL-RACE-PRESENCE milestone (feat/rival-race-presence) — all four on ONE local branch, single push at the
end ([[one-branch-local-review]]). #124 MERGED (squash 32bad64) cleared the gate.**
- [x] **RIVAL-FALTER-NEWS + RIVAL-RISE-NEWS — DONE (local commit on feat/rival-race-presence).** Added a
  `rivalNews()` engine channel surfaced as `view.rivalNews`: a near-vantage faltering rival yields a "stumbled"
  WINDOW dispatch (gold), a rival surged above the player's rung yields an "outpaced you" PRESSURE dispatch
  (red). NewsTicker renders them above the world news (the News tab now shows when there's rival news even with
  no world timelines). Both halves of the race felt in-run. Tests: NewsTicker.browser (render+accent) +
  loop.unit (both kinds fire over a seed sweep, humanized). 881 node + 118 browser green, gate clean.
- [x] **CONVERGENCE-FIELD-IN-TIMELINE — DONE (local commit on feat/rival-race-presence).** TimelineView now
  renders "The Field" — a rung bar per line (the player's own slotted in by rung + highlighted gold, faltering
  rivals' bars red), sorted high→low, so the player tracks the whole race mid-run, not just at the close.
  Reads view.rivalStandings + view.rung (wired through PlayScreen). Views.browser pins the sort order, player
  slot, faltering accent, and empty case. 881 node + 119 browser green, gate clean.
- [x] **RIVAL-CROSSING-EXPLOIT — DONE (feat/rival-crossing-exploit).** The player can "Press the advantage" on a
  faltering near-vantage rival (a NewsTicker button on faltered dispatches): nudgeRival -1 + a +12 heat cost.
  SAVE-INVARIANT solved via a SEPARATE press side-log (state.presses: {at, rivalId, year}) — NOT history, so
  history.length (the saga RNG fork key) is untouched; reconstruct interleaves presses by `at` (record-free
  applyPressEffect) so replay is bit-identical. Wired engine→store→PlayScreen→App; presses round-trip in
  toSave/fromSave. Tests: loop.unit (press effects + no-op guard + bit-identical reconstruct) + NewsTicker.browser
  (button fires/absent). 888 node + 122 browser green, full gate clean. [[mmm-save-and-chronology]] preserved.
- [x] **RIVAL-FATE-IN-CONVERGENCE-ENDING — DONE (forward commit on PR #126).** resolveConvergence now computes a
  `rivalEpilogue` coda from the field summary (rivalField: reachedStars/fallen/abovePlayer/total): a rival among
  the stars (distinct for player-also-stars vs not), the whole field fallen behind you, or a still-contested
  race. LegacyReport narrates it beneath the finale prose; a failed/unfounded run gets no coda. convergence.unit
  (5 cases) + screens.browser (render + empty). 886 node + 120 browser green, gate clean.
- [x] **SHOCK-FORESHADOW — DONE (forward commit on PR #128).** Extracted shockExposure() (the ONE home for the
  era-medicine hazard formula) + shockForeshadow() — a deterministic (NO RNG, replay-safe) predicate: true in a
  harsh era when the line carries strain (a shock_meter:* marker) OR has kin to lose. view.foreshadow surfaces
  "The season turns against the house — hard days may be near." in the PlayScreen above the scene (muted/dashed,
  distinct from the red aftermath). Loss now has dread, not just consequence. Tests: sagaShock.unit (exposure
  monotone + foreshadow gating) + loop.unit (omen surfaces + deterministic). 891 node + 122 browser green.
- [ ] [WAIT-REVIEW] **RECOVERY-CHOICE — let the player INVEST in a rebound (next branch after #128).**
  Recoveries fire automatically on quiet ticks; give the player a beat after a blow to spend a meter (money/heat)
  to RAISE the next recovery's chance/magnitude — turning the comeback into agency, not just luck. Reuses
  rollSagaRecovery with a player-set bonus; deterministic; tested. (Mirrors RIVAL-CROSSING-EXPLOIT's side-log.)
- [ ] [WAIT-REVIEW] **FORESHADOW-WEIGHT — the omen's certainty scales with the actual hazard (after #128).** SHOCK-FORESHADOW
  is binary (omen or not); a founding-era line with heavy strain should read a GRAVER omen than a marginal one.
  Tier the foreshadow text by exposure×strain ("a shadow over the season" → "the house braces for the worst"),
  so dread is proportional. Pure, view-derived, deterministic; tested.
- [ ] [WAIT-REVIEW] **OMEN-PAYOFF-AUDIT — measure foreshadow→shock correlation, calibrate trust (after #128).**
  A foreshadow that rarely precedes a real blow trains the player to ignore it; one that always does is just a
  spoiler. Instrument the foreshadow→next-shock correlation over many seeds; if it's miscalibrated, tune the
  threshold so an omen is a meaningful-but-not-certain warning. Decide from figures (like SHOCK-CADENCE-AUDIT).
- [x] **RIVAL-RACE-PRESENCE PR #126 — DONE, MERGED (squash 0cf8514; release cut 0.32.0).** 4 units: falter/rise
  news, field strip, rival-fate ending. All review (Amazon-Q dedup, Gemini perf/DRY/test-comment) folded forward,
  all threads resolved, merged CLEAN. Post-merge Release+CD+CodeQL all SUCCESS (deployed). main synced.
- [ ] [WAIT-REVIEW] **RIVAL-CROSSING-EXPLOIT PR #128 — wait CI green + address review, then self-squash-merge.**
  Pushed feat/rival-crossing-exploit (4de722b). Full local gate passed. Loop: wait build-and-test + CodeQL, read
  CodeRabbit/Amazon-Q/Gemini, fix forward + resolve threads, self-squash-merge ([[babysit-pr]]). After merge:
  sync main, SHOCK-FORESHADOW on a fresh branch.
- [x] **WV-3-YUKA PR #108 — DONE, MERGED (squash e3b9f17; release-please will cut 0.24.0).** The divergence
  audit + g9 apex fix, WV-3-MORTALITY (seeded saga shocks) + WV-3-RIVAL-REACT (reactive rivals) — saga path
  diverges per seed while bit-reproducible. CI green; CodeRabbit pass; Gemini high+medium findings (saga shock
  tempered off the wrong medicine map) FIXED in a forward commit + threads resolved; self-squash-merged.
  Post-merge Release + CD + CodeQL on main all SUCCESS (shipped + deployed). Synced main, deleted branch.
  Follow-ups now on feat/wv3-shock-scenes (below).

- [x] **SPINE-DEPTH PR #106 — DONE, MERGED (squash 045f7d5; release 0.22.0 auto-cut).** The whole spine-depth
  milestone shipped: SAGA-RESTORE-CURSOR, SPINE-ACT-DEPTH (all 10 acts, 3 interstitials each, hour mandate
  met), SAGA-CLOCK-DECOUPLE, TRIGGER-CROSSING-RECORD, SPINE-WEAVE-PAYOFF ×2, MAP-ERA-PROGRESS-RICHER + content
  QA ×4. CI all green; CodeRabbit pass + 0 unresolved threads; Amazon-Q + Gemini reviews positive, no
  actionable findings. Self-squash-merged. Synced main, deleted the branch.
- [x] **POST-MERGE-VERIFY #106 — DONE.** Release + CD + CodeQL on main all SUCCESS after the #106 merge —
  release 0.22.0 shipped + deployed clean (the deepened spine is live).
- [x] **WV-3-YUKA step 1 — DONE (commit fba598c): divergence audit + g9 apex bug.** Audited 8 seeds of the
  same founding comp → FINDING: the saga path is near-IDENTICAL across seeds (same end/year/gens/money/
  convergence; only family-alive varies) — the Suzerain trap, measured (the seeded market substrate is inert
  on the saga clock). Also caught + fixed: g9's terminal close carried no succession, so a fully-succeeded
  line wrongly fell to line-extinct instead of the `apex` stars ending (now reachable + guarded). Spec
  §AUDIT-RESULT + §DECISION.
- [x] **WV-3-MORTALITY — DONE (commit 28df954).** Seeded, era-weighted disruption hazard (src/sim/sagaShock.ts:
  rollSagaShock) on year-advancing saga ticks: takes a non-protagonist member (family_death) or blows a meter
  (plague/fire/scandal/betrayal/+heat). Wired into advanceRunClock beside advanceFamily; stamps a
  `shock:<kind>:<year>` flag. Pure+seeded → replay bit-identical (save round-trip green). RESULT: the
  divergence audit's saga path now spreads (moneyDistinct 1→6, familyAlive varies) — Suzerain trap broken on
  the saga path. Tests: sagaShock.unit + audit assertions. 847 node + 110 browser green.
- [x] **WV-3-SHOCK-SCENES — DONE (commit 110e99e).** A shock now NARRATES its loss: rollSagaShock gains
  shockNote() (one-line era-neutral aftermath per kind); loop.ts holds it as a transient (lastShock) surfaced
  as GameView.shock, set when a shock fires + cleared on the next move (one-turn). PlayScreen renders a
  red-accented `.shock-aftermath` line above the scene. (Year-suffixed `shock:*` flags made scene-`requires`
  gating impractical, so a transient view note is the cleaner surface than a gated interstitial.) Tests:
  sagaShock.unit shockNote + loop.unit + PlayScreen.visual. 851 node + 111 browser green.
- [x] **WV-3-RIVAL-REACT — DONE (commit 4e5a4d1).** advanceWorld takes an optional PlayerVantage (rung +
  strategy); a rival on the SAME strategy within one rung of the player is a DIRECT COMPETITOR and escalates
  (+25 climb chance) to contest the same ground — so the player's position perturbs the rival world + the
  convergence race differently per run, not just static motivators. loop.ts passes the vantage from
  playerRung() + strategyForArchetype(archetype). Deterministic (fixed bonus, seeded roll). Test:
  dynastyWorld.unit WV-3-RIVAL-REACT. Both halves of WV-3-YUKA (mortality shocks + reactive rivals) now built.
  848 node + 110 browser green.
- [x] **SPINE-CONTENT-QA-4 — DONE (commit d35c7c4, pushed to PR #106).** Full uniqueness scan of all 30
  interstitials. Opening sentences + beat openers already varied (0 first-3-word opener repeats; 54/60
  distinct beat openers). CAUGHT: the reversal SECOND paragraphs shared one skeleton — 9/10 opened "The [X]
  ahead —". Rewrote all to distinct structures → 10/10 distinct 2nd-para openers. Prose-only, idempotent.
- [x] **SPINE-WEAVE-PAYOFF-4 — DONE (no-op by design, same finding as PAYOFF-3).** Enumerated all 12
  mid-weight reversal flags vs the remaining un-flag-gated branches. NO genuine match: every remaining branch
  is an ARRIVAL vignette that already fires unconditionally (once-arrival on era+year) or the open baghdad
  merchant-house — a flag rule surfacing them adds nothing; the priorCrossing-gated returns are already
  covered by PAYOFF/PAYOFF-2. Per "never blanket-wire," NO rule added. The reversal flags still matter via
  their motivatorShifts. (If branches needing an alternative unlock are authored later, these flags are the
  natural gate.)
- [x] **SAGA-VL-INTEGRATE — DONE (live screenshot pass on dev :5175).** Walked the full founding funnel
  end-to-end in the running build and READ every screen: title (luxury Playfair/Garamond gold-on-navy) →
  REGION → POWER BASE (all 6, scannable) → STANDING → NAMING (11 lanes) → SURNAME → GENDER → GIVEN → 3 FS-7b
  life-seeds → PLAY SCREEN. The deepened spine reader renders correctly: act title, the g0 founding PORTRAIT
  (period engraving — portraits confirmed back), the open-scene prose with the founder's name woven in
  ({given_name} substitution works), TAP-TO-CONTINUE for decisionless scenes, the right-rail tabs
  (Map/News/.../Dossier), DEV fast-forward footer. Prose is measured (~64ch) + scannable per
  [[dynasty-ui-conventions]]/[[suzerain-ui-reference]]. No app console errors (only a Chrome-extension
  message-channel noise, not the app). The Map per-generation/rival markers are covered by MapView.browser
  (110 green). No visual drift to fix.
- [x] **SPINE-DEPTH-EXTEND-MIDWEIGHT — DONE (commit 255f405).** Added a REVERSAL interstitial to the six
  mid-weight acts (g1/g2/g4/g5/g6/g7), bringing ALL 10 acts to the 7-scene shape (open → tex → decision →
  csq → rev → decision → close). Each new reversal is era-voiced, decisionless, distinct-opener (uniqueness
  lens). A full founding→stars run is now 70 scenes / 144 paragraphs / 95 beats ≈ 48 min at the conservative
  FLOOR — a careful/exploring player crosses the hour. The "hour or more" mandate is MET. Idempotent; 839
  node + 110 browser green.
- [x] **TRIGGER-CROSSING-RECORD — DONE (commit fd84582).** pickBeat/pickDecision now call
  recordTriggerCrossings against the engaged scene: every fired trigger branch stamps a
  `crossed:<family>:<branch>` flag (the existing crossedFlag convention). So `once` arrivals fire exactly
  once + the priorCrossing-gated RETURN branches unlock once their family was met — the Turtledove cast
  memory is real. Deterministic (stable sorted fired order, new-only flags, no RNG-label impact); save =
  seed+history reconstructs bit-identically. Shared firedTriggerBranches helper backs weave + record. Test:
  loop.unit TRIGGER-CROSSING-RECORD. 839 node + 110 browser green.
- [x] **SPINE-DEPTH-PLAYTEST — DONE (commit dbc45ef).** Permanent end-to-end measurement test
  (spineDepthPlaytest.unit). MEASURED a full founding→stars run: all 10 gens, 64 scenes, 132 paragraphs, 42
  beats (of 83 available), 22 decisions ≈ 44 min at a conservative single-read pace — up from ~15-20 min
  pre-depth, materially toward the hour+ (a careful/exploring player runs longer). Asserts g9-reach + a depth
  floor. If a future measurement wants the full hour locked in: a 4th interstitial on mid-weight acts or
  longer prose (decide from the figure).
- [x] **SPINE-WEAVE-PAYOFF-3 — DONE (no-op by design, enumerated + rejected).** Enumerated all 8 reversal
  flags vs the remaining un-flag-gated branches. FINDING: no genuine match exists. The remaining branches are
  either ARRIVAL vignettes that already fire UNCONDITIONALLY on era+year (so a flag rule surfacing them adds
  nothing — verified g3_broke_the_attack→padrone is redundant, padrone already fires in convergence/1880-99),
  or priorCrossing-gated returns already covered by PAYOFF/PAYOFF-2. Per the "never blanket-wire" rule, adding
  a meaningless duplicate rule would be the anti-pattern — so NO rule was added. The reversal flags still
  matter via their motivatorShifts (which accrete into convergence). If future branches are authored that
  NEED an alternative unlock, the reversal flags are the natural gate then.
- [x] **MAP-ERA-PROGRESS-RICHER — DONE (commit 04413e5).** MapView now plots a per-GENERATION marker (g0..g9,
  from the live family) sliding along the founding→stars axis + faint RIVAL dots per convergence line on the
  same rung axis, with a caption naming the leading rival. Optional props from PlayScreen's existing
  view.rivalStandings/view.rung; renders gracefully from gameState alone. Tests in MapView.browser.
- [x] **SAGA-CLOCK-DECOUPLE — DONE (commit dcdc83b, root-caused by stuck-loop-debugger).** ROOT: generation
  advanced ONLY as a side-effect of the protagonist dying in advanceFamily's per-YEAR mortality loop — so it
  scaled with years, and the clock ticked 1y/scene. FIX: pickBeat advances 0 years (texture passes no time);
  a succession pickDecision begins the next-gen act, then deterministically promotes the heir via the new pure
  `succeedToHeir` and advances SAGA_GENERATION_SPAN=25y at once. Generation now steps per-DECISION, not per
  mortality roll — replay bit-identical. Tests: 2 SAGA-CLOCK-DECOUPLE regressions + DEPTH-3 updated. 834 node
  green. This unblocks depth-2.
- [x] **SPINE-ACT-DEPTH-2 — DONE (commit 389e442; stale duplicate of the entry above, reconciled).** The 4
  heavy-act reversals (g0/g3/g8/g9) shipped, then EXTEND-MIDWEIGHT (255f405) extended the reversal to all 10
  acts. FS-8 founding→stars reaches g9 with the deeper acts; ~48 min playtest. (This lower copy was a leftover
  from an in-place edit; marked done to match reality — the canonical record is the entry above.)
- [x] **SPINE-WEAVE-PAYOFF — DONE (commit abe608e).** Enumerated the payoff channels: (1) the interstitial
  beats' motivatorShifts ALREADY accrete into the run + the convergence ending (real, by design); (2)
  convergence flag-gating REJECTED — it's deliberately motivators-pure; (3) the trigger lattice is the
  designed home for "a flag surfaces downstream woven content." Wired 2 thematically-matched, flag+era(+year)
  gated rules: g6_shaped_the_narrative → ashkenazi_jewish founding_of_hollywood; g3_bought_the_influence →
  italian syndicate_crossroads (1920-1960). Tests assert each fires its branch + respects its window.
  More matched rules are incremental backlog (the PATTERN is the unit). Spec §SPINE-WEAVE-PAYOFF.
- [x] **SPINE-CONTENT-QA — DONE first pass (commit 73942c2).** Audited the 20 interstitials vs the uniqueness
  lens: texture openers well-varied (each grounds in its era's concrete sensory detail); found 6/10 CONSEQUENCE
  openers sharing one skeleton ("[decision] [committed/taken], {given_name}…") and rewrote g3/g6/g7/g8/g9 to
  enter through different doors (newspapers/switchboard/dashboards/shipyard-thrum/tactical display) → 1/10.
  Remaining backlog: a deeper rhythm/scannability pass on the BEAT prose + cross-act sentence-skeleton scan
  with the Suzerain reference ([[suzerain-ui-reference]]) — fold into SPINE-CONTENT-QA-2 below.
- [x] **SPINE-WEAVE-PAYOFF-2 — DONE (commit b42a743).** Added 3 more thematically-matched flag→branch rules:
  g2_kept_faith_with_kin → ireland machine_politics_return; g7_gathered_everything → chinese
  exclusion_and_after; g4_co-opted_the_reform → bavaria the_great_war_rupture (1914-1933 window). Each flag +
  era/year gated, tested (fires in-window, inert out). 5 of the 10 family branches now carry a matched
  interstitial-flag gate. (scandinavian arrival + baghdad merchant_house remain — no clean flag match yet;
  leave them unforced per the "never blanket-wire" rule.)
- [x] **SPINE-CONTENT-QA-2 — DONE (commit 3cfdf58).** Cross-act skeleton scan of the 40 interstitial weave-beats
  found the first beat of nearly every interstitial opening with the same perception-verb skeleton ("You
  watch" 5×, "You read" 3×, "You walk" 3×). Diversified the clustered openers (object-first / sensation-first
  / action-first) → 35 distinct first-2-word openers across 40 beats, dominant skeleton gone. Remaining
  follow-on backlog (deeper sentence-rhythm + the new depth-2 reversal prose) folds into a future QA pass once
  depth-2 lands.
- [x] **SPINE-CONTENT-QA-3 — DONE (audit pass, no fixes needed).** Audited the 4 depth-2 reversal scenes vs the
  uniqueness lens: opening sentences enter through 4 distinct era-grounded media (a telegram / a whisper of
  light / midnight news / a red bloom on the status board); beat-1 openers all distinct. Across ALL 24
  interstitials: 22 distinct opening-sentence first-2-word starts (only "After the"/"From the" twice), and
  48 beats with 42 distinct 2-word openers, zero 3×+ repeats. The reversals were authored with deliberate
  variety — no templating to fix. (A deeper full-sentence-rhythm pass remains optional future polish.)
