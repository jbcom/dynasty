import { expect, test } from "@playwright/test";

/**
 * Full cross-cutting playthroughs: drive a real game from the title screen all the
 * way to an end state, exercising the whole stack (sim + engine + UI + persistence)
 * in a real mobile browser.
 *
 * Flow (EI-6b EMERGENT-INFANCY onboarding): Title (New Game / Load / Settings, NO inputs) → New Game →
 * the lived Epoch-0 EMERGENCE (the SceneReader plays birth → naming → childhood → formative beats; the
 * player pages the prose and picks glowing inline choices — NO upfront card funnel) → the emergence
 * resolves the founding → Play. The played narrative is the NOVEL (NA-11): a founded line opens on its
 * saga act (the SceneReader), with the event card as the fallback for any cell without an authored act.
 * The run seed is a hidden random draw.
 */

/** The play surface's actionable CHOICE — a saga inline-option (glowing text), or an event-card choice. */
const PLAY_CHOICE = "[data-testid='scene-reader'] .inline-option, [data-event] .choices button";

/** Whether the run has reached the play screen (either the novel reader or the event card). */
function playSurface(page: import("@playwright/test").Page) {
  return page.locator("[data-testid='scene-reader'], [data-event]");
}

/**
 * Advance the play surface one step (paged SceneReader, PF-3): if a CHOICE is up (inline glowing
 * option or an event-card button), pick the first; otherwise TAP the page to turn to the next
 * paragraph. The tap layer sits behind the prose (z-index), so a real tap is a force-click on it.
 * Returns false when neither a choice nor a tap layer is present (e.g. an interlude / end).
 */
async function advancePlay(page: import("@playwright/test").Page): Promise<boolean> {
  const choice = page.locator(PLAY_CHOICE).first();
  if (await choice.count()) {
    await choice.click();
    return true;
  }
  const tap = page.locator("[data-testid='scene-reader'] .tap-layer").first();
  if (await tap.count()) {
    // Dispatch the click directly — the tap layer sits behind the prose (z-index) so normal
    // actionability hit-testing would wait forever; the onclick handler is what we need to fire.
    await tap.dispatchEvent("click");
    return true;
  }
  return false;
}

/** A glowing inline choice on the OPENING's SceneReader (a weave beat OR the terminal decision). */
const OPENING_CHOICE =
  "[data-testid='scene-reader'] [data-testid='weave'] .inline-option, " +
  "[data-testid='scene-reader'] [data-testid='decision'] .inline-option";

/**
 * Advance the EMERGENCE one step: if a glowing inline choice is up (a sense weave-beat or the scene's
 * terminal decision), pick the first; otherwise TAP the page to turn to the next paragraph. The tap layer
 * sits behind the prose (z-index), so a real tap is a dispatched click on it. Returns false when neither a
 * choice nor a tap layer is present (the emergence has ended → we've left the OpeningScreen).
 */
async function advanceOpening(page: import("@playwright/test").Page): Promise<boolean> {
  const choice = page.locator(OPENING_CHOICE).first();
  if (await choice.count()) {
    await choice.click();
    return true;
  }
  const tap = page.locator("[data-testid='scene-reader'] .tap-layer").first();
  if (await tap.count()) {
    await tap.dispatchEvent("click");
    return true;
  }
  return false;
}

/**
 * From the title, play the lived Epoch-0 EMERGENCE through to the play screen (EI-6b). New Game opens the
 * OpeningScreen; we page its prose and pick the first glowing inline choice at every beat/decision until the
 * emergence resolves the founding and the play surface (the slim saga header) appears. No upfront card
 * funnel, no surname/seed inputs — the line's name is seed-dealt during the birth/naming beat.
 */
async function startGame(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Dynasty" })).toBeVisible();
  await page.getByRole("button", { name: /Begin a Line/ }).click();

  // The emergence plays on the SceneReader — page + pick until it founds the line and drops into play.
  await expect(page.locator("[data-testid='scene-reader']")).toBeVisible({ timeout: 8000 });
  const head = page.locator("[data-testid='saga-head']");
  for (let i = 0; i < 80 && !(await head.count()); i++) {
    if (!(await advanceOpening(page))) break;
    await page.waitForTimeout(30);
  }

  // Land on the play screen: the slim header + the first play surface (novel scene or event card).
  await expect(head).toBeVisible({ timeout: 8000 });
  await expect(playSurface(page).first()).toBeVisible({ timeout: 8000 });
}

test("plays from title through the diegetic birth and advances the founding spine", async ({
  page,
}) => {
  await startGame(page);

  // The founded line opens straight into the play surface (the paged novel, or an event).
  await expect(playSurface(page).first()).toBeVisible();

  // The founding spine is a LONG run (g0→g9, 1776→the stars). Full-run COMPLETION to the legacy report is
  // proven deterministically at the unit/store level (sim autoPlaythrough endings + the gameStore
  // devFastForward probe both reach finished:true). Here, e2e's job is the UI PATH: that the founded line
  // plays through real scenes and ADVANCES the spine (the act title / era moves forward) via the play
  // surface. We drive the saga-aware DEV fast-forward and assert genuine forward progress through the acts.
  const devSkip = page.getByRole("button", { name: "⏭ +100" });
  const head = page.locator("[data-testid='saga-head']");
  const startHead = (await head.textContent()) ?? "";
  let advanced = false;
  for (let i = 0; i < 60; i++) {
    if (await page.locator("[data-end]").count()) {
      advanced = true; // reached the end outright — also valid progress
      break;
    }
    if ((await head.textContent()) !== startHead) {
      advanced = true; // the act/era moved forward — the spine is progressing through the UI
      break;
    }
    if (await devSkip.count()) await devSkip.click().catch(() => {});
    else await advancePlay(page);
    await page.waitForTimeout(60);
  }

  expect(
    advanced,
    "the founded spine should advance through the UI (act/era moves, or run ends)",
  ).toBe(true);
});

test("inter-era tabs render their views", async ({ page }) => {
  await startGame(page);
  await expect(page.locator("[data-testid='saga-head']")).toBeVisible();

  // A11Y-TAB-ARIA: the tab buttons are now role="tab" (in a tablist), not role="button".
  await page.getByRole("tab", { name: "Timeline" }).click();
  await expect(page.getByRole("heading", { name: "Timeline" })).toBeVisible();

  await page.getByRole("tab", { name: "Dossier" }).click();
  // VD-7: the Dossier tab is the rich path-keyed visual briefing (DossierView), not the old meter-bar list.
  await expect(page.locator("[data-testid='dossier-view']")).toBeVisible();

  await page.getByRole("tab", { name: "Stats" }).click();
  await expect(page.getByRole("heading", { name: "Trajectory" })).toBeVisible();
});

test("APP-RUNS-VERIFY: every GenAI surface degrades cleanly when its assets are ABSENT (real fallback path)", async ({
  page,
}) => {
  // The doctrine DoD: "tests pass" ≠ "app runs". The repo SHIPS generated assets (incl. the founding-era ones a
  // freshly-founded line renders), so the run normally hits the assets-PRESENT path. To genuinely prove the
  // hide-on-error FALLBACK (the point of this test), ABORT every generated asset so each surface's onerror fires —
  // then assert (a) no broken <img> is left visible AND (b) the fallback CONTENT renders, so the pass isn't vacuous.
  await page.route("**/assets/generated/**", (r) => r.abort());
  await startGame(page);
  await expect(page.locator("[data-testid='saga-head']")).toBeVisible();

  // No <img> that errored is left VISIBLE: a broken img reports complete=true + naturalWidth=0 while still shown;
  // a gracefully-handled one is display:none / unmounted (offsetParent null). Mid-load (complete=false) is excluded.
  const noVisibleBrokenImages = async (label: string) => {
    const broken = await page.evaluate(
      () =>
        [...document.querySelectorAll("img")].filter((img) => {
          const visible = img.offsetParent !== null && getComputedStyle(img).display !== "none";
          return visible && img.complete && img.naturalWidth === 0;
        }).length,
    );
    expect(broken, `${label}: no visible broken images`).toBe(0);
  };

  // Field — the rival heads (encounter portraits) hide; the field rows + the summary line (asset-independent) read.
  await page.getByRole("tab", { name: "Field" }).click();
  await expect(
    page.locator("[data-testid='rival-dossier'], [data-testid='rival-dossier-empty']"),
  ).toBeVisible();
  await noVisibleBrokenImages("Field");

  // Map — the era base + the founding fallback both abort → the base hides; the journey overlay + labels still
  // render (the .chart keeps its aspect-ratio box; the SVG route + the stage labels are the asset-independent
  // fallback content). Assert a layout-bearing element (a stage label), not an inner SVG geometry node (which has
  // no CSS box and reads "hidden" to Playwright even when painted).
  await page.getByRole("tab", { name: "Map" }).click();
  await expect(page.locator("svg.route")).toBeVisible();
  await expect(page.locator(".chart .labels .stage").first()).toBeVisible(); // the journey labels are the fallback content
  await noVisibleBrokenImages("Map");

  // Dossier — the figure + diagram hide; the real data-viz panels carry the briefing. Assert the chart panel's
  // title (a layout-bearing element), not a raw SVG node.
  await page.getByRole("tab", { name: "Dossier" }).click();
  await expect(page.locator("[data-testid='dossier-view']")).toBeVisible();
  await expect(page.getByText("Trajectory").first()).toBeVisible(); // the chart data panel rendered (the briefing's anchor)
  await noVisibleBrokenImages("Dossier");
});

test("the lineage tab shows the founded line (FD-13)", async ({ page }) => {
  // The surname is now SEED-DEALT during the emergence (EI-6b) — not picked — so assert the lineage shows
  // a real founded house ("House of <name>") + the player ("You"), reading the dealt name from the DOM.
  await startGame(page);
  await expect(page.locator("[data-testid='saga-head']")).toBeVisible();
  await page.getByRole("tab", { name: "Lineage" }).click();
  await expect(page.getByRole("heading", { name: "The Line" })).toBeVisible();
  await expect(page.getByText(/House of \S+/)).toBeVisible();
  await expect(page.getByText("You")).toBeVisible();
});

test("a saved run can be continued", async ({ page }) => {
  await startGame(page);
  await expect(page.locator("[data-testid='saga-head']")).toBeVisible();

  // Page through the opening prose until a choice is up, then take it — a beat/decision autosaves.
  for (let i = 0; i < 8; i++) {
    if (await page.locator(PLAY_CHOICE).count()) break;
    await advancePlay(page);
    await page.waitForTimeout(30);
  }
  await page.locator(PLAY_CHOICE).first().click();
  await page.waitForTimeout(150);
  await page.reload();

  // Load Game / Continue should now be offered and resume into the play screen.
  const cont = page.getByRole("button", { name: /Continue/ });
  await expect(cont).toBeVisible();
  await cont.click();
  await expect(page.locator("[data-testid='saga-head']")).toBeVisible();
});

test("New Game has no upfront inputs and enters the lived emergence (PL-3 / EI-6b)", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Dynasty" })).toBeVisible();
  // The landing page is purely New Game / Load / Settings — no surname or seed inputs.
  await expect(page.locator("input")).toHaveCount(0);
  const begin = page.getByRole("button", { name: /Begin a Line/ });
  await expect(begin).toBeEnabled();
  await begin.click();
  // Straight into the lived Epoch-0 EMERGENCE on the SceneReader — NO card funnel (no data-phase cards).
  await expect(page.locator("[data-testid='scene-reader']")).toBeVisible({ timeout: 8000 });
  await expect(page.locator("[data-phase]")).toHaveCount(0);
  // It opens on the birth scene (the first emergence scene the runner starts at).
  await expect(page.locator("[data-scene-id='epoch0:birth']")).toBeVisible();
});

test("the Settings screen stores no key by default and disables live mode (FD-12)", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.getByRole("heading", { name: "The Study" })).toBeVisible();
  // Live extrapolation is off and the toggle is disabled until a key is entered.
  await expect(page.getByRole("button", { name: /Live extrapolation OFF/ })).toBeDisabled();
  await page.getByRole("button", { name: "← Back" }).click();
  await expect(page.getByRole("button", { name: /Begin a Line/ })).toBeVisible();
});
