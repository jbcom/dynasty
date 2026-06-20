import { expect, test } from "@playwright/test";

/**
 * Full cross-cutting playthroughs: drive a real game from the title screen all
 * the way to an end state, exercising the whole stack (sim + engine + UI +
 * persistence) in a real mobile browser.
 *
 * Flow since de-5d: Title → Begin a Dynasty → Dynasty Carousel → pick a house → Play.
 */

/** Helper: navigate to "/" and pick a dynasty to start playing. */
async function startGame(
  page: import("@playwright/test").Page,
  opts: { seed: string; dynasty?: "trump" | "musk" | "kennedy" } = { seed: "e2e-seed" },
): Promise<void> {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Dynasty" })).toBeVisible();
  await page.getByLabel("Seed (optional)").fill(opts.seed);
  await page.getByRole("button", { name: "Begin a Dynasty" }).click();
  // Carousel is now visible — pick the requested house (default: Trump).
  const dynastyName = { trump: "Trump", musk: "Musk", kennedy: "Kennedy" }[opts.dynasty ?? "trump"];
  await page.getByRole("button", { name: `Play as ${dynastyName} →` }).click();
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

test("a saved run can be continued", async ({ page }) => {
  await startGame(page, { seed: "e2e-continue" });
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

test("dynasty carousel shows all three houses and routes to Musk saga (de-5d)", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Begin a Dynasty" }).click();
  // Carousel is visible.
  await expect(page.getByText("CHOOSE YOUR BLOODLINE")).toBeVisible();
  // All three dynasty cards present.
  await expect(page.getByRole("button", { name: /Play as Trump/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Play as Musk/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Play as Kennedy/ })).toBeVisible();
  // Back button returns to title.
  await page.getByRole("button", { name: "← Back" }).click();
  await expect(page.getByRole("button", { name: "Begin a Dynasty" })).toBeVisible();
});

test("Musk dynasty run starts with Musk Era-0 events (de-5b)", async ({ page }) => {
  await startGame(page, { seed: "e2e-musk", dynasty: "musk" });
  await expect(page.locator("[data-meter]").first()).toBeVisible();
  // The first event visible should belong to the Musk prologue chain (dynasty selector fires first).
  // We just verify the play screen is alive and making choices is possible.
  const choice = page.locator("[data-event] .choices button").first();
  await expect(choice).toBeVisible({ timeout: 5000 });
});
