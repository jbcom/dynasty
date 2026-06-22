---
title: UQ-UI — UI Text-Heaviness Audit
updated: 2026-06-22
status: draft
domain: product
---

# UQ-UI-1 — UI / HUD Text-Heaviness Audit

## Mandate

> "the ui ux hud etc feels VERY text heavy which does not optimize for scanning. we need to rethink
> the UI a bit just to make sure we are presenting everything in the best way possible. your own ui
> review skills and paper playtesting can help find where weight needs to change, margins or add
> borders or whatever else helps." — user, 2026-06-22

Constraints that bound the rework:
- **Svelte + CSS ONLY for atmosphere/iconography** — NO asset/img/svg art layers ([[no-portraits-no-asset-art]]).
- **Mobile-first** (Pixel 5a class) is the primary target; the wide/desktop split panel is secondary.
- Balance **game-scannability** with the **novel reading experience** ([[scannability-game-novel-balance]]) —
  the SceneReader stays prose; the HUD/views get more glanceable.
- Brand tokens: gold/red/navy `--mmm-*` (open-props base).

## Method

Walked the live app in Chrome (localhost:5174, the ONB-1 dev build), screenshotting each screen and
reading the screenshots. Onboarding funnel (ONB-1) live-verified end-to-end as a side effect:
PERIOD→CLASS→WAVE→STYLE→SURNAME→GENDER→GIVEN all render and flow correctly (founder "Concetta Bruno",
Southern-Italian style → Italian female given-name suggestions — exactly the user's ordering).

NOTE: screenshots captured at desktop width (the screenshot viewport stayed ~1500px despite a window
resize). The **wide** layout shows the scene + a right-hand panel side by side; mobile collapses to a
single column with the panel behind the menu. Mobile re-screenshot is a UQ-UI-1b follow-up, but the
text-weight findings hold at both widths (denser on mobile).

## Findings (prioritized)

### P1 — Markets "Standing" block: pure label→value text, no weight (Markets view)
Below the (decent) market rows, **Standing** is four flat rows — `Social Standing → immigrant`,
`Commercial Power → nobody`, `Religious Authority → layman`, `Political Power → citizen` — plain text
left/right, no bars, no grouping, no rank-position cue. This is the densest unscannable block found.
**Fix:** render each as a labeled RANK PILL or a tiny segmented rung-ladder (the rank HAS a ladder in
the sim — `ranks`), so "immigrant" reads as position 1 of N at a glance. CSS only.

### P1 — Market values are bare numbers, no magnitude cue (Markets view)
Each market shows `100` + a tiny italic tag (stable/carry/buzz/pump/frontier). The number alone gives no
at-a-glance sense of high/low/trend. **Fix:** a thin inline bar/sparkline (CSS) behind the value, or a
delta arrow, so the eye reads relative magnitude without parsing digits. The colored left-bars are good —
keep + extend that visual language.

### P2 — SceneReader: a single dense prose slab + a big dead gap to "TAP TO CONTINUE"
The opening scene is one ~6-line block with no internal paragraph rhythm visible, then a large empty
vertical gap before the faint "TAP TO CONTINUE". Reads as a wall on first glance. **Fix (UQ-UI-4):** the
corpus prose is 2-4 paragraphs (UQ-2b) — ensure inter-paragraph spacing actually renders; tighten the
gap to the continue affordance, or pin it; add a subtle drop-letter / first-line lead so the eye has an
entry point. Keep it PROSE (per the novel balance) — this is rhythm + whitespace, not thinning.

### P2 — Everything is italic serif, including scannable data (News, Markets tags, Stats legend)
The italic body serif is right for the novel voice but it's used for the News headlines, the market
tags, and data labels too — italic serif is the SLOWEST face to scan. **Fix:** reserve italic-serif for
prose; use the upright display/UI face (or a tighter weight) for data rows, pills, headlines, legends.
A type-role split is the single highest-leverage scannability lever across all views.

### P3 — News feed: good structure, minor polish (News view)
The "Wider World" feed (category PILL + headline + year) is the most scannable panel — the pills carry
it. Keep as the reference pattern. Minor: headlines are ALL-CAPS italic for NYC but title-case for
others (inconsistent); the year column competes with the headline. Align the year as a dim right-rail.

### P3 — Stats Trajectory: structurally fine, weak at founding (Stats view)
A real line chart with a legend — inherently scannable, the best-structured view. At founding all series
are "--" so it's an empty grid (weak first impression). **Fix:** seed turn-0 dots / a "your line begins"
empty-state so it doesn't read as broken. Legend is a text row — fine; could become chips matching the
series colors.

### Pass-2 captures (UQ-UI-1b — DONE for desktop; mobile still pending)
- **Dossier = THE METER HUD, and it's the REFERENCE PATTERN.** Money/Power/Reputation/Loyalty/Health/Heat
  each = icon + label + horizontal magnitude BAR + value. Instantly scannable. THIS is the pattern the P1
  fixes should adopt: Markets "Standing" rows and bare market numbers should become icon+bar+value rows
  like the Dossier. One caveat: the icons are **emoji** (💰🏛️🏆🤝❤️🔥) — not "asset art", but emoji render
  inconsistently cross-platform and clash with the luxury serif. Replace with CSS-drawn glyphs / a cohesive
  icon treatment (the tab bar already uses small CSS icons — reuse that language).
- **Lineage:** card per member ("House of Bruno / Generation 1 / Concetta Bruno b.1885 [YOU]" gold pill).
  Clean card pattern, scannable; watch density as the tree grows (multi-gen → needs a compact/tree layout).
- **Timeline:** era cards ("Origins 1885-1946" + dashed "? the road ahead") + "You are in Origins, 1885."
  Clean, card-based. Good.
- **Choices = Butterfly Log:** good empty state ("No ripples yet. Your choices will echo here.").
- **Net:** the app ALREADY has the scannable vocabulary it needs (Dossier bars, News pills, Lineage/Timeline
  cards). The text-heaviness is localized to (a) Markets "Standing" + bare numbers not using the bar pattern,
  and (b) italic-serif bleeding into data rows. The rework is mostly PROPAGATING existing good patterns +
  the type-role split — not inventing new UI.
- STILL PENDING: the **mobile single-column layout + hamburger panel** (screenshot viewport stayed desktop
  despite resize). Capture on a real mobile viewport before the rework passes ship.

### P2 — Decision choices read as gold TEXT, not tappable affordances (beat/decision scene)
On a decision beat the prose is followed by the choice options in gold serif — distinct from the body, but
full-width lines with no card/border/hover/tap affordance. They look like emphasized prose, not buttons.
**Fix:** give choices a clear interactive container (border/inset/chevron, the onboarding choice-button
language already exists — reuse it) so "this is a thing I tap" is unambiguous, especially on touch.
Bonus finding: beat scenes DO render paragraph rhythm (prose para → gap → choices) — so the SceneReader
spacing is fine; the P2 "wall" is specific to the opening tap-to-continue scene's single slab + dead gap.

### P2 — On a decision, meters live only in the Dossier tab (mobile blind spot)
Wide layout shows the Dossier bars beside the scene, so meter context is visible while choosing. Mobile
hides the panel behind the menu — the player decides blind to Money/Health/Heat. **Fix:** a compact
always-visible meter strip (the 2-3 most decision-relevant bars) on the decision view at mobile width.

## Rework sequencing (maps to directive UQ-UI-2..4)
1. **UQ-UI-2 (HUD + meters):** the type-role split (P2) + Standing rank-pills (P1) + market magnitude
   cues (P1) — the persistent, highest-traffic surface.
2. **UQ-UI-3 (views):** News polish (P3), Stats empty-state (P3), and the same type-role split across
   Lineage/Timeline/Codex/Stats; tables/cards/grouping over prose where it scans better.
3. **UQ-UI-4 (SceneReader balance):** paragraph rhythm + continue-gap + drop-letter (P2), keeping prose.

Each change: visual test + Chrome screenshot-and-read before commit. Svelte+CSS only.
