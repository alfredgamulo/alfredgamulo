/**
 * tests/e2e/mind-map.spec.ts
 *
 * Playwright e2e tests for User Story 1: Animated Mind Map Home Page.
 *
 * Implements T019.
 */

import { test, expect } from "@playwright/test";

test.describe("Mind Map Home Page", () => {
  test("renders SVG with at least one node", async ({ page }) => {
    await page.goto("/");
    // Wait for the D3 simulation to render nodes
    await page.waitForSelector("g.node", { timeout: 10_000 });
    const nodes = page.locator("g.node");
    expect(await nodes.count()).toBeGreaterThanOrEqual(1);
  });

  test("shows preview card on node hover", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("g.node", { timeout: 10_000 });

    const firstNode = page.locator("g.node").first();
    await firstNode.hover();

    // Preview card should become visible
    const card = page.locator("#node-preview-card");
    await expect(card).toHaveClass(/visible/, { timeout: 3_000 });
  });

  test("navigates to page on node click", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("g.node", { timeout: 10_000 });

    const initialUrl = page.url();
    const firstNode = page.locator("g.node").first();
    await firstNode.click();

    // URL should have changed after click
    await page.waitForURL((url) => url.toString() !== initialUrl, {
      timeout: 5_000,
    });
    expect(page.url()).not.toBe(initialUrl);
  });

  test("SVG contains zoom group (pan/zoom enabled)", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#mind-map-zoom-group", { timeout: 10_000 });
    const zoomGroup = page.locator("#mind-map-zoom-group");
    await expect(zoomGroup).toBeVisible();
  });

  test("noscript fallback contains list of pages", async ({ page }) => {
    // Check that noscript content exists in the HTML source
    const html = await page.content();
    expect(html).toContain("<noscript>");
    expect(html).toContain("noscript-fallback");
  });
});
