/**
 * tests/e2e/python-editor.spec.ts
 *
 * Playwright e2e tests for User Story 3: In-Browser Python Code Editor.
 *
 * Implements T031.
 */

import { test, expect } from "@playwright/test";

const EDITOR_PAGE = "/playground/python-editor";
const PYODIDE_LOAD_TIMEOUT = 120_000; // Pyodide can take a while to load WASM
const RUN_TIMEOUT = 5_000; // SC-003: 10-line script must run within 5s post-load

test.describe("Python Editor Page", () => {
  test("loads and Pyodide becomes ready", async ({ page }) => {
    test.setTimeout(PYODIDE_LOAD_TIMEOUT + 30_000);
    await page.goto(EDITOR_PAGE);

    // Wait for loading overlay to disappear (Pyodide ready)
    await page.waitForSelector("#editor-loading-overlay[style*='display: none']", {
      timeout: PYODIDE_LOAD_TIMEOUT,
    });

    // Run button should now be enabled
    const runBtn = page.locator("#run-btn");
    await expect(runBtn).toBeEnabled({ timeout: 5_000 });
  });

  test("executes Python code and shows output", async ({ page }) => {
    test.setTimeout(PYODIDE_LOAD_TIMEOUT + 30_000);
    await page.goto(EDITOR_PAGE);

    // Wait for Pyodide to load
    await page.waitForSelector("#editor-loading-overlay[style*='display: none']", {
      timeout: PYODIDE_LOAD_TIMEOUT,
    });

    // Type into CodeMirror editor
    const cmEditor = page.locator(".cm-editor .cm-content");
    await cmEditor.click();
    await page.keyboard.selectAll();
    await page.keyboard.type('print("hello")');

    const startTime = Date.now();

    // Click Run
    await page.locator("#run-btn").click();

    // Wait for output
    await expect(page.locator("#output-panel")).toContainText("hello", {
      timeout: 10_000,
    });

    const elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThanOrEqual(RUN_TIMEOUT);
  });

  test("resets editor to starter code on Reset click", async ({ page }) => {
    test.setTimeout(PYODIDE_LOAD_TIMEOUT + 30_000);
    await page.goto(EDITOR_PAGE);

    // Wait for Pyodide to load
    await page.waitForSelector("#editor-loading-overlay[style*='display: none']", {
      timeout: PYODIDE_LOAD_TIMEOUT,
    });

    // Modify editor content
    const cmEditor = page.locator(".cm-editor .cm-content");
    await cmEditor.click();
    await page.keyboard.selectAll();
    await page.keyboard.type("# modified code");

    // Click Reset
    await page.locator("#reset-btn").click();

    // After reset, editor should contain starter code (Caesar cipher demo)
    await page.waitForSelector("#editor-loading-overlay[style*='display: none']", {
      timeout: PYODIDE_LOAD_TIMEOUT,
    });

    const editorContent = await page.locator(".cm-editor").textContent();
    expect(editorContent).toContain("caesar_cipher");
    expect(editorContent).not.toContain("# modified code");
  });

  test("shows traceback for Python errors", async ({ page }) => {
    test.setTimeout(PYODIDE_LOAD_TIMEOUT + 30_000);
    await page.goto(EDITOR_PAGE);

    // Wait for Pyodide to load
    await page.waitForSelector("#editor-loading-overlay[style*='display: none']", {
      timeout: PYODIDE_LOAD_TIMEOUT,
    });

    // Type code that raises an error
    const cmEditor = page.locator(".cm-editor .cm-content");
    await cmEditor.click();
    await page.keyboard.selectAll();
    await page.keyboard.type("1/0");

    // Click Run
    await page.locator("#run-btn").click();

    // Output should contain the traceback/error message
    await expect(page.locator("#output-panel")).toContainText("ZeroDivisionError", {
      timeout: 10_000,
    });
  });

  test("has noscript fallback element", async ({ page }) => {
    await page.goto(EDITOR_PAGE);
    const html = await page.content();
    expect(html).toContain("<noscript>");
    expect(html).toContain("JavaScript is required");
  });
});
