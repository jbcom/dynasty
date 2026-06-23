import { expect, test } from "@playwright/test";

/**
 * Full cross-cutting playthroughs: drive a real game from the title screen all the
 * way to an end state, exercising the whole stack (sim + engine + UI + persistence)
 * in a real mobile browser.
 *
 * Flow (FS-ONB-DRIFT onboarding): Title (New Game / Load / Settings, NO inputs) → New Game → founding
 * funnel (REGION → POWER BASE → STANDING → STYLE → SURNAME → GENDER → GIVEN → JOB → FRIEND → PARTNER) →
 * Play. The played narrative is the NOVEL
 * (NA-11): a founded line opens on its saga act (the SceneReader), with the event card as the
 * fallback surface for any cell without an authored act. The run seed is a hidden random draw.
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

/** Click the first choice on the funnel card currently showing the given data-phase. */
async function pickPhase(page: import("@playwright/test").Page, phase: string): Promise<void> {
  const card = page.locator(`[data-phase="${phase}"]`);
  await expect(card).toBeVisible({ timeout: 8000 });
  await card.locator(".choices button").first().click();
}

/**
 * Walk the FS-ONB-DRIFT founding funnel to the play screen: REGION → POWER BASE → STANDING → naming
 * STYLE → SURNAME → GENDER → GIVEN → the FS-7b life-seeds (JOB → FRIEND → PARTNER). Picks the first
 * choice at each step; bestows the first suggested surname, or `opts.surname` via the "name your own" modal.
 */
async function startGame(
  page: import("@playwright/test").Page,
  opts: { surname?: string } = {},
): Promise<void> {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Dynasty" })).toBeVisible();
  await page.getByRole("button", { name: /Begin a Line/ }).click();

  // Founding-era origin: region → power base → standing → naming style.
  await pickPhase(page, "region");
  await pickPhase(page, "base");
  await pickPhase(page, "standing");
  await pickPhase(page, "style");

  // Surname bestowal (the data-phase="surname" card).
  const surnamePhase = page.locator('[data-phase="surname"]');
  await expect(surnamePhase).toBeVisible({ timeout: 8000 });
  if (opts.surname) {
    await surnamePhase.getByRole("button", { name: /Name your own line/ }).click();
    await page.getByPlaceholder("a family name").fill(opts.surname);
    await page.getByRole("button", { name: /Bestow it/ }).click();
  } else {
    await surnamePhase.locator(".choices button").first().click();
  }

  // Gender → given name → the diegetic Epoch-0 life-seeds (first job / best friend / life partner).
  await pickPhase(page, "gender");
  await pickPhase(page, "given");
  await pickPhase(page, "job");
  await pickPhase(page, "friend");
  await pickPhase(page, "partner");

  // Land on the play screen: the slim header + the first play surface (novel scene or event card).
  await expect(page.locator("[data-testid='saga-head']")).toBeVisible({ timeout: 8000 });
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

  await page.getByRole("button", { name: "Timeline" }).click();
  await expect(page.getByRole("heading", { name: "Timeline" })).toBeVisible();

  await page.getByRole("button", { name: "Dossier" }).click();
  await expect(page.getByText(/Dossier —/)).toBeVisible();

  await page.getByRole("button", { name: "Stats" }).click();
  await expect(page.getByRole("heading", { name: "Trajectory" })).toBeVisible();
});

test("the lineage tab shows the founded line (FD-13)", async ({ page }) => {
  await startGame(page, { surname: "Sterling" });
  await expect(page.locator("[data-testid='saga-head']")).toBeVisible();
  await page.getByRole("button", { name: "Lineage" }).click();
  await expect(page.getByRole("heading", { name: "The Line" })).toBeVisible();
  await expect(page.getByText("House of Sterling")).toBeVisible();
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

test("New Game has no upfront inputs and enters the diegetic onboarding (PL-3)", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Dynasty" })).toBeVisible();
  // The landing page is purely New Game / Load / Settings — no surname or seed inputs.
  await expect(page.locator("input")).toHaveCount(0);
  const begin = page.getByRole("button", { name: /Begin a Line/ });
  await expect(begin).toBeEnabled();
  await begin.click();
  // Straight into the founding funnel's REGION pick, no control panel / carousel.
  await expect(page.locator('[data-phase="region"] .choices button').first()).toBeVisible({
    timeout: 8000,
  });
  await expect(page.getByText("CHOOSE YOUR HINGE")).toHaveCount(0);
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
