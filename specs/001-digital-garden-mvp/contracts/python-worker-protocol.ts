/**
 * contracts/python-worker-protocol.ts
 *
 * Message protocol between the main thread (PythonEditor component) and the
 * Pyodide Web Worker (src/workers/pyodide.worker.ts).
 *
 * Follows a request/response pattern with discriminated unions.
 */

// ─── Main → Worker ────────────────────────────────────────────────────────────

export type WorkerRequest =
  | { type: "run"; code: string }
  | { type: "reset" };

// ─── Worker → Main ────────────────────────────────────────────────────────────

export type WorkerResponse =
  | { type: "ready" }
  | { type: "stdout"; text: string }
  | { type: "stderr"; text: string }
  | { type: "done" }
  | { type: "error"; message: string; traceback?: string };

// ─── Runtime State (main thread) ──────────────────────────────────────────────

export type PyodideRuntimeState = "loading" | "ready" | "running" | "error";
