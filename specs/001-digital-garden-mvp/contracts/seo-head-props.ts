/**
 * contracts/seo-head-props.ts
 *
 * Props interface for the shared SEOHead.astro component.
 * Every layout must pass these props to SEOHead to ensure all pages
 * pass the FR-015 SEO gate.
 */

export interface SEOHeadProps {
  /**
   * Page title. Will be formatted as "{title} | Alfred Gamulo" on most pages,
   * or left as-is for the home page.
   */
  title: string;

  /**
   * Meta description. Max 160 chars.
   * Used in <meta name="description"> and og:description.
   */
  description: string;

  /**
   * Canonical URL (absolute). Used in <link rel="canonical"> and og:url.
   * Example: "https://alfredgamulo.com/writing/cve-2024-example"
   */
  canonical: string;

  /** Open Graph image URL. Falls back to site-default OG image when omitted. */
  ogImage?: string;

  /**
   * JSON-LD structured data object. Passed as-is into a <script type="application/ld+json">.
   * Layouts that need JSON-LD (e.g., WriteupLayout) build this object and pass it here.
   * Omit on pages that don't need structured data (e.g., home, editor).
   */
  jsonLd?: Record<string, unknown>;

  /**
   * If true, robots noindex is added. Use for draft preview URLs.
   * Default: false.
   */
  noindex?: boolean;
}
