import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

/**
 * Defines the locale routing configuration for the portal.
 *
 * - Supported locales: Hindi (hi) and English (en)
 * - Default locale: Hindi (hi) — the primary language of Village Kanganheri residents
 * - URL strategy: /hi/... for Hindi, /en/... for English
 *   (locale prefix is always shown to avoid ambiguous canonical URLs)
 */
export const routing = defineRouting({
  locales: ["hi", "en"] as const,
  defaultLocale: "hi",
  // Always prefix locale in the URL for canonical clarity
  localePrefix: "always",
  // Pathnames can be localized in the future (e.g., /shikayat vs /complaints)
  pathnames: {
    "/": "/",
    "/complaints": {
      hi: "/shikayat",
      en: "/complaints",
    },
    "/complaints/[trackingId]": {
      hi: "/shikayat/[trackingId]",
      en: "/complaints/[trackingId]",
    },
    "/directory": {
      hi: "/vyapar-suchi",
      en: "/directory",
    },
    "/directory/[slug]": {
      hi: "/vyapar-suchi/[slug]",
      en: "/directory/[slug]",
    },
    "/emergency": {
      hi: "/aapatkaalin",
      en: "/emergency",
    },
    "/notices": {
      hi: "/suchna-phalak",
      en: "/notices",
    },
    "/heritage": {
      hi: "/virasat",
      en: "/heritage",
    },
    "/tools/land-converter": {
      hi: "/sadhhan/jamin-converter",
      en: "/tools/land-converter",
    },
    "/admin": "/admin",
    "/admin/complaints": "/admin/complaints",
    "/admin/directory": "/admin/directory",
    "/admin/notices": "/admin/notices",
    "/admin/audit-log": "/admin/audit-log",
    "/privacy": {
      hi: "/niji-niti",
      en: "/privacy",
    },
    "/terms": {
      hi: "/niyam-sharten",
      en: "/terms",
    },
    "/privacy/data-request": {
      hi: "/niji-niti/data-anurodh",
      en: "/privacy/data-request",
    },
  },
});

export type Locale = (typeof routing.locales)[number];

/**
 * Navigation utilities typed to the routing configuration.
 * Import Link, redirect, usePathname, useRouter from here
 * instead of next/navigation for locale-aware behavior.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
