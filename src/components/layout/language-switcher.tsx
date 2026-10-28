"use client";

import React, { useTransition } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Languages } from "lucide-react";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const nextLocale = locale === "hi" ? "en" : "hi";
  const label = locale === "hi" ? "English" : "हिंदी";

  const handleToggle = () => {
    startTransition(() => {
      // Robust locale replacement on current path
      const segments = pathname.split("/");
      if (segments.length > 1 && (segments[1] === "hi" || segments[1] === "en")) {
        segments[1] = nextLocale;
      } else {
        segments.splice(1, 0, nextLocale);
      }
      const newPath = segments.join("/") || `/${nextLocale}`;
      router.replace(newPath);
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-all duration-150 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:opacity-50"
      aria-label={`Switch language to ${nextLocale === "hi" ? "Hindi" : "English"}`}
      title={`Switch language to ${nextLocale === "hi" ? "Hindi" : "English"}`}
    >
      <Languages className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}
