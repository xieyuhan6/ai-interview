import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await page.goto("http://127.0.0.1:3000", { waitUntil: "domcontentloaded" });
assert.match(await page.title(), /Interview Helper/);
assert.equal(await page.locator("html").getAttribute("class"), "dark");
assert.equal(await page.locator("html").getAttribute("lang"), "en");
assert.doesNotMatch(await page.locator("body").innerText(), /\p{Script=Han}/u);
await page
  .getByRole("heading", { name: "Get interview-ready with AI" })
  .waitFor();
assert.equal(await page.locator('img[alt="robot"]').count(), 1);
assert.equal(await page.locator('a[href="/resume"]').count(), 2);
await page.screenshot({ path: "docs/home-desktop.png", fullPage: true });
assert.equal(await page.locator(".helper-interview-card").count(), 2);
for (const route of [
  "/interview",
  "/resume",
  "/history",
  "/interview/unknown",
]) {
  await page.goto(`http://127.0.0.1:3000${route}`, {
    waitUntil: "domcontentloaded",
  });
  assert.match(page.url(), /\/sign-in$/);
}
await page.getByRole("link", { name: "No account yet? Sign up" }).click();
await page
  .getByRole("heading", { name: "Practice job interviews with AI" })
  .waitFor();
assert.doesNotMatch(await page.locator("body").innerText(), /\p{Script=Han}/u);
await page.screenshot({ path: "docs/register-desktop.png", fullPage: true });
await page.setViewportSize({ width: 390, height: 844 });
await page.goto("http://127.0.0.1:3000", { waitUntil: "domcontentloaded" });
assert.equal(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  true,
);
await page.screenshot({ path: "docs/home-mobile.png", fullPage: true });
assert.equal(
  (await page.request.get("http://127.0.0.1:3000/api/helper")).status(),
  401,
);
assert.equal(
  (
    await page.request.get("http://127.0.0.1:3000/api/vapi/transcript")
  ).status(),
  410,
);
assert.equal(
  (
    await page.request.post("http://127.0.0.1:3000/api/helper", {
      headers: { origin: "https://attacker.example" },
      data: {},
    })
  ).status(),
  403,
);
assert.deepEqual(errors, []);
console.log(
  "PASS: desktop/mobile rendering, protected page redirects, registration navigation, API authentication, old endpoint retirement, no browser errors.",
);
await browser.close();
