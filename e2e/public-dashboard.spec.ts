import { expect, test } from "@playwright/test";

test("public dashboard is usable, English-only, and has no horizontal overflow", async ({ page }) => {
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });

  const response = await page.goto("/");
  expect(response?.ok()).toBeTruthy();

  await expect(page).toHaveTitle("Leonardo V Academy Houses");
  await expect(page.getByRole("heading", { name: "House points at a glance." })).toBeVisible();
  await expect(page.getByText("Leading house", { exact: true })).toBeVisible();
  await expect(page.getByText("Leading student", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Every house, at a glance" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Explore Curiositas" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Explore Humanitas" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Explore Veritas" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Explore Sapientia" })).toBeVisible();
  await expect(page.locator(".house-card-art img")).toHaveCount(3);
  await expect(page.locator(".house-card-art-color")).toHaveCount(1);
  expect(await page.locator(".house-card-art img").evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0))).toBeTruthy();
  expect(await page.locator(".house-card-art img").evaluateAll((images) => images.every((image) => getComputedStyle(image).objectFit === "contain" && image.clientHeight <= (image.parentElement?.clientHeight ?? 0)))).toBeTruthy();
  const leadingStudentCard = page.getByText("Leading student", { exact: true }).locator("..");
  await expect(leadingStudentCard.getByRole("heading")).toBeVisible();

  await expect(page.locator("body")).not.toContainText(/[А-Яа-яЁё]/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy();

  await page.getByRole("link", { name: "Explore Curiositas" }).click();
  await expect(page).toHaveURL(/\/houses\//);
  await expect(page.getByRole("heading", { name: "Curiositas" })).toBeVisible();
  await expect(page.getByText("Set of keys", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy();

  await page.goto("/");

  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.getByRole("link", { name: "Sign in" }).first().click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Enter your portal" })).toBeVisible();
  await expect(page.getByLabel("Email or username")).toBeVisible();
  await expect(page.getByLabel("Password")).toHaveAttribute("minlength", "14");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy();
  expect(browserErrors).toEqual([]);
});
