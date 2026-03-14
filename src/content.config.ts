/**
 * src/content.config.ts
 *
 * Astro 6 Content Layer API — Content Collection schema for all garden pages.
 * Derived from: specs/001-digital-garden-mvp/contracts/page-schema.ts
 */

import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// ─── Shared ───────────────────────────────────────────────────────────────────

const PageTypeEnum = z.enum(["writeup", "interactive", "note"]);

const CvssSeverityEnum = z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW", "NONE"]);

// ─── Base Page Schema ─────────────────────────────────────────────────────────

const basePageSchema = z.object({
  /** Human-readable title. Max 80 chars. Used in <title>, OG, mind map label. */
  title: z.string().max(80),

  /** Publication date (ISO 8601). Must not be in the future. */
  date: z.coerce.date(),

  /** One-paragraph summary. Max 160 chars. Used in meta description and OG. */
  description: z.string().max(160),

  /**
   * Page presentation type.
   * - "writeup"     → WriteupLayout (CVE reports, essays)
   * - "interactive" → InteractiveLayout (code editors, canvases)
   * - "note"        → NoteLayout (short-form, links, quick thoughts)
   */
  pageType: PageTypeEnum,

  /**
   * Ordered list of tags. First tag is the "primary" tag and drives:
   * - mind map node color
   * - edge grouping priority when a node has many connections
   * At least one tag is required.
   */
  tags: z.array(z.string().min(1)).min(1),

  /** If true, page is excluded from build output and mind map. Default: false. */
  draft: z.boolean().default(false),

  /**
   * If true, the interactive layout allows vertical scrolling instead of
   * locking to 100vh. Use for content-heavy pages like calculators.
   */
  scrollable: z.boolean().default(false),

  /** Relative path to OG image. Falls back to site default when omitted. */
  ogImage: z.string().optional(),

  /**
   * Override canonical URL. Only needed when content is cross-posted.
   * Defaults to the page's own URL.
   */
  canonical: z.string().url().optional(),
});

// ─── CVE Write-Up Extension ───────────────────────────────────────────────────

const cveExtension = z.object({
  /** CVE identifier. Must match CVE-YYYY-NNNNN format. */
  cveId: z
    .string()
    .regex(/^CVE-\d{4}-\d{4,}$/, "Must match CVE-YYYY-NNNNN format")
    .optional(),

  /** CVSS v3.1 base score. Required when cveId is set. */
  cvssScore: z.number().min(0).max(10).optional(),

  /** CVSS severity label. Must align with cvssScore range. Required when cveId is set. */
  cvssSeverity: CvssSeverityEnum.optional(),

  /** Affected software version strings. Required when cveId is set. */
  affectedVersions: z.array(z.string()).optional(),

  /** Public disclosure date. Required when cveId is set. */
  disclosureDate: z.coerce.date().optional(),

  /** Date a patch became available. Optional even when cveId is set. */
  patchDate: z.coerce.date().optional(),

  /** Affected vendor / project name. Required when cveId is set. */
  vendor: z.string().optional(),
});

// ─── Combined Schema with Cross-Field Validation ──────────────────────────────

export const gardenPageSchema = basePageSchema.merge(cveExtension).superRefine(
  (data, ctx) => {
    if (data.cveId) {
      const required = [
        "cvssScore",
        "cvssSeverity",
        "affectedVersions",
        "disclosureDate",
        "vendor",
      ] as const;
      for (const field of required) {
        if (data[field] === undefined) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field],
            message: `${String(field)} is required when cveId is set`,
          });
        }
      }
    }
  }
);

// ─── Content Collection Definition ───────────────────────────────────────────

export const collections = {
  /** All garden content lives in src/content/garden/ */
  garden: defineCollection({
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/garden" }),
    schema: gardenPageSchema,
  }),
};

// ─── Exported Types ───────────────────────────────────────────────────────────

export type GardenPage = z.infer<typeof gardenPageSchema>;
export type PageType = z.infer<typeof PageTypeEnum>;
export type CvssSeverity = z.infer<typeof CvssSeverityEnum>;
