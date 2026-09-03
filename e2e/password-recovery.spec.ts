import { expect, test } from "@playwright/test";

test("password recovery screens are accessible and work on a narrow viewport", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("link", { name: "Forgot your password?" }).click();

  await expect(page).toHaveURL(/\/forgot-password$/);
  await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
  await expect(page.getByLabel("School email address")).toHaveAttribute("autocomplete", "email");
  await expect(page.getByRole("button", { name: "Send reset link" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy();

  await page.goto(`/reset-password?token=${"a".repeat(43)}`);
  await expect(page.getByRole("heading", { name: "Choose a new password" })).toBeVisible();
  await expect(page.getByLabel("New password", { exact: true })).toHaveAttribute("autocomplete", "new-password");
  await expect(page.getByLabel("Confirm new password")).toHaveAttribute("autocomplete", "new-password");

  await page.goto("/reset-password");
  await expect(page.getByText("This reset link is incomplete or invalid.", { exact: false })).toBeVisible();
});
