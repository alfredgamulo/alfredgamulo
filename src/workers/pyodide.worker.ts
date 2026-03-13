/**
 * src/workers/pyodide.worker.ts
 *
 * ESM Web Worker for running Python code via Pyodide.
 *
 * SECURITY NOTE — SRI for Pyodide:
 * Pyodide is loaded via ESM import from the CDN below (pinned to v0.27.0).
 * Browser `<script integrity="...">` SRI applies only to HTML script tags, NOT
 * to ESM `import` statements inside Workers. The Fetch/SW spec does not yet
 * support SRI for dynamic ESM imports. As a compensating control, we pin the
 * exact CDN URL and version here. Track Pyodide releases at:
 * https://github.com/pyodide/pyodide/releases
 *
 * Implements:
 *  - T026: WorkerRequest / WorkerResponse protocol
 *  - T012b: Pyodide CDN version lock + SRI rationale comment
 */

// Pinned CDN URL — v0.27.0. Update intentionally when upgrading Pyodide.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — ESM import from CDN; no .d.ts available at compile time
import { loadPyodide } from "https://cdn.jsdelivr.net/pyodide/v0.27.0/full/pyodide.mjs";

// ─── Protocol Types ────────────────────────────────────────────────────────────

type WorkerRequest =
  | { type: "run"; code: string }
  | { type: "reset" };

type WorkerResponse =
  | { type: "ready" }
  | { type: "stdout"; text: string }
  | { type: "stderr"; text: string }
  | { type: "done" }
  | { type: "error"; message: string; traceback?: string };

// ─── Worker State ─────────────────────────────────────────────────────────────

let pyodide: Awaited<ReturnType<typeof loadPyodide>> | null = null;

function post(msg: WorkerResponse) {
  self.postMessage(msg);
}

// ─── Initialization ───────────────────────────────────────────────────────────

async function init() {
  try {
    pyodide = await loadPyodide({
      // Redirect stdout/stderr to worker messages
      stdout: (text: string) => post({ type: "stdout", text }),
      stderr: (text: string) => post({ type: "stderr", text }),
    });
    post({ type: "ready" });
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    post({ type: "error", message: `Failed to load Pyodide: ${error.message}` });
  }
}

// ─── Code Execution ───────────────────────────────────────────────────────────

async function runCode(code: string) {
  if (!pyodide) {
    post({ type: "error", message: "Pyodide is not initialised yet." });
    return;
  }

  try {
    await pyodide.runPythonAsync(code);
    post({ type: "done" });
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    // Extract Python traceback from Pyodide errors
    const traceback =
      typeof (err as { message?: string }).message === "string"
        ? (err as { message: string }).message
        : error.toString();
    post({ type: "error", message: error.message, traceback });
  }
}

// ─── Message Handler ──────────────────────────────────────────────────────────

self.addEventListener("message", (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data;
  if (msg.type === "run") {
    runCode(msg.code);
  }
  // "reset" is handled by the main thread (it recreates the Worker)
});

// Start loading Pyodide immediately when Worker is created
init();
