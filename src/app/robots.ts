import type { MetadataRoute } from "next";

/**
 * robots.ts — dynamically generated robots.txt
 *
 * Allows all crawlers on public content.
 * Explicitly disallows admin, API, and private routes.
 * Points crawlers to the sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://kanganheri.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/hi/", "/en/"],
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/private/",
          // Prevent indexing of draft/hidden locale variants
          "/_next/",
        ],
      },
      // Block AI scrapers from training on village residents' content
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "Google-Extended",
          "CCBot",
          "anthropic-ai",
          "ClaudeBot",
          "Omgilibot",
          "FacebookBot",
        ],
        disallow: ["/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
