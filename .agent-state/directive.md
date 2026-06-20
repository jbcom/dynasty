# Continuous Work Directive — maga-money-moves

**Status:** ACTIVE
**Owner:** jbogaty

## Batch — alt-history consistency (batch-20260620-althist)

Source: user directives, 2026-06-20 (verbatim intent below)
Started: 2026-06-20

THE CORE PROBLEM (user): counterfactual branches must stay HISTORICALLY
CONSISTENT, and no single divergent choice may make the content feel shallow.
Three intertwined requirements:

- [ ] AH1 TITLE-AWARE OVERRIDES (user): the override system must work with TITLES,
      not just events/flags. Full scan done: "president" appears 144× across 8 era
      files + usa/musk timelines, all branch-blind. On the Nazi/Axis route there is
      NO U.S. president — the Axis-appointed American leader holds a Reich-style
      title (Reichskommissar/Gauleiter/Statthalter — research the accurate term),
      never "President". JFK is NOT shot in 1963 (no presidency to assassinate).
      The leader-title (and head-of-state references generally) must resolve from
      the active branch. Needs a title/term resolution layer the content reads.
- [ ] AH2 MUTUALLY-EXCLUSIVE / EXCLUDED EVENTS (user): some world events FORCE
      OTHERS OUT of the timeline by choice bias. Real-history landmarks that are
      impossible under a branch must be suppressed: e.g. "I Have a Dream" / March
      on Washington / civil-rights arc / free elections / democracy / Constitution
      / Congress cannot occur in Nazi-occupied America. Scan found all of these in
      the data, none gated on branch. Need an exclusion mechanism (branch flags in
      notFlags, or an excludes-set) so picking a branch removes incompatible events.
- [ ] AH3 ALT-HISTORY BRANCHING ARCHITECTURE (user DECISION 2026-06-20): mechanism =
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
- [ ] AH5 TIMELINE-COMPILER DEV HARNESS (user, 2026-06-20): so we never have to
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
- [ ] AH7 SLOT EVENTS (user, 2026-06-20): certain real events are SO structurally
      critical they should be abstract SLOTS filled per timeline, not hardcoded
      concrete events. The JFK assassination is really the archetype "the
      assassination of the dynasty's leader" — on the political-dynasty path it's
      FRED TRUMP's assassination; elsewhere it's another figure or doesn't fire.
      There are likely a TON of these (the war, the crash, the great scandal, the
      martyrdom, the succession). Design a SLOT system: archetypal event slots that
      resolve to branch/dynasty-specific concrete events at compile time (pairs with
      the gears-in-a-clock compiler — slots are filled when the timeline compiles).
- [ ] AH8 BRANCH-AWARE PATRONYMICS / NAMES (user, 2026-06-20): names change with the
      branch. The family only became "Trump" by anglicizing "Drumpf"; in the Nazi
      (stayed-German) timeline Donald remains DONALD DRUMPF. Extend the AH1 term layer
      to PROPER NAMES / surnames (a {surname}/{family_name} term: "Trump" default,
      "Drumpf" on the German/Nazi branch, etc.), and audit content for hardcoded
      "Trump" that should be the branch-aware surname token.
- [ ] AH9 BUTTERFLY WEIGHT/BIAS AGENT PASS (user, 2026-06-20): the butterfly effect +
      causal engine need an agent pass to ASSIGN WEIGHTS AND BIASES across the events
      / butterfly rules / ripples so the compile-at-0 selection and the in-run chaos
      field pull realistically (which configs/events are more or less likely given the
      prologue + accumulated state). Send an agent through to tune weights/biases
      systematically (this is what makes the bias-weighted timeline compilation and
      the butterfly machine produce believable, varied bespoke stories).
- [ ] AH6 AGENT-SWEEP VERIFICATION (user, 2026-06-20): agent verification is FAST —
      far quicker than a human reviewer at spotting flaws across many permutations.
      So the QA strategy pairs with AH5: once the compiler/harness can dump a
      compiled timeline per (seed + Era-0 choices), FAN OUT verification agents over
      a SWEEP of Era-0 permutations, each agent reading one compiled-timeline dump
      and flagging cross-timeline contradictions / anachronisms / shallowness / title
      mismatches (e.g. "President" leaking into a Nazi run, a default real-history
      headline in an alt branch). Aggregate findings → fix the offending config →
      re-sweep. This automated consistency sweep is how we hold the no-shallowness +
      consistency invariants at scale instead of hand-checking.
- [ ] AH3-BRANCHES (user): author full alt-history treatment for these branches:
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
- [ ] AH4 NO-SHALLOWNESS INVARIANT (user): "we do not want any one choice suddenly
      makes the content feel shallow." A branch must be authored to the SAME depth
      as the main line — taking any fork opens a comparably rich, gated, multi-layer
      backdrop + event pool, not a thin stub. Acceptance bar for AH1-AH3.
- [ ] SIM1 SYSTEMIC SIMULATION LAYER — "Donald Trump meets Dwarf Fortress" (user,
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
