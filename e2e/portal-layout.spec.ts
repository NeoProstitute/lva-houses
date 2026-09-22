import { expect, test } from "@playwright/test";

const accounts = [
  ["liliana.netland", "LilianaHouse!2026"],
  ["michael.stoner", "MichaelHouse!2026"],
  ["admin", "AdminHouses!2026"]
] as const;

for (const [login, password] of accounts) {
  test(`Czech ${login} portal fits a narrow viewport`, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("lva-houses-language", "cs"));
    await page.goto("/login");
    await page.locator('input[name="login"]').fill(login);
    await page.locator('input[name="password"]').fill(password);
    await page.locator(".auth-card button").click();
    await expect(page).toHaveURL(/\/portal$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "cs");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy();
  });
}
