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

## ★★TOP PRIORITY — SHOW-DON'T-TELL VISUAL DOSSIERS (user, 2026-06-23, NEW HIGHEST-ORDER)★★

**Mandate (verbatim):** "right now we have a LOT of tell and very little show. exploring ideas like
intelligence dossiers / research dossiers / marketing r&d based on the context of the dynasty path, as
distinct visual pieces with text but also charts graphs maps and other visual anchors and set pieces would
be AMAZING layered onto the existing directives." + "create full scene transition pieces" + content = HYBRID
(real data viz + GenAI path-voice prose + GenAI atmospheric art) + PROCESS = MILESTONE PRs not slices
([[one-branch-local-review]], [[show-dont-tell-visual-dossiers]]).

SPEC: docs/superpowers/specs/2026-06-23-visual-dossiers-design.md. BUILD AS ONE MILESTONE on this long-running
local branch `feat/visual-dossiers`; full local gate + reviewer trio per commit folded forward; ONE remote PR
when the WHOLE milestone is solid — NOT a PR per VD-step.

- [x] **VD-1 BRAINSTORM → SPEC — DONE.** Wrote the visual-dossier design spec (hybrid content, all placements,
  the Dossier typed-panel model, path→kind mapping, the interstitial scene-transition headline, the GenAI
  brief+figure pipelines reusing the portrait/scarcity infra). User gave the design inputs; building per the spec.
- [x] **VD-2 Dossier content model + read-model selectors — DONE (branch feat/visual-dossiers).** Pure
  `src/sim/dossier/dossier.ts`: `DossierKind` (7, path-keyed), `Dossier`/`DossierPanel`
  (chart/graph/map/figure/brief), `dossierKindForArchetype` (total over the 7 paths incl. crime), `buildDossier`
  mapping live state → a real meter-trajectory CHART + the rival-field GRAPH + the era-reach MAP + the figure/brief
  KEYS (`dossierFigureKey`/`dossierBriefKey`, deterministic). Pure (no DOM/Date/random). 7 unit tests. check 0,
  typecheck 0/0.
- [x] **VD-3 panel components + DossierView — DONE (branch feat/visual-dossiers).** `src/ui/dossier/`: ChartPanel
  (uPlot, reuses StatsView's chart), GraphPanel (SVG rival network, player-centered, adapts ButterflyGraph),
  MapPanel (era-reach strip), FigurePanel (Imagen image + EI-9d onerror fallback), BriefPanel (path-voice prose +
  pending state) + DossierView briefing-spread (masthead + magazine grid, Suzerain scannability). 4 browser tests;
  LIVE-VERIFIED via screenshot READ: the crime "Intelligence Dossier · MID-CENTURY" renders a real Reputation/Heat
  chart + the You-centered rival graph + the 1776→Mid-C reach strip. check 0, typecheck 0/0, browser 166.
- [x] **VD-4 DossierInterstitial placement — DONE (branch feat/visual-dossiers).** At a GENERATION boundary
  (view.saga.ended), PlayScreen now fires the path-keyed DossierView set piece (a "state of the dynasty" briefing —
  real meter trajectory + rival field + reach, built purely from the live view via buildDossier + buildMeterSeries)
  in place of the one-line "generation closes" interlude. check 0, typecheck 0/0, PlayScreen visual tests 26. (e2e
  walk of the boundary + a richer continue affordance fold into VD-6/VD-7.)
- [x] **VD-5 GenAI brief + figure PROMPTS — DONE (branch feat/visual-dossiers).** `src/sim/dossier/dossierGenai.ts`:
  `buildDossierBriefPrompt` (path VOICE per kind — consigliere intel / visionary R&D / magnate portfolio / star
  marketing / statesman war-room / prophet doctrine / champion scouting — × era register + the run's state digest,
  with the far-future SCARCITY stake folded in), `dossierBriefSystem` (leak-safe: no real names, {family_name}, a
  briefing not prose), and `buildDossierFigurePrompt` (a NO-PEOPLE establishing PLATE per kind in the signature
  engraving style — cohesive with portraits/map). Pure + deterministic. 5 unit tests. check 0, typecheck 0/0.
  (The runner WIRING — resolving the keys through the text/Imagen on-demand cache — lands in VD-6 end-to-end.)
- [x] **VD-6 ONE full path end-to-end — DONE (branch feat/visual-dossiers).** The economic founding "Holdings &
  Market Dossier" composes the HYBRID: the real generated counting-house figure plate (scripts/genai-dossiers.ts) +
  the path-voice brief + the real Reputation/Money trajectory chart + the rival graph + the reach strip — LIVE-
  VERIFIED via screenshot READ (a complete, designed briefing set piece). The figure pipeline + FigurePanel +
  DossierView all integrate. The BRIEF is now wired too: keyed kind×era (run-independent, generated OFFLINE into
  src/data/dossierBriefs.json by genai-dossiers.ts, loaded at runtime via loadDossierBrief — no API at sim runtime,
  like the scene corpus), with a defensive JSON-unwrap on the model reply. LIVE-VERIFIED: the founding dossier now
  shows the REAL magnate assessment ("The {family_name} interest remains concentrated in the mid-Atlantic shipping
  lanes…second tier of the republic's financial hierarchy…"). 5 browser tests.
- [x] **VD-7 tab upgrade + all founding-era paths — DONE (branch feat/visual-dossiers).** (a) The Dossier TAB now
  renders the rich path-keyed DossierView (the same set piece the generation boundary fires) instead of the old
  meter-bar list — a full SHOW surface on demand. (b) Generated the founding-era figures + path-voice briefs for ALL
  7 dossier kinds (portfolio/intelligence/rnd/marketing/warroom/doctrine/scouting) — READ-verified the crime intel
  plate (a red-marked surveillance waterfront) is path-distinct from the economic counting-house. Fixed the asset
  schema to allow `dossier-figure`. Gate: check 0, unit 995, browser 167. The decision-aid placement + the other
  ERA bands' dossier assets are a follow-up (the on-demand cache + EI-9d fallback cover ungenerated keys).
- [x] **VD-8 MILESTONE PR — OPENED #200.** The visual-dossier milestone (VD-1…VD-7, 14 commits) is comprehensively
  locally reviewed (full gate green: check 0, typecheck 0/0, unit 995, browser 167, e2e 7) + the reviewer trio
  (code-reviewer + simplifier) findings folded forward (ChartPanel double-destroy, typed predicate, dead-seed
  removal, era-band DRY via ERA_BAND_ORDER, fence-regex). One PR for the whole milestone per [[one-branch-local-review]].
- [x] **#200 (visual dossiers) — MERGED (squash 317e533).** VERIFIED main has src/sim/dossier/ + src/ui/dossier/ +
  the 7 founding dossier figures (no stale-head recurrence — clean tree at merge). The whole VD milestone is on main.
  Now on a fresh branch feat/ga-news for the first GenAI-expansion milestone.

## ★FULL GENAI-SURFACE EXPANSION (user 2026-06-23: "are we SURE you have FULLY explored all the areas for genai?")★
AUDIT (honest, this session): currently GenAI is used for TEXT (gemini-3.5-flash: scene/act prose, the QA
editor, spine gen, retitle, + the VD dossier briefs) and IMAGE (imagen-4.0-fast: the portrait matrix + the VD
dossier figures). NOT yet used, though the visual-layer spec called for "imagery + VIDEO":
- [x] **GA-VIDEO — GenAI video (Veo) cinematics — BUILT (branch feat/ga-video, commit b85c6e8).** GV-1 pure
  `src/sim/cinematic/genaiCinematic.ts` (buildHandoffPrompt per era band + buildFinalePrompt per ending outcome +
  cinematicKey; the engraving-chronicle CINEMATIC_STYLE; 5 unit tests). GV-2 `geminiGenerateVideo` (Veo
  long-running op polled → mp4 bytes, bounded maxPolls; inline videoBytes OR fetch the uri) + scripts/genai-cinematics.ts
  (offline, idempotent, --handoff/--finale/--force). GV-4 CinematicView `<video>` (hide-on-error) wired into the
  PlayScreen generation boundary (handoff, above the dossier) AND LegacyReport (finale, keyed by convergence.destination);
  2 browser tests (src maps key, hide-on-error). Gate: check 0, typecheck 0/0, unit 1011, browser 170.
  GV-3 (live Veo generation): BLOCKED in this env (no GEMINI_API_KEY) — pipeline proven, runtime degrades gracefully
  when the mp4 is absent (browser test); generates offline when a key is present, like the portrait/dossier/news/music
  pipelines. Reviewer trio folded forward (1f0d38d): code-reviewer clean+2 low-sev folded (CLI flag validation,
  Veo op-error/timeout surfaced); simplifier clean.
- [x] **GA-VIDEO PR #205 — MERGED (squash 5e29211); v0.63.0 cut.** First CI pass GREEN; amazon-q CWE-598 (Veo uri
  fetch leaked the key via `?key=`) → fixed (ff68ed8: x-goog-api-key header) + thread resolved; re-run GREEN;
  squash-merged CLEAN. VERIFIED main has src/sim/cinematic/ + CinematicView wired into PlayScreen+LegacyReport +
  the x-goog-api-key fix. Three GenAI-expansion milestones now shipped (GA-NEWS #202, GA-MUSIC #203, GA-VIDEO #205).
- [x] **GA-MUSIC — GenAI era-shifting score (Lyria) — BUILT (branch feat/ga-music).** GM-1 pure
  src/sim/music/genaiMusic.ts (buildMusicPrompt + the 10 ambient-track slots, era moods, loopable/instrumental;
  5 tests). GM-2 `geminiCaptureMusic` (Lyria realtime-stream → PCM capture) + scripts/genai-music.ts (PCM→WAV);
  AudioEngine.setEra now chains .ogg → .wav → synth-chord so the GenAI beds drop into the existing era slots. GM-3
  captured ALL 10 era tracks (boyhood→redplanet, real ~16-24s Lyria beds, verified non-silent). GM-4: engine.audio
  tests exercise the .wav fallback; the era bed shifts via the existing setMusicEra wiring (no new wiring). Gate:
  check 0, typecheck 0/0, music unit 5, engine.audio 5. NEXT: local review trio + ONE PR.
- [x] **GA-MUSIC PR — local review folded, PR OPENING.** Code-reviewer folded: the HIGH era→track namespace bug
  (beds were dead on the saga path — fixed via trackForEra + a new eras test) + the MEDIUM capture stop() guard.
  Gate: check 0, typecheck 0/0, unit 1006, audio browser 8, e2e 7. PR #203 OPENED. Remaining GA-*
  below + EI-9g each their own fresh-branch milestone, gated on the #203 merge.
- [x] **#203 (GA-MUSIC) — MERGED (squash cdc4a67).** VERIFIED main has src/sim/music/ + 10 .wav tracks +
  trackForEra. Two GenAI-expansion milestones now shipped (GA-NEWS #202, GA-MUSIC #203). On feat/ga-video next.
- [x] **GA-TTS — period-voice narration of the bookend beats — BUILT (branch feat/ga-tts, commit c4bef5b).** A short
  era-true read frames the FOUNDING + FINALE (register shifts founding→stellar). Like the dossier brief, it's the
  run-independent framing (UI shows the name), keyed beat×era + generated OFFLINE (Gemini TTS → cached .wav), never at
  sim runtime. GT-1 pure genaiNarration.ts (narrationText/Voice/Key + allNarrationJobs, 2 beats × 8 bands; 4 tests).
  GT-2 geminiGenerateSpeech (AUDIO modality + prebuilt voice → 24kHz PCM) + scripts/genai-narration.ts (PCM→WAV,
  --beat/--era/--force). GT-3 AudioEngine.playNarration (one-shot, silent fallback pre-start/muted/missing; engine.audio
  test) + sound.ts facade; LegacyReport fires the finale read on mount (no-visual-impact override — audio-only side
  effect). Gate: check 0, typecheck 0/0, unit 1022, browser 175. Live-synth BLOCKED here (no key) — degrades silently.
  Reviewer trio CLEAN (code-reviewer incl. security pass: SDK auth no key-leak, null-safe, totality; simplifier clean).
- [x] **GA-TTS PR #211 — MERGED (squash 22fb37d); v0.66.0 cut.** Reviewer trio clean (incl. security pass); CI green;
  merged CLEAN + verified on main (src/sim/narration/ + AudioEngine.playNarration). SEVEN GenAI-surface milestones
  shipped (GA-NEWS #202, GA-MUSIC #203, GA-VIDEO #205, GA-MAP-ART #207, GA-DOSSIER-DIAGRAMS #209, GA-TTS #211).
- [x] **GA-NEWS — GenAI period DISPATCHES — BUILT (branch feat/ga-news).** GN-1 pure `src/sim/news/genaiNews.ts`
  (buildNewsDispatchPrompt + newsDispatchKey, era × mood, leak-safe, JSON-unwrap defense). GN-2 loadNewsDispatch +
  a NewsTicker "Dispatch" layer (term-resolved). GN-3 scripts/genai-news.ts generated ALL 24 era×mood dispatch sets
  (8 bands × 3 moods × 3 headlines) — READ-verified period-true ("A NEW POWER IN THE NEW REPUBLIC: The Meteoric and
  Envied Rise of the {family_name} Interest"). GN-4 NewsTicker browser test + the PL-11 quiet-world test updated for
  the new layer. Gate: check 0, typecheck 0/0, unit 1000, browser 168. FOLLOW-UP: thread the live rung-trend into the
  `mood` prop (PlayScreen passes "steady" today). THEN local review trio + ONE PR ([[one-branch-local-review]]).
- [x] **GA-NEWS PR — MERGED #202 (squash 20c61dd).** Reviewer trio folded (moodForRanks cross-ladder bug,
  toHeadlines trailing-md, PL-11 testid). VERIFIED on main (src/sim/news/ + 24 dispatch keys). The first
  GenAI-expansion milestone is shipped.
- [x] **GA-MAP-ART — GenAI cartographic base per era — BUILT (branch feat/ga-map-art, commit 1081a0d).** The MapView
  base was a fixed 1700s chart for the whole founding→stars journey. GM-1 pure src/sim/genai/mapArt.ts (buildMapPrompt
  + mapKey + allMapJobs, one period register per era band, engraving-chronicle MAP_STYLE base-only; 3 tests). GM-2
  scripts/genai-map-art.ts (offline Imagen per band, --era/--force). GM-3 MapView loads map_<eraBand>.png for the
  current era with a graceful onerror chain (era base → founding base → hide → CSS); seeded map_founding_1700s.png from
  the existing founding base so the founding era loads directly; 2 browser tests (era tracks base; fallback). assets.json
  license entry. Gate: check 0, typecheck 0/0, unit 1014, browser 172. Live-gen of the other 7 bands BLOCKED here (no
  key) — degrades to the founding base until generated. NEXT: reviewer trio (running) folded → ONE PR.
- [x] **GA-DOSSIER-DIAGRAMS — GenAI informational diagrams in the dossiers — BUILT (branch feat/ga-dossier-diagrams,
  commit cb8202d).** The dossier had data-viz + atmospheric figure + prose but no INFORMATIONAL diagram. Added a
  { type:"diagram"; key; caption } panel + dossierDiagramKey (kind×era) + per-kind caption (dossier.ts); a period-true
  SCHEMATIC prompt per kind (buildDossierDiagramPrompt: R&D tree, surveillance chart, capital-flow, order-of-battle…,
  no people/no baked text — the panel captions it; dossierGenai.ts); FigurePanel grew an optional caption → the
  captioned diagram variant (DossierView renders the full-width cell); genai-dossiers.ts also generates the diagrams
  (kind×era, license-logged). Tests: unit (key + per-kind prompt + era-keying + caption) + browser (captioned diagram
  renders + hides on error). Gate: check 0, typecheck 0/0, unit 1018, browser 174. Live-gen BLOCKED here (no key) —
  degrades via hide-on-error. Reviewer trio CLEAN (code-reviewer + simplifier, no findings to fold).
- [x] **GA-DOSSIER-DIAGRAMS PR #209 — MERGED (squash 047d5b1); v0.65.0 cut.** Reviewer trio clean; CI green; merged
  CLEAN + verified on main (the diagram panel + buildDossierDiagramPrompt). SIX GenAI-expansion milestones shipped
  (GA-NEWS #202, GA-MUSIC #203, GA-VIDEO #205, GA-MAP-ART #207, GA-DOSSIER-DIAGRAMS #209).
- [x] **GA-ENCOUNTER-PORTRAITS — rival-line head portraits on the Field — BUILT (branch feat/ga-encounter-portraits,
  commit 7198f54).** buildEncounterPortraitPrompt/encounterPortraitKey existed (EI-8d) with no consumer. Now the
  convergence Field has faces: rivalEncounterFacets(rivalId, eraBand) (pure, deterministic — role=line identity,
  adult, current era, gender = a stable FNV-1a hash of the id, never Math.random) drives a small era-true head per
  RivalDossier row (hide-on-error; PlayScreen passes the era). scripts/genai-encounter-portraits.ts sweeps every
  eligible rival place × era band offline. Tests: unit (deterministic facets + roster spans both genders) + browser
  (head src + hide-on-error + none without era / on the player row). Gate: check 0, typecheck 0/0, unit 1024, browser
  177. Live-gen BLOCKED here (no key). NEXT: reviewer trio (running) folded → ONE PR.
  DECISION (log, [[never-ask-direction]]): sequenced after the VD milestone — GA-NEWS + GA-MUSIC first (highest
  feel-per-effort), then GA-VIDEO finale, then the rest. ALL SEVEN GenAI-surface milestones now built.

## ★GenAI-surface expansion COMPLETE — next: holistic verification + live asset generation★
- [x] **GA-ENCOUNTER-PORTRAITS PR #213 — MERGED (squash 8112d89); v0.67.0 cut.** Reviewer trio clean; CI green; merged
  CLEAN + verified on main (rivalEncounterFacets + the RivalDossier head wiring). ALL SEVEN GenAI-surface milestones shipped.
- [x] **GENAI-VERIFY-1 — holistic GenAI-surface audit — BUILT (branch feat/genai-verify, commit 2981451).** Read-only
  audit of all 7 surfaces' runtime fallbacks: news/music/video/map/dossier-diagrams/tts/encounter-portraits + the dossier
  brief ALL degrade gracefully on a missing key-gated asset (no throw / broken-image / empty panel) — verified per
  file:line. (b) docs/genai-surfaces.md written (the 7 surfaces, model tiers, offline-gen commands). (c) One polish
  folded: FigurePanel now unmounts the WHOLE figure (img + caption) on error (was a captioned empty space). Gap
  enumeration: the only remaining GenAI work is producing the LIVE assets (key-gated). Gate: check 0, typecheck 0/0,
  browser 177. NEXT: reviewer (running) → ONE PR.
- [ ] [WAIT] **GENAI-VERIFY-1 PR — merge on green (after open).** Gated on the open PR's CI + threads.
- [ ] [WAIT] **APP-RUNS-VERIFY — live smoke of the app + all 7 GenAI fallbacks in a real browser (next milestone, own branch GATED on the GENAI-VERIFY-1 PR merge).**
  Doctrine DoD: "tests pass" ≠ "app runs". Run `pnpm dev`, drive a founded line through a generation boundary +
  the Field/dossier/map/news tabs + a finale, screenshot each, READ the screenshots, confirm every GenAI surface
  renders its graceful fallback (no broken-image/empty-panel) with NO assets generated. Record findings + fix any
  real visual break. Milestone branch, ONE PR. (chrome-devtools-mcp / the repo's Playwright e2e as the harness.)
- [ ] [WAIT] **GENAI-GENERATE — produce the live cached assets (BLOCKED: needs GEMINI_API_KEY in the env).** Run the
  seven offline scripts (genai-news/music/cinematics/map-art/dossiers/narration/encounter-portraits) to fill the
  caches, READ-verify a sample of each, commit the assets. True blocker here (no key); un-WAIT when a key is available.
- [x] **GA-MAP-ART PR #207 — MERGED (squash ece0be9); v0.64.0 cut.** Reviewer trio folded; CI green; squash-merged
  CLEAN. VERIFIED main has src/sim/genai/mapArt.ts + the MapView era-base wiring + map_founding_1700s.png. Five
  GenAI-expansion milestones now shipped (GA-NEWS #202, GA-MUSIC #203, GA-VIDEO #205, GA-MAP-ART #207).

## ★TOP PRIORITY — EMERGENT-INFANCY ONBOARDING (user, 2026-06-23, HIGHEST-ORDER — outranks everything)★

**Mandate (verbatim intent, two messages):** "i counted TEN choices before you even start. ALL could
have been woven into the fabric of the journey either at the beginning middle or end of the first act.
by removing formative years from infancy we remove diegetic sensory experience of some of those and keep
them from emerging naturally. also instead of choices being sentences WITHIN scannable dialogue glowing
and bigger sized we're still showing them below the paragraph of text just... without buttons. also by
offering THREE locations to start at you force needing to write three competing storylines for at least
part of the act. would be better to EMERGE location based on sensory experiences of the newborn that
crystallize into an awareness of surroundings. what does the baby hear? smell? touch? taste? … also what
is the first friend like? first betrayal? first loss? first romance? early schooling?"

**The problem (confirmed by my own ONBOARDING-SCREEN-SHOT / FUNNEL-FULL-WALK screenshots this session):**
the founding identity is chosen up-front as a ~10-step MENU funnel (region → power base → standing →
naming tradition → surname → gender → given → life-seeds). That is the opposite of the diegetic,
seed-dealt, *discovered-through-birth* identity the game's own CLAUDE.md promises ("identity is composed
from PLACE × CULTURE × ERA × ARCHETYPE … discovered through a diegetic, seed-dealt birth"). The Epoch-0
birth WAS that, and it was retired ([[mmm-epoch0-birth-beat]] / novel-acts cut-over) — which threw out
the formative-years sensory texture with it.

**THE FIX = UN-RETIRE EPOCH 0 (user correction, 2026-06-23):** "you were supposed to UN-RETIRE Epoch 0
as part of emergence — the emergence of the progenitor of the dynasty through infancy through adulthood —
and write real copy for it." Epoch 0 returns as the lived emergence opening (infancy → childhood →
adulthood), rebuilt on the saga/SceneReader substrate (NOT the old event chain), with REAL authored copy.
docs/STATE.md's "Epoch 0 — RETIRED" section gets un-retired when EI lands. Spec:
`docs/superpowers/specs/2026-06-23-emergent-infancy-onboarding-design.md` (EI-1, written).

**ART BAN — PRECISE (user corrections, 2026-06-23):** the ban is HAND-DRAWN SVG FIGURE ART ("a big stupid
sketch of a person as an SVG that looks like crayons"), NOT "procedural art" broadly. **SHADERS ARE NOT
BANNED — a shader is a shader; a gorgeous shader is wanted, do NOT retire ShaderBackdrop.** Portraits =
GenAI raster ([[visual-layer-revival]]). The one hard "no" is hand-drawn SVG people.

**The redesign — identity EMERGES through a lived infancy/childhood, not a menu:**
1. **No upfront choice menu.** Deal the seed; open IN the newborn's body. Identity facets surface as the
   child experiences the world, the player's reactions nudging (not picking) where ambiguous.
2. **Location crystallizes from the SENSES.** What the baby HEARS (gulls + harbor bells vs mill-clatter
   vs cicadas over tobacco rows), SMELLS (cod-and-brine vs coal vs river-mud), TOUCHES (rough wool vs
   linen vs bare-board floor), TASTES — these resolve INTO an awareness of place. One emergent location,
   not three competing picked storylines (which would force writing three Act-1 branches).
3. **Choices are GLOWING INLINE dialogue** — bigger, scannable, woven INTO the prose (the Suzerain
   pattern, [[suzerain-ui-reference]] / SceneReader inline-glow), NOT plain sentences dumped below a
   paragraph "without buttons." (The SceneReader already has glowing inline options for saga beats — the
   ONBOARDING/opening must use that same surface, not the .card/.choices button-list menu.)
4. **Restore the formative-life beats as emergent diegetic moments** woven across Act 1's beginning /
   middle / end: first friend, first betrayal, first loss, first romance, early schooling — each a SCENE
   that both gives sensory/social texture AND lets an identity facet (power base, standing, naming, the
   line's bent) crystallize from how it's lived, rather than be declared on a card.
5. **The ~10 facets all still get SET** — just woven, not front-loaded: region/place (from senses, beat 1),
   standing + power base (from the family's circumstances + the child's early inclinations, mid Act 1),
   naming/surname/gender/given (named in-fiction as they would be — at the naming beat, by the parents),
   life-seeds (from the formative beats). foundByComposition stays the pure seam; the funnel feeding it is
   replaced by the lived opening's accumulated choices/flags.

**This is a milestone, not a one-PR fix.** Step 1 of the unit (per agent-state doctrine) = USE-CASE
ENUMERATION before code: list every identity facet the current funnel sets + where in a lived Act-1 each
could emerge (sense / family-circumstance / formative-beat / naming-beat); read the retired Epoch-0 spec
([[mmm-epoch0-birth-beat]], docs/STATE.md "diegetic birth (Epoch 0) — RETIRED") to mine its sensory-cue
→ place mechanic; design the DATA MODEL for an emergent-opening act (how senses accumulate into a resolved
place; how formative beats set life-seeds/flags) and write the decision into a spec doc BEFORE building.
Then build the opening act, wire it to foundByComposition, retire the .card funnel, ship behind the gate.

### EMERGENT-INFANCY queue (work top-down; expand as use-case enumeration surfaces sub-steps)
- [x] **EI-1 USE-CASE ENUMERATION + SPEC — DONE.** Wrote
  `docs/superpowers/specs/2026-06-23-emergent-infancy-onboarding-design.md`: the 10 funnel facets × where each
  emerges in a lived Act 1 (sense / family-circumstance / formative-beat / naming-beat); the data model
  (senseEmergence resolver → one place; formative beats on the saga substrate set facets via existing
  motivatorShift/flag accrual); 3 options → CHOSEN = **UN-RETIRE Epoch 0** as the progenitor's emergence
  infancy→adulthood, real authored copy, on the saga/SceneReader substrate (not the old event chain); EI-7/EI-8
  visuals; build order. Art-ban precision recorded: ban = hand-drawn SVG figures only; shaders are fine.
- [x] **EI-2 SENSORY-PLACE-RESOLUTION — DONE (branch feat/ei2-sense-place-resolution).** Pure
  `src/sim/founding/senseEmergence.ts`: `dealSenseCues(rng)` deals one diegetic cue per sense leaning to a
  founding region; `resolvePlace(cues, attendedSenses)` weights ambient + attended → ONE FoundingRegion (never a
  3-way pick). Sim-pure (RNG facade only); same seed + taps → same place; taps nudge. Test: senseEmergence.unit
  (cue shape / determinism / one-of-three / taps-nudge). The sim core for the SENSORY birth beat; EI-3 wires it
  into the Epoch-0 opening act on the SceneReader surface.
- [x] **EI-2 PR #182 — DONE, MERGED (squash 6e9307c; release 0.55.0).** senseEmergence resolver shipped; post-merge green.
- [x] **EI-3a EPOCH-0 BIRTH SCENE — DONE (branch feat/ei3-epoch0-opening-act).** Un-retired Epoch 0's FIRST scene
  on the saga substrate: `src/sim/founding/epoch0Opening.ts` `buildBirthScene(cues)` — a schema-valid Scene
  opening in the newborn's body (no menu, no place named) with the EI-2 sense cues as GLOWING INLINE beat-choices
  (each stamps `attend:<sense>`), real authored prose, and a MAJOR close decision through which the place
  crystallizes (resolvePlace reads the attend flags). Test: epoch0Opening.unit (schema-valid, sense beats,
  close decision, resolvePlace end-to-end). Flows `next: epoch0:naming`.
- [x] **EI-3b EPOCH-0 NAMING + CHILDHOOD SCENES (REAL COPY) — DONE (branch feat/ei3-epoch0-opening-act).** Authored
  `epoch0:naming` (parents name the child in-fiction via {full_name}/{given_name} tokens; a secondary first-
  disposition fork) + `epoch0:childhood` (the child reads the family's STANDING — established vs rising — diegetically)
  + `buildEpoch0Opening(cues)` returning the connected birth → naming → childhood chain. Real copy, saga-substrate
  scenes. Test: epoch0Opening.unit (naming tokens + named flag; childhood standing flags; connected chain). Flows
  `next: epoch0:formative` (EI-4).
- [x] **EI-4 FORMATIVE-BEATS (REAL COPY) — DONE (branch feat/ei4-formative-beats).** Authored the five named beats
  as real-copy saga scenes in `src/sim/founding/epoch0Formative.ts`: first friend → schooling → betrayal → loss →
  romance, chained from epoch0:childhood (next: epoch0:formative). Each sets a life-seed (`seed:*`) + nudges a power
  base (`power_lean:*`, the bent crystallizes from how it's lived); the romance close carries the kept succession
  hand-off (takesPartner) + `epoch0:emerged`. Wired into buildEpoch0Opening → the full birth→…→romance chain. Test:
  epoch0Formative.unit (5 beats schema-valid, seeds + leans, connected chain, succession close) + the opening chain
  test. EI-5 deepens naming; EI-6 wires the chain into the engine (retiring the funnel).
- [x] **EI-5 NAMING-IN-FICTION — DONE (branch feat/ei5-naming-in-fiction).** The Epoch-0 naming beat now speaks the
  GENDER diegetically too: added a `{child_kind}` term (son/daughter, from the protagonist's sex in terms.ts) and
  enriched `epoch0:naming` so the parents say "A {child_kind}" + give the name "in the family's own tongue" —
  surname/given (existing tokens) + gender + naming-tradition all named in-fiction, none on a card. The name facets
  flow from the live family via the term seam (foundByComposition stays the source of the names; EI-6 wires the
  emergent-opening state INTO foundByComposition). Test: terms.unit ({child_kind} son/daughter/unresolved) +
  epoch0Opening.unit (naming speaks {child_kind}).
- [x] **EI-6a EMERGENCE→FOUNDING BRIDGE — DONE (branch feat/ei6-wire-emergent-opening).** Pure
  `src/sim/founding/resolveEmergentFounding.ts`: turns the Epoch-0 emergence's accumulated FLAGS (attend:* →
  region via EI-2 resolvePlace; power_lean:* → most-leaned base; epoch0:standing_* → standing) into the
  `{region, base, standing}` the existing `resolveFoundingStart` consumes — so the lived opening feeds
  foundByComposition with NO card menu. Test: resolveEmergentFounding.unit (valid choice, tie-break, defaults,
  determinism, feeds resolveFoundingStart). 942 node green.
- [x] **EI-6b-sim OPENING RUNNER — DONE (branch feat/ei6b-wire-opening-live).** Pure
  `src/sim/founding/openingRunner.ts`: startOpening / chooseOpeningBeat / chooseOpeningDecision / openingEnded walk
  the buildEpoch0Opening scene chain (reusing the saga's pure applyBeatChoice/applyDecision accrual), a gathering
  beat stays in-scene, the romance close ends it; the accumulated flags + cues resolve a valid founding via EI-6a.
  Test: openingRunner.unit (start, gather-then-advance, FULL walk → founding, determinism). 946 node green.
- [x] **EI-6b-ui OPENING SCREEN + WIRE + RETIRE FUNNEL — DONE (branch feat/ei6b-ui-opening-screen).** New
  `src/ui/screens/OpeningScreen.svelte` drives the SceneReader through the pure opening runner (glowing-inline beats +
  decision), founding a PROVISIONAL line up front so the naming beat's {full_name}/{child_kind} tokens resolve, then on
  openingEnded handing the accumulated flags + dealt cues to App. App's New Game now opens it via `{#key pendingSeed}`
  (startNewGame draws a hidden seed → screen "opening"; birthGameFromEmergence runs resolveEmergentFounding →
  resolveFoundingStart → foundByComposition). The family name is SEED-DEALT region-independently
  (`dealFoundingSurname`, new onomastics export) so provisional == final founding name. Retired the OnboardingScreen
  funnel + its two tests; rewired SafeAreaAudit + reducedMotion + e2e to the new opening. Full gate green: check 0,
  typecheck 0/0, unit 950, browser 161, e2e 7, build OK.
- [x] **EI-7 PORTRAIT-TEXT-WRAP LAYOUT — DONE (branch feat/ei6b-ui-opening-screen, commit 29435b2).** The
  SceneReader portrait now FLOATS at the head of the prose block at every width: the scene text flows ALONGSIDE
  the engraving and continues DOWN BELOW it (a magazine wrap), not a portrait-block-then-text-block stack. Moved
  the portrait inside .scene-body (a float only wraps text within its own block); .scene-body carries the measured
  ~62ch reading column so the float sits inside the measure; shape-outside rounds the wrap to the plate. Verified
  live (mobile 412px screenshot — prose hugs the plate's left edge then reclaims the column below) + a structural
  test (float:right, shape-outside set, portrait precedes the prose in .scene-body).
- [x] **EI-PRESENTATION — portrait MEDIUM by era × station — DONE (code, commit 9319bc5; user 2026-06-23).**
  `presentationFor(eraBand, tier)` + `CHRONICLE_WRAPPER`: the composite/encounter prompts now render the era×station
  ARTIFACT (founding sketch→oil-miniature; Gilded-Age tintype-keepsake→gilt-framed-oil; …→volumetric→holographic
  state portrait among the stars), held cohesive by the chronicle wrapper. VALIDATED live: regenerated the Gilded-Age
  economic low (a worn tintype) vs high (a gilt-framed oil) — the medium reads station exactly per the user's miner-
  vs-robber-baron example (commit 02826ab). 18 unit tests.
- [x] **EI-9 PORTRAIT-MATRIX ADULT SWEEP — DONE.** The full ADULT matrix is generated across all 8 era bands × 7
  archetypes × 3 rung tiers × 2 genders (336 portraits) with the era×station presentation MEDIUM + scarcity
  inversion. READ-verified one low (humble medium) + one high (commissioned/physical medium) per band: founding
  charcoal-sketch→oil; federal silhouette→oil; Gilded-Age tintype→framed-oil; early-1900s snapshot→studio-photo;
  midcentury snapshot→color-studio; digital headshot; near_future hologram→PHYSICAL-OIL; stellar hologram→PHYSICAL-OIL.
- [x] **EI-9b digital_modern screen-native captures — DONE (commits 499e079, 9a94e10).** Added SCREEN_WRAPPER +
  `isScreenCapture`: digital_modern low/mid now route to a clean modern-photo wrapper (not the aged plate), HIGH
  stays chronicle. KNOWN LIMIT: Imagen renders "modern photo + accent border" as a phone/device frame and ignores
  the negative prompt — settled rather than prompt-fought (debug-stop-rule); the casual-vs-formal-vs-aged distinction
  reads regardless. A later post-crop pass could remove the device frame. 21 unit tests.
- [x] **EI-9c OPENING life-stage portraits — DONE (branch feat/ei9c-lifestage-encounter-portraits, PR pending).**
  The Epoch-0 emergence now shows a portrait that GROWS with the progenitor (birth/naming→infant, childhood/first-
  friend/schooling→child, late beats→youth) via `lifeStageForOpeningScene`; OpeningScreen passes the founding-era
  composite-key portrait to the SceneReader (magazine-wrapped, EI-7). Generated the founding infant/child/youth low
  portraits (period-correct children, humble sketch medium). LIVE-VERIFIED in Chrome: the birth scene shows the
  sketched founding infant beside "You are born…". Gate: check 0, typecheck 0/0, unit 982, browser 161, e2e 7.
- [x] **EI-9d portrait graceful-fallback — DONE (branch ei9c).** ENUMERATED the live non-adult demand: `age = year −
  birthYear` and each succession re-anchors birthYear (effects.ts), so every generation's protagonist ages
  child→youth→adult→elder through its span — PlayScreen DOES request non-adult life-stage keys across all eras the
  spine hits. Since the matrix is on-demand (not all keys pre-generated), the SceneReader portrait `<img>` now has an
  `onerror` that HIDES it (degrades to prose-only, no broken-image icon). Browser-tested (a missing asset hides the
  portrait). The on-demand cache (EI-8e) generates real keys at runtime; this is the missing-asset safety net.
- [x] **EI-9e founding life-stage seed + encounter-portrait DECISION — DONE (branch ei9c).** Generated founding_1700s
  ELDER economic low/mid (the founder aging) — with EI-9c's infant/child/youth + the adult matrix, the founding era
  (the opening + gen-0's whole span) has the full life-stage set; READ-verified the elder reads aged + period-correct.
  DECISION on encounter portraits: KEEP the Suzerain single-speaker pattern — the SceneReader portrait stays the
  PROGENITOR (the story is THEIR life); a formative-beat figure (first friend/betrayer) is woven in PROSE, not given a
  competing second portrait ([[intersections-woven-not-walls]]). Distinct-figure portraits belong to the dedicated
  RivalDossier / braid-crossing surfaces, not the main reader. So `buildEncounterPortraitPrompt` stays available for
  THOSE surfaces (future), not the scene reader.
- [ ] [WAIT] **#199 (EI-9c/9d/9e + EI-SCARCITY-STORIES) — merge on green.** Monitor bo55n1uio armed; CI re-running on
  d7877a8 (CodeRabbit pass, build-and-test pending). Merge once green + 0 threads, then VERIFY main has the EI-9c/9e
  files (lifeStageForOpeningScene, founding life-stage portraits) — [[gh-squash-stale-head-gotcha]] — sync main + fresh
  branch for EI-9f.
- [x] **EI-9f encounter-portrait consumer ANALYSIS — DONE (no live surface yet; infra ready).** Inspected the
  candidate surfaces: `RivalDossier` is a ROSTER (Standing = id/label/rung/trend — whole LINES, no era/year/gender,
  no single-figure focus), so a per-row avatar would be scope-creep, not the dramatic single-figure the encounter
  portrait is for. There is NO current surface where ONE encounter figure is the focus (rivals are lines in a list;
  formative-beat figures are woven in prose per the EI-9e decision). So `buildEncounterPortraitPrompt` has no live
  consumer yet — the infra stays ready (built + tested in EI-8d) for when a single-rival-head / braid-crossing FOCUS
  view is designed. Not force-fitting it into the roster. DECISION logged; the portrait milestone's live demand
  (progenitor life-stage portraits) is fully served.
- [ ] [WAIT] **EI-9g per-rival roster avatars (optional polish, post-#199)** — IF wanted: give each RivalDossier/RivalField
  row a small head-avatar keyed on the rival's wave + current era band + rung tier (pass the game year in; default
  gender), with the EI-9d fallback. Lighter than a focus portrait; a roster-glance enrichment. Lower priority than
  any narrative/gameplay work — pick up only if the portrait polish is the best next use.
- [x] **EI-SCARCITY-STORIES — post-scarcity narrative theme in the guidance — DONE (code, branch ei9c).** Added a
  `scarcity` field to the far-future era guidance (t4/t5 × poor/middle in guidance.json) naming the post-scarcity
  stakes (what STAYS scarce when all else is abundant: un-copyable physical artifacts, real presence, authentic line,
  legitimacy), and wove it into both the scene-generation prompt (`buildScenePrompt` eraBrief) and the QA editor brief
  (`scenePassBrief`) — so generated near_future/stellar acts foreground it instead of recycled money/land scarcity. 23
  scene unit tests (far-future tiers carry the stake, earlier tiers don't). FOLLOW-UP: when the spine acts regenerate,
  verify a stellar act actually reflects it (live-read a generated far-future act).
- [x] **EI-10 future-digital luminosity — DONE (commit e32b9cf).** Root cause: the aged-physical-plate
  CHRONICLE_WRAPPER fought the holographic medium. `wrapperFor(era,tier)` now uses a luminous void-ground
  ARCHIVE_WRAPPER for near_future/stellar low+mid (digital captures) + keeps CHRONICLE_WRAPPER for physical
  artifacts (all historical + the future-HIGH physical-oil flex). READ-verified: stellar mid now reads as a
  glowing translucent hologram; the digital-abundant vs physical-scarce contrast is stark. 20 unit tests.
- [x] **PR #194 (EI-6b-ui + EI-7 + EI-8 enumeration) — MERGED (squash aff10e5, release 0.62.0).** The lived
  emergence opening + portrait magazine-wrap + EI-8a–e are on main. Live-verified in Chrome (emergence opens on
  "You are born…", senses→4 glowing inline sense-choices→naming speaks "Gwendolyn Calloway"/"daughter"; portrait
  magazine-wraps). WARNING: the squash captured a STALE HEAD — it DROPPED EI-8f's PNGs + everything after
  (presentation/scarcity/EI-9/EI-10/EI-9b). Recovered in #197. [[gh-squash-stale-head-gotcha]].
- [x] **PR #197 — recovered EI-8c…EI-10 portrait work — MERGED (squash de2174c).** The full portrait demand matrix +
  presentation medium + scarcity inversion + 336 adult portraits are on main. VERIFIED post-merge: main has
  portrait.ts's `presentationFor`/`CHRONICLE_WRAPPER`/`SCREEN_WRAPPER` + 336 portrait_adult_*.png. Both feature
  branches deleted (local + remote); main synced clean. The whole EMERGENT-INFANCY milestone (EI-1→EI-10) + the adult
  portrait matrix is shipped. Now on a fresh branch feat/ei9c-lifestage-encounter-portraits for EI-9c.
- [x] **EI-8 ENUMERATE THE PORTRAIT-DEMAND MATRIX — DONE (spec).** Wrote the full demand matrix into the EI spec
  (docs/.../2026-06-23-emergent-infancy-onboarding-design.md §"EI-8 — the portrait-demand MATRIX"), grounded in the
  real enums: 5 LIFE-STAGES (infant/child/youth/adult/elder) × 8 fine ERA BANDS (founding_1700s…stellar, NOT the 4
  macro-acts) × 7 ARCHETYPES (the 6 ARCHETYPES + crime/cult [[crime-power-axis]]) × 3 RUNG TIERS (the 4×6 ladders →
  low/mid/high) × optional ENCOUNTER role. Composite cache key `portrait:<lifeStage>:<eraBand>:<archetype>:<rungTier>`
  (+ `:enc:<role>` variant, gender suffix); 1680-key protagonist space → generate-on-demand + cache, never blanket.
  Surfaced 6 build sub-steps (below).
- [x] **EI-8a ERA-BAND RESOLVER + 8-entry ERA_VISUAL — DONE (branch feat/ei6b-ui-opening-screen).** portrait.ts:
  `EraBand` type + `ERA_BANDS` table + pure `eraBandForYear(year)` (8 fine bands, inclusive upper bounds) +
  `ERA_VISUAL` grown 4→8 entries; `buildPortraitPrompt` now resolves the band from `act.year` (not the coarse
  macro-act). 9 unit tests (band boundaries + the 1790≠1990≠stars distinction + the prompt tracks the fine band).
  Gate: unit 954, browser 161, check 0, typecheck 0/0.
- [x] **EI-8b lifeStage + rungTier derivations — DONE (branch feat/ei6b-ui-opening-screen).** New pure module
  src/sim/genai/portraitFacets.ts: `lifeStageForAge(age)` (5 stages, inclusive bands, neg→infant) +
  `rungTierForRung`/`rungTierForState` (highest current rung across the ladders → low/mid/high). 7 unit tests
  (stage + tier boundaries, peak-across-ladders, empty-ladder=low). Gate: check 0, typecheck 0/0.
- [x] **EI-8c wardrobeFor(archetype, rungTier) register table (21 entries) — DONE (branch feat/ei6b-ui-opening-screen).**
  portraitFacets.ts: `PortraitArchetype = Archetype | "crime"` (a PORTRAIT-LAYER superset — the full crime POWER
  AXIS stays its own [[crime-power-axis]] milestone, NOT half-wired through every Record<Archetype> in the sim) +
  a 21-entry `WARDROBE` table + `wardrobeFor(archetype, tier)`. High-rung registers read as the user's named paths
  (CEO / celebrity / cult-leader / crime boss), deepening with rung. 10 unit tests (21-cell coverage + per-archetype
  tier scaling + named-path checks). Gate: check 0, typecheck 0/0.
  NOTE: adding `crime` to the SIM Archetype union (3 Record<Archetype> tables + callings + agents) remains the
  separate crime-axis milestone; EI-8c deliberately scopes to portraits only.
- [x] **EI-8d composite prompt + key + encounter variant — DONE (branch feat/ei6b-ui-opening-screen).** portrait.ts:
  `PortraitFacets` + `buildCompositePortraitPrompt`/`compositePortraitKey` (key `portrait:<lifeStage>:<eraBand>:
  <archetype>:<rungTier>:<g>`, wardrobe muted for infant/child) and `EncounterFacets` +
  `buildEncounterPortraitPrompt`/`encounterPortraitKey` (`portrait:enc:<role>:<lifeStage>:<eraBand>:<g>`, role
  token normalized). Signature engraving style rides every prompt. 14 unit tests. Gate: check 0, typecheck 0/0.
- [x] **EI-8e on-demand generate+cache layer — DONE (branch feat/ei6b-ui-opening-screen).** New
  src/sim/genai/portraitCache.ts: `PortraitCache` interface (has/get/put) + pure `resolvePortrait(key, prompt,
  cache, generate)` (cache-first, ONE generation per missing key, store-then-serve; nulls NOT cached so they
  retry) + `memoryPortraitCache`. Offline tooling — the sim only references keys, never calls a generator (sim
  purity). 4 unit tests (hit, miss→gen-once→hit, null-not-cached-retries, ≤1 gen per distinct key). Gate: check 0,
  typecheck 0/0.
- [x] **EI-8f wire portrait lookup to the composite key + founding-era assets — DONE (branch feat/ei6b-ui-opening-screen).**
  PlayScreen derives the portrait asset from the EI-8 composite key built from live state (lifeStage(age) ×
  eraBand(year) × archetype/wardrobe × rungTier(ranks) × gender). Rewrote scripts/genai-portraits.ts to sweep the
  composite matrix through the EI-8e on-demand cache + write composite-key filenames. GENERATED the founding-era
  (1700s) adult slice (economic/political/technological × low/mid/high × both genders — 26 real engraving portraits,
  READ the founding economic_low_m: a candle-lit colonial gentleman, signature aquatint). Retired the 20 orphaned
  spine_g* assets. Gate: check 0, typecheck 0/0, browser 161, e2e 7.
  FOLLOW-UP (umbrella, separate asset pass): complete the full 294-key matrix generation (other era bands /
  life-stages / encounter roles) — on-demand cache fills gaps at runtime meanwhile; needs the Gemini image key, so
  it runs as a dedicated keyed asset-gen pass, not blanket here.
- [x] **EI-8 GENAI LIFE-STAGE × ERA × ENCOUNTER PORTRAITS — CORE DONE (EI-8a–f shipped).** The full demand matrix
  (life-stage × fine era band × archetype/path-wardrobe × rung tier × encounter role) is enumerated, the composite
  prompt + key + on-demand cache are built and wired into the play surface, and the founding-era slice is generated.
  Remaining = the full-matrix ASSET generation pass (a keyed offline sweep — [[never ask direction]]: runs as its own
  asset-gen task; the on-demand cache covers gaps at runtime). Below is the original user spec, kept for reference.
- [ ] [WAIT] **EI-8 ORIGINAL SPEC (reference, user 2026-06-23):** the existing GenAI image pipeline
  must generate portraits matched to LIFE STAGE (infant / child / youth / adult / elder — the cycles of birth →
  growth → death recur every generation) AND to the ERA the beat sits in (not just the 3 coarse macro-bands —
  the line runs 1770s→stars over 300+ years, so a child in 1790 ≠ a child in 1990 ≠ a child among the stars), AND
  for ENCOUNTER characters (storyline figures met across the 300+ years get their own era/age-appropriate portrait).
  ALSO key on the line's PATH / power-base WARDROBE (user, 2026-06-23): "different path ways — religious garb,
  celebrity garb of different types, cult leader, CEO, etc. … the widest range of generative art." A portrait
  reflects WHO the line has become — a religious archetype reads in vestments, an entertainment one in celebrity
  dress, a crime/cult/CEO path each its own look — scaled by how far it's climbed (rung). So the portrait key is
  LIFE-STAGE × ERA × ARCHETYPE/PATH(+rung) × (encounter role). Use the EXISTING genai pipeline (images+video), the
  polished signature look, NEVER hand-drawn SVG ([[visual-layer-revival]]). Step 1 = enumerate the full portrait
  DEMAND matrix (life-stages × eras × archetype-wardrobes × rung × encounter roles) + the prompt/asset key scheme +
  caching strategy (the matrix is large — generate-on-demand + cache, not eagerly), write into the EI spec, THEN
  generate. Milestone; many sub-steps will surface — DO NOT blanket-generate; enumerate + cache by key.

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

- [x] **SHOCK-LEDGER-RECOVERIES PR #124 — DONE, MERGED.**
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
- [x] **RECOVERY-CHOICE — DONE (feat/recovery-choice).** After a blow, the player can invest a meter (Spend
  funds / Call in favours, cost 18) to set a pending-invest flag; the next rollSagaRecovery reads it for a
  DETERMINISTIC boost (chance +0.4 → near-certain, magnitude ×1.5), then consumes it. Same save-invariant
  side-log discipline as presses (state.recoveryInvests {at, meter, year} — out of RNG-keyed history;
  reconstruct re-applies by `at` with the stored meter; toSave/fromSave round-trip). view.canInvestRecovery
  gates the PlayScreen invest prompt. Tests: sagaShock.unit (boost chance+mag, determinism) + loop.unit (spend
  + boost + one-pending guard + bit-identical reconstruct) + PlayScreen.visual (buttons fire/absent). 894 node
  + 125 browser green, full gate clean. [[mmm-save-and-chronology]] preserved.
- [x] **FORESHADOW-WEIGHT — DONE (feat/foreshadow-weight).** foreshadowWeight() now tiers the omen by hazard:
  "grave" (harsh era + un-recovered strain → "the house braces for the worst"), "marginal" (harsh era + only
  kin to lose → "a shadow lies over the season"), or "none". shockForeshadow is a thin boolean wrapper; the
  PlayScreen renders the tiered text. Dread is now proportional to the threat. Tests: sagaShock.unit (3-tier
  gating + strain-dominates-kin) + the existing loop.unit omen test. 896 node + 126 browser green, gate clean.
- [x] **FORESHADOW-IN-TONE — DONE (feat/foreshadow-in-tone).** view.foreshadow now carries {text, weight}; the
  PlayScreen styles a "grave" omen in a heavier register (solid red-tinted border, brighter+bolder text) vs the
  "marginal" one's faint dashed dim. Dread is felt visually, not just read. Tests: loop.unit (omen carries
  text+weight, deterministic) + PlayScreen.visual (grave border ≠ marginal border). 896 node + 127 browser green.
- [x] **OMEN-PAYOFF-AUDIT — DONE (feat/omen-payoff-audit).** omenPayoffAudit.unit drives 24 founding runs and
  measures foreshadow→next-shock correlation. MEASURED: P(shock|omen) ≈ 11.2% vs P(shock|calm) ≈ 6.3% — an omen
  makes the next shock ~1.8× likelier, a meaningful-but-not-certain warning (neither spoiler nor noise). The
  test guards P(omen)≥P(calm) AND <1 (well-calibrated; no threshold tuning needed). 897 node green, gate clean.
- [x] **OMEN-PAYOFF-AUDIT PR #136 — DONE, MERGED.**
  Pushed feat/omen-payoff-audit. Full local gate passed. Loop: wait build-and-test + CodeQL, fold review forward
  + resolve threads, self-squash-merge ([[babysit-pr]]). After merge: sync main, RECOVERY-INVEST-IN-LEDGER.
- [x] **RECOVERY-INVEST-IN-LEDGER — DONE (feat/recovery-invest-in-ledger).** An invested rebound now stamps
  `recovered:<meter>:<year>:invested`; shockLedger parses the suffix into a distinct entry (invested:true, label
  "…by your own hand") crediting the player's agency vs a lucky rebound. The distinct label flows to TimelineView
  + LegacyReport automatically (they render entry.label). Tests: sagaShock.unit (invested vs lucky parse). 898
  node + 127 browser green, gate clean.
- [x] **RECOVERY-INVEST-IN-LEDGER PR #137 — DONE, MERGED.**
  Pushed feat/recovery-invest-in-ledger (c065136). Full local gate passed. Loop: wait build-and-test + CodeQL,
  fold review forward + resolve threads, self-squash-merge ([[babysit-pr]]). After merge: sync main, AGENCY-IN-LEGACY.
- [x] **AGENCY-IN-LEGACY — DONE (feat/agency-in-legacy).** LegacyReport now tallies the player's WV-3
  interventions from the side-logs (state.presses + state.recoveryInvests) into a gold "By your own hand: you
  pressed N faltering rivals, and forced M recoveries…" line — the active counterpart to the passive ledger.
  Omitted for a fully-passive run. Tests: screens.browser (tally render + plural/empty). 898 node + 128 browser
  green, gate clean.
- [x] **AGENCY-IN-LEGACY PR #139 — DONE, MERGED.**
  Pushed feat/agency-in-legacy (d906833). Full local gate passed. Loop: wait build-and-test + CodeQL, fold
  review forward + resolve threads, self-squash-merge ([[babysit-pr]]). After merge: sync main, AGENCY-PLAYSTYLE-AUDIT.
- [x] **AGENCY-PLAYSTYLE-AUDIT — DONE (feat/agency-playstyle-audit).** agencyPlaystyleAudit.unit drives 16
  always-act runs. MEASURED: press offered 134 / fired 134; invest offered 24 / fired 24 — both levers surface
  + fire reliably (neither is dead UI; press is the frequent window, invest rarer but healthy). No trigger
  tuning needed; the test guards both are offered AND fire. 899 node green, gate clean.
- [x] **AGENCY-PLAYSTYLE-AUDIT PR #141 — DONE, MERGED.**
  Pushed feat/agency-playstyle-audit. Full local gate passed. Loop: wait build-and-test + CodeQL, fold review
  forward + resolve threads, self-squash-merge ([[babysit-pr]]). After merge: sync main, SHOCK-CLUSTERING-GUARD.
- [x] **SHOCK-CLUSTERING-GUARD — DONE (feat/shock-clustering-guard).** rollSagaShock takes a `recentlyShocked`
  flag that applies a 0.4× cooldown to the chance; applySagaShock derives it from the persisted shock:* flags
  (any blow within one generation span before the tick). 3+ back-to-back blows are now rare — losses have
  rhythm, no death spiral. The base cadence is preserved (the cooldown only dampens the tick AFTER a shock; the
  SHOCK-CADENCE-AUDIT single-tick figures are unchanged). Replay-safe (derived from flags, no new state). Tests:
  sagaShock.unit (cooled fires fewer than normal) + cadence audit re-confirmed. 900 node green, gate clean.
- [x] **SHOCK-CLUSTERING-GUARD PR #142 — DONE, MERGED.**
  Pushed feat/shock-clustering-guard (148bd2e). Full local gate passed. Loop: wait build-and-test + CodeQL, fold
  review forward + resolve threads, self-squash-merge ([[babysit-pr]]). After merge: sync main, RIVAL-RISE-NEWS-WEIGHT.
- [x] **RIVAL-RISE-NEWS-WEIGHT — DONE (feat/rival-rise-news-weight).** The surge dispatch headline now tiers by
  the rung gap via surgeHeadline(): edged ahead (gap 1) → pulling away (2) → left you behind (3+, capped). The
  cap was also removed so a far-ahead rival surfaces as the MOST urgent dispatch (was silenced at gap>2). Pure,
  view-derived; the phrasing extracted to dynastyWorld.surgeHeadline (engine + tests share). Tests: dynastyWorld.unit
  (3-tier escalation + cap). 901 node + 128 browser green, gate clean.
- [x] **RIVAL-RISE-NEWS-WEIGHT PR #144 — DONE, MERGED.**
  Pushed feat/rival-rise-news-weight (ae68b1f). Full local gate passed. Loop: wait build-and-test + CodeQL, fold
  review forward + resolve threads, self-squash-merge ([[babysit-pr]]). After merge: sync main, MERGE-CADENCE-HEALTH.
- [x] **MERGE-CADENCE-HEALTH — DONE (inline gh-run audit, no PR — read-only ops verification).** Audited the
  last 30 main runs + the per-workflow histories: Release 8/8 success, CD 7/7 success (latest d69cacd still
  in_progress, not failed), CodeQL 8/8 success — ZERO non-success post-merge runs across the WV-3 merge wave.
  No silent breakage accumulated; no remediation needed. The release-please→Release→CD→CodeQL chain is healthy.
- [x] **WV-3-DEPTH-PLAYTEST-3 — DONE (feat/wv3-depth-playtest-3).** Extended spineDepthPlaytest.unit with a
  5-seed always-act instrument counting the agency+atmosphere surface ON TOP of the floor + PLAYTEST-2. MEASURED:
  9 omens + 29 dispatches + 54 agency acts, median ~180s (3 min) added/run. So ~48-min floor + PLAYTEST-2 ~76s +
  PLAYTEST-3 ~180s ≈ 52 min fast-path (a careful player far more) — the hour mandate holds with margin and the
  agency layer only WIDENS it. No prose lever needed. 902 node green, gate clean.
- [x] **WV-3-DEPTH-PLAYTEST-3 PR #146 — DONE, MERGED.**
  Pushed feat/wv3-depth-playtest-3 (75b7803). Full local gate passed. Loop: wait build-and-test + CodeQL, fold
  review forward + resolve threads, self-squash-merge ([[babysit-pr]]). After merge: sync main, RIVAL-DOSSIER-TAB.
- [x] **RIVAL-DOSSIER-TAB — DONE (feat/rival-dossier-tab).** New RivalDossier component + a "Field" PlayScreen
  tab (shown when a rival world exists): every rival's humanized place + rung stars + a state badge — faltering
  (gold window) / surging (red, above the player) / holding — with the player's line slotted in by rung. A
  fuller race readout than the compact Timeline strip. Tests: RivalDossier.browser (state badges, humanized
  labels, slotting, empty). 902 node + 131 browser green, gate clean.
- [x] **RIVAL-DOSSIER-TAB PR #147 — DONE, MERGED.**
  Pushed feat/rival-dossier-tab. Full local gate passed. Loop: wait build-and-test + CodeQL, fold review forward
  + resolve threads, self-squash-merge ([[babysit-pr]]). After merge: sync main, RIVAL-RUNG-TREND.
- [x] **RIVAL-RUNG-TREND — DONE (feat/rival-rung-trend).** advanceWorld records a capped per-agent rungHistory
  each tick; the snapshot derives a trend (rising/steady/falling) via rungTrend(). RivalSnapshot + rivalStandings
  + GameView carry it; the RivalDossier shows a ▲/—/▼ momentum arrow (gold/dim/red) beside each rival's rung.
  Pure + seeded (re-derived from advanceWorld, no new save state). Tests: dynastyWorld.unit (trend direction +
  determinism) + RivalDossier.browser (arrow render). 904 node + 131 browser green, gate clean.
- [x] **RIVAL-RUNG-TREND PR #149 — DONE, MERGED.**
  Pushed feat/rival-rung-trend (b41524b). Full local gate passed. Loop: wait build-and-test + CodeQL, fold review
  forward + resolve threads, self-squash-merge ([[babysit-pr]]). After merge: sync main, STELLAR-EPILOGUE-VARIETY.
- [x] **STELLAR-EPILOGUE-VARIETY — DONE (feat/stellar-epilogue-variety).** The apex `end.reason` now resolves
  from the stellar DESTINY (conquest → "took them by force, an empire of suns" / allies → "a covenant kept" /
  hidden → "a quiet horizon") via APEX_REASON, set by resolving the convergence at apex-set time. The ultimate
  close reflects the path taken, not one flat line (the LegacyReport already showed the destiny-specific
  convergence prose; this fixes the reason line too). Tests: loop.unit (apex reason is path-specific). 905 node
  + 131 browser green, gate clean.
- [x] **STELLAR-EPILOGUE-VARIETY PR #151 — DONE, MERGED.**
  Pushed feat/stellar-epilogue-variety (1b20414). Full local gate passed. Loop: wait build-and-test + CodeQL,
  fold review forward + resolve threads, self-squash-merge ([[babysit-pr]]). After merge: sync main, DEAD-LINE-IN-FIELD.
- [x] **DEAD-LINE-IN-FIELD — DONE (feat/dead-line-in-field).** isFallen(history) flags a rival stuck at rung 0
  across a FULL window (not fresh/recovering); RivalSnapshot + standings carry `fallen`; the RivalDossier reads
  it as "Fallen" (dimmed + struck-through), taking precedence over faltering/surging — the field now shows
  eliminations, not just low standings. Pure + seeded. Tests: dynastyWorld.unit (isFallen window gating) +
  RivalDossier.browser (fallen state). 906 node + 132 browser green, gate clean.
- [x] **DEAD-LINE-IN-FIELD PR #153 — DONE, MERGED.**
  Pushed feat/dead-line-in-field (baae7ab). Full local gate passed. Loop: wait build-and-test + CodeQL, fold
  review forward + resolve threads, self-squash-merge ([[babysit-pr]]). After merge: sync main, CONVERGENCE-FIELD-SUMMARY-LINE.
- [x] **CONVERGENCE-FIELD-SUMMARY-LINE — DONE (feat/convergence-field-summary-line).** The RivalDossier now
  shows a one-line "state of the race" header — "You lead the field." / "N lines lead you." + " M lines have
  fallen out." — derived from the standings (pluralized), so the player gets the gestalt before the rows.
  Tests: RivalDossier.browser (lead / ahead+fallen variants). 906 node + 133 browser green, gate clean.
- [x] **CONVERGENCE-FIELD-SUMMARY-LINE PR #155 — DONE, MERGED (squash 1fa62ea; release 0.44.0).** "State of the
  race" header on the dossier. Post-merge Release/CD/CodeQL all green. main synced.
- [x] **FALLEN-NEWS — DONE.** A line dropping out now emits a one-time NewsTicker dispatch ("The <place> line has
  dropped out of the race"), kind "fallen", rendered "Eliminated" (dim + struck, no Press button). Fires ONCE via a
  `fallen_seen:<id>` flag stamped at the next advanceWorldToNow (same one-turn cadence as the shock aftermath) —
  derived purely from the deterministic world, so it replays bit-identically (save-invariant). Tests: loop.unit
  (fallen surfaces + one-time suppression + reconstruct replay), NewsTicker.browser (Eliminated render, no press,
  accented apart). RIVAL-RACE-PRESENCE test widened to accept the fallen kind. 908 node + 134 browser green, gate clean.
- [x] **WV-3-MILESTONE-DOC — DONE.** docs/STATE.md now has a "WV-3 — saga shocks, recoveries, agency & the rival
  race" section under Saga polish: the shock→recovery→foreshadow→press/invest→rival-race layer, the
  save-invariant SIDE-LOG pattern (presses/recoveryInvests tagged `at: history.length`, re-applied in reconstruct)
  + the one-time-news FLAG sub-pattern (fallen_seen, derived from world state), and the determinism audit
  instruments. The canonical map for the next session. Docs only; frontmatter date bumped.
- [x] **FALLEN-NEWS-IN-ENDING — DONE (branch feat/fallen-arc-followons).** The LegacyReport rival-finale now gives a
  DROPPED-OUT (isFallen) line a distinct fate ("dropped out of the race entirely, its line spent"), struck + dimmed,
  set apart from a merely-faltering line; rivalStandings threads `fallen` through to the finale. convergenceEnding
  gained a `droppedOut` count + a dedicated epilogue clause (singular/plural). Also fixed: the falter dispatch +
  rivalField.fallen previously conflated faltering with truly-fallen. Tests: convergence.unit (dropped-out coda),
  screens.browser (struck "dropped out" fate). Caps the fallen arc end-to-end (dossier → news → finale).
- [x] **PRESS-FALLEN-GUARD — DONE.** The falter dispatch now excludes fallen lines (`!snap.fallen`), and pressRival
  has an engine-layer guard (a fallen snapshot → no-op), defense-in-depth even if a caller bypasses the news. Audit:
  loop.unit drives seeds to a fallen line, asserts pressing it records nothing / costs no heat / drops no rung, and
  that it's never offered as a pressable faltered dispatch. 911 node + 136 browser green, gate clean.
- [x] **RECOVERY-FORESHADOW-TONE — DONE.** Added `recoveryForeshadow(flags)` (a strained line has a pending rebound)
  + a `tone: "dread" | "hope"` on the foreshadow; a strained line now reads a HOPE omen ("the worst is behind you —
  the line gathers itself for a turn back upward") in a warm gold register, taking precedence over the grave red
  dread (same strain drives both). Tests: sagaShock.unit (predicate), PlayScreen.visual (hope vs dread register).
- [x] **STELLAR-RIVAL-IN-ENDING — DONE (branch feat/field-extremes-and-omen-audit).** A line that reached the
  interstellar tier (rung at the ladder top, not faltering/fallen) now reads in an ASCENDANT gold register in The
  Other Lines (`data-stars`, bright-gold border + name), mirroring the struck dropped-out treatment so the field's
  two extremes read distinctly. `reachedStars(rung,faltering,fallen)` derives the marker. Test: screens.browser
  (star register apart from a mid line, with brand tokens set so the colors are real).
- [x] **FORESHADOW-AUDIT — DONE.** New foreshadowToneAudit.unit instrument: drives 24 founding-era seeds, counts
  hope vs dread omens, and asserts the hope omen FIRES (live feature) + appears EXACTLY on a strained line (0 false
  positives, every hope omen coincides with `shock_meter:` strain) + both tones occur. MEASURED: 675 omen-steps,
  hope 47.9% / dread 52.1%, hopeWithoutStrain=0. Guards the valence layer from silent regression. Prints figures.
- [x] **INVEST-WHILE-HOPE-OMEN — DONE.** The hope omen already renders directly ABOVE the invest prompt (same
  outstanding-strain condition); tightened so they read as ONE beat — when the omen is hopeful the invest label
  becomes "Press the rebound — pour resources in to make it count?" and the prompt is marked `data-after-hope`.
  Test: PlayScreen.visual (DOM order omen-before-invest + the connecting copy + data-after-hope).
- [x] **FIELD-EXTREMES PR #161 — DONE, MERGED.** (stale placeholder reconciled — the unit's items below are all done.)
- [x] **ENDING-FIELD-NARRATIVE-AUDIT — DONE (branch feat/finale-polish).** New endingFieldNarrativeAudit.unit: a
  28-case matrix asserting resolveConvergence's epilogue clause matches the documented field-count precedence
  (stars > whole-field-fallen > droppedOut > neck-and-neck > quiet-recede), the no-field/failed-run → no-epilogue
  rules, AND the per-line fate-rank invariants (fallen sinks below faltering below the rung tiers, even when the
  fallen line's raw rung is higher). Catches drift BETWEEN the epilogue + per-line surfaces. Prints the matrix size.
- [x] **RIVAL-FINALE-SORT — DONE.** The Other Lines now sort by a finale-fate ORDINAL (stars 0 → high → settled →
  low → faltered → dropped-out 6), then rung, then name — so the field reads as a clean descent and a fallen line
  at a mid rung sinks below a thriving low line. `fateRank()` derives the ordinal. Test: screens.browser (out-of-
  order input incl. a high-rung fallen line → fate order, faltered above dropped-out).
- [x] **HOPE-OMEN-COPY-VARIETY — DONE.** `recoveryForeshadowText(flags)` keys the hope omen to the strained meter —
  money (coffers rebuilt) / reputation (name to grace) / health (back to strength) / loyalty (bonds reforged) —
  first outstanding flag wins (replay-stable); heat + unrecognized fall back to the generic hopeful line. Wired into
  the engine foreshadow(). Test: sagaShock.unit (four distinct variants, first-flag-wins, fallback).
- [x] **FINALE-POLISH PR #163 — DONE, MERGED.** (stale placeholder reconciled — the unit's items below are all done.)
- [x] **SHOCK-LEDGER-IN-FINALE-SORT — DONE (branch feat/ledger-and-dread-polish).** Verified shockLedger already
  sorts year-then-kind with a same-year comeback after the blow (codepoint compare, replay-stable). Added a
  screens.browser test that feeds SCRAMBLED flags (incl. a same-year 1920 blow+recovery) and asserts the RENDERED
  Hard Seasons list is chronological with the 1920 comeback after the 1920 blow and the 1950 death last.
- [x] **OMEN-DREAD-COPY-VARIETY — DONE.** `dreadForeshadowText(macroActId)` keys the dread omen to the macro-act:
  founding (fever/hard winters — loss of life), convergence (old-country troubles), emergence (markets/mood),
  ascension (fortune-not-certain). Generic fallback for an unknown band. Wired into engine foreshadow() (the
  reachable dread weight is "marginal" since strain → the hope branch). Test: sagaShock.unit (four distinct, fallback).
- [x] **FIELD-EXTREMES-SCREENSHOT — DONE.** New LegacyReportFieldExtremes.visual test mounts the finale with a star
  line + a mid line + a dropped-out line + a loss→comeback ledger, asserts both extreme markers present, and captures
  a screenshot. READ the screenshot: Bavaria (stars) renders bright-gold/ascendant, Chinese (dropped out) struck +
  dimmed grey, ledger shows 1920 reversal→rebuilt→1950 death. The two registers read distinctly as intended. ✓
- [x] **MID-RUN-FIELD-GLANCE-SCREENSHOT — DONE (branch feat/a11y-and-finale-glance).** New RivalDossierGlance.visual
  test captures the live Field dossier with every state (surging/faltering/fallen/holding + the player slotted in) +
  trend arrows. READ the screenshot: Bavaria surging (5★ ▲), Your Line (3★, gold-outlined), Scandinavian holding (—),
  Italian faltering (▼ red), Chinese fallen (struck + dim), summary "1 line leads you. 1 line has fallen out." Reads
  clearly at a glance, as well as the finale. ✓
- [x] **OMEN-TONE-A11Y — DONE.** The omen now carries a TEXT badge ("↻ Recovering" / "⚠ Warning") keyed on tone, so a
  colorblind / screen-reader player gets the valence from the label, not the gold/red hue alone (WCAG 1.4.1). The
  finale field-extreme registers already use non-color cues (struck-through "dropped out" text, "reached the stars"
  text), so no mirror needed there. Test: PlayScreen.visual (the badge text distinguishes hope vs dread).
- [x] **SHOCK-LEDGER-EMPTY-VOICE — DONE.** A charmed run (no shock/recovered flags) with a multi-generation dynasty
  now shows a grace note — "The line was spared the worst — no disaster struck across N generations" — instead of
  silently omitting the Hard Seasons section; a trivial/≤1-gen run still shows nothing. Test: screens.browser (the
  grace note + generation count for a 2-gen charmed run; silence for a no-family run).
- [x] **MAP-FIELD-LINK — DONE (branch feat/surface-parity-and-finale-contrast).** MapView now carries the SAME
  faltering/fallen state the Field dossier does: a fallen line's marker reads eliminated (barely-there + grey), a
  faltering one dimmer, and a fallen line is excluded from the map's "leads the convergence" note. Test:
  MapFieldParity.browser mounts BOTH off shared standings — a fallen line reads fallen on both + never leads; an
  all-fallen field yields no map leader.
- [x] **OMEN-BADGE-SCREENSHOT — DONE.** Captured both omen badges + READ them: "↻ RECOVERING" renders a gold pill
  (dark text), "⚠ WARNING" a red pill (light text), each legible at size, distinct, not crowding the prose. Confirms
  the OMEN-TONE-A11Y badges read clearly. Test: PlayScreen.visual captures both tones.
- [x] **FINALE-APEX-VS-RUIN-CONTRAST — DONE.** Captured + READ both finales: a triumphant ending reads "Total
  Victory" in bright gold (endgame-good tier, gold "Play Again"); a ruin reads "The End" in stark red
  ("YOUR LINE WAS EXTINGUISHED", endgame-bad tier). The tone visibly differs (gold ascendance vs stark loss), not
  just the headline. Test: LegacyReportToneContrast.visual asserts the tier + title-color contrast + captures both.
- [x] **MAP-FIELD-LINK-WIRING-CHECK — DONE (branch feat/empty-voice-and-a11y-audit).** Verified PlayScreen passes
  `view.rivalStandings` (full object incl. fallen/faltering) to MapView at the call site. Test: PlayScreen.visual
  mounts a founded line + a fallen rival, clicks the Map tab, and asserts the rival marker carries data-fallen —
  the state flows PlayScreen → MapView → marker end-to-end, not lost in the wiring.
- [x] **DOSSIER-EMPTY-VOICE — DONE.** An empty Field dossier (early game, no near-vantage lines) now shows a grace
  note — "The other lines are still finding their feet — the race has yet to take shape." — under the field title,
  instead of rendering nothing, mirroring SHOCK-LEDGER-EMPTY-VOICE. Test: RivalDossier.browser (the grace note +
  title for empty standings).
- [x] **OMEN-A11Y-AUDIT — DONE.** Extracted the badge map to a pure `omenBadgeLabel(tone)` + `FORESHADOW_TONES`
  in sagaShock (PlayScreen now uses it, no inline ternary). Audit: every tone maps to a non-empty, distinct label
  (no blank fall-through), guarding the a11y layer from a future tone slipping the map. Test: sagaShock.unit.
- [x] **DOSSIER-EMPTY-VOICE-IN-PLAYSCREEN — DONE (branch feat/chronicle-and-contrast-audit).** Found a real gap: the
  Field tab was gated on `rivalStandings.length > 0`, so the empty-voice grace note was UNREACHABLE in the live app.
  Fixed: the Field tab now gates on `hasLineage` (a founded line, same as the Map tab), so it's stable and the
  grace note surfaces early-game. Test: PlayScreen.visual mounts a founded line + empty standings, opens the Field
  tab, asserts the "still finding their feet" note.
- [x] **CHRONICLE-FULL-PLAYTHROUGH-SCREENSHOTS — DONE.** New ChronicleArc.visual captures 5 frames across one run +
  READ in order: title (Dynasty masthead, gold/navy) → an Act II scene → a dread omen (⚠ WARNING red) → a hope omen
  (↻ RECOVERING gold + the invest "Press the rebound" beat) → the Total Victory finale (gold). The luxury register
  holds across every beat, omen valence shifts red→gold with the narrative, finale pays off in gold — reads as ONE
  coherent chronicle, not five disjoint screens. ✓
- [x] **OMEN-BADGE-CONTRAST-AUDIT — DONE.** New omenBadgeContrast.unit reads the brand-token hexes from tokens.css
  and computes WCAG contrast: hope (ink/gold) = 8.68:1, dread (cream/red) = 5.81:1 — both ≥ AA 4.5:1. Guards the
  a11y badges from a token change quietly dropping below legible contrast. Prints the ratios.
- [x] **MAP-TAB-LABEL-ICON-DEDUP — DONE (branch feat/tab-icons-afford-voice-register).** The Field tab now uses the
  `pole-centrist` (spread-of-positions) glyph, distinct from the Map's `timeline` journey arc, so the tab bar
  disambiguates the two. Test: PlayScreen.visual asserts the Map and Field tab icons differ for a founded line.
- [x] **HOPE-OMEN-INVEST-AFFORD-VOICE — DONE.** When the coffers can't cover the money invest, the hope-omen prompt
  softens from "pour resources in to make it count" to "call in favours if you can't spare the coin" (the heat
  invest is always available, so there's still a path) + the money button disables. With funds, the full copy
  returns. Test: PlayScreen.visual (broke-but-hopeful softened copy + flush-funds full copy).
- [x] **TITLE-TO-FINALE-REGISTER-AUDIT — DONE.** New RegisterAudit.browser asserts the masthead, the in-run header
  (act-chapter), and the finale title all share the SAME display-font register (Playfair/serif) and none falls back
  to the body font — guarding the luxury voice from CSS drift. (Color compared via font, since the masthead uses a
  gradient-fill technique where `color` is transparent; font-family is the reliable cross-screen register signal.)
- [x] **DOSSIER-EMPTY-VOICE-A11Y-PARITY — DONE (branch feat/empty-parity-tab-dedup-ruin-arc).** Aligned the finale's
  "spared the worst" note to the dossier's empty-field register (dim, italic, 0.85rem) — the "achievement" framing
  comes from the WORDS, not a louder gold color, so both empty states read as one quiet-grace voice. Test:
  emptyVoiceParity.browser asserts the two notes share computed font-style/color/size.
- [x] **TAB-ICON-FULL-DEDUP — DONE.** Every founded-line tab now has a DISTINCT glyph: Map→`pole-utopian` (ascent),
  Lineage→`pole-dictatorial`, freeing `timeline` for Timeline and `dossier` for Dossier (Field already `pole-centrist`).
  Test: PlayScreen.visual asserts no two tabs in the founded-line bar share an icon (Set size == count).
- [x] **CHRONICLE-RUIN-ARC-SCREENSHOTS — DONE.** Added a RUIN arc to ChronicleArc.visual + READ it: title (gold
  masthead) → scene → dread omen (⚠ red) → an unrecovered shock (red loss note) → extinguished finale ("The End",
  stark red). The down-arc builds the red loss register coherently — the mirror of the victory arc's gold ascent.
  The two arcs are distinct in valence but consistent in luxury register. ✓
- [x] **STATS-CHOICES-TAB-SCREENSHOT — DONE (branch feat/tab-shots-wording-safearea).** Captured + READ both: the
  Stats tab shows "Trajectory" (gold heading) + a uPlot meter-trend chart with a color-coded legend + net worth; the
  Choices tab shows "Butterfly Log" (gold) + the dim-italic "No ripples yet" empty-state. Both legible, hold the
  luxury register (gold heading / navy bg). Test: PlayScreen.visual captures each tab.
- [x] **EMPTY-VOICE-WORDING-DISTINCT-AUDIT — DONE.** emptyVoiceParity.browser now also asserts the two empty-state
  notes say DISTINCT things ("finding their feet" vs "spared the worst") despite the shared register — so the parity
  styling can't invite a copy-paste that repeats one line in two places.
- [x] **MOBILE-SAFE-AREA-AUDIT — DONE.** Found + fixed a gap: the `.content` scroll region (the screen's bottom
  edge) didn't pad the bottom inset, so the last content could sit under the home indicator. Added
  `padding-bottom: env(safe-area-inset-bottom)`. Test: SafeAreaAudit.browser asserts the header rule references
  safe-area-inset-top AND the content rule references safe-area-inset-bottom (jsdom resolves the inset to 0, so the
  audit checks the CSS references the inset, not a pixel value).
- [x] **MARKETS-NEWS-TAB-SCREENSHOT — DONE (branch feat/markets-news-shots-ledger-prune-safearea).** Captured + READ
  both (real content, loadContent): News shows the PRESSURE rival dispatch + "The Wider World" scoped headlines
  (NYC/USA/WORLD/SCIENCE/SOCIETY/FAITH); Markets shows the asset board (Equities/Real Estate/Crypto/Mars Colony …) +
  the Standing rungs (immigrant/nobody/layman/citizen) + net worth. Both rich, legible, hold the register. Per-tab
  visual coverage now complete. Test: MarketsNewsTabShot.visual captures each.
- [x] **DIRECTIVE-LEDGER-PRUNE — DONE.** Archived 27 WV-3 + spine shipped-ledger `[x]` entries to a "Shipped — WV-3 +
  spine wave" appendix in docs/STATE.md and replaced them with one pointer line; the directive dropped from ~1666 to
  ~1521 lines, scannable again. Code + git history remain the source of truth.
- [x] **SAFE-AREA-LEGACYREPORT — DONE.** Found a gap: `.report` (the tall, scrolling finale) didn't pad the bottom
  inset, so "Play Again" could sit under the home bar. Added `padding-bottom: max(--mmm-pad, env(safe-area-inset-
  bottom))`. Test: SafeAreaAudit.browser asserts `.report` references safe-area-inset-bottom.
- [x] **ONBOARDING-SCREEN-SHOT — DONE (branch feat/onboarding-shot-safearea-tabcoverage).** Captured + READ the
  founding funnel: phase 1 (Region — New England / Mid-Atlantic / South, gold cards + grounded prose under an italic
  prompt) and phase 2 (Power base — Commerce / Pulpit / Law & Politics / Land / Press / Sword, the chosen region
  threaded into the next prompt). Holds the luxury register, legible, the funnel reads coherently. Test:
  OnboardingScreen.visual captures the opening phase + one advanced step.
- [x] **SAFE-AREA-ONBOARDING-TITLE — DONE.** Found a gap: Title (.panel-screen) and Onboarding (.onboarding) padded
  the top inset but the `padding` shorthand reused the TOP inset for the bottom — so action buttons could sit under
  the home bar. Made top/bottom explicit (`max(1.25rem, env(safe-area-inset-bottom))`). Test: SafeAreaAudit.browser
  asserts both screens reference top AND bottom insets.
- [x] **FULL-TAB-COVERAGE-ASSERT — DONE.** PlayScreen.visual now iterates EVERY founded-line tab (≥6), clicks each,
  and asserts its panel renders non-empty content — a structural guard that no tab is a dead/blank route,
  complementing the per-tab visual reads.
- [x] **A11Y-TAB-ARIA — DONE (branch feat/tab-aria-funnel-walk-title-continue).** The tab bar is now a
  `role="tablist"` (changed `<nav>`→`<div>` to satisfy the Svelte a11y rule — nav is a landmark, can't be a tablist)
  and each tab button carries `role="tab"` + `aria-selected`, so a screen reader announces the active tab (the
  non-visual counterpart of the gold `.active` highlight). Updated all tab-clicking tests to getByRole("tab", …).
  Test: PlayScreen.visual asserts exactly one tab aria-selected, moving on click.
- [x] **ONBOARDING-FUNNEL-FULL-WALK-SHOT — DONE.** OnboardingScreen.visual now walks EVERY funnel phase, capturing
  each. READ the un-shot ones: Naming tradition (10 cultures, prior region threaded in), Founder gender ("The
  Carrington line. Who founds it?" — surname woven in, A son / A daughter). The luxury register holds end-to-end.
- [x] **TITLE-CONTINUE-STATE-SHOT — DONE.** The TitleScreen.visual screenshot test (props default hasSave:true) now
  asserts Continue is present; READ it: the gold Dynasty masthead + Seed input + New Game / Load Game — Continue /
  Settings all read legibly together in the with-save variant.
- [x] **A11Y-INVEST-PRESS-LABELS — DONE (branch feat/a11y-labels-reduced-motion-funnel).** The "Press the advantage"
  button now carries an aria-label naming the target line (`humanizeRivalLabel(id)`); the invest buttons carry
  aria-labels ("Spend funds to strengthen the line's recovery" / "Call in favours … (raises heat)"). Tests:
  NewsTicker.browser (press label names the line) + PlayScreen.visual (invest labels describe the spend).
- [x] **REDUCED-MOTION-AUDIT — DONE.** Verified the ShaderBackdrop already gates its rAF loop on
  `matchMedia(prefers-reduced-motion)` (static frame otherwise) and 6 motion surfaces carry the CSS media query. New
  reducedMotion.unit asserts each surface references it + the backdrop's guard precedes the loop — guards regression.
- [x] **ONBOARDING-A11Y-FUNNEL — DONE.** The `.onboarding` main is now `aria-live="polite"` so a screen reader
  announces each new phase prompt as the card swaps; the choices are native keyboard-navigable `<button>`s. Test:
  OnboardingScreen.browser (live region + enabled button choices).
- [x] **WV-3 + SPINE shipped ledger — ARCHIVED to docs/STATE.md (DIRECTIVE-LEDGER-PRUNE).** 27 merged-PR / done entries (FORESHADOW-IN-TONE #134 … the spine-depth + QA wave) were moved to the "Shipped — WV-3 + spine wave" appendix in docs/STATE.md to keep this directive scannable. The code + git history are the source of truth; the appendix is the human-readable index.
