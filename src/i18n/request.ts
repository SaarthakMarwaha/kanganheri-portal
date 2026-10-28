import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

/**
 * next-intl server request configuration.
 * Loads the correct message dictionary based on the active locale.
 * Falls back to Hindi (hi) as the default locale if none is detected.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  // Resolve the locale from the request
  let locale = await requestLocale;

  // Validate against supported locales; fall back to default
  if (!locale || !routing.locales.includes(locale as "en" | "hi")) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
