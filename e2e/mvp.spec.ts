import { expect, test } from "@playwright/test";

test("user can see a mission-based day on Today page", async ({ page }) => {
  await page.goto("/today");

  await expect(page.getByRole("heading", { name: "Daily Mission Plan" })).toBeVisible();
  await expect(page.getByText("Speaking mission")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Use Today Queue" })).toBeVisible();
});

test("user can complete a speaking mission with used chunks", async ({ page }) => {
  await page.goto("/study/speak");

  await expect(page.getByRole("heading", { name: "Speaking Mission" })).toBeVisible();
  await page.getByRole("checkbox").nth(0).check();
  await page.getByRole("checkbox").nth(1).check();
  await page.getByRole("button", { name: "Complete mission" }).click();

  await page.goto("/today");
  await expect(page.getByText("zaliczona")).toBeVisible();
});

test("user can update learner profile and see it in settings", async ({ page }) => {
  await page.goto("/settings");

  await expect(page.getByRole("heading", { name: "Learner Profile" })).toBeVisible();
  await page.getByLabel("New cards cap").fill("3");
  await page.getByRole("button", { name: "Save settings" }).click();
  await page.getByLabel("Priority contexts").fill("rutina, trabajo, social");
  await page.getByRole("button", { name: "Save learner profile" }).click();

  await expect(page.getByLabel("Priority contexts")).toHaveValue("rutina, trabajo, social");
});
