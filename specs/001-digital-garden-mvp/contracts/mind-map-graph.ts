/**
 * contracts/mind-map-graph.ts
 *
 * TypeScript contract for the mind map graph data structure.
 * This JSON is serialized by index.astro at build time and consumed by the
 * D3.js island (MindMap.astro → client:only) at runtime.
 *
 * IMPORTANT: Changes to this interface require a corresponding update to:
 *   1. src/pages/index.astro (graph builder)
 *   2. src/components/MindMap.astro (graph consumer)
 */

// ─── Node ─────────────────────────────────────────────────────────────────────

export interface MindMapNode {
  /** Page slug — unique identifier. Used as D3 node id. */
  id: string;

  /** Page title — displayed as node label. */
  label: string;

  /** URL path (e.g., "/writing/cve-2024-example"). Used for navigation on click. */
  url: string;

  /** ISO date string. Displayed in preview card. */
  date: string;

  /** Short description text. Displayed in preview card. */
  description: string;

  /** All tags (ordered; first is primary). */
  tags: string[];

  /** First tag — determines node fill color from TAG_COLOR_PALETTE. */
  primaryTag: string;

  /**
   * Page type — determines node shape:
   * - "writeup"     → circle
   * - "interactive" → diamond (rotated square)
   * - "note"        → hexagon
   */
  pageType: "writeup" | "interactive" | "note";

  // D3 simulation will add x, y, vx, vy at runtime — not serialized
}

// ─── Link ─────────────────────────────────────────────────────────────────────

export interface MindMapLink {
  /** Source node id (slug) */
  source: string;

  /** Target node id (slug) */
  target: string;

  /** Tags shared by both nodes. Drives edge label and tooltip. */
  sharedTags: string[];

  /**
   * D3 link force strength multiplier.
   * Equals sharedTags.length (more shared tags → stronger attraction).
   * Range: 1–N.
   */
  strength: number;
}

// ─── Graph ────────────────────────────────────────────────────────────────────

export interface MindMapGraph {
  nodes: MindMapNode[];
  links: MindMapLink[];

  /** All unique tags derived from nodes, with deterministic color assignments. */
  tags: TagMeta[];
}

export interface TagMeta {
  name: string;
  slug: string;
  /** Hex color string (e.g., "#7c3aed") derived deterministically from tag name. */
  color: string;
  pageCount: number;
}

// ─── D3 Runtime Extensions (not serialized) ───────────────────────────────────

/** D3 simulation augments nodes with positional state at runtime. */
export interface SimulatedNode extends MindMapNode {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}
