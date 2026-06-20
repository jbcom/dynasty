import { expect, test } from "@playwright/test";

/**
 * Full cross-cutting playthroughs: drive a real game from the title screen all
 * the way to an end state, exercising the whole stack (sim + engine + UI +
 * persistence) in a real mobile browser.
 */

test("plays from title to a legacy report end screen", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Dynasty" })).toBeVisible();

  // Start a fresh, deterministic run.
  await page.getByLabel("Seed (optional)").fill("e2e-playthrough");
  await page.getByRole("button", { name: "Begin a Dynasty" }).click();

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
  await page.goto("/");
  await page.getByLabel("Seed (optional)").fill("e2e-tabs");
  await page.getByRole("button", { name: "Begin a Dynasty" }).click();
  await expect(page.locator("[data-meter]").first()).toBeVisible();

  await page.getByRole("button", { name: "Timeline" }).click();
  await expect(page.getByRole("heading", { name: "Timeline" })).toBeVisible();

  await page.getByRole("button", { name: "Dossier" }).click();
  await expect(page.getByText(/Dossier —/)).toBeVisible();

  await page.getByRole("button", { name: "Stats" }).click();
  await expect(page.getByRole("heading", { name: "Trajectory" })).toBeVisible();
});

test("a saved run can be continued", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Seed (optional)").fill("e2e-continue");
  await page.getByRole("button", { name: "Begin a Dynasty" }).click();
  await expect(page.locator("[data-meter]").first()).toBeVisible();

  // Make one choice so a save exists, then reload.
  await page.locator("[data-event] .choices button").first().click();
  await page.waitForTimeout(100);
  await page.reload();

  // Continue should now be offered and resume into the play screen.
  const cont = page.getByRole("button", { name: "Continue the Saga" });
  await expect(cont).toBeVisible();
  await cont.click();
  await expect(page.locator("[data-meter]").first()).toBeVisible();
});
