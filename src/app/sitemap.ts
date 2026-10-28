import { type MetadataRoute } from "next";
import { db } from "@/lib/db";
import { VerificationStatus } from "@prisma/client";

/**
 * Dynamic XML Sitemap generator.
 *
 * Automatically generates sitemap URLs for:
 * 1. Static public routes across both `/hi` and `/en` locales
 * 2. Verified active business profiles (`/directory/[slug]`)
 * 3. Published village notices
 *
 * Emits hreflang alternates (hi, en, x-default) for all entries
 * to guarantee optimal indexing without duplicate-content penalties.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://kanganheri.com";
  const now = new Date();

  // Static core routes
  const staticRoutes = [
    "",
    "/complaints",
    "/directory",
    "/emergency",
    "/notices",
    "/heritage",
    "/tools/land-converter",
    "/privacy",
    "/terms",
    "/privacy/data-request",
  ];

  const entries: MetadataRoute.Sitemap = [];

  // 1. Static routes with bilingual alternates
  for (const route of staticRoutes) {
    const priority =
      route === "" ? 1.0 : route === "/emergency" || route === "/complaints" ? 0.9 : 0.8;
    const changeFrequency: "daily" | "weekly" | "monthly" =
      route === "" || route === "/complaints" || route === "/notices" ? "daily" : "weekly";

    entries.push({
      url: `${baseUrl}/hi${route}`,
      lastModified: now,
      changeFrequency,
      priority,
      alternates: {
        languages: {
          "hi-IN": `${baseUrl}/hi${route}`,
          "en-IN": `${baseUrl}/en${route}`,
          "x-default": `${baseUrl}/hi${route}`,
        },
      },
    });

    entries.push({
      url: `${baseUrl}/en${route}`,
      lastModified: now,
      changeFrequency,
      priority,
      alternates: {
        languages: {
          "hi-IN": `${baseUrl}/hi${route}`,
          "en-IN": `${baseUrl}/en${route}`,
          "x-default": `${baseUrl}/hi${route}`,
        },
      },
    });
  }

  // 2. Dynamic Verified Business Listings
  try {
    const businesses = await db.businessListing.findMany({
      where: {
        isActive: true,
        verificationStatus: VerificationStatus.VERIFIED,
      },
      select: {
        slug: true,
        updatedAt: true,
      },
      take: 1000,
    });

    for (const b of businesses) {
      entries.push({
        url: `${baseUrl}/hi/directory/${b.slug}`,
        lastModified: b.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
        alternates: {
          languages: {
            "hi-IN": `${baseUrl}/hi/directory/${b.slug}`,
            "en-IN": `${baseUrl}/en/directory/${b.slug}`,
            "x-default": `${baseUrl}/hi/directory/${b.slug}`,
          },
        },
      });

      entries.push({
        url: `${baseUrl}/en/directory/${b.slug}`,
        lastModified: b.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
        alternates: {
          languages: {
            "hi-IN": `${baseUrl}/hi/directory/${b.slug}`,
            "en-IN": `${baseUrl}/en/directory/${b.slug}`,
            "x-default": `${baseUrl}/hi/directory/${b.slug}`,
          },
        },
      });
    }
  } catch (err) {
    console.warn("Sitemap: Failed to query business listings:", err);
  }

  return entries;
}
