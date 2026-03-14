/**
 * src/lib/buildGraph.ts
 *
 * Build-time utility that constructs a MindMapGraph from Astro Content
 * Collection entries. Called by src/pages/index.astro at build time.
 *
 * Based on contract: specs/001-digital-garden-mvp/contracts/mind-map-graph.ts
 */

import type { CollectionEntry } from "astro:content";
import { getTagColor } from "./tagColors";

// ─── Types (mirrors contracts/mind-map-graph.ts) ─────────────────────────────

export interface MindMapNode {
  id: string;
  label: string;
  url: string;
  date: string;
  description: string;
  tags: string[];
  primaryTag: string;
  pageType: "writeup" | "interactive" | "note" | "tag";
}

export interface MindMapLink {
  source: string;
  target: string;
  sharedTags: string[];
  strength: number;
}

export interface TagMeta {
  name: string;
  slug: string;
  color: string;
  pageCount: number;
}

export interface MindMapGraph {
  nodes: MindMapNode[];
  links: MindMapLink[];
  tags: TagMeta[];
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

/**
 * Determine the URL path for a collection entry based on its slug and pageType.
 */
function getEntryUrl(entry: CollectionEntry<"garden">): string {
  const { pageType } = entry.data;
  // In Astro 6 Content Layer, entry.id is the path relative to the base without
  // extension, e.g. "writing/cve-2024-example" or "playground/python-editor".
  // Extract the leaf segment as the URL slug.
  const parts = entry.id.split("/");
  const leafSlug = parts[parts.length - 1];
  if (pageType === "writeup") {
    return `/writing/${leafSlug}`;
  } else if (pageType === "interactive") {
    return `/playground/${leafSlug}`;
  } else {
    return `/notes/${leafSlug}`;
  }
}

// ─── Main Builder ─────────────────────────────────────────────────────────────

/**
 * Builds a MindMapGraph from all non-draft garden content entries.
 * Links are created between nodes that share at least one tag.
 * Link strength equals the number of shared tags.
 */
export function buildMindMapGraph(
  entries: CollectionEntry<"garden">[]
): MindMapGraph {
  // Filter out drafts
  const published = entries.filter((e) => !e.data.draft);

  // Build nodes
  const nodes: MindMapNode[] = published.map((entry) => {
    // In Astro 6, entry.id from the glob loader has no extension, e.g. "writing/cve-2024-example"
    const parts = entry.id.split("/");
    const leafSlug = parts[parts.length - 1];

    return {
      id: leafSlug,
      label: entry.data.title,
      url: getEntryUrl(entry),
      date: entry.data.date.toISOString(),
      description: entry.data.description,
      tags: entry.data.tags,
      primaryTag: entry.data.tags[0],
      pageType: entry.data.pageType,
    };
  });

  // Build links between nodes that share at least one tag
  const links: MindMapLink[] = [];

  // Collect all unique tags across published content
  const tagMap = new Map<string, number>();
  for (const node of nodes) {
    for (const tag of node.tags) {
      tagMap.set(tag, (tagMap.get(tag) ?? 0) + 1);
    }
  }

  // Create a hub node for each tag
  const tagNodes: MindMapNode[] = Array.from(tagMap.keys()).map((name) => ({
    id: `tag-${slugify(name)}`,
    label: name,
    url: "",
    date: new Date(0).toISOString(),
    description: `Tag: ${name}`,
    tags: [name],
    primaryTag: name,
    pageType: "tag" as const,
  }));

  // Links: tag hub → each content post that carries that tag
  for (const node of nodes) {
    for (const tag of node.tags) {
      links.push({
        source: `tag-${slugify(tag)}`,
        target: node.id,
        sharedTags: [tag],
        strength: 1,
      });
    }
  }

  const allNodes: MindMapNode[] = [...tagNodes, ...nodes];

  const tags: TagMeta[] = Array.from(tagMap.entries()).map(([name, pageCount]) => ({
    name,
    slug: slugify(name),
    color: getTagColor(name),
    pageCount,
  }));

  return { nodes: allNodes, links, tags };
}
