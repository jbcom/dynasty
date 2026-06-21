import { expect, test } from "@playwright/test";

/**
 * Full cross-cutting playthroughs: drive a real game from the title screen all the
 * way to an end state, exercising the whole stack (sim + engine + UI + persistence)
 * in a real mobile browser.
 *
 * Flow (CP-R4/R5 diegetic birth): Title → enter a surname (+ optional seed) → New
 * Game (Begin a Line) → the Epoch-0 birth (you emerge / discover the origin) → Play.
 * There is no control panel and no preset-dynasty carousel; the origin is seed-dealt
 * and discovered in-fiction.
 */

/** Helper: enter a surname (+ seed) and begin a line, landing on the play screen. */
async function startGame(
  page: import("@playwright/test").Page,
  opts: { seed: string; surname?: string } = { seed: "e2e-seed" },
): Promise<void> {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Dynasty" })).toBeVisible();
  await page.getByLabel("Family name").fill(opts.surname ?? "Vane");
  await page.getByLabel("Seed (optional)").fill(opts.seed);
  const begin = page.getByRole("button", { name: /Begin a Line/ });
  await expect(begin).toBeEnabled();
  await begin.click();
  // Land on the play screen: the meter HUD + the first event with choices.
  await expect(page.locator("[data-meter]").first()).toBeVisible({ timeout: 8000 });
  await expect(page.locator("[data-event] .choices button").first()).toBeVisible({ timeout: 8000 });
}

test("plays from title through the diegetic birth to a legacy report end screen", async ({
  page,
}) => {
  await startGame(page, { seed: "e2e-playthrough" });

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

test("New Game requires a surname and goes straight into the birth (no control panel)", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Dynasty" })).toBeVisible();
  // The Begin button is disabled until a surname is entered.
  const begin = page.getByRole("button", { name: /Begin a Line/ });
  await expect(begin).toBeDisabled();
  await page.getByLabel("Family name").fill("Ashford");
  await expect(begin).toBeEnabled();
  await begin.click();
  // Straight into the diegetic birth event — no moment carousel / control-panel step.
  await expect(page.locator("[data-event]").first()).toBeVisible();
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
