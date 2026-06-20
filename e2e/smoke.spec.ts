import { expect, test } from "@playwright/test";

// Cross-cutting smoke test. Full playthrough specs land in task G1.
test("app boots and shows the title", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "MAGA Money Moves" })).toBeVisible();
});
