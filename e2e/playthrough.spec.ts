import { expect, test } from "@playwright/test";

/**
 * Full cross-cutting playthroughs: drive a real game from the title screen all the
 * way to an end state, exercising the whole stack (sim + engine + UI + persistence)
 * in a real mobile browser.
 *
 * Flow (OB-3 onboarding): Title (New Game / Load / Settings, NO inputs) → New Game → pick a
 * LOCATION from the place-cue cards (geography) → bestow a family name (suggestion or "name
 * your own") → the authored Epoch-0 story → Play. The run seed is a hidden random draw.
 */

/**
 * Walk the onboarding to the play screen: pick the first location cue, then bestow a family
 * name — the first suggestion, or, when `surname` is given, via the "name your own" modal.
 */
async function startGame(
  page: import("@playwright/test").Page,
  opts: { surname?: string } = {},
): Promise<void> {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Dynasty" })).toBeVisible();
  await page.getByRole("button", { name: /Begin a Line/ }).click();

  // Onboarding (SS-7): the wave funnel — PERIOD → CLASS → (CULTURE if >1) → bestow a name.
  const periodPhase = page.locator('[data-phase="period"]');
  await expect(periodPhase).toBeVisible({ timeout: 8000 });
  await periodPhase.locator(".choices button").first().click();

  const classPhase = page.locator('[data-phase="class"]');
  await expect(classPhase).toBeVisible({ timeout: 8000 });
  await classPhase.locator(".choices button").first().click();

  // The race/culture step appears only when the (period, class) cell has more than one wave.
  const culturePhase = page.locator('[data-phase="culture"]');
  if (await culturePhase.count()) {
    await culturePhase.locator(".choices button").first().click();
  }

  // Family-name bestowal (the data-phase="name" card).
  const namePhase = page.locator('[data-phase="name"]');
  await expect(namePhase).toBeVisible({ timeout: 8000 });
  if (opts.surname) {
    await namePhase.getByRole("button", { name: /Name your own line/ }).click();
    await page.getByPlaceholder("a family name").fill(opts.surname);
    await page.getByRole("button", { name: /Bestow it/ }).click();
  } else {
    // Take the first offered (culture-appropriate) family name.
    await namePhase.locator(".choices button").first().click();
  }

  // Land on the play screen: the meter HUD + the first event with choices.
  await expect(page.locator("[data-meter]").first()).toBeVisible({ timeout: 8000 });
  await expect(page.locator("[data-event] .choices button").first()).toBeVisible({ timeout: 8000 });
}

test("plays from title through the diegetic birth to a legacy report end screen", async ({
  page,
}) => {
  await startGame(page);

  // The diegetic birth opens straight into an event with reactable choices.
  await expect(page.locator("[data-event]").first()).toBeVisible();
  await expect(page.locator("[data-event] .choices button").first()).toBeVisible();

  // Keep taking the first available choice until the run ends (legacy report).
  const maxTurns = 300;
  let ended = false;
  for (let i = 0; i < maxTurns; i++) {
    const report = page.locator("[data-end]");
    if (await report.count()) {
      ended = true;
      break;
    }
    const choice = page.locator("[data-event] .choices button").first();
    if (await choice.count()) {
      await choice.click();
      await page.waitForTimeout(20);
    } else {
      await page.waitForTimeout(50);
    }
  }

  expect(ended, "run should reach an end state").toBe(true);
  await expect(page.locator("[data-end]")).toBeVisible();
  await expect(page.getByRole("button", { name: "Play Again" })).toBeVisible();
});

test("inter-era tabs render their views", async ({ page }) => {
  await startGame(page);
  await expect(page.locator("[data-meter]").first()).toBeVisible();

  await page.getByRole("button", { name: "Timeline" }).click();
  await expect(page.getByRole("heading", { name: "Timeline" })).toBeVisible();

  await page.getByRole("button", { name: "Dossier" }).click();
  await expect(page.getByText(/Dossier —/)).toBeVisible();

  await page.getByRole("button", { name: "Stats" }).click();
  await expect(page.getByRole("heading", { name: "Trajectory" })).toBeVisible();
});

test("the lineage tab shows the founded line (FD-13)", async ({ page }) => {
  await startGame(page, { surname: "Sterling" });
  await expect(page.locator("[data-meter]").first()).toBeVisible();
  await page.getByRole("button", { name: "Lineage" }).click();
  await expect(page.getByRole("heading", { name: "The Line" })).toBeVisible();
  await expect(page.getByText("House of Sterling")).toBeVisible();
  await expect(page.getByText("You")).toBeVisible();
});

test("a saved run can be continued", async ({ page }) => {
  await startGame(page);
  await expect(page.locator("[data-meter]").first()).toBeVisible();

  // Make one choice so a save exists, then reload.
  await page.locator("[data-event] .choices button").first().click();
  await page.waitForTimeout(100);
  await page.reload();

  // Load Game / Continue should now be offered and resume into the play screen.
  const cont = page.getByRole("button", { name: /Continue/ });
  await expect(cont).toBeVisible();
  await cont.click();
  await expect(page.locator("[data-meter]").first()).toBeVisible();
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
  // Straight into the wave funnel's PERIOD pick, no control panel / carousel.
  await expect(page.locator('[data-phase="period"] .choices button').first()).toBeVisible({
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
