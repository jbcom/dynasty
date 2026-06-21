import { expect, test } from "@playwright/test";

/**
 * Full cross-cutting playthroughs: drive a real game from the title screen all the
 * way to an end state, exercising the whole stack (sim + engine + UI + persistence)
 * in a real mobile browser.
 *
 * Flow (PL-3 diegetic onboarding): Title (New Game / Load / Settings, NO inputs) → New
 * Game → the consciousness phase (three place-agnostic choices that author the seed) →
 * surname bestowal (a culture-appropriate suggestion, or "name your own" via a modal) →
 * the Epoch-0 birth → Play. The seed is never shown; the surname is never typed on the
 * title screen.
 */

/**
 * Walk the diegetic onboarding to the play screen. Picks the first option in each of the
 * three consciousness lanes (authoring the seed), then bestows a surname — either the
 * first suggested family name, or, when `surname` is given, via the "name your own" modal.
 */
async function startGame(
  page: import("@playwright/test").Page,
  opts: { surname?: string } = {},
): Promise<void> {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Dynasty" })).toBeVisible();
  await page.getByRole("button", { name: /Begin a Line/ }).click();

  // Consciousness phase: three lanes, each a card of fragment choices. Pick the first.
  for (let lane = 0; lane < 3; lane++) {
    const choice = page.locator(".onboarding .choices button").first();
    await expect(choice).toBeVisible({ timeout: 8000 });
    await choice.click();
  }

  // Surname bestowal.
  if (opts.surname) {
    await page.getByRole("button", { name: /Name your own line/ }).click();
    await page.getByPlaceholder("a family name").fill(opts.surname);
    await page.getByRole("button", { name: /Bestow it/ }).click();
  } else {
    // Take the first offered (culture-appropriate) family name.
    await page.locator(".onboarding .choices button").first().click();
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
  // Straight into the consciousness phase — fragment choices, no control-panel/carousel.
  await expect(page.locator(".onboarding .choices button").first()).toBeVisible({ timeout: 8000 });
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
