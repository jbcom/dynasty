import { expect, test } from "@playwright/test";

/**
 * Full cross-cutting playthroughs: drive a real game from the title screen all
 * the way to an end state, exercising the whole stack (sim + engine + UI +
 * persistence) in a real mobile browser.
 *
 * Flow (FD-6, found-only): Title → New Game (Found a Dynasty) → moment picker →
 * surname entry → Begin the Line → Play. The preset-dynasty carousel is gone.
 */

/** Helper: navigate to "/", found a line at a start-moment, and reach the play screen. */
async function startGame(
  page: import("@playwright/test").Page,
  opts: { seed: string; momentLabel?: RegExp; surname?: string } = { seed: "e2e-seed" },
): Promise<void> {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Dynasty" })).toBeVisible();
  await page.getByLabel("Seed (optional)").fill(opts.seed);
  await page.getByRole("button", { name: /Found a Dynasty/ }).click();
  // Moment picker — choose the requested moment (default: the first card).
  const card = opts.momentLabel
    ? page.getByRole("button", { name: opts.momentLabel })
    : page.getByRole("button", { name: /Found here/ }).first();
  await card.click();
  // Name-entry — type a surname and begin the line.
  await page.getByLabel("Family name").fill(opts.surname ?? "Vane");
  await page.getByRole("button", { name: "Begin the Line" }).click();
}

test("plays from title to a legacy report end screen", async ({ page }) => {
  await startGame(page, { seed: "e2e-playthrough" });

  // The play screen shows the meter HUD.
  await expect(page.locator("[data-meter]").first()).toBeVisible();

  // Keep taking the first available choice until the run ends (legacy report).
  const maxTurns = 200;
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
      // Let the transition + autosave settle.
      await page.waitForTimeout(30);
    } else {
      await page.waitForTimeout(50);
    }
  }

  expect(ended, "run should reach an end state").toBe(true);
  await expect(page.locator("[data-end]")).toBeVisible();
  await expect(page.getByRole("button", { name: "Play Again" })).toBeVisible();
});

test("inter-era tabs render their views", async ({ page }) => {
  await startGame(page, { seed: "e2e-tabs" });
  await expect(page.locator("[data-meter]").first()).toBeVisible();

  await page.getByRole("button", { name: "Timeline" }).click();
  await expect(page.getByRole("heading", { name: "Timeline" })).toBeVisible();

  await page.getByRole("button", { name: "Dossier" }).click();
  await expect(page.getByText(/Dossier —/)).toBeVisible();

  await page.getByRole("button", { name: "Stats" }).click();
  await expect(page.getByRole("heading", { name: "Trajectory" })).toBeVisible();
});

test("the lineage tab shows the founded line (FD-13)", async ({ page }) => {
  await startGame(page, { seed: "e2e-lineage", surname: "Sterling" });
  await expect(page.locator("[data-meter]").first()).toBeVisible();
  await page.getByRole("button", { name: "Lineage" }).click();
  await expect(page.getByRole("heading", { name: "The Line" })).toBeVisible();
  await expect(page.getByText("House of Sterling")).toBeVisible();
  await expect(page.getByText("You")).toBeVisible();
});

test("a saved run can be continued", async ({ page }) => {
  await startGame(page, { seed: "e2e-continue" });
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

test("the moment picker shows the founding hinges incl. deep history (FD-6)", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Found a Dynasty/ }).click();
  await expect(page.getByText("CHOOSE YOUR HINGE")).toBeVisible();
  // Several start-moments are offered, including the deep-history exemplar.
  await expect(page.getByRole("button", { name: /The Great Hunger/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /The Round City/ })).toBeVisible();
  await expect(page.getByText("Deep history").first()).toBeVisible();
  // Back button returns to title.
  await page.getByRole("button", { name: "← Back" }).click();
  await expect(page.getByRole("button", { name: /Found a Dynasty/ })).toBeVisible();
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
  await expect(page.getByRole("button", { name: /Found a Dynasty/ })).toBeVisible();
});

test("a deep-history line founds and plays the caliphate era", async ({ page }) => {
  await startGame(page, {
    seed: "e2e-deep",
    momentLabel: /The Round City/,
    surname: "al-Rashid",
  });
  await expect(page.locator("[data-meter]").first()).toBeVisible();
  // A choice is available in the opening caliphate event.
  const choice = page.locator("[data-event] .choices button").first();
  await expect(choice).toBeVisible({ timeout: 5000 });
});
