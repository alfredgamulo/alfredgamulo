/**
 * src/workers/pyodide.worker.ts
 *
 * ESM Web Worker for running Python code via Pyodide.
 *
 * Pyodide is served from /pyodide/ (self-hosted via scripts/vendor-pyodide.sh)
 * so all assets come from our own origin. This eliminates the cross-origin
 * resource that triggered COEP violations on the Python editor page.
 * Update the version constant below when upgrading Pyodide.
 *
 * Implements:
 *  - T026: WorkerRequest / WorkerResponse protocol
 *  - T012b: Pyodide version lock
 */

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pyodide: any = null;

function post(msg: WorkerResponse) {
  self.postMessage(msg);
}

// ─── Initialization ───────────────────────────────────────────────────────────

async function init() {
  try {
    // Dynamic import keeps Vite from trying to bundle /pyodide/pyodide.mjs
    // (it lives in public/ and is only available at runtime).
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore — no .d.ts for self-hosted Pyodide ESM
    const { loadPyodide } = await import(/* @vite-ignore */ "/pyodide/pyodide.mjs");
    pyodide = await loadPyodide({
      // Tell Pyodide where to find its wasm/stdlib — must match vendor script path.
      indexURL: "/pyodide/",
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
