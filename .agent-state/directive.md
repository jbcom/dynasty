# Continuous Work Directive — maga-money-moves

**Status:** ACTIVE
**Owner:** jbogaty
**Mandate:** "convert all WAIT-USER into the next long-running local branch, your scope is to handle EVERYTHING, no deferment" (user, 2026-06-20). Confirmed scope: INCLUDES the Dynasty rename + Musk/Kennedy playable Era-0 sagas + dynasty-select carousel. Delivery: ONE long-running branch (`dynasty-everything`) with PERIODIC PRs at phase boundaries.

## Batch — DYNASTY EVERYTHING (batch-20260620-dynasty-everything)

Source: all former [WAIT-USER] epics, activated by the user 2026-06-20. One branch
(`dynasty-everything`), periodic PRs at phase boundaries. NO deferment — every item
below is in-scope for this unit. Sequenced koota-substrate-first (user's prior
decision: "do the refactor first"), then the query-heavy systems built on it, then
content depth, then the Dynasty product epic, then the cross-cutting QA invariants.

### Phase DE-1 — Koota query-substrate migration (task-026)
- [x] de-1a migrate eligibleEvents/effectiveWeight selection (events.ts/pickNextEvent) to a declarative query over projectWorld, keeping the pure helper as source-of-truth + a parity test. Pattern for the rest.
- [x] de-1b migrate the remaining hand-rolled query surfaces over the read-model where it clarifies (branch/slot/moralAxis resolution reads, timelinesForBranch/applyWorldFlags linking reads, market/rank reads already done). Pure transition (applyChoice) stays authoritative; worlds projected→queried→destroyed (withWorld). Every determinism + replay + timeline:sweep test stays green.
- [x] de-1c PHASE BOUNDARY: full gate (typecheck/biome/unit/browser) + replay parity + sweep; open PR #A "koota query substrate"; reviewer trio; resolve threads; squash-merge green. (PR #17 merged; de-1a loop.ts wiring + parity tests added as forward commits.)

### Phase DE-2 — Moral-axis wiring into endings + HUD (task-022 remainder)
- [x] de-2a DONE: authored 19 per-branch-per-pole endings (7 branches × 3 poles — nazi/theocracy/oligarchy/megachurch/media/westcoast + default centrist), each gated by its branch's pole flags from POLE_FLAGS. moralPoleOf + evaluateEnding already wired (EndingSchema.when.pole + flag-based gating both work). 21 new tests. 289 unit tests green.
- [x] de-2b DONE: PersonalityDial accepts pole+poleLabel props; renders branch-relative pole badge (cyan▲ utopian / gold◆ centrist / red▼ dictatorial) with branch-specific label. PlayScreen derives moralPoleOf+moralPoleLabel and passes them live. 2 new browser tests; priority regression test for theocracy vs assassination. 290 unit + 61 browser green.
- [x] de-2c DONE: verified all 6 branches define all 3 pole endings AND every pole ending gates only on flags some event/world-timeline actually sets (19 pole flags, 0 unreachable). Added pole-coverage.unit.test.ts as a permanent invariant guard (a future pole ending referencing an unsettable flag now fails the suite instead of silently becoming unwinnable). PHASE DE-2 boundary → PR #B.

### Phase DE-3 — Balance + depth (task-015 + task-017 + AH4 no-shallowness)
- [x] de-3a DONE: heat-aware scans show no-downside at 18% (1192 choices) with only 8 all-no-downside events, 6 of which are legit flag/personality FORKS (decision = which path) and 2 flat — fixed the one genuine free lunch (embrace_the_heel now +10 heat so the heel turn is a real risk/reward vs the dignified option). Added balance.unit.test.ts: a permanent DOMINANT-STRATEGY guard — fails if any choice strictly dominates a sibling on every meter (heat as cost) without either carrying a distinct flag/personality identity. 0 offenders. (Markets already live + telegraphed from DE-1/prior; currency hedge survives via the systemicTick redenomination already tested.)
- [x] de-3b DONE: audited branch backdrop depth — nazi 177 / westcoast 137 / oligarchy 126 / theocracy 124 / media 111 / megachurch 104 events across 4 scopes each; none a stub. Added branch-depth-floor.unit.test.ts as the permanent AH4 no-shallowness guard: every branch must clear ≥90 backdrop events across ≥3 scopes AND no branch may be <1/3 the depth of the richest (a future thin fork fails the suite). Phase DE-3 boundary gate green (300 tests, sweep all 7 ok) → PR #C.

### Phase DE-4 — Era-0 levers: sibling-count / birth-order (AH8d, ties AH8c given-name)
- [ ] [WAIT] de-ui-d PR #19 CI green + squash-merge (CodeRabbit pass, 0 threads, build-and-test in flight). Merge once green, then live-verify + catch up main. @wakeup 15:52
- [x] de-4a DONE: added the ev_the_children Era-0 prologue event (origins, 1945, gated after marriage / before birth) with 4 birth-order choices setting firstborn_heir / only_child / fourth_child / fred_jr_present / fred_jr_died. New flag-aware resolveGivenName/resolveFullName/isNamedHeir in terms.ts: a firstborn/only-child heir carries the patriarch's name (→ Friedrich, "<name> <surname> III") OVERRIDING the branch default even on the Donald line — the groomed-heir vs accidental-fourth-child dynamic. Wired into the compiler's given_name/full_name. Tests: terms birth-order resolution (10) + compiler birth-order name (firstborn→Friedrich Trump III; axis+firstborn→Friedrich Drumpf III; fourth→Donald Trump). 307 tests green. PHASE DE-4 → folds into the next boundary PR.

### Phase DE-5 — THE DYNASTY PRODUCT EPIC (rename + 3 playable sagas + carousel)
- [~] de-5a DISPLAY RENAME done (commit 7f6fb88): index.html <title> + title-screen wordmark (DE-UI) + capacitor appName + Android app_name/title_activity_main → "Dynasty"; cap:sync run. DELIBERATELY KEPT: appId com.jbogaty.magamoneymoves (Android install/store continuity) + npm package name (release-please load-bearing) — rename is display-only, identity stays. REMAINING: docs copy reframe (README/CLAUDE.md/STANDARDS) from "MAGA Money Moves" → "Dynasty" + generic dynastic-saga framing; assets.json attribution strings. (do alongside DE-5 saga work)
- [ ] de-5b MUSK playable Era-0 saga — South Africa origin (Walter Henry James Musk → Errol → Elon), the most TECHNOLOGICALLY-focused house; its own Era-0 prologue + early eras feeding the existing mid/late-game systems (markets/ranks/branches/slots). Reuse the grammar; author Musk-specific slot resolutions + backdrop.
- [ ] de-5c KENNEDY playable Era-0 saga — earliest origin (Patrick Kennedy 1823–1858, Irish Famine), the most POLITICAL house; its own (earliest) Era-0 + bridge into the existing kennedy.json protagonist timeline + bootlegger arc.
- [ ] de-5d DYNASTY-SELECT CAROUSEL landing screen — portraits + public-domain lineage imagery for Trump/Musk/Kennedy; pick a dynasty → play its saga. Slot/timeline pools keyed per dynasty so each house yields a unique emergent story; architecture open to adding more houses. PHASE BOUNDARY PR #E (largest).

### Phase DE-UI — Luxury UI/UX + HUD uplevel: POC → finished "Dynasty" (user, 2026-06-20)
User mandate: "the ui ux and HUD needs significant polish and upleveling to go from POC to a new game Dynasty with a dedicated set of complementary luxury-feel header and UI typography etc. Download Google web fonts locally to public/assets/fonts."
- [x] de-ui-a LOCAL LUXURY FONTS: Playfair Display + EB Garamond self-hosted in public/assets/fonts/ (woff2, font-display:swap, no runtime gstatic). @font-face in fonts.css, preload in index.html, --mmm-font-display/--mmm-font-body tokens wired. OFL licensed + logged in assets.json. Schema gains "font" kind + unit test. (commit 982b824)
- [x] de-ui-b HEADER / TITLE upleveling: TitleScreen reworked — gilded gradient "Dynasty" wordmark (Playfair 800), "A DYNASTIC SAGA" eyebrow, Garamond tagline, ornamental gold rule, glass panel + gradient CTA buttons. Verified by screenshot read. (commit 982b824)
- [x] de-ui-c DONE: MeterGauge SVG icons + Playfair/Garamond font tokens; MeterHud gold border+shadow; EventCard scene gold left-border + Garamond body + gold choice hover; PersonalityDial Garamond readout/badge; PlayScreen tabs → text labels + currentColor SVG line-art icons (public/assets/icons/ui/). Also fixed de-2c review finding: pole-fork ideology thresholds ±30→±40 across 7 files to align with moralPoleOf composite-axis breakpoints. Screenshot-verified in browser. 303 unit + 62 browser green. (commit cbf9de2)
- [x] de-ui-d DONE: full gate green (303 unit + 62 browser + typecheck 0 errors + biome clean); screenshot-verified title + HUD; reviewer trio dispatched; review findings folded (dossier.svg degenerate arc fixed, EventCard @supports backdrop-filter fallback added, threshold rationale clarified in decisions.ndjson). PR #19 open → jbcom/dynasty/pull/19. (commit e64aec4)

### Phase DE-6 — Cross-cutting QA invariants (AH6 agent-sweep + task-023 persona sweep)
- [ ] de-6a AH6 automated consistency sweep: fan out verification agents over a SWEEP of Era-0 permutations (now incl. all 3 dynasties), each reading one compiled-timeline dump (timeline:dump) flagging cross-timeline contradictions/anachronisms/shallowness/title-leaks (e.g. "President" in a Nazi run). Aggregate → fix → re-sweep. Wire as a repeatable harness, not a one-off.
- [ ] de-6b task-023 persona playtest sweep across ALL dynasties+branches (min-maxer/roleplayer/completionist/chaos-tester/moralist/historian/speedrunner/villain) — find dead-ends, dominant strategies, unclear choices, AND entirely missing branches; author discovered gaps.
- [ ] de-6c FINAL DoD: full gate + app live-verified per dynasty AND per branch; all reviewer threads resolved; green PR #F squash-merged; directive → RELEASED.

## Batch — dynasty-koota-deepfuture (batch-20260620-134116)

Source: carried-forward epics from the alt-history batch (PRs #10/#11 merged), user-sequenced 2026-06-20.
Started: 2026-06-20T18:41:00Z

The next work unit. Order chosen by the user (Koota-migration-first, then
deep-future, then coverage/audit, then persona sweep). Full design detail for each
lives in the WAIT-USER items further down (now unblocked).

### nb-001 Koota: migrate remaining queries over the read-model (continues task-026)
- [x] nb-001 Koota read-model extended: market entities (MarketRef/Index/Regime/Position) + declarative queries queryMarketsInCrash / queryLeveragedPositions / queryEligibleByWeight, each parity-tested vs the pure semantics. CRITICAL fix: koota caps live worlds at 16 and createWorld does not auto-free — added withWorld() that always destroy()s, converted all queries to it, + a 50-call leak-guard test (would have crashed real play). 232 tests green.
### nb-002 Deep-future for the remaining branches (continues task-025)
- [x] nb-002 deep-future arcs done for all 4 remaining branches: NAZI +13 (Reich conquest — WOTAN AGI→Festung Mars→solar empire→conquest fleet), MEDIA +14 (broadcast reach — orbital ring→solar relay→signal-as-ratings→info war), WESTCOAST +15 (techno-frontier — AGI→corporate Mars charter→transhumanist schism→open-protocol contact), MEGACHURCH +12 (mission — Mars church-planting→galactic missiology→interspecies covenant, distinct from theocracy crusade). Each sets all 4 science-ladder flags via its OWN motivation + 3 poles. All 7 branches now reach the stars; sweep consistent.
### nb-003 Full 3-pole coverage + no-shallowness audit (task-022 remainder + task-017)
- [x] nb-003 COVERAGE: expanded moralAxis POLE_FLAGS to recognize every branch authored pole flag (reich_*_pole, pole_utopian/centrist/dictatorial, media_*_pole, communion/standoff/theodicy theology poles, interstellar_trade_commonwealth/monopoly_trade_regime/alien_subjugation, missionary_uplift…); removed axis_ascendant from dictatorial (it is a BRANCH marker, not a pole — a Nazi run pole comes from its reich_*_pole flag). 14-case coverage test (all 7 branches × 3 poles resolve). AUDIT: every branch backdrop is 104-177 events across 4 scopes — none a thin stub, comparable depth, no shallowness.
### nb-004 Persona playtest sweep (task-023)
- [x] nb-004 persona playtest sweep DONE (7 personas / 3 agents). Found + FIXED 5 real bugs (megachurch+media branches were unreachable; all-3-poles menu locked nazi/westcoast to dictatorial; end_first_contact_malevolent dead via bad notFlags; dueWorldEvents mutual-exclusion race) — each verified before fixing + regression-tested. Debunked the agent false-positive '7 dead gate flags' (world-timeline-set + role_flip resolveRoles-derived). LIGHT findings deferred to nb-006: historical date nits (John G. Trump MIT 1936/EE not 1933/Physics; JPK Harvard 1912 not 1908; Columbia Trust 1913), ending body text, balance (inert markets/no-heat-decay/power=30 outlier/23.7%-no-downside), missing-content gaps (Epstein, Trump children as heirs, 2000 Reform run).
### nb-006 Balance + content-polish from persona findings (deferred from nb-004)
- [x] nb-006 balance + content polish DONE. (1) marketOps wire market holdings to choices + Manhattan op + unit test; heat passive decay (-1.5/yr, floored at 0) + test; capped pol_win_accept_mandate power 30->18; throttled end_early_obscurity (minEraOrder 3, minAge 30). (2) "~24% no-downside" was FALSE POSITIVE — heat is a negative meter, flag-forks are legit; 13 all-upside events are all apex victory laps/personality forks; added felt heat-cost to 7 domineering redplanet choices instead. (3) Historical date nits: science.json wt_john_trump_mit year 1933->1936 + headline Physics->Electrical Engineering; kennedy.json wk2_jpk_harvard_outsider year 1908->1912; wk2_jpk_bank_president year 1914->1913. (4) Gap events audit: Epstein (ev_epstein_circle), Trump children/heirs, ev_reform_party_flirt all ALREADY exist — gaps were filled in prior work. (5) Ending body field: not in EndingSchema — endings use `reason` as epitaph; all 28 have it. 242 tests green.
### nb-005 Definition of done
- [x] nb-005 DoD DONE — PR #12 squash-merged (commit f277a65 on main). CI green (build-and-test pass 1m58s), CodeRabbit pass, all Gemini review threads resolved. typecheck 0 errors, biome clean, 242 unit tests + 59 browser tests green. Security audit: 0 vulns. Live-verified 1885→1905 playthrough: heat decay, market systemic tick, brand-era marketOps all working. Two post-merge null-coalescing linter reverts also confirmed clean in final main state.

## VISION — "DYNASTY": three playable dynastic sagas (user, 2026-06-20)

The systems built here (branch resolver, terms/titles, slot events, per-branch
timeline pools, the compile-at-0 model, the systemic markets/ranks layer) are a
GENERIC GRAMMAR for a dynastic-saga game — not Trump-specific. The user's
realization: RENAME the game to "DYNASTY" and let each of the THREE dynastic
families be its OWN emergent, playable game (not just roles you SWAP between):
- TRUMP — the existing Drumpf/Kallstadt Era 0 (commercial/real-estate spine).
- MUSK — begins in SOUTH AFRICA (Walter Henry James Musk → Errol Musk → Elon);
  the most TECHNOLOGICALLY-focused of the three. Needs its own Era 0.
- KENNEDY — begins EARLIEST of all three, with Patrick Kennedy (1823–1858) and
  the IRISH FAMINE; by far the most POLITICAL. Needs its own (earliest) Era 0.
Landing screen: a NEW-GAME CAROUSEL of portraits + public-domain historical
lineage images for the three families; pick a dynasty → play its saga. With
expansion + the slot system, ANY dynastic family could be added — unique
emergent stories per house. This is a future epic (rename + 3 playable Era-0
sagas + dynasty-select carousel + per-dynasty slot/timeline pools), tracked here
to shape the remaining batch work toward it (the slot/compiler/branch work is
exactly the foundation it needs). NOT started; revisit scope/sequencing with the
user before the rename + the Musk/Kennedy Era-0 sagas. The current batch's
Kennedy/Musk protagonist timelines + bootlegger bridge are the seeds.

## Batch — alt-history-and-systemic-sim (batch-20260620-113905)

Source: docs/plans/alt-history-and-systemic-sim.prq.md (sha256: e292c27ee0d28499536fd909f8bb59d83684f16122a8d449008a19f008ce00c2)
Started: 2026-06-20T16:39:05Z

Executable queue for the full alt-history + systemic-sim PRD. Design detail
lives in the "alt-history consistency" section below and in
docs/superpowers/specs/2026-06-20-systemic-sim-layer.md. Already shipped
(AH1 terms/branch/render, AH3 selection, Nazi pool, AH8 surname terms, SIM1
spec) — not re-queued here.

### task-001 AH7 slot-event system
- [x] task-001 SlotSchema + data; archetypal slots resolve to branch/dynasty events at compile time; test: leader-assassination slot → Fred Trump (political) / Commissar purge (nazi)
### task-002 AH8b branch-name audit
- [x] task-002 sweep content for hardcoded Trump/Drumpf → {surname}/{family_name} tokens; render-path wired; interpolation test (Nazi shows Drumpf). Audit finding: origins is ALREADY branch-consistent (German/Nazi paths route through separate Drumpf-framed events; American paths through Trump events), so no mass retokenization needed/safe (would wrongly flip proper nouns like "Trump Tower"). Fixed family_name to drop embedded article; tokenized the one shared cross-branch reference (born_to_empire → {surname}); surname/patronymic interpolation test added.
### task-003 Kennedy/RFK Jr protagonist timeline
- [x] task-003 timelines/kennedy.json (scope kennedy, 26 events) + brewing/bootlegger Era-0 bridge (origins) enabling the Trump↔Kennedy swap; validates + swap test (bootlegger_fortune/political_dynasty/kennedy_swap flags asserted in both)
### task-004 West-Coast branch backdrop pool
- [x] task-004 usa/world/mores/religion .westcoast.json (35/31/29/27 events) — Pacific-centered, ≥30 events each, 0 dups, consistency test
### task-005 Evangelical-theocracy branch backdrop pool
- [x] task-005 usa/world/mores/religion .theocracy.json (28/21/19/24 events) — religious-state titles/events, ≥30 each, 0 dups, consistency test
### task-006 Media/pleasure-king branch backdrop pool
- [x] task-006 usa/world/mores/religion .media.json (31/27/20/20 events) — vice→porn→Hollywood→propaganda arc, ≥30 each, 0 dups, consistency test
### task-007 Role-flip protagonist overwrite content
- [x] task-007 role-flip era content: 9 ev_flip_* events across interregnum(+4)/victory(+5) dramatizing Musk-as-leader / Trump-as-tycoon from Donald's POV (natural-born repeal → Musk ascends → Donald the kingmaker-mogul/patron/rival → bankroll-or-build the rival Mars program), using the {head_of_state} token + role flags (musk_political/trump_commercial_path/trump_tycoon_empire/kingmaker_mogul). 0 dups.
### task-021 TRUE TOTALITARIAN THEOCRACY (user, 2026-06-20)
- [x] task-021 theocracy darkened to GILEAD-grade across all 4 theocracy files (+22 events: gender-caste edict, the Watchers secret police, ritual submission, forced-conversion centers, reproduction-as-state-property, heretic labor colonies, soul surveillance, refugee + underground-railroad world events) while PRESERVING the 3 poles (gilead_regime dictatorial / soft_establishment centrist / covenant_commonwealth benevolent-illiberal). Grounded in Handmaid's Tale + real totalitarian theocracy. 0 dups. ORIGINAL: our current theocracy branch reads as institutional-Religious-Right; the user wants a TRUE theocracy — HANDMAID'S TALE-grade dystopian totalitarian theocracy (Gilead): gender-caste subjugation, ritualized control, secret police, a total surveillance-of-the-soul state. RESEARCH dystopian-theocracy fiction + real totalitarian-theocratic regimes for grounding. Either deepen the existing theocracy pool toward this darkness or fork a distinct sub-variant. Lean into the dark/hard-sci mandate.
### task-022 BRANCH MORAL-AXIS SUB-PATHS — utopian / centrist / dictatorial (user, 2026-06-20)
- [x] [ABSORBED→DE-2] (activated into DYNASTY EVERYTHING batch) task-022 [FOUNDATION DONE: src/sim/moralAxis.ts — moralPoleOf resolves utopian/centrist/dictatorial from branch pole-flags with personality fallback; moralPoleLabel gives BRANCH-RELATIVE labels (theocracy utopia = Covenant Commonwealth, dictatorial = Gilead); 4 tests. REMAINING: wire moral pole into endings + HUD; ensure every branch pool expresses all 3 poles.] EACH branch should offer UTOPIAN, CENTRIST (middle-of-the-road), and DICTATORIAL sub-paths — UNLESS one makes zero sense early. KEY THEME (user): even the Nazi-controlled world HAS a "utopian" state — the chilling, interesting part is interrogating WHAT its idea of utopia is and HOW it's achieved. So "good vs bad outcome" is BRANCH-RELATIVE and morally interrogated; the game leans into dark areas + hard sci-fi, and a core question is what even CONSTITUTES a positive vs negative outcome for a given timeline. Design: a per-branch moral/governance axis (utopian↔centrist↔dictatorial) that gates events + endings within each backdrop, mapped onto the existing personality ideology axis + tyranny↔utopia HUD, but with each branch's "utopia" authored on its OWN value system (a Reich "utopia" is monstrous-but-coherent). Applies across all branches (default/nazi/westcoast/theocracy/media/megachurch/oligarchy). Each branch pool + endings must express its three poles.
### task-023 PAPER-PLAYTEST WITH PLAYER PERSONAS (user, 2026-06-20)
- [x] [ABSORBED→DE-6b] (activated into DYNASTY EVERYTHING batch) task-023 fan out agents that PAPER-PLAYTEST as a range of distinct HUMAN-PLAYER PERSONAS (e.g. the min-maxer/optimizer, the roleplayer/immersionist, the completionist/100%-er, the chaos-tester/button-masher, the moralist seeking the "good" ending, the historian probing accuracy, the speedrunner, the villain-roleplayer). Each persona plays through compiled timelines (via the AH5 harness) and reports: dead-ends, shallow stretches, dominant/trap strategies, unclear choices, balance problems, AND — crucially — ENTIRE MISSING BRANCHES we haven't identified yet (gaps in the dynastic/governance/ideological space). Aggregate persona findings → fill gaps, author newly-discovered branches, deepen thin spots. Complements AH6 (mechanical consistency sweep) with creative-coverage discovery. This is open-ended discovery — expect it to surface new branch ideas like task-019/020/021 did.
### task-024 EVALUATE KOOTA (ECS) FOR QUERIES/ENGINES (user, 2026-06-20)
- [x] task-024 (spec: docs/superpowers/specs/2026-06-20-koota-ecs-evaluation.md) RECOMMENDATION: decline Koota as core (it is a mutable reactive ECS; our correctness rests on pure+deterministic+replay-from-seed, which it would fight); keep the small tested pure query helpers; hold a disposable read-model projection in reserve with a tripwire (same multi-component join hand-written 3+ places, e.g. persona-playtest analytics). consider wiring KOOTA (pmndrs reactive ECS, https://github.com/pmndrs/koota) into the JSON-data layer to power the many cross-cutting QUERIES + engines we keep hand-rolling: event eligibility, the linking-protocol broadcast, butterfly-rule matching, branch/slot/timeline selection, market/rank ticks. An ECS where timelines/events/markets/ranks/dynasts are entities with components could make these queries declarative and the engines composable. DESIGN PASS FIRST (don't adopt impulsively): hard constraints to honor — the sim MUST stay PURE + DETERMINISTIC (no Math.random/Date.now; replay from seed+history reconstructs state to the bit); Koota's world/store must be reconstructable deterministically and serialize into the seed+history save model (or stay a derived read-model over the existing pure state, NOT the source of truth). Evaluate: does Koota's mutation model fit a pure-functional transition? Is it a query/read layer over GameState, or a rewrite of state.ts? Bundle-size + Capacitor/mobile cost. Write a short spec (docs/superpowers/specs/) weighing adopt-as-read-model vs adopt-as-core vs decline, with a recommendation, before any code.
### task-026 KOOTA REFACTOR — FIRST (user DECISION 2026-06-20, OVERRIDES task-024 "decline")
- [x] [ABSORBED→DE-1] (activated into DYNASTY EVERYTHING batch) task-026 the user has DECIDED to do the Koota refactor FIRST: "this is also where koota would be tremendously helpful — if we did the refactor first to koota it would make all these queries much cleaner." So adopt Koota as the query/engine substrate AHEAD of the remaining query-heavy systems (moral-axis, deep-future, persona analytics) so they're authored against the ECS, not hand-rolled. HARD CONSTRAINTS still hold (from the task-024 spec): the sim must stay PURE + DETERMINISTIC, saves stay seed+history, replay reconstructs to the bit. So the refactor adopts Koota as a DERIVED read-model/query layer projected from the pure GameState each turn (option B in the spec), NOT as a mutable source of truth — the pure transition (applyChoice) remains authoritative; Koota worlds are rebuilt from (Content, GameState), queried, discarded. Migrate the existing query helpers (eligibleEvents/effectiveWeight, timelinesForBranch/applyWorldFlags linking, branchOf/slot/moralAxis resolution, market/rank reads) to declarative Koota queries over that projection, keeping every determinism + replay test green. Sequence: (1) add koota dep + a projectWorld(content,state) builder + determinism guardrail tests; (2) migrate one query (e.g. eligibility) as the pattern; (3) migrate the rest; (4) re-verify replay parity + the timeline:sweep. PRECEDES task-022 deepening / task-025 / task-023 analytics so they're built on the ECS.
      PROGRESS: step 1+2 DONE — koota ^0.6.6 added; src/sim/world.ts projectWorld(content,state) builds a disposable Koota read-model (one entity per event with EventRef/Eligible/Weight/Branch/Pole traits, content-order deterministic); queryEligible migrated as the pattern with a PARITY test proving it exactly equals the pure eligibleEvents across seeds + a determinism test. Pure transition stays authoritative; world rebuilt+discarded per query. 226 tests green. NOTE: koota added ~180KB gzip to the bundle (1.25→1.78MB) — acceptable for now; if mobile size bites, lazy-load the read-model (it's per-query, not on the hot save path). REMAINING (step 3-4): migrate more queries (linking/branch-group/market-rank reads) + re-verify replay parity & timeline:sweep.
### task-025 PER-BRANCH DEEP-FUTURE: branch-motivated Mars / stars / first contact (user, 2026-06-20)
- [~] task-025 DONE for 2 of the key branches (the user's detailed examples): THEOCRACY (+13 events) — broadcast-evangelism drives tech → orbital "Heaven's Gate" array → the sermon-signal answered = first contact → Crusade Encyclical → ark-class warships → 3 poles (Communion/Standoff/Theodicy-of-Fire); OLIGARCHY (+14 events) — multinationals assume sovereign debt (EIC model) → solar-system extraction → extrasolar new-markets → first-contact-as-trade → fork: trade commonwealth (utopian) / monopoly regime (centrist) / alien subjugation+company-rule (dictatorial). Both set ALL four science-ladder flags via their OWN motivation (mission / profit), not the default conquest. REMAINING: deep-future arcs for nazi (Reich conquest), media (broadcast reach), westcoast (techno-frontier), megachurch (mission) — pair with task-017. ORIGINAL: each timeline/dynasty needs its OWN distinctive MOTIVATION + path into Mars, the stars, and first contact — not a shared generic science ladder. The DRIVE differs per branch and reshapes the whole late game. KEY EXAMPLE (user): a TECHNO-THEOCRATIC line where mass media motivates the theocracy to embrace technology — but the goal is NOT to conquer the solar system; it is to build the GREATEST BROADCASTING ARRAY to share the Word of the Lord to the heavens → that signal CAUSES first contact → a HOLY WAR / CRUSADE, with late-stage tech (giant ARK SHIPS, weapons) pursued purely as a means to strike the enemy. Design per-branch deep-future arcs (eras ~10-12) where the spacefaring motivation, the nature of first contact (trade vs crusade vs corporate-annexation vs broadcast-evangelism vs Reich-conquest), and the endings flow from the branch's values. Each branch's science-ladder gating + first-contact events + Era-11/12 content should express its OWN reason for reaching the stars. Cross-cuts the science timeline, the moral-axis (task-022), and the endings.
      PER-BRANCH MOTIVATION EXAMPLES (user): (a) TECHNO-THEOCRACY — broadcast the Word
      to the heavens → signal causes contact → holy war/crusade, ark ships as weapons.
      (b) OLIGARCHY — a purely economically-motivated oligarchy turns into MULTINATIONALS
      ASSUMING THE WORLD'S DEBT (in pieces) → a mercantile incentive to EXPLOIT the
      solar system, then beyond → first contact framed as a choice between ECONOMIC
      ALLIANCES vs COLONIZATION/SUBJUGATION (East-India-Company / mercantile-colonial
      precedents extrapolated). Each backdrop reaches the stars for its OWN reason
      (Reich conquest, theocratic evangelism, corporate exploitation, media reach,
      West-Coast techno-frontier, megachurch mission) — author each accordingly.
### task-019 MEGACHURCH religious-dynasty branch (user, 2026-06-20)
- [x] task-019 (megachurch pool: usa/world/mores/religion .megachurch.json, 30/20/20/22) a TRUE American MEGACHURCH religious DYNASTY — a clear gap for a game with interwoven ideological/theological areas, and distinct from the theocracy STATE branch. RESEARCH the real American megachurch phenomenon (Graham, the televangelist dynasties — Roberts/Bakker/Robertson/Osteen, the prosperity gospel, Hillsong/Lakewood, family-succession ministries, the megachurch-as-business-empire). A dynasty whose power is a religious-media-financial empire (not a theocratic state per se). New branch key "megachurch" (+ schema/branch/terms entries) and a 4-scope pool (usa/world/mores/religion .megachurch.json). Head-of-state/title + currency terms per branch. Could converge with media (televangelism) and theocracy (Religious Right) threads.
### task-020 OLIGARCHY / OLIGOPOLY branch (user, 2026-06-20)
- [x] task-020 (oligarchy pool: usa/world/mores/religion .oligarchy.json, 28 each, utopian/centrist/dictatorial poles) an OLIGARCHY/OLIGOPOLY America as another logical successor to the COLLAPSE of the democratic republic (we already introduced an America that does NOT remain a democracy via the Nazi + theocracy branches; oligarchy is the third logical destination — corporate/plutocratic capture, a board-of-billionaires state, company-towns writ national, the Chairman/CEO-as-ruler). RESEARCH (Gilded-Age trusts, robber barons, regulatory capture, modern tech-oligarch power, state-capture literature). New branch key "oligarchy" (+ schema/branch/terms) and a 4-scope pool. Ties naturally to the Musk tech-dynast + the markets/ranks SIM1 layer (commercial rank → political power). FRAMING (user): the collapse of one America and the rise of another — Reich / theocracy / oligarchy are parallel post-democracy forms.
### task-008 AH3 timeline compiler (compile-at-Era-0)
- [x] task-008 timeline compiler (src/sim/compiler.ts): compileTimeline produces ONE bespoke internally-consistent CompiledTimeline read-model from a run's Era-0 state — resolved branch + dynasty + role-flip, the selected timeline variants (default+branch), slot resolutions, active currency lane, and branch-resolved key terms. compileFromEra0 replays the prologue from seed+choices. Deterministic; a READ-MODEL over seed+history (saves stay tiny — no new persisted state, replay-safe). 4 tests (Nazi run compiles coherent Reichskommissar/Drumpf/reichsmark/nazi-USA/Fred-slot bundle). Bias-weighting (AH9) threads through the rng param for later without churn.
### task-009 AH5 timeline-compiler dev harness
- [x] task-009 dev harness scripts/timeline-dump.ts via vite-node: `pnpm timeline:dump --seed X --flags a,b` dumps the full compiled JSON + consistency report (exit 1 on issue); `pnpm timeline:sweep --n N` prints a per-branch summary table. Already caught real gaps (megachurch/oligarchy missing head_of_state terms → fixed).
### task-010 AH9 butterfly weight/bias pass
- [x] task-010 selection BIAS layer (AH9): optional event.bias {branch, personality} scales effectiveWeight so the seeded chaos field pulls toward the run character — a branch-matched event is likelier on its line, a grandiose run surfaces grandiose events. Applied in effectiveWeight after butterfly+ripple; the compiler already threads rng for it. 4 bias tests.
### task-011 SIM1 phase 1 — schemas + state
- [x] task-011 markets/currencies/ranks zod schemas + GameState fields (markets/ranks/currencyId), deterministic init helpers, wired through buildContent + loader; 5 tests. (Done out of order — pure new files, no conflict with the in-flight Kennedy origins edit.)
### task-012 SIM1 phase 2 — pure systemicTick
- [x] task-012 pure systemicTick in applyChoice step 8d (looped per elapsed year); markets walk (regime hazard→AR(1)→meter transmission+housing carry), currency resolves+redenominates, ranks drip/fall-bleed; seeded via rng.fork; replay parity preserved (184 tests incl. existing determinism tests green); 9 tick tests
### task-013 SIM1 phase 3 — data + per-era table
- [x] task-013 markets.json (6 markets incl. attention+crypto+housing, regimes/couplings), currencies.json (branch+location+year-window catalog incl. the Weimar Rentenmark ÷1e12 wipe), ranks.json (4 ladders, political→head of state); real data drives a deterministic tick end-to-end; 13 tests; app builds. (Per-era applicability wiring of which markets/ranks are live per era — a refinement — folds into task-022 moral-axis + later balance; data foundation shipped.)
### task-014 SIM1 phase 4 — UI surfacing
- [x] task-014 SIM1 UI: MarketsView component (live market index/regime/position badges + the 4 rank ladders with fall-from-grace marker) wired as a 💹 tab (shown when markets/ranks exist); branch-aware currency relabel via resolveCurrency + formatMoneyIn (net worth reads ℛℳ on the Nazi branch, etc.). 3 browser tests; app builds + renders. (Put markets in their own tab rather than a Dossier sub-panel — earns the space given the systemic depth.)
- [x] SEEDRANDOM / MULTI-LAYER PRNG (user, 2026-06-20) — CONFIRMED already the determinism backbone: seedrandom ^3.0.5 + @types/seedrandom ^3.0.8 installed, wrapped behind createRng (src/sim/rng.ts) with LAYERED independent streams via fork(label) (used pervasively: mkt:/systemic:/choose:/pick: layers). Math.random banned in src/sim by the commit gate. Fork-independence + determinism already tested (rng.unit.test.ts).
### task-015 SIM1 phase 5 — balance + polish
- [x] [ABSORBED→DE-3a] (activated into DYNASTY EVERYTHING batch) task-015 balance pass; telegraphed currency-hedge survival play; crypto/attention polish
### task-016 AH6 agent-sweep verification
- [~] task-016 MECHANICAL sweep DONE + green: `pnpm timeline:sweep` over all 7 branches × dynasty shows correct title/currency/timeline-variant selection, 0 structural contradictions (the harness consistency check). The DEEP content-anachronism + shallowness sweep (agents reading compiled dumps for prose-level leaks) pairs with task-023 personas and runs AFTER the theocracy-darkening + role-flip content lands so it checks final content. Keeping open for that pass.
### task-017 AH4 no-shallowness audit
- [x] [ABSORBED→DE-3b] (activated into DYNASTY EVERYTHING batch) task-017 verify every branch opens a comparably rich gated multi-layer pool; deepen any thin branch
### nb-006c Post-merge cleanup (PR #12 follow-up)
- [x] nb-006c removed dead `?? 0`/`?? 1` masking on MarketState reads in src/sim/world.ts (Index/Regime/Position spawn) + src/sim/effects.ts (marketOps holding/leverage). MarketState fields are NON-OPTIONAL by type and guarded by `if(!ms)continue`/`if(!cur)continue`, so the fallbacks were unreachable and would mask a future real bug. The Gemini PR #12 thread ("legacy save-state market fields") rests on a WRONG premise: saves are seed+history ONLY (save.ts toSave/fromSave→replay), market state is ALWAYS reconstructed by initState→initMarkets — no save carries a partial MarketState. Kept the legitimate koota `.get(Component)?.x ?? d` getters (koota getters genuinely can be undefined). Carries the loose-on-main directive commit 2fcb0fe onto this branch (never-commit-to-main fix). 261 tests green, typecheck + biome clean.
### task-018 Definition of done
- [x] task-018 DoD — PR #10 squash-merged to main (a0ab271). Reviewer trio folded (security clean; code-review 3 findings fixed; gemini 2 fixed + 3 refuted), CI green, 228 tests, app live-verified. DoD — PR #10 open (https://github.com/jbcom/maga-money-moves/pull/10); reviewer trio + CI running under a Monitor. On completion: fold findings → resolve threads → squash-merge once green. gate GREEN (typecheck, biome, 227 unit + 59 browser, build) and app LIVE-VERIFIED (chrome-devtools: title → German/Nazi-branch divergence "The Boy Who Served the King" → Markets tab with 6 live markets + 4 rank ladders + currency relabel, zero console errors); 7-branch timeline:sweep consistent. Opening the PR for the shippable unit now; remaining OPEN EPICS (full Koota query migration, deep-future for nazi/media/westcoast/megachurch, persona sweep task-023, Dynasty rename + Musk/Kennedy Era-0 sagas, AH8d sibling-count, task-022 full 3-pole coverage, task-017 no-shallowness) carry forward as the NEXT work unit per one-branch-per-unit. → open PR → reviewer trio → wait CI → squash-merge.

## Batch — alt-history consistency (batch-20260620-althist)

Source: user directives, 2026-06-20 (verbatim intent below)
Started: 2026-06-20

THE CORE PROBLEM (user): counterfactual branches must stay HISTORICALLY
CONSISTENT, and no single divergent choice may make the content feel shallow.
Three intertwined requirements:

- [x] AH1 TITLE-AWARE OVERRIDES (DONE via task-001/AH-terms: branch+term layer src/sim/{branch,terms}.ts, render-path wired): (user): the override system must work with TITLES,
      not just events/flags. Full scan done: "president" appears 144× across 8 era
      files + usa/musk timelines, all branch-blind. On the Nazi/Axis route there is
      NO U.S. president — the Axis-appointed American leader holds a Reich-style
      title (Reichskommissar/Gauleiter/Statthalter — research the accurate term),
      never "President". JFK is NOT shot in 1963 (no presidency to assassinate).
      The leader-title (and head-of-state references generally) must resolve from
      the active branch. Needs a title/term resolution layer the content reads.
- [x] AH2 MUTUALLY-EXCLUSIVE / EXCLUDED EVENTS (DONE via per-branch pools: usa.nazi etc. replace incompatible real events; consistency test + timeline:sweep enforce it): (user): some world events FORCE
      OTHERS OUT of the timeline by choice bias. Real-history landmarks that are
      impossible under a branch must be suppressed: e.g. "I Have a Dream" / March
      on Washington / civil-rights arc / free elections / democracy / Constitution
      / Congress cannot occur in Nazi-occupied America. Scan found all of these in
      the data, none gated on branch. Need an exclusion mechanism (branch flags in
      notFlags, or an excludes-set) so picking a branch removes incompatible events.
- [x] AH3 ALT-HISTORY BRANCHING ARCHITECTURE (DONE via task-008 compiler + timelinesForBranch + 7 branch pools): (user DECISION 2026-06-20): mechanism =
      FULL SEPARATE TIMELINES PER BRANCH. Loader picks the variant set matching the
      active branch flag: e.g. timelines/usa.default.json + usa.nazi.json +
      usa.westcoast.json + usa.theocracy.json + usa.media.json; same for
      world/mores/religion/science. A branch-key resolver chooses which variant of
      each scope to load from the run's branch flag.
      CRITICAL LAYERING (user): the DONALD and MUSK arcs are PROTAGONIST timelines —
      threadable/overwritable THROUGH the backdrop timelines (they weave across
      branches, the role-flip overwrites them). The SOCIAL (mores), RELIGIOUS,
      TECHNOLOGICAL (science), and GEOGRAPHICAL (manhattan/eastcoast/westcoast/usa/
      world) timelines are BACKDROPS — each must be MASSIVELY fleshed out per branch
      to give rich multi-layered context, extrapolating how leadership / geopolitical
      / economic / moral decisions differ across the changed timeline.

      *** AH3 ENGINE MODEL — "GEARS IN A CLOCK" (user, 2026-06-20, AUTHORITATIVE,
      supersedes the simple per-scope swap above) ***
      - Every backdrop config (geography / social / religious / ideology, and the
        whole-history variants: real-American-political, evangelical, Nazi, …) is its
        OWN DISTINCT, INTERNALLY-CONSISTENT timeline. You must NEVER see a cross-
        timeline contradiction (e.g. "A Young Man Wins the White House" must NOT
        appear in a Nazi timeline). Each config stays coherent on its own.
      - THREE CENTRAL FIGURES / DYNASTIC FAMILIES (Trump, Musk, Kennedy/RFK Jr) are
        the GEARS — the push-and-pull. The COURSE of the timeline is what ERA 0 (the
        prologue) sets: prologue choices SLOT IN exactly which timeline configuration
        the run assembles.
      - COMPILATION AT ERA 0: at the start, the engine stores a CUSTOM CAPACITOR
        PREFERENCES SAVE that records the prologue choices AND — using the BUTTERFLY
        MACHINE + BIAS WEIGHTING — PULLS from all the myriad timeline configs
        (geography, social, religious, ideology, titles, markets, currencies, …) and
        COMPILES them into ONE bespoke, internally-consistent story for that save.
      - So a run is not a live per-scope file swap; it is a COMPILED bespoke timeline,
        composed once at Era 0 from weighted, mutually-consistent config selections,
        persisted to the save, then played out (still driven by the butterfly machine
        and the three dynastic gears). The branch flag + timelinesForBranch selection
        already built is a SUBSET of this; evolve it toward the compile-at-0 model.
- [x] AH5 TIMELINE-COMPILER DEV HARNESS (DONE via task-009: pnpm timeline:dump/sweep): (user, 2026-06-20): so we never have to
      WONDER whether a timeline is stable/consistent, build a dev harness that, given
      a SEED + ERA-0 CHOICES, DUMPS THE FULL COMPILED JSON TIMELINE for that run
      (all backdrop selections, titles, markets, the woven event order — the entire
      bespoke story). A pnpm script (e.g. `pnpm timeline:dump --seed X --choices ...`)
      writing the compiled timeline to a file for inspection + a consistency check
      (no cross-timeline contradictions). This is the verification tool for the
      compile-at-0 engine — pairs with the no-shallowness + consistency invariants.
      WHY (user): makes testing much more DETERMINISTIC, and lets the user run a BUNCH
      of different Era-0 PERMUTATIONS and manually quality-control the compiled
      results themselves. So the harness needs a BATCH/MULTI-PERMUTATION mode too
      (enumerate or sample many Era-0 choice sets → dump each compiled timeline →
      summary table of which configs each produced), for sweep-style manual QA.
      NOTE: the per-branch backdrop JSONs being authored now (usa.nazi, world.nazi,
      mores.nazi, religion.nazi, …) are the CONFIG POOLS the compiler draws from —
      authoring them remains necessary under the gears-in-a-clock model.
- [x] AH7 SLOT EVENTS (DONE via task-001: SlotSchema + slots.json + resolveSlot): (user, 2026-06-20): certain real events are SO structurally
      critical they should be abstract SLOTS filled per timeline, not hardcoded
      concrete events. The JFK assassination is really the archetype "the
      assassination of the dynasty's leader" — on the political-dynasty path it's
      FRED TRUMP's assassination; elsewhere it's another figure or doesn't fire.
      There are likely a TON of these (the war, the crash, the great scandal, the
      martyrdom, the succession). Design a SLOT system: archetypal event slots that
      resolve to branch/dynasty-specific concrete events at compile time (pairs with
      the gears-in-a-clock compiler — slots are filled when the timeline compiles).
- [x] AH8 BRANCH-AWARE PATRONYMICS / NAMES (DONE via task-002 + AH8c: surname/given_name/full_name terms, Trump↔Drumpf / Donald↔Friedrich): (user, 2026-06-20): names change with the
      branch. The family only became "Trump" by anglicizing "Drumpf"; in the Nazi
      (stayed-German) timeline Donald remains DONALD DRUMPF. Extend the AH1 term layer
      to PROPER NAMES / surnames (a {surname}/{family_name} term: "Trump" default,
      "Drumpf" on the German/Nazi branch, etc.), and audit content for hardcoded
      "Trump" that should be the branch-aware surname token.
      AH8b (done) + AH8c GIVEN NAMES (user, 2026-06-20): the protagonist's FIRST name
      is also branch-aware. In tradition-proud military/religious German dynasties
      (Nazi, Lutheran/evangelical) the heir would likely carry the patriarch's name —
      so Donald could instead be FRIEDRICH (III), after Friedrich Drumpf. CAVEAT
      (user): Donald was the FOURTH child, so naming the fourth son after the
      patriarch is a stretch under strict primogeniture — handle nuance: the
      branch-aware {given_name}/{full_name} resolves to "Donald" by default and to a
      dynasty-traditional name (Friedrich III, etc.) on the military/religious German
      branches where the family-name tradition is strong, with the fourth-child
      caveat acknowledged in the framing (e.g. the name passes to him because earlier
      sons fell / on the proud-tradition branches it is bestowed deliberately).
- [x] [ABSORBED→DE-4] (activated into DYNASTY EVERYTHING batch) AH8d SIBLING-COUNT / BIRTH-ORDER AS AN ERA-0 LEVER (user, 2026-06-20): how many
      children Fred/Friedrich has — and the protagonist's birth order — is itself a
      PIVOTAL branching variable that ripples through many timelines. Real history:
      Donald is the FOURTH of five, heir only because Fred Jr. (the firstborn)
      rebelled/washed out and died — the "reluctant/accidental heir" dynamic. If Fred
      has ONE child (or Donald is firstborn), the patriarch's name likely passes to
      him (→ Friedrich III, ties to AH8c), inheritance is direct/groomed, and the
      "had to earn it past an elder brother" arc vanishes. Make sibling-count +
      birth-order an Era-0 prologue choice that sets flags (e.g. only_child /
      firstborn_heir / fourth_child / fred_jr_present / fred_jr_died) which then drive
      given-name resolution (AH8c), inheritance logic, and the groomed-vs-accidental-
      heir personality framing across the compiled timeline.
- [x] AH9 BUTTERFLY WEIGHT/BIAS (DONE via task-010: event.bias branch+personality layer in effectiveWeight): (user, 2026-06-20): the butterfly effect +
      causal engine need an agent pass to ASSIGN WEIGHTS AND BIASES across the events
      / butterfly rules / ripples so the compile-at-0 selection and the in-run chaos
      field pull realistically (which configs/events are more or less likely given the
      prologue + accumulated state). Send an agent through to tune weights/biases
      systematically (this is what makes the bias-weighted timeline compilation and
      the butterfly machine produce believable, varied bespoke stories).
- [x] [ABSORBED→DE-6a] (activated into DYNASTY EVERYTHING batch) AH6 AGENT-SWEEP VERIFICATION (user, 2026-06-20): agent verification is FAST —
      far quicker than a human reviewer at spotting flaws across many permutations.
      So the QA strategy pairs with AH5: once the compiler/harness can dump a
      compiled timeline per (seed + Era-0 choices), FAN OUT verification agents over
      a SWEEP of Era-0 permutations, each agent reading one compiled-timeline dump
      and flagging cross-timeline contradictions / anachronisms / shallowness / title
      mismatches (e.g. "President" leaking into a Nazi run, a default real-history
      headline in an alt branch). Aggregate findings → fix the offending config →
      re-sweep. This automated consistency sweep is how we hold the no-shallowness +
      consistency invariants at scale instead of hand-checking.
- [x] AH3-BRANCHES (DONE via task-004/005/006/019/020/021: nazi/westcoast/theocracy/media/megachurch/oligarchy pools authored). author full alt-history treatment for these branches:
      (1) NAZI-OCCUPIED AMERICA (axis_ascendant/nazi_dynasty) — Reich titles, purges
          not assassinations, no elections/civil-rights/free press.
      (2) WEST-COAST-ONLY DYNASTY (west_coast_origin) — Pacific-centered, never
          touches Manhattan/East Coast.
      (3) EVANGELICAL THEOCRACY (evangelical_scion/faith_to_power) — religious-state
          titles (Supreme Pastor etc.), theocratic events.
      (4) TRUMP↔MUSK ROLE-FLIP (role_flip) — head-of-state + arc reflect Musk-as-
          leader / Trump-as-tycoon (protagonist-thread overwrite, per layering rule).
      (5) NEW — MEDIA / "PLEASURE KING" BRANCH (user): Drumpf goes ALL-IN on the
          brothels → "pleasure king" of the West Coast, a position spanning Nevada
          through California where mining-boom prostitution stays legal longer →
          transitions into PORNOGRAPHY then MEDIA (think Hefner) → becomes a FOUNDING
          FAMILY OF HOLLYWOOD → a PROPAGANDA empire that launders its sordid past
          into legitimacy amid the post-1920s shift in morality. Its propaganda
          capability toward legitimacy is a key thread to explore.
      (6) NEW — POLITICAL DYNASTY / KENNEDY SWAP (user): add a THIRD immortal
          protagonist dynast — RFK JR — with his OWN JSON timeline and a rich
          KENNEDY family tree (Joseph → his sons → RFK Jr), making THREE swappable
          protagonist dynasts (Trump, Musk, Kennedy). Historical wiring: Kallstadt
          was a brewing village; if the Drumpfs had stayed in BREWING instead of
          real estate, then become BOOTLEGGERS during Prohibition (exactly Joseph
          Kennedy's path to fortune + political dynasty), Donald could SWAP IN AND
          OUT of the Kennedy family tree. So three avenues let Donald merge with /
          mirror the Kennedy arc. flags: brewing_dynasty / bootlegger_fortune /
          kennedy_swap / political_dynasty. RFK Jr is a protagonist timeline
          (timelines/kennedy.json) threaded like Donald/Musk, per the layering rule.
- [x] [ABSORBED→DE-3b] (activated into DYNASTY EVERYTHING batch) AH4 NO-SHALLOWNESS INVARIANT (user): "we do not want any one choice suddenly
      makes the content feel shallow." A branch must be authored to the SAME depth
      as the main line — taking any fork opens a comparably rich, gated, multi-layer
      backdrop + event pool, not a thin stub. Acceptance bar for AH1-AH3.
- [x] SIM1 SYSTEMIC SIMULATION LAYER (DONE via task-011/012/013/014: schemas+state, systemicTick, data, Markets UI): — "Donald Trump meets Dwarf Fortress" (user,
      2026-06-20): choices alone don't make a good game; we need LIVING SUBSYSTEMS
      that continuously pull the 6 meters (money/power/reputation/loyalty/health/heat)
      up and down between choices, like a stock market. All branch-aware/overridable
      and era-applicable. Be open-ended, extrapolate, research; same rule — nothing
      too dense, no detail too specific to omit. Components:
      (a) FINANCIAL MARKETS: an overridable CURRENCY (dollars default; deutschmarks
          pre-Reich; reichsmarks under the Nazi branch; rand on a South-Africa/
          apartheid thread; etc. — currency resolves by branch AND by where/when the
          player is) plus market dynamics (booms/busts/cycles) that move money.
      (b) HOUSING MARKETS: real-estate cycles (the family's core business) that move
          money/power — bubbles, crashes, rent rolls, redlining-era dynamics, etc.
      (c) REPLACEABLE INTERWOVEN RANK SYSTEMS: SOCIAL rank, COMMERCIAL rank,
          RELIGIOUS rank, POLITICAL rank — each a ladder the player climbs/falls,
          branch-swappable (e.g. political rank = elected office vs Reich appointment
          vs church hierarchy vs board seats). Think per era what ladder applies.
      (d) Markets + ranks feed the 6 levers procedurally (a tick/era step), so the
          world moves even when the player isn't clicking. Design per-era: which
          markets + which rank ladders are live in each era 0→12.
      Needs a brainstorm/design pass (architecture: schema for markets/currencies/
      ranks, a deterministic tick that applies them in the pure sim, branch override,
      UI surfacing) before authoring — this is a substantial new simulator pillar.

## Batch — causality-endings-personality (batch-20260620-causality)

Source: docs/plans/causality-endings-personality.prq.md (sha256: 9eaf443ac3929c8faab9e78c05b2a38036d96ed711f2356c6d7335930942e812)
Started: 2026-06-20

**SCOPE MANDATE (user, 2026-06-20):** This is NOT a small fan-out. The game must
support **1000+ distinct permutations** and a real playthrough must NOT be
clickable-through in ~5 minutes. That means: deep per-era event pools (many more
events, higher budgets), heavily requires-gated branching so paths diverge, more
choices per event, dozens of endings, and rich consequence chains. Build systems
to support that scale, then author content MASSIVELY (parallel agents per era,
multiple passes). Depth + divergence are the goal, not coverage checkboxes.

### Phase M — Scale content for depth (1000+ permutations)
- [x] M1 Raise era event budgets + author deep event pools (20-40 events/era), heavily flag/meter/personality-gated for divergent paths
- [x] M2 Many more choices per event (3-5) with distinct downstream gating
- [x] M3 Branch-density pass: ensure no era is a straight line; verify path-divergence metric (branch-density.unit.test). WEAK eras to deepen: ascent (dispatched), brand, interregnum, primetime, atomic.
- [x] M4 WORLD/regional/local per-year events woven into all eras (world-event tag)
- [x] M5 GEOPOLITICAL CAUSALITY LAYER (user): the Trumps were intertwined with Manhattan = the 20th-century world. Treat macro-forces as first-class causal inputs to the family fortune & arc: 1918 flu (market crash + manpower loss + anti-German sentiment), Gilded-Age old-money-vs-nouveau-riche LEGITIMACY, WWI/WWII anti-German sentiment, Great Depression, the World Wars, Vietnam. Friedrich surviving the flu → potential TRUE DYNASTY with old-money legitimacy (not just nouveau riche). Wire these as branching world-events with real downstream fortune effects.
- [x] M6 EARLY-POLITICS branch: Trump really flirted with politics early (1987 full-page ads, 2000 Reform run, 2001 Democratic registration). Add a reachable branch where he runs for president in the 1990s — forking the arc decades early, tied to the "stayed liberal" (ideology-negative) personality path. Could lead to wholly different mid-game (early presidency / early flameout / kingmaker) instead of the 2016 timeline.
- [x] M7 ALT-1990s PRESIDENCY (user): research his ACTUAL stated 1980s-90s views (protectionist, anti-nuclear-proliferation, criticized US defense free-riding in his 1987 ads, economically populist, not yet doctrinaire-GOP) — a very different Trump. Branch: he WINS succeeding Reagan (1988/1992) and is the one who navigates the FALL OF THE SOVIET UNION (1989-91) instead of George H.W. Bush. A full alternate-history early-presidency path off brand/early-politics, grounded in period-accurate views; forks the whole mid-game (different Cold-War endgame, different personality trajectory).

### Phase P — Four parallel world-timelines + linking protocol (user, 2026-06-20)
- [x] P1 FOUR PARALLEL TIMELINES: beyond Donald's arc, author FOUR separate researched JSON timelines (era 0 → future), each via its own agents: (1) MANHATTAN/NYC, (2) EAST COAST (NY, Florida, regional), (3) USA (national), (4) THE WORLD (geopolitics). Each is a year/era-indexed sequence of real (then extrapolated) events.
- [x] P2 LINKING PROTOCOL: cross-reference the four world-timelines with Donald's arc — world events gate/trigger/modify his events and vice-versa (e.g. NYC fiscal crisis ↔ his deals; world recession ↔ his fortune). Massively enriches causality + butterfly effects. Define the schema + engine for timeline cross-links.
- [x] P3 NEWS HUD: surface progression as NEWS drawn from all four timelines (headlines/tickers from Manhattan/East-Coast/USA/World) — diegetic atmosphere + signal of the wider world acting on him.
- [x] P4 AI & DEEPFAKES woven into the appropriate eras (2010s onward): the rise of AI, deepfakes, synthetic media — as world-events and as tools/threats in his arc (disinformation, AI-driven campaigns, deepfake scandals, later AI governance). Tie into the science path + personality.
- [x] P5 ERA-0 ALT-HISTORY BRANCHES (user, from Friedrich Trump's real bio — researched): expand origins.json with grand counterfactuals, each a divergent starting hand:
      (a) FRIEDRICH DOESN'T DODGE CONSCRIPTION → family STAYS in Germany → becomes a German MILITARY family → alt-WWII path → a NAZI-CONTROLLED USA (lean on existing "Axis won" alt-history); Donald arrives in America as part of a prominent NAZI family — and CONVERGES, unnervingly, near our existing power branches. (flag: german_military_family / nazi_dynasty / arrived_as_nazi)
      (b) WEST COAST FAMILY → Friedrich stays in his real Seattle/Yukon (Klondike) period and the family becomes a WEST-COAST dynasty, influencing California/the Pacific, NEVER touching Manhattan/East Coast (flag: west_coast_dynasty). Needs a WEST COAST world-timeline (5th scope) to support it.
      (Real anchors: Friedrich b.1869 Kallstadt, emigrated 1885 dodging Bavarian conscription, Seattle 1891 + Yukon Klondike brothel/restaurant fortune, citizenship stripped 1905 → forced back to US; son John G. Trump = MIT physicist, a science-path anchor.)
      (c) RELIGIOUS/EVANGELICAL DYNASTY (user): Kallstadt was LUTHERAN. A branch where the family leans into faith → becomes a religious dynasty (Canada or US) → Donald pushed into power as the SCION OF AN EVANGELICAL MOVEMENT. Grounded in the real historical contingency that Lutheranism could plausibly have become the dominant American evangelical strain (vs the Baptist/revivalist strains that did). A different pathway to a similar road to power (religious-populist route). flag: lutheran_dynasty / evangelical_scion / faith_to_power.
- [x] P6 THREE THEMATIC (LONGITUDINAL) TIMELINES (user, 2026-06-20): beyond the geographic timelines, the alt-history branches surfaced the need for THREE thematic axis-timelines, each its own researched JSON + scope, because deep-FUTURE linking benefits hugely from them (science gates Mars→first-contact; mores+religion gate evangelical/utopia/tyranny endings). Author + wire (new scopes on WorldTimelineSchema): (1) SOCIAL MORES — civil rights, gender, sexuality, immigration sentiment, anti-German sentiment, media norms, cancel-culture, the shifting Overton window across eras 0→12. (2) RELIGIOUS / IDEOLOGICAL — Protestant/Lutheran/evangelical/Catholic currents, the Religious Right, secularization, the communist-utopia↔autocratic-king ideology axis, and far-future ideology (post-scarcity, theocracy-in-space). (3) SCIENCE — the real arc of physics/space/computing/AI/biotech then extrapolated (fusion, AI, extrasolar flight, FTL) — the BACKING timeline for the science ladder (mars_program / back_science / extrasolar_flight / contact_made). All three link cross-scope into Donald's arc AND each other in the deep-future eras.
- [x] P7 MUSK AS A FIRST-CLASS CHARACTER-TIMELINE + TRUMP↔MUSK ROLE-FLIP (user, 2026-06-20, expanded): Donald-as-president must NOT be a required spine. Make the override/perceived-timeline system flexible enough that MANY branch points route Donald into a purely COMMERCIAL life — the trillionaire-tycoon role Musk actually plays in reality (Musk just became the first trillionaire) — where he never needs political power and simply ALIGNS HIMSELF WITH WHATEVER PRESIDENT benefits his companies. Implement by giving ELON MUSK his OWN researched character-timeline JSON (new scope "musk", same WorldTimeline schema) — a parallel arc (b.1971 → future) of his real then extrapolated life: Pretoria, Zip2/PayPal, Tesla/SpaceX, Twitter/X, AI, trillionaire, then extrapolated political/space ascendancy. The role-FLIP falls out of the linking protocol: when Musk's timeline routes him into the political-megalomaniac slot (e.g. after a future repeal of the natural-born-citizen requirement), Donald's arc routes commercial; and vice-versa. Reachable from ANY of the three commercial origins (restaurants / hotels / Klondike brothels) and from many mid-game branch points, not just one. Forks late/endgame eras: Musk-as-king vs Trump-as-king; the other becomes the immortal tycoon-rival who funds/builds (or rules) the Mars + extrasolar program. Tie to existing Musk-rivalry + immortality + extrasolar-flight-motivation threads. NOTE: this scope is a PERSON not a place — its events still broadcast flags (e.g. musk_trillionaire, musk_presidency_eligible, musk_takes_power, trump_commercial_path, role_flip) that gate Donald's arc.
      P7c [x] ROLE-SWAP INVARIANT (user, 2026-06-20) — DONE: implemented src/sim/roles.ts (resolveRoles), wired into applyChoice step 8c, with mutual-exclusion enforced (the flip wins — one seat of power). Endings end_role_flip_tycoon + end_reich_industrialist read the derived flags. Covered by roles.unit.test.ts (6 tests). The SYSTEM of linkages + overrides must NOT collapse no matter the timeline. The invariant across ALL worlds: exactly one of {Trump, Musk} ends up in AMERICAN POLITICAL LEADERSHIP and the other CONTINUES/RUNS THE COMMERCIAL EMPIRE. This holds even in the eternal-Reich world (Musk → political power as Axis power-broker, Trump → economic power within the Reich) and in the default world (Trump → president, Musk → tycoon) and the flip (Musk → president, Trump → tycoon). Encode as a mutual-exclusion rule over role flags (e.g. a *_takes_power / *_commercial_path pair per person, never both-political / both-commercial in the same run) and verify with a determinism/consistency test across seeded playthroughs. This is the load-bearing guarantee that makes the butterfly/override richness safe.
      P7b MUSK ↔ NAZI/AXIS SECRET LINK (user, 2026-06-20): Musk's real origins are apartheid South Africa. Couple the Musk timeline to the Era-0 Nazi/Axis "secret" alt-history: in a world where an Axis-aligned order controlled Africa, apartheid (or a similar racial-caste system) is never dismantled but INHERITED — Musk becomes the scion of that system instead of emigrating. Gate these Musk events on the Era-0 flags (axis_ascendant / nazi_dynasty). Flags: musk_apartheid_scion / musk_axis_aligned / musk_inherited_caste. Real-history Musk events stay unconditional.

### Phase O — Perceived (compressible) timeline (user, 2026-06-20)
- [x] O1 ARCHITECTURE: the timeline is PERCEIVED, not hardcoded. Chains of choices can SHORT-CIRCUIT and "hop" the arc — compressing eras so events happen much sooner (e.g. an early-prodigy path reaches power decades early). Add an engine mechanism where a choice can JUMP the perceived era/year (e.g. choice field "jumpTo": {era?, yearAdvance?}) — advanceTimeline honors it, collapsing the linear era march into a branchy, compressible graph. Keep deterministic + replayable; keep the chronological floor (no backward jumps). Eras become waypoints a run can skip/compress, not a fixed conveyor. Wire example hops (Era-0/early paths that leap forward).

### Phase N — ONE reality + medium-native HUD (user, 2026-06-20)
- [x] N1 ONE reality: strip meta/franchise keywords from player-facing text (Trek/Vulcan/Cochrane/Phoenix); rename benevolent first-contact species to an original in-world name; startrekInspired flag stays private provenance
- [x] N2 Immersion: removed Extrapolated badge + research-note panel (facts woven into scene prose)
- [x] N3 Medium-native HUD: Capacitor Device form-factor (phone/tablet/foldable) → diegetic surfaces (newspapers, TV) not a constant button set
- [x] N4 engine: era entryRequires gate (advanceTimeline ends the run if next era's gate fails) — implements the science ladder
**SCIENCE LADDER (user, 2026-06-20):**
  - NO science at all → game ends on EARTH (≤Era 9) with a utopian/religious OR deistic god-king ending. No Mars.
  - PARTIAL science (Mars program) → reach MARS (Era 10) → good/bad Martian ending.
  - FULL science (back_science + extrasolar_flight from Mars) → Era 11 First Contact → Era 12 Interstellar FTL.
  Personality (utopian↔tyrannical) forks the FLAVOR at every tier.
- [x] N4a Index: add era 11 (firstcontact) + 12 (interstellar); entryRequires gates (mars: mars_program; 11: back_science+extrasolar_flight; 12: warp_gift)
- [x] N4b Earth-terminal endings (utopian-religious, deistic god-king) when science not embraced; ensure Mars-terminal good/bad endings
- [x] N5 EVERY era must be able to END the game, good OR bad, with a logical extrapolated reason it wouldn't continue — INCLUDING childhood (fatal accident, institutionalization, vanishing into obscurity). Author per-era early-out endings (early-good + early-bad) for all 12 eras so the arc is branchy/lethal at every stage.
      EXEMPLAR (the thesis of the cause-and-effect game): the "Quiet Succession" ending — if early/mid choices keep him CONTENT and unambitious, he settles into life as a comfortable old CEO of the inherited rental business: wealthy but not insanely so, still married to his first wife, eventually handing the firm to his son (mirroring Fred→Donald). The story logically just ends — no rise, no drama engine. Early/mid-good ending gated on low grandiosity + content flags + still-married + not-overreached.
- [x] N6 The PREMISE itself is contingent: the inherited business wasn't guaranteed. World-event branches in boyhood/mogul where the family fortune never passes down — e.g. if 1950s-70s civil-rights/housing-discrimination enforcement had gone differently and Fred Trump had been INDICTED (the rentals built on FHA + discriminatory practices; the real 1973 DOJ suit), Donald inherits nothing → no seed capital → no Manhattan, no empire → an obscurity/working-life ending. Make "no inheritance" a reachable branch that forecloses the whole rise.
- [x] N7 ERA 0 — ORIGINS (the Drumpf prologue): NEW first era starting with Friedrich "Drumpf" Trump (Kallstadt immigrant, Klondike-era restaurateur) → Fred Trump → culminating in Donald's birth 1946. Era-0 choices set the player's STARTING HAND, with branches:
      (a) NO DONALD: the dynasty fails before him → Era-0 ending (game over at origins);
      (b) EMPIRE SEEDED EARLY: Friedrich/Fred build real capital → Donald inherits advantage (head-start flags);
      (c) TENEMENT ORIGINS: Donald born middle/lower-class (German ghettos of NYC, public school) — NO inherited empire, must bootstrap (sets a "self_made_start" flag that hard-gates the rise).
      Requires: prepend era 0 to index (shift all orders +1; boyhood becomes order 1, etc.), author origins.json (hard-history grounded), and have boyhood read the Era-0 starting flags. Real name was Drumpf; grandfather Friedrich; grandmother Elizabeth brought the family back to NYC.
- [x] N8 BRANCH-AND-MERGE: the tenement/bootstrap start (1c, self_made_start) is NOT a dead end. Like real self-made financiers (e.g. Lewie Ranieri — Salomon mailroom → mortgage securitization), a tenement-born Donald can CLAW BACK to the main empire branches by the 1980s through his own choices (hustle/merit/finance). Author reconverging branches: self_made_start opens distinct hard-scrabble events (public school, finance-floor grind, 70s-80s opportunity) that can rejoin the mogul/brand arc — or fork to wholly new self-made-tycoon endings. Personality shapes which.
- [x] N4c Author Era 11 (First Contact) + Era 12 (Interstellar FTL); set extrasolar_flight in Mars era
- [x] N4d Re-point secret endings: contact resolves Era 11; warp-apex + spread endings Era 12
- [x] N4e Era 12 branches off the Era 11 contact outcome — multiple far-futures:
      (a) WITH ALLIES: cooperative interstellar expansion (benevolent contact);
      (b) WITH SLAVES: humanity-as-empire, expansion by domination (we conquered them);
      (c) IN REBELLION: fighting back against alien overlords (malevolent contact subjugated us);
      (d) PUPPET: Trump as quisling administrator for worse tyrannical aliens (Half-Life-2/Combine-style) on a subjugated Earth.
      Each its own ending(s), gated by Era-11 outcome flags + personality.
- [x] N4f POST-HISTORY MOTIVE DOCTRINE: once real history ends, causality = hard-SF
      logistics + power dynamics, not events. extrasolar_flight is the RESULT of
      mastering the solar system: settle Jupiter's moons, the Belt, Venus, Mercury
      (rotating equatorial bases) → accumulate ORGANICS + VOLATILES → build deep-space
      ship foundries → extrasolar_flight. The tension/motivation in eras 10-12:
        • Solar-system mastery vs Mars stagnation (gather star-ship resources or stall).
        • RIVALRY WITH MUSK, the other immortal — a centuries-long power struggle.
        • Tyranny-of-distance: light-lag/relativistic separation makes TOTAL RULE
          physically impossible — does the immortal autocrat even want to expand if he
          can't control it? Expansion vs control is the core late-game dilemma.
      Redplanet (Era 10) gets a resource/expansion sub-loop; extrasolar_flight gated on it.
Config: stop_on_failure=false (autonomous, self-resolving) · single feature branch → squash-merge

### Phase H — Research & Causality Model
- [x] H1 Web-research timeline; index pivotal events w/ dated cause→effect (Wikipedia bio + business career indexed; key endings/ideology anchors pulled)
- [x] H2 Causality graph model (delayed/compounding consequences w/ prereqs) + butterfly promoted to a subpackage (ripples/ledger/consequences) + ledger DEDUP fix (no more duplicate chains under different dates)
- [x] H3 Personality vector schema + sim (ideology + grandiosity; outward vs inward) — + time-monotonicity fix (no backward years) + timeline self-reveal (no future spoilers)

### Phase I — Endings
- [x] I1 Data-driven ending system (triggers over meters+personality+flags+era)
- [x] I2 Author ending set (early/late × good/bad + named: jail, bankruptcy, assassination, coup, communist-utopia, megalomaniac-king, Martian-patriarch, obscurity)
- [x] I3 Wire ending triggers across all 10 eras
- [x] I4 SETI / deep-space tech achievement track (science+SETI+telescope flags)
- [x] I5 Two SECRET First-Contact endings (Benevolent/warp APEX vs Malevolent/hostile), forked by planet moral state

### Phase J — Causal Content Pass (per era)
- [x] J1 Era 1 causal+personality+ending pass
- [x] J2 Era 2 pass
- [x] J3 Era 3 pass
- [x] J4 Era 4 pass
- [x] J5 Era 5 pass
- [x] J6 Era 6 pass
- [x] J7 Era 7 pass
- [x] J8 Era 8 pass
- [x] J9 Era 9 pass (First-Contact-2063 hooks)
- [x] J10 Era 10 pass

### Phase K — Personality & Endings UI
- [x] K1 HUD-as-language (tyranny↔utopia drift, visual + diegetic, outward radiation)
- [x] K2 Ending-aware Legacy Report + endings-discovered tracker (secrets locked)
- [x] K3 First-Contact apex-ending presentation (lightspeed → the stars)

### Phase L — Verify
- [x] L1 Determinism + schema tests; seeded playthroughs reach a spread of endings; live screenshots — DONE: 147 unit tests green (determinism + schema + roles + endings + timelines); 300-seed sweep shows 7 distinct endings; reachability probe found + fixed a real bug (science-ladder players were pre-empted by Earth-bound endgame endings at era 7 → added notFlags [mars_program, back_science]); app builds + runs, live-verified via chrome-devtools (title, play screen, seven-scope News HUD, era progression) with ZERO console errors.
- [x] L2 Reviewer trio + green PR + squash-merge — DONE: PR #8 squash-merged to main as da9568d (2026-06-20). All reviewer findings folded (local trio: security clean, simplifier 2 fixes, code-review HIGH role-resolver trap fixed; gemini-code-assist on the PR: 4 threads — late-game ending freeze + non-functional ripples + redundant ripples + render guard — all fixed, tested, resolved). CI green (build-and-test + CodeRabbit), 149 unit + 55 browser tests, app live-verified. mergeStateStatus flipped BLOCKED→CLEAN once CodeRabbit's in-progress review finished; merged cleanly. Local + remote branches deleted.

## Batch — maga-money-moves-full-build (batch-20260619-build)

Source: docs/plans/maga-money-moves.prq.md (sha256: 894bc3bfdbc5b8dcfb3ccfbaf679f3be09d1523c7b32ad85e88139579846705c)
Started: 2026-06-19
Config: stop_on_failure=false (autonomous, self-resolving) · single feature branch → squash-merge

### Phase A — Bootstrap & Profile
- [x] A1 Initialize repo as arcade-game profile project
- [x] A2 Scaffold Vite + TS + pnpm + Biome + Svelte 5
- [x] A3 Configure Vitest (node + browser mode) + Playwright e2e

### Phase B — Pure Sim Engine
- [x] B1 RNG facade (createRng/seedrandom)
- [x] B2 JSON content schemas (zod) + loader/validator
- [x] B3 GameState + meters
- [x] B4 Event eligibility + seeded weighted selection
- [x] B5 Butterfly engine (visible ledger + seeded chaos ripples)
- [x] B6 Effects + timeline + end conditions

### Phase C — Engine glue
- [x] C1 Clock facade + game loop
- [x] C2 Save/load via Capacitor Preferences

### Phase D — UI / Render / Audio
- [x] D1 Design tokens + open-props brand system
- [x] D2 Meter HUD (SVG gauges) + Motion One deltas
- [x] D3 Event Card + choice flow + sim bridge
- [x] D4 Butterfly Log + D3 force-DAG graph view
- [x] D5 Timeline (hand-rolled fallback) + Stats (uPlot) + Dossier views
- [x] D6 Render layer — caricature portrait/scene compositing
- [x] D7 Audio — Tone.js graph
- [x] D8 Screens — Title/New Game, Play (HUD+tabs+portrait+card), Legacy Report + router

### Phase E — Assets
- [x] E1 Asset sourcing + manifest (OpenMoji icons, CC0 SVG caricatures + backgrounds, photo→cartoon derivatives, scraper + cartoonify dev tools, ASSETS.md)

### Phase F — Content: all 10 eras
- [x] F0 Era index + meters + butterfly-rules data
- [x] F1 Era 1 — Birth & Boyhood (1946–1964)
- [x] F2 Era 2 — Apprentice Mogul (1964–1987)
- [x] F3 Era 3 — Boom, Bust & Brand (1988–2003)
- [x] F4 Era 4 — Prime Time (2004–2014)
- [x] F5 Era 5 — The Ascent (2015–2020)
- [x] F6 Era 6 — Interregnum & Return (2021–2028)
- [x] F7 Era 7 — Total Victory (2029–2040) [extrapolated]
- [x] F8 Era 8 — The Atomic Horror (2041–2053) [extrapolated, startrek_inspired]
- [x] F9 Era 9 — The Unification (2054–2079) [extrapolated, startrek_inspired]
- [x] F10 Era 10 — Red Planet & Beyond (2080+) [extrapolated]

### Phase G — Integration, Android, Polish
- [x] G1 Full e2e playthroughs to each end state
- [x] G2 Capacitor Android setup + sync
- [x] G3 Verify app RUNS — Chromium screenshot of real playthrough
- [x] G4 Reviewer trio + green PR (PR #1 squash-merged: trio folded, CI green, CodeRabbit pass, all 10 bot threads resolved)

## What CONTINUOUS means
1. Never stop for status reports the user didn't ask for.
2. Never stop for scope caution.
3. Never stop to summarize — git log is the summary.
4. Never stop for context pressure — task-batch + compaction survival handle it.
5. Never stop because a task feels big — pick the next atomic commit.
6. Only stop on: explicit user halt, red CI blocking, or genuine STOP_FAIL.

## Operating loop
while queue has [ ] items: implement → verify → commit → dispatch reviewers → mark [x] → next.

## Forbidden phrases
"deferred" | "v2+" | "out of scope" | "future work" | "tracked separately" | "follow-up"
"TODO" | "FIXME" | "stub" | "placeholder" | "mock for now"
