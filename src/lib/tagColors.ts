/**
 * src/lib/tagColors.ts
 *
 * Deterministic tag color utility.
 * Given a tag name, always returns the same accessible hex color
 * from the 12-color TAG_PALETTE using a hash function.
 */

/** 12 accessible hex colors for tag colorization (WCAG AA on dark bg) */
export const TAG_PALETTE = [
  "#7c3aed", // violet
  "#2563eb", // blue
  "#0d9488", // teal
  "#16a34a", // green
  "#ca8a04", // yellow
  "#ea580c", // orange
  "#dc2626", // red
  "#db2777", // pink
  "#9333ea", // purple
  "#0284c7", // sky
  "#059669", // emerald
  "#b45309", // amber
] as const;

/**
 * Compute a stable integer hash for a string (djb2 variant).
 * Returns a non-negative integer suitable for modulo operations.
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Returns a deterministic hex color for a tag name.
 * The same name always maps to the same color.
 *
 * @param name - Tag name (e.g., "vulnerability-research")
 * @returns Hex color string (e.g., "#7c3aed")
 */
export function getTagColor(name: string): string {
  return TAG_PALETTE[hashCode(name) % TAG_PALETTE.length];
}
