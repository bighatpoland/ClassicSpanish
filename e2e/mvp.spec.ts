import { expect, test } from "@playwright/test";

test("user can complete minimum viable day from Today page", async ({ page }) => {
  await page.goto("/today");

  await expect(page.getByRole("heading", { name: "Daily Plan" })).toBeVisible();
  await page.getByRole("button", { name: "5+5+5", exact: true }).click();
  await page.getByRole("button", { name: "Complete" }).first().click();
  await page.getByRole("button", { name: "Complete" }).first().click();
  await page.getByRole("button", { name: "Complete" }).first().click();

  await expect(page.getByText("domkniety")).toBeVisible();
});

test("user can review a card in SRS", async ({ page }) => {
  await page.goto("/study/srs");

  await expect(page.getByRole("heading", { name: "Review Queue" })).toBeVisible();
  await page.getByRole("button", { name: "Show answer" }).click();
  await page.getByRole("button", { name: "4" }).click();

  await expect(page.getByText("review today")).toBeVisible();
});
