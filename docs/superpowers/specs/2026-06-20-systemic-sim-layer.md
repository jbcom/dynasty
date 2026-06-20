# Systemic Simulation Layer — Markets, Currencies & Rank Ladders

**Status:** Draft spec for review (no source files touched).
**Date:** 2026-06-20.
**Author:** systemic-sim design pass.
**Supersedes / extends:** `2026-06-19-maga-money-moves-design.md` §3 (sim architecture). This document defines a *new pure subsystem* that slots into the existing transition without breaking determinism, replay, or the colocated-test conventions.

---

## 0. The vision (verbatim intent)

> "choices dont make for a good game if its all you do. we need markets as a missing branching system. financial markets overridable to reichsmarks vs dollars vs rand depending on the path and where they are at a point in time. or deutschmarks pre reich. also housing markets. and we need replaceable interwoven ranks systems. social ranks commercial ranks religious ranks political ranks. need to think out each era and what would be applicable. there are 6 simulator levers... money personality etc.... we need stuff that can pull them up and down like a stock market and whatever else you can think of. be open ended, extrapolate, research. follow the same rule where nothing is too dense and no details too specific to be omitted. think like Donald Trump meets Dwarf Fortress."

The current game is a **choice engine**: the player only moves the world by picking event branches. Between choices the world is *frozen*. This spec adds a **living substrate** — markets that breathe and rank ladders the player is embedded in — so that even when the player does nothing, the six meters drift, opportunities open and close, and the same choice means different things depending on the economic and social weather. That is the Dwarf-Fortress half: a simulation that runs underneath the narrative, generating emergent pressure. The Trump half: it is all leverage, brand, debt, status, and grievance — markets you can rig, ranks you can buy or bully your way up, and a currency that itself can collapse out from under you.

### Design north stars

1. **Markets and ranks are *forces*, not *content*.** They never replace events; they *bias* them — moving meters between choices, gating which events appear, and recoloring the same authored line. The choice engine stays the spine.
2. **Everything branch- and time-overridable.** The dollar is not special; it is the `default` variant of a currency term. A "stock market" under the Reich is the *Reichsbörse*; under theocracy it is tithe-and-indulgence flows; on the West-Coast secession it is a tech-equity casino. The rank you climb is *elected office* on the default line, a *Reich appointment* on the nazi line, a *church hierarchy* under theocracy, *board seats* under media.
3. **Pure + deterministic, no exceptions.** A market tick is a pure function of `(content, state, rng.fork(label))`. Replay from `seed + history` must reconstruct every market value and rank to the bit. No `Math.random`, no `Date.now`, no wall clock. This is the non-negotiable constraint inherited from `src/sim/**`.
4. **Data-driven, zod-validated.** Markets, currencies, and ranks are authored JSON in `src/data/**`, validated on load exactly like meters/eras/terms. No market behavior is hardcoded in TS beyond the generic tick math.
5. **No detail too specific to omit.** Per the user's rule, the per-era applicability table (§5) is exhaustive across all 13 eras for all market and rank ladders, with concrete real-history anchors.

---

## 1. Where this fits the existing architecture

### 1.1 The current transition (recap, from `src/sim/effects.ts`)

`applyChoice` runs a fixed pipeline per choice:

1. Meters (`applyDelta`)
2. Personality (`applyPersonality`)
3. Flags (set/clear)
4. Chaos ripples (seeded `rng.fork`)
5. Ledger chains
6. History + fired-event recording
7. Schedule delayed consequences
8. Timeline hop → end check → `advanceTimeline` → world-flag broadcast → `resolveRoles`
9. Land due consequences → re-check end

Crucially, **time advances inside step 8** (`advanceTimeline`). Markets must tick *as a function of elapsed in-world time*, so the natural insertion point is **a new step 8d: the systemic tick**, run *after* the year has advanced and roles/world-flags settled, but *before* due-consequence landing and the final end check (so a market crash can itself be lethal via `detectEnd`).

### 1.2 The six meters (from `src/sim/schema.ts`)

`money` (log net worth) · `power` · `reputation` (signed) · `loyalty` · `health` · `heat`. Markets and ranks pull these up and down. They never *add a seventh meter*; instead they add **secondary state** (market indices, holdings, rank positions) that *feed* the six via the tick. This keeps the HUD's six-gauge contract intact while giving the player a "stock-market that pulls levers up and down," exactly as asked.

### 1.3 The branch + term layers (from `src/sim/branch.ts`, `terms.ts`)

`BranchKey = default | nazi | westcoast | theocracy | media`. Terms already resolve `{head_of_state}` → "President"/"Reichskommissar"/etc. **Currency names resolve through the *exact same mechanism*** — a currency is, at the display layer, a branch-aware term plus a time-window. Ranks reuse `branchOf(state)` to select which ladder definition is live.

---

## 2. MARKETS subsystem

### 2.1 Concept

A **market** is a named, mean-reverting, regime-switching index that evolves each in-world step and **transmits its movement into the six meters** via authored coupling coefficients. Two market *families* ship in this spec; the schema is open so more can be authored (commodities, crypto, attention/virality, war-bond markets in the atomic era, Martian futures, etc.).

- **Financial markets** — broad-equity / capital-markets indices (the Dow-like backdrop, the family's stock & bond exposure, later crypto and "attention futures"). Boom/bust cycles that move `money` directly and `reputation`/`heat`/`power` indirectly (a crash with leverage = scandal + heat; a boom you called = reputation).
- **Housing markets** — the *family core business* (Fred Trump's outer-borough rentals → Manhattan condos → casinos → branded towers → the wall/infrastructure era → Martian habs). A region-scoped real-estate index with rent yield, vacancy, and a leverage/debt dimension. This is the most Trumpian system: it is where the dynasty's money is *made and lost*, and it is the natural home of the "boom, bust & brand" era.

### 2.2 Market state model

Each market is an **AR(1) mean-reverting process with regime switching**, fully deterministic given the run seed and step index. Per market, the running state is:

```
MarketState {
  id: string            // "us_equities", "nyc_housing", ...
  index: number         // current level (e.g. 100 = baseline)
  drift: number         // current per-step expected return (regime-dependent)
  volatility: number    // current per-step stddev band (regime-dependent)
  regime: string        // "boom" | "bust" | "stable" | "bubble" | "crash" | "hyperinflation" | ...
  regimeAge: number     // steps spent in the current regime (drives switching hazard)
  holding: number       // the family's net exposure in this market, signed (long/short)
  leverage: number      // debt multiplier on the holding (Trump's signature)
  peakIndex: number     // running max, for drawdown / "lost it all" detection
}
```

These live in `GameState.markets: Record<string, MarketState>` (see §6.2). **Holdings and leverage are the player's stake** — events and choices adjust them ("mortgage the Plaza", "go long on crypto", "short the housing market"). The index itself is world-driven (the tick), but the *meter impact* is `holding × Δindex × leverage`, so the same crash ruins a leveraged longer and enriches a shorter. That asymmetric leverage payoff is the whole Trumpian thrill.

### 2.3 The market tick (the heart of this spec)

A single pure function, conceptually:

```
tickMarkets(content, state, rng) -> { markets, meterDelta, ledger, flags }
```

For each market live in the current era (per §5 applicability), per in-world step:

1. **Fork a deterministic stream.** `const mrng = rng.fork(`mkt:${market.id}:${state.year}:${state.history.length}`)`. The label mirrors the ripple pattern in `effects.ts` so repeated steps in the same year get distinct-but-replayable jitter. *No other randomness source is permitted.*

2. **Regime hazard check.** Each regime has an authored base dwell time and per-step switch probabilities to neighboring regimes, modulated by `regimeAge` (older regimes are likelier to flip — a long boom is "due" for a correction) and by **catalysts** (flags/era/personality). E.g. `flag:black_monday_1987` forces `bust`; `era:brand` raises bubble→crash hazard; high `grandiosity` + high `leverage` raises the player's *personal* crash hazard even if the index is fine ("you overextended"). Draw with `mrng.chance(p)` / `mrng.weightedIndex(...)`.

3. **Price step (AR(1) mean reversion).**
   ```
   shock      = mrng.float(-1, 1) * volatility
   pull       = meanReversionK * (baseline - index)      // toward the regime's anchor
   index'     = max(floor, index + drift*index + pull + shock*index)
   ```
   `floor` prevents negative prices; a regime like `hyperinflation` instead applies a multiplicative blow-up to the *currency* (see §3.4) rather than the index.

4. **Drawdown & special events.** Update `peakIndex`; if `index / peakIndex` falls below an authored `crashThreshold` while in a crash-capable regime, emit a **market-shock flag** (e.g. `mkt_crash_us_equities`) so the event engine can surface a crash event next step, and (optionally) a butterfly ledger entry "The market you bet the house on collapsed."

5. **Meter transmission (the lever-pulling the user asked for).** Compute a `MeterDelta` from the authored **coupling matrix** of this market:
   ```
   moneyΔ   = holding * (index' - index)/index * leverage * money_couple
   repΔ     = regimeBonus(regime) * rep_couple        // calling a boom = rep; eating a crash = -rep
   heatΔ    = leverageStress(leverage, drawdown) * heat_couple   // overleverage draws scrutiny
   powerΔ   = marketControl(holding, index') * power_couple       // owning the market = power
   healthΔ  = stress(drawdown) * health_couple                   // a wipeout is a heart attack risk
   loyaltyΔ = payroll(money) * loyalty_couple                     // when you're flush, the base is loyal
   ```
   Couplings are authored per market (most are 0). `money_couple` is near 1 for both market families; housing also drives `power` (landlord-as-kingmaker) and `loyalty` (tenants/employees). All deltas funnel through the existing `applyDelta` so clamping/log-scaling is unchanged.

6. **Accumulate** the per-market deltas, merge into one `MeterDelta`, apply once.

The tick is **idempotent per step** (it runs exactly once per `advanceTimeline` year increment) and **order-independent across markets** (deltas are summed before a single `applyDelta`). If `advanceTimeline` skips multiple years (a timeline hop), the tick runs **once per elapsed year** in a deterministic loop, so a 10-year jump compounds 10 market steps — long jumps legitimately let booms balloon and busts wipe out, which is desirable narrative-economically.

### 2.4 Housing market specifics

Housing is a financial market with three extra authored fields and a region scope:

```
HousingExtra {
  region: string        // "outer_boroughs" | "manhattan" | "atlantic_city" | "national" | "mars_colony" | ...
  rentYield: number     // cashflow per step as % of holding value (the steady drip)
  vacancy: number       // 0..1, raises in busts, suppresses rentYield
  debtService: number   // per-step money drain from leverage (the bust killer)
}
```

The housing tick adds a **steady cashflow term** to `moneyΔ` (`holding * rentYield * (1 - vacancy)`) *minus* `debtService`. This models the dynasty's actual engine: positive carry in good times, a debt-service noose in busts (the 1990 near-bankruptcy is a `debtService > rentYield` crossover, authorable as a forced event via a `mkt_housing_underwater` flag). Region matters because the per-era table (§5) swaps which housing region is the live one as Donald's empire migrates (outer boroughs → Manhattan → casinos → global brand → Mars).

### 2.5 Player agency over markets

Markets are not just weather — the player **acts on them** through ordinary choices, which now carry an optional `market` effect block (see §5 schema extension to `ChoiceSchema`):

- `setHolding` / `addHolding` — go long, short, or divest.
- `setLeverage` / `addLeverage` — the Trump special: borrow against the asset.
- `nudgeRegime` — rig it (insider move, talk your book on TV, a Fed-friend bailout) — biases the *next* regime draw, gated by `power`/`heat`/flags.
- `forceShock` — a scripted crash/boom tied to a historical event (Black Monday, 2008, a crypto rug).

This is how "Donald Trump meets Dwarf Fortress" lands: the sim runs the economy, but the player is a leveraged operator inside it who can amplify, hedge, or rig — at the cost of `heat` and `reputation` when it goes wrong.

---

## 3. CURRENCY as a branch + time overridable term

### 3.1 Concept

`money` is a *number*; **currency is how that number is named, scaled, and stylized**, and it changes with branch *and* with era/location. The dollar is just the `default`. The schema and tick must answer two questions at every step: *what currency is the player's `money` denominated in right now*, and *did a denomination change just happen* (a redenomination/hyperinflation event that should slam the meter and fire a ledger chain).

### 3.2 The currency catalog (research-grounded)

Authored in `currencies.json`. Real-history anchors, kept accurate:

| id | symbol | name | real window | notes for flavor/accuracy |
|----|--------|------|-------------|---------------------------|
| `usd` | $ | US Dollar | 1792–present (default) | The baseline for all default-branch play. |
| `goldmark` | ℳ | Goldmark | 1873–1914 | German gold-standard mark; the *pre-Reich, pre-war* "deutschmark" the user means for the early German thread. Used if the nazi branch reaches back before 1924. |
| `papiermark` | ℳ | Papiermark | 1914–1923 | The hyperinflation currency. **This is the canonical `hyperinflation` regime currency** — Weimar 1921–1923, when a loaf cost billions. A glorious place to wipe a leveraged player. |
| `rentenmark` | RM | Rentenmark | 1923–1924 | The stabilization currency (land-backed) that *ended* the hyperinflation — a redenomination event (1 Rentenmark = 1 trillion Papiermark). |
| `reichsmark` | ℛℳ | Reichsmark | 1924–1948 | The Reich currency. **The nazi-branch denomination.** Frozen/controlled economy flavor. |
| `deutschmark` | DM | Deutsche Mark | 1948–2002 | Post-war West German mark — the "deutschmarks pre reich" phrasing maps better to Goldmark, but DM is available for any *post-war German* default-adjacent thread. |
| `zar` | R | South African Rand | 1961–present | Replaced the SA pound (1961); the **apartheid thread** (apartheid 1948–1994). The "rand" the user names — used for any South-Africa-located arc (a mining/land grab, an apartheid-state alliance, a krugerrand gold play). |
| `sa_pound` | £ | South African Pound | 1825–1961 | Pre-rand SA currency, for an early-century SA thread. |
| `maga_dollar` | $ | MAGA Dollar / Trumpbuck | 2029+ extrapolated | Victory-era redenomination — the dollar rebranded under total victory (gold-foil, his face). Pure satire fuel. |
| `reichsdollar` | ℛ$ | Reichsdollar | 2029+ nazi extrapolated | The fused Reich-American currency on the deep nazi line. |
| `unicred` | ⊕ | Unification Credit | 2054+ extrapolated | Post-Unification one-world currency (Star-Trek-inspired eras). |
| `marscrip` | ☉ | Mars Scrip / Colony Credit | 2080+ | Company-town scrip on the Martian base (housing-as-company-town comes full circle). |

### 3.3 Currency resolution (reuses the terms layer)

A currency is resolved exactly like a term, but with an added **time/era window** and a **location** dimension:

```
resolveCurrency(content, state) -> ActiveCurrency
```

Order of resolution:
1. **Location override** — if the player holds a location flag (`in_south_africa`, `on_mars`, `in_germany_reich`), the currency for that location wins (you spend rand in Johannesburg regardless of branch).
2. **Branch override** — else `branchOf(state)` selects the branch's denomination (nazi → reichsmark, etc.).
3. **Era/year window** — within the chosen lane, pick the currency whose `[fromYear, toYear]` window contains `state.year` (so the German thread shows Goldmark→Papiermark→Rentenmark→Reichsmark as years pass).
4. **Default** — `usd`.

The chosen currency's `symbol`/`name` feed:
- **`money` formatting in the HUD** (net worth rendered as "ℛℳ 4.2 billion" / "R 900 million" / "$ 1.1 billion").
- **A `{currency}` / `{currency_symbol}` term** so authored event copy interpolates the right unit ("you paid {currency_symbol}50,000 under the table") via the *existing* `applyTerms` — currency terms are injected into the terms table at load (see §6.1) so authors get them for free.

### 3.4 Redenomination events (the destabilizer)

When `resolveCurrency` returns a *different* currency id than last step (a window crossing or branch/location flip), the tick emits a **redenomination event**:
- Apply the authored **conversion factor** to `money` (e.g. Papiermark→Rentenmark = ÷ 1e12; a hyperinflation run-up multiplies the *price index* so the player's cash is vaporized first, then redenominated). Because `money` is log-scaled, these are dramatic but legible on the gauge.
- Set a flag `currency_changed_<to>` so a scripted event can dramatize it.
- Push a ledger chain ("Your billions in Papiermark bought a wheelbarrow and a loaf.").
- Optionally flip `reputation`/`heat` (you saw it coming and bought gold = rep; you got wiped = heat/health).

This is fully deterministic (the windows and factors are authored data; the only randomness is the pre-collapse market jitter, already seeded). The **`hyperinflation` market regime + a papiermark window** is the canonical combo: the financial-market tick blows up the price index while the currency window is about to flip, so the player feels the spiral *then* the reset.

---

## 4. INTERWOVEN RANK LADDERS

### 4.1 Concept

A **rank ladder** is a named, ordered list of rungs (rank 0..N) that the player occupies a position on. There are four canonical ladders, each **branch-swappable** in its rung *labels and meaning* while keeping the same numeric backbone:

- **Social rank** — where he stands in society's pecking order (Queens outer-borough kid → Manhattan arriviste → tabloid celebrity → global icon → god-emperor). Bleeds/feeds `reputation`.
- **Commercial rank** — his standing in business (errand boy in dad's office → developer → mogul → brand → monopolist → owner-of-everything). Feeds `money` & `power`; **board seats** is the media-branch flavor.
- **Religious rank** — standing in the faith hierarchy (nominal congregant → donor → deacon → patron → prophet/Supreme Pastor). Mostly dormant on the default line; **the spine of the theocracy branch**. Feeds `loyalty` & `power`.
- **Political rank** — formal power (private citizen → local official → state office → national office → head of state → autocrat-for-life). The most branch-divergent: *elected office* (default), *Reich appointment* (nazi), *church-state office* (theocracy), *chairman/board control* (media), *secessionist governorship* (westcoast). Feeds `power` heavily.

### 4.2 Rank state model

```
RankState {
  ladder: string    // "social" | "commercial" | "religious" | "political"
  rank: number      // current rung index, 0..N
  momentum: number  // signed pressure toward the next/previous rung (accumulates, then promotes/demotes)
  peakRank: number  // high-water mark, for "the fall from grace" detection
}
```

Lives in `GameState.ranks: Record<string, RankState>` (§6.2).

### 4.3 How ranks move

Two channels:

1. **Choices/consequences** push `momentum` (a new `rank` effect block on `ChoiceSchema`: `addMomentum`, `setRank`, `promote`, `demote`). Authored: "marry into the Manhattan elite" → +social momentum; "indictment" → −social, −political.
2. **The systemic tick** converts `momentum` into rung changes when it crosses an authored threshold, *and* lets **meters/markets feed momentum passively**: sustained high `money` slowly lifts commercial & social rank; a housing-market crash drags commercial rank down; high `power` pulls political rank up; `heat` above a threshold erodes social rank (scandal). This is the "interwoven" requirement — ranks are not isolated tracks but coupled to the economy and the meters.

### 4.4 How ranks feed back into the six meters (amplifiers)

Each rung carries authored **per-rung modifiers**: a flat passive meter drip *and* a set of **multipliers** on incoming gains:

- High **political rank** *amplifies `power` gains* (a President's choices move power more than a citizen's) — a multiplier applied in the tick to that step's `power` delta.
- Losing **social rank** *bleeds `reputation`* (a flat negative drip per step while below your `peakRank` — the "fallen socialite" tax).
- High **commercial rank** *amplifies `money`* market returns (scale economies — a monopolist's holdings compound faster) and lifts the **leverage ceiling** (you can borrow more).
- High **religious rank** *amplifies `loyalty`* gains and *dampens `heat`* (the sanctified get forgiven) — central to the theocracy power fantasy.

Concretely, the tick computes a **rank modifier pass** that (a) applies each ladder's per-rung passive drip to the `MeterDelta`, and (b) multiplies the *choice's own* meter deltas by the relevant rung multipliers before clamping. Because this is a pure transform over authored coefficients, it stays deterministic and replay-safe.

### 4.5 Rank ↔ branch coupling

`branchOf(state)` selects which **rung-label set** a ladder uses (the numeric ladder and coupling are shared; only labels + a few branch-specific multipliers differ). The political ladder is authored with five label-columns (one per branch) just like a `Term`. Reaching political rank N on the nazi branch = "Reichskommissar"; on theocracy = "Supreme Pastor"; on media = "Chairman" — and these **reuse the existing `head_of_state` term values** so the rank ladder and the term layer never disagree. (Implementation: rank rung labels can *be* term tokens, e.g. a rung label of `{head_of_state}` resolves through `applyTerms`, guaranteeing consistency.)

---

## 5. PER-ERA APPLICABILITY TABLE (exhaustive)

For each of the 13 eras (`src/data/eras/index.json`, order 0–12), which markets and rank ladders are **live**, the **active currency** (default branch unless noted), and what they *do*. Branch overrides noted inline. "No detail too specific to omit."

### Era 0 — Origins (1885–1946, order 0)
*Pre-Donald: the Drumpf/Trump dynasty's founding (Friedrich Trump's Klondike/Bronx money, Fred Trump's Queens rentals). The player is shaping the inheritance.*
- **Currency:** `usd` (default). **German thread (nazi seed):** `goldmark` (pre-1914) → `papiermark` (1914–1923, hyperinflation window) → `rentenmark`/`reichsmark` (post-1924) if the arc is in Germany. **The "deutschmarks pre reich" case lives here.**
- **Financial market:** `us_equities` live but low-coupling (the family isn't in stocks yet) — the **1929 Crash** and **Great Depression** are authored shocks that *create* the opportunity (buy cheap, FHA-financed Queens housing). The German thread can run the **Weimar hyperinflation** as a formative catastrophe.
- **Housing market:** `nyc_housing` region `outer_boroughs` — **the founding engine.** Rent yield steady, FHA-subsidized boom post-1934. This is where the dynasty's money is minted.
- **Ranks:** *social* (immigrant-arriviste → established Queens landlord), *commercial* (the only fully live ladder — building the rental empire). *Political* dormant (Fred's machine ties seed it). *Religious* dormant.

### Era 1 — Birth & Boyhood (1946–1964, order 1)
- **Currency:** `usd`.
- **Financial market:** `us_equities` post-war boom — background prosperity that lifts the family `money` passively (low coupling; Donald is a child).
- **Housing market:** `nyc_housing`/`outer_boroughs` at full tilt (Fred's post-war suburban-rental boom; the Beach Haven/Trump Village era). High positive carry — the inheritance compounds.
- **Ranks:** *social* (the boss's son), *commercial* (passive — learning at Fred's knee; military-school discipline arc). *Political* + *religious* dormant (a Norman-Vincent-Peale "positive thinking" religious seed sets early `religious` momentum on the theocracy branch).

### Era 2 — Apprentice Mogul (1964–1987, order 2)
*Donald takes the wheel: Manhattan conquest, Grand Hyatt, Trump Tower, USFL, casinos begin.*
- **Currency:** `usd`.
- **Financial market:** `us_equities` — the 1970s stagflation (a `bust`/`stable` regime with inflation drag) then the early-80s `boom`. Coupling rises (he's now an operator).
- **Housing market:** **region flips to `manhattan`** (the outer-boroughs→Manhattan migration is the central move of this era). High volatility, high leverage ceiling — Trump Tower is a leveraged, tax-abated swing. A second housing region `atlantic_city` opens late (casino real estate) with its own boom/bust.
- **Ranks:** *commercial* climbs hard (developer → mogul). *Social* climbs (Manhattan elite, Studio 54, the tabloids — **social rank starts feeding `reputation` heavily** and `heat` from the tabloid scrutiny). *Political* wakes (donor-class access). *Religious* dormant.

### Era 3 — Boom, Bust & Brand (1988–2003, order 3)
*The signature era for markets — the user's "boom, bust & brand."*
- **Currency:** `usd`.
- **Financial market:** `us_equities` — **Black Monday 1987→** carries in, the early-90s recession, the late-90s dot-com `bubble`→`crash` (2000–2001). Authored `forceShock`s. High coupling.
- **Housing market:** `manhattan` + `atlantic_city` — **the near-bankruptcy of 1990** is the canonical `debtService > rentYield` crossover (the Taj Mahal/casino debt). The player's `leverage` set in Era 2 detonates here. Surviving it via brand-licensing pivot (taking `holding` *off* the balance sheet, licensing the name) is a real strategic option — **the "Brand" arc literally moves the business from owning real estate to selling the name**, modeled as housing `holding` → near-zero while a new **`brand_equity`** financial market spins up (licensing royalties as a low-volatility cashflow market).
- **Ranks:** *commercial* whipsaws (mogul → near-ruin → brand-baron). *Social* survives on tabloid notoriety. *Political* idles (Reform Party flirtation = a small political-momentum blip). *Religious* dormant.

### Era 4 — Prime Time (2004–2014, order 4)
*The Apprentice; peak brand; "you're fired"; birtherism seeds political rank.*
- **Currency:** `usd`.
- **Financial market:** `brand_equity` dominant (licensing + TV — a steady, high-yield, *low-volatility* attention-cashflow market). `us_equities` runs the **2008 Global Financial Crisis** as a major housing-linked `crash` (a chance to short, to buy distressed, or to get caught).
- **Housing market:** `national` region opens (branded towers worldwide, distressed-asset plays post-2008). 2008 is the housing crash event.
- **Ranks:** *commercial* high & stable (brand). *Social* peaks (TV celebrity — social rank near-max, feeding `reputation`). **`attention`/virality emerges** as a proto-market (see §5 note). *Political* climbs sharply late (birther movement = political momentum + `heat`). *Religious* wakes on the theocracy branch (evangelical courtship).

### Era 5 — The Ascent (2015–2020, order 5)
*Campaign → presidency.*
- **Currency:** `usd`. **Nazi branch:** if the alt-history divergence has hardened, currency begins drifting toward `reichsdollar` framing in copy.
- **Financial market:** `us_equities` **boom** (the "greatest economy ever" bull run) — high positive `money` coupling *and* `reputation` coupling (he takes credit). **`attention` market goes live and dominant** (Twitter/rally virality as a tradable index that moves `power` and `heat`). 2020 COVID `crash` ends the era.
- **Housing market:** `national`/`brand` — backgrounded (he's in office; conflicts-of-interest `heat`).
- **Ranks:** **Political ladder becomes primary** — rises to **head of state** (rung label resolves via `{head_of_state}` term: President / Reichskommissar / Supreme Pastor / Chairman / Governor-General by branch). Political rank now *amplifies all `power` gains*. *Social* and *commercial* subordinate to political.

### Era 6 — Interregnum & Return (2021–2028, order 6)
*Loss, exile, indictments, comeback.*
- **Currency:** `usd`. **Victory seed:** `maga_dollar` framing if total-victory flags accrue.
- **Financial market:** `attention` market dominant and **highly volatile** (the post-presidency grievance/Truth-Social economy — a meme-stock-like index that can pump `money` via a media venture or crash via legal `heat`). **`crypto` market opens** ($TRUMP coin energy — extreme volatility, a leveraged-degenerate playground). `us_equities` runs its own cycle independent of him now (he's out of power — low coupling, a reminder the world moves without you).
- **Housing market:** `national` under legal siege (valuation-fraud `heat` drags commercial rank; a forced-sale event possible — the Dwarf-Fortress "your fortress is collapsing" beat).
- **Ranks:** *political* **falls then re-climbs** (the fall-from-grace `peakRank` mechanic fires — social-rank bleed while below peak). *Commercial* under indictment pressure. *Religious* surges on theocracy branch (martyrdom narrative).

### Era 7 — Total Victory (2029–2040, order 7, extrapolated)
*Consolidation of one-man rule.*
- **Currency:** **`maga_dollar`** (default victory redenomination — the dollar rebranded) / **`reichsdollar`** (nazi) / theocracy & media variants. A **redenomination event** fires on era entry (his face on the money; a `reputation`/`grandiosity` spike, a `heat` spike abroad).
- **Financial market:** `state_economy` — markets become **controlled/rigged** (a low-volatility, high-`power`-coupling regime; you *are* the market). Shorting is now treason (a `heat` event). `attention` market state-monopolized.
- **Housing market:** `national` → state-confiscatory (land seizures feed `money`/`power`, bleed `reputation` abroad).
- **Ranks:** *political* at/near max (autocrat-for-life). All other ladders subordinate; commercial = state ownership. Religious fuses with political on theocracy branch.

### Era 8 — The Atomic Horror (2041–2053, order 8, extrapolated, Star-Trek-inspired)
*Nuclear brinkmanship / fallout.*
- **Currency:** branch victory currency, but a **`war_economy`** distortion (rationing — a `hyperinflation`-adjacent regime if things go badly; scrip emerges).
- **Financial market:** `war_bonds` / `defense` market (mobilization boom that props `money`+`power` but `health`-erodes the world). A nuclear-exchange `forceShock` can crater everything (a `crash` regime that wipes indices to the floor — the "everyone loses" beat).
- **Housing market:** **bunkers/shelters** region (`fortified`) — real estate becomes survival infrastructure; rent yield in `loyalty` (protection) not `money`.
- **Ranks:** *political* + *commercial* fuse into a war-command rank. *Social* irrelevant (survival). *Religious* surges (apocalyptic faith).

### Era 9 — The Unification (2054–2079, order 9, extrapolated, Star-Trek-inspired)
*One world government / recovery.*
- **Currency:** **`unicred`** (Unification Credit) — a redenomination from the war scrip; a stabilization event (very Rentenmark-coded — order from chaos).
- **Financial market:** `unified_economy` — a post-scarcity-leaning, low-volatility regime; markets matter less for `money`, more for `power` (who controls allocation). `attention` becomes `legacy`/historical-reputation index.
- **Housing market:** **planetary reconstruction** region — rebuilding feeds `money`+`reputation` (the builder redeemed) or `power` (the controller).
- **Ranks:** *political* = world-unifier rank (max civic). *Commercial* = post-scarcity steward. *Religious* = either obsolete (utopia) or state-fused (tyranny) per personality axis.

### Era 10 — Red Planet & Beyond (2080–2120, order 10, extrapolated; entry requires `mars_program`)
*Mars colonization — housing comes full circle as company-town scrip.*
- **Currency:** **`marscrip`** (colony credit / company scrip) — **the dynasty's founding move (Fred's rentals) recurs as a Martian company town**: the player issues the scrip the colonists are paid in and spend at his stores. Deeply Trumpian and Dwarf-Fortress (you run the economy of your fortress).
- **Financial market:** `mars_futures` / `helium3` / `resource` market — a frontier `boom`/`bust` casino (claim-staking, speculation). High volatility, high leverage.
- **Housing market:** **`mars_colony` region — the core business again.** Habitat leases, life-support rent (rent yield literally = oxygen). `vacancy` = depopulation/death. This is the era where the housing engine is most *literal* and most lethal (a bust = colonists die = `health`/`reputation` collapse, or `power` if you don't care).
- **Ranks:** *commercial* = colony proprietor (peak again — the wheel turns). *Political* = colonial governor. *Social* = Earth-vs-Mars elite split. *Religious* = frontier cult on theocracy branch.

### Era 11 — First Contact (2121–2160, order 11, extrapolated, Star-Trek-inspired; requires `back_science` + `extrasolar_flight`)
*Alien contact.*
- **Currency:** `unicred`/`marscrip` plus a nascent **interspecies-exchange** wrinkle (a `forceShock` market if trade with aliens opens — the ultimate new market). The tyranny/utopia personality axis forks whether contact is *trade* (utopia: a benevolent boom) or *conquest* (tyranny: a war-economy spike).
- **Financial market:** `contact_economy` — a wildcard market whose regime is set by the diplomacy outcome (peaceful first contact = `boom`, hostile = `crash`/`war_bonds`).
- **Housing market:** off-world expansion (more colonies) or contraction (war losses).
- **Ranks:** *political* = species-representative rank. *Religious* = either transcended or weaponized (alien-as-deity). *Commercial* = interstellar-trade baron.

### Era 12 — Interstellar (2161–2300, order 12, extrapolated; requires `contact_made`)
*The legacy era — what the dynasty became across the stars.*
- **Currency:** `unicred` or a successor; mostly **symbolic** (post-scarcity legacy — money matters least here, `reputation`/`power`/legacy matter most).
- **Financial market:** `legacy`/`civilization` index — a meta-market summarizing the whole run's economic arc (boom/bust of the civilization he built), feeding the final endings.
- **Housing market:** multi-system real estate as `power` projection (the empire's reach), low `money` relevance.
- **Ranks:** *political* = founder-of-an-interstellar-order rank (the apex rung). All ladders resolve into the final-ending inputs.

### Cross-era emergent markets (authorable, not all listed above)
- **`attention`/virality** (Eras 4–6): a tradable index of public attention; pumps/dumps `power`, `heat`, `money` (media ventures). The most modern, most Trumpian non-financial market.
- **`crypto`** (Era 6+): extreme-volatility leverage casino ($TRUMP-coin energy).
- **`brand_equity`** (Eras 3–7): licensing royalties as a low-vol cashflow market.
- **`gold`/`krugerrand`** (any era, esp. SA thread): the hedge that survives redenomination — buying gold before a currency collapse is the *smart* play the sim rewards.

---

## 6. SCHEMA + DATA-DRIVEN DESIGN

All new content is JSON in `src/data/**`, validated by new zod schemas in `src/sim/schema.ts`, loaded by extending `loadContent.ts` and `buildContent`. **Nothing market/rank/currency-specific is hardcoded in TS beyond the generic tick math.**

### 6.1 New data files

```
src/data/markets.json      // market definitions + regimes + couplings
src/data/housing.json      // housing-specific extras per region  (or folded into markets.json)
src/data/currencies.json   // the currency catalog + windows + conversion factors
src/data/ranks.json        // the four ladders, rungs, couplings, branch label-columns
```

`loadContent.ts` gains four eager globs (`./markets.json`, `./currencies.json`, `./ranks.json`, optionally `./housing.json`) mirroring the existing `termsGlob` pattern, threaded through `RawContent`/`buildContent`. **Currency terms are injected into the terms table at load** so `{currency}`/`{currency_symbol}` interpolate through the unchanged `applyTerms`.

### 6.2 Zod schema shapes (proposed, consistent with existing `schema.ts` idioms)

```ts
// ---- Regimes ----
const RegimeSchema = z.object({
  id: z.string().min(1),                 // "boom" | "bust" | "bubble" | "crash" | "hyperinflation" | "stable" | ...
  drift: z.number(),                     // per-step expected return
  volatility: z.number().min(0),
  meanReversionK: z.number().min(0).default(0.05),
  baseline: z.number().default(100),     // index anchor this regime reverts toward
  dwell: z.number().int().positive(),    // expected steps before a switch is likely
  // weighted transition hazards to other regimes, modulated by regimeAge & catalysts
  transitions: z.array(z.object({ to: z.string(), weight: z.number().min(0) })).default([]),
  // optional catalysts that force/bias entry into THIS regime
  catalysts: RequiresSchema.optional(),  // reuse the existing flags/meters/personality/age gate
});

// ---- Coupling: how a market's move transmits to the six meters ----
const CouplingSchema = z.partialRecord(MeterIdSchema, z.number()).default({});

// ---- Market definition ----
const MarketDefSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  family: z.enum(["financial", "housing", "attention", "crypto", "commodity", "resource", "meta"]),
  startIndex: z.number().default(100),
  floor: z.number().default(1),
  crashThreshold: z.number().min(0).max(1).default(0.5),   // drawdown fraction that flags a crash
  startRegime: z.string().min(1),
  regimes: z.array(RegimeSchema).min(1),
  coupling: CouplingSchema,                                 // per-Δindex meter transmission
  // housing extras (only for family === "housing")
  housing: z.object({
    region: z.string().min(1),
    rentYield: z.number().default(0),
    vacancy: z.number().min(0).max(1).default(0),
    debtService: z.number().default(0),
  }).optional(),
  // which eras this market is live in (by era id), + per-era overrides
  liveInEras: z.array(z.string()).default([]),
  // optional per-era regime/coupling overrides keyed by era id (boom in one era, bust in next)
  eraOverrides: z.record(z.string(), z.object({
    forceRegime: z.string().optional(),
    coupling: CouplingSchema.optional(),
    catalystShocks: z.array(z.object({ flag: z.string(), regime: z.string() })).default([]),
  })).default({}),
});

// ---- Currency ----
const CurrencySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  symbol: z.string().min(1),
  // resolution windows
  fromYear: z.number().int().optional(),
  toYear: z.number().int().optional(),
  branch: z.enum(["default","nazi","westcoast","theocracy","media"]).optional(),
  location: z.string().optional(),       // matches a location flag, highest precedence
  extrapolated: z.boolean().default(false),
  // conversion factor applied to `money` when redenominating FROM the previous currency
  conversionFrom: z.record(z.string(), z.number()).default({}),  // { papiermark: 1e-12, ... }
  // optional meter/personality jolt on adopting this currency
  adoptionEffects: MeterDeltaSchema.default({}),
  adoptionPersonality: PersonalityDeltaSchema.default({}),
});

// ---- Rank ladder ----
const RungSchema = z.object({
  rank: z.number().int().nonnegative(),
  // branch label columns (reuse Term-like shape; a label may itself be a {term} token)
  label: TermSchema,                     // resolves via applyTerms by branch
  passiveDrip: CouplingSchema,           // per-step meter drip while at this rung
  gainMultipliers: z.partialRecord(MeterIdSchema, z.number()).default({}), // amplify choice deltas
  leverageCeiling: z.number().optional(),// commercial rank raises borrowing power
});
const LadderSchema = z.object({
  id: z.enum(["social","commercial","religious","political"]),
  label: z.string().min(1),
  startRank: z.number().int().default(0),
  promoteAt: z.number().default(100),    // momentum threshold to climb a rung
  demoteAt: z.number().default(-100),
  // passive feeders: meters/markets that push momentum each step
  feeders: z.array(z.object({
    from: z.enum(["meter","market","heat_scandal"]),
    ref: z.string(),                     // meter id or market id
    weight: z.number(),
  })).default([]),
  liveInEras: z.array(z.string()).default([]),
  rungs: z.array(RungSchema).min(1),
});

export const MarketsFileSchema   = z.object({ markets: z.array(MarketDefSchema).default([]) });
export const CurrenciesFileSchema= z.object({ currencies: z.array(CurrencySchema).default([]) });
export const RanksFileSchema     = z.object({ ladders: z.array(LadderSchema).default([]) });
```

### 6.3 Choice/consequence schema extensions

`ChoiceSchema` (and `ConsequenceSchema`) gain optional, fully-backward-compatible blocks so authors can act on the new systems from any event:

```ts
market: z.array(z.object({
  id: z.string(),
  setHolding: z.number().optional(),
  addHolding: z.number().optional(),
  setLeverage: z.number().optional(),
  addLeverage: z.number().optional(),
  nudgeRegime: z.string().optional(),   // bias the NEXT regime draw (gated by requires)
  forceShock: z.string().optional(),    // force a regime this step (historical events)
})).default([]),
rank: z.array(z.object({
  ladder: z.enum(["social","commercial","religious","political"]),
  addMomentum: z.number().optional(),
  setRank: z.number().int().optional(),
  promote: z.boolean().optional(),
  demote: z.boolean().optional(),
})).default([]),
currency: z.object({                    // rare: a choice that forces a currency switch
  setActive: z.string().optional(),     // e.g. flee to SA → rand
  buyHedge: z.string().optional(),      // buy gold/krugerrand to survive a redenomination
}).optional(),
```

These default to empty, so **every existing event JSON validates unchanged** — the subsystem is additive.

### 6.4 How the tick reads the data

The tick receives the validated `Content` (now carrying `markets`, `currencies`, `ladders`) and the `GameState` (now carrying `markets`, `ranks`, plus a small `economy` block — active currency id, last currency id). It filters markets/ladders by `liveInEras.includes(currentEraId)`, applies `eraOverrides`, runs the per-market AR(1)+regime step, the rank momentum/promotion pass, the rank-modifier pass over the step's meter delta, and the currency-resolution + redenomination check — all from authored coefficients.

---

## 7. DETERMINISM + REPLAY

This is the load-bearing constraint. The subsystem preserves the existing guarantee that **`replay(seed, history)` reconstructs the exact end state**.

1. **Single randomness source.** The tick draws *only* from `rng.fork(label)` with labels deterministic in `(market.id, state.year, state.history.length)` — the same recipe `effects.ts` already uses for ripples. No `Math.random`, no `Date.now`, no `performance.now`. The `src/sim/**` commit gate's sim-purity ban patterns already enforce this; the tick lives in `src/sim/` and inherits the ban.

2. **Tick is a pure function** `(content, state, rng) -> { markets, ranks, economy, meterDelta, newFlags, newLedger }`. It never mutates inputs (returns new objects, exactly like `applyDelta`/`applyPersonality`).

3. **Deterministic placement.** The tick runs inside `applyChoice`, **once per elapsed in-world year** during `advanceTimeline`'s advance (a multi-year hop loops the tick deterministically N times). Because `replay` calls `applyChoice` with the same choices in the same order from the same seed, the year sequence — and thus the tick sequence and every fork label — is identical. Market indices, regimes, rank positions, and currency state are therefore **fully reconstructable** and never need to be stored in the save (saves stay `seed + history`, as today).

4. **All new state derives from authored data + the seeded stream.** Starting indices, regimes, ranks, currency come from JSON; every subsequent value is a pure function of prior value + seeded draw + applied choices. No hidden inputs.

5. **State location (`GameState`).** Three new serializable fields, all pure data:
   ```ts
   markets: Record<string, MarketState>;   // index, regime, holding, leverage, peakIndex, ...
   ranks:   Record<string, RankState>;     // rank, momentum, peakRank per ladder
   economy: { currencyId: string; lastCurrencyId: string };
   ```
   Initialized in `initState` from `content.markets`/`content.ladders`/`content.currencies` (start indices, start ranks, era-0 default currency). They are in-state (not derived-on-render) because the tick is *stateful across steps* (AR(1) needs the prior index) — but since they're rebuilt identically on replay, they need not be persisted in the save blob. A determinism test asserts `replay(...).markets === live.markets` deep-equal.

6. **A dedicated property test** (mirroring the existing replay tests): for a battery of seeds + random-but-recorded histories, assert that a fresh `replay` reproduces `markets`, `ranks`, and `economy` exactly. This is the regression guard for the whole subsystem.

---

## 8. UI SURFACING

The HUD already has `MeterHud` (six gauges), `PersonalityDial`, a `NewsTicker`, and a tabbed `PlayScreen` (`Now / 📰 / Timeline / Stats / 🦋 / Dossier`). The new systems surface **without breaking the six-gauge contract**:

1. **Currency in the HUD.** `MeterHud`'s `money` gauge formats net worth using the **active currency** symbol/name (`resolveCurrency(content, state)`). No new gauge — the existing money gauge just relabels ("$1.1B" → "ℛℳ 4.2B" → "R 900M"). A **redenomination flashes** the gauge and drops a NewsTicker headline + a 🦋 ledger entry ("Your Papiermark fortune is now a wheelbarrow.").

2. **New `Markets` tab** (added to the `tabs` array in `PlayScreen.svelte`, gated on `content.markets.length > 0`, exactly like `hasNews` gates the 📰 tab). Shows, for each live market: a **sparkline of the index** (deterministic history is replayable so the line is real), current **regime badge** (boom/bust/crash), the player's **holding + leverage**, and the player's **P&L** this era. Housing markets show region, rent yield, vacancy, debt-service warning. This is the "watch the stock market move your money" surface the user asked for.

3. **New `Ranks` panel** (a sub-section of the existing **Dossier** tab, or its own tab gated on `content.ladders.length > 0`). A **four-ladder display** (social / commercial / religious / political) showing current rung label (branch-resolved via `applyTerms` — "President"/"Reichskommissar"/"Supreme Pastor"), a 0..N progress bar with `momentum` shown as a filling segment toward the next rung, and a `peakRank` ghost marker (so the "fall from grace" is visible). Dormant ladders (e.g. religious on the default line) are dimmed, not hidden, so the player learns they exist on other branches.

4. **Ambient signal.** The existing `data-drift` tyranny/utopia tint can gain a second axis: a subtle **market-weather** cue (a faint green/red vignette pulse on a boom/bust tick) so the economy is *felt* between choices, reinforcing that the world moves on its own — the Dwarf-Fortress "the world breathes" feeling.

5. **Bridge purity.** Per the architecture rule, the UI reads markets/ranks/currency **only through derived selectors** (`resolveCurrency`, `marketView`, `rankView`) exposed by the engine bridge — the UI never touches sim internals directly, matching how `branchOf`/`applyTerms` are already consumed in `PlayScreen.svelte`.

---

## 9. PHASING (each phase independently shippable, one PR per phase)

Following the repo's **Docs → Tests → Code**, milestone-TDD, one-branch-per-unit doctrine. Each phase is a green, mergeable increment.

### Phase 1 — Schema + state (foundation)
- Add zod schemas (`MarketDefSchema`, `RegimeSchema`, `CurrencySchema`, `LadderSchema`, file schemas) to `src/sim/schema.ts`; extend `ChoiceSchema`/`ConsequenceSchema` with the optional `market`/`rank`/`currency` blocks (defaults keep all existing JSON valid).
- Add `markets`/`ranks`/`economy` to `GameState` + `initState`; thread `markets`/`currencies`/`ladders` through `RawContent`/`buildContent`/`loadContent.ts` globs.
- **Tests:** schema round-trips, `initState` shape, existing-content-still-validates, save/replay shape unchanged.
- **Ships:** state plumbing, no behavior. Verifiably inert (all deltas zero with empty data).

### Phase 2 — Tick engine (pure math)
- Implement `src/sim/markets.ts` (AR(1)+regime step, coupling transmission, housing cashflow), `src/sim/ranks.ts` (momentum/promotion, rank-modifier pass), `src/sim/currency.ts` (resolution + redenomination). Wire the unified `systemicTick` into `applyChoice` as **step 8d** (post-advance, pre-consequence-land, once per elapsed year).
- **Tests (write first):** determinism/replay property test (the §7.6 guard), AR(1) mean-reversion sanity, regime-switch hazard, leverage asymmetry (longer vs shorter on the same crash), redenomination conversion math, rank promotion threshold, rank-amplifier multiplier. Sim-purity ban patterns enforced by the commit gate.
- **Ships:** the live substrate, driven by (still-empty or minimal) data — meters now drift between choices.

### Phase 3 — Data authoring (content)
- Author `markets.json`, `housing.json`, `currencies.json`, `ranks.json` covering the full §5 per-era table (all 13 eras, all four ladders, all currencies, branch label-columns reusing `head_of_state` terms). Inject currency terms into the terms table at load.
- Add the historical `forceShock` events (1929, Weimar hyperinflation, Black Monday, 1990 near-bankruptcy, 2008, COVID, era-7 redenomination, Mars-scrip) to the relevant era event pools, plus a handful of player-agency choices (`setHolding`/`addLeverage`/`buyHedge`).
- **Tests:** content-cross-reference (every `liveInEras`/`startRegime`/`conversionFrom`/rung `{term}` resolves), per-era applicability assertions, an `autoPlaythrough` smoke test that a full run produces sane (non-NaN, in-range) market/rank trajectories across all branches.
- **Ships:** the game now has a real, era-accurate economy and rank world.

### Phase 4 — UI surfacing (presentation)
- `MeterHud` money gauge uses `resolveCurrency`; add the `Markets` tab (sparkline + regime + holdings + P&L) and the `Ranks` panel (four ladders, branch-resolved labels, peak-rank ghost); redenomination flash + NewsTicker/ledger hooks; optional market-weather ambient cue.
- **Tests:** browser/visual tests for the new tab and ranks panel (colocated `*.browser.test.ts`/`*.visual.test.ts`), screenshot baselines per the repo's visual-test convention; an a11y pass; verify the app *runs* (chrome-devtools-mcp) showing currency relabel + a live sparkline.
- **Ships:** the player can see and act on markets/ranks/currency.

### Phase 5 — Balance + integration polish (tuning)
- Cross-system balance pass (leverage payoffs, rank-amplifier strength, redenomination severity), butterfly-rule integration (market crashes feed the existing ripple/consequence chains), ending integration (the era-12 `legacy`/`civilization` meta-market and apex political rank feed ending triggers).
- **Tests:** balance/regression battery over many seeds (no run NaNs, no infinite-money exploit, every branch reaches a coherent economy), tutorialization check (first market/rank appearance is legible).
- **Ships:** a tuned, integrated systemic layer.

---

## 10. Open questions for review (genuine design forks, not blockers)

1. **Tick cadence.** Per *in-world year* (chosen here, ties cleanly to `advanceTimeline`) vs per *event/choice* (more granular but decouples from time). Recommendation: per year — it makes long timeline-hops compound markets dramatically, which is the point.
2. **Ranks as their own tab vs a Dossier sub-panel.** Recommendation: start as a Dossier sub-panel (Phase 4), promote to a tab if it earns the space.
3. **How aggressive should redenominations be?** Wiping a player's net worth is dramatic but punishing. Recommendation: make the *hedge* (`buyHedge` gold) a clearly-telegraphed survival play so the wipe is a *learnable* risk, not a feel-bad random event — the sim rewards foresight, very Dwarf-Fortress.
4. **Attention/crypto markets** — ship in Phase 3 or defer to a follow-up? They're the most modern and most fun but also the most balance-sensitive. Recommendation: ship `attention` (it's core to Eras 4–6), defer `crypto` polish to Phase 5.
