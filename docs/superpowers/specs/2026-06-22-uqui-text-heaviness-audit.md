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

### Not yet screenshotted (UQ-UI-1b — capture in pass-2 before reworking each)
Lineage, Timeline, Choices, Dossier tabs; the MeterHud/MeterGauge as it appears on a DECISION scene
(the founding scene showed no meter gauges — they likely appear on choice/decision beats); the mobile
single-column layout + the hamburger menu panel. Screenshot + read each before its rework pass.

## Rework sequencing (maps to directive UQ-UI-2..4)
1. **UQ-UI-2 (HUD + meters):** the type-role split (P2) + Standing rank-pills (P1) + market magnitude
   cues (P1) — the persistent, highest-traffic surface.
2. **UQ-UI-3 (views):** News polish (P3), Stats empty-state (P3), and the same type-role split across
   Lineage/Timeline/Codex/Stats; tables/cards/grouping over prose where it scans better.
3. **UQ-UI-4 (SceneReader balance):** paragraph rhythm + continue-gap + drop-letter (P2), keeping prose.

Each change: visual test + Chrome screenshot-and-read before commit. Svelte+CSS only.
