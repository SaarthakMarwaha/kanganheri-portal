"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Link } from "@/i18n/routing";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useLocale();

  useEffect(() => {
    // Report to Sentry if in production
    if (process.env.NODE_ENV === "production") {
      import("@sentry/nextjs")
        .then(({ captureException }) => {
          captureException(error);
        })
        .catch(() => {});
    }
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="container mx-auto max-w-screen-md px-4 py-16 text-center sm:py-24">
      <div className="card-base border-danger-red/20 p-8 sm:p-12">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-danger-red/10 text-danger-red">
          <AlertTriangle className="h-8 w-8" aria-hidden="true" />
        </div>

        <h1 className="mb-3 text-2xl font-black text-foreground sm:text-3xl">
          {locale === "hi"
            ? "कुछ अप्रत्याशित समस्या उत्पन्न हुई"
            : "Something Went Unexpectedly Wrong"}
        </h1>

        <p className="mx-auto mb-6 max-w-prose text-sm text-muted-foreground sm:text-base">
          {locale === "hi"
            ? "अनुरोध को संसाधित करते समय एक तकनीकी समस्या आई है। यदि आप कमजोर मोबाइल नेटवर्क पर हैं, तो पुनः प्रयास करें।"
            : "A technical error occurred while processing this request. If you are on an unstable cellular connection, please retry."}
        </p>

        {error.digest && (
          <p className="mb-6 inline-block rounded bg-muted px-3 py-1.5 font-mono text-xs text-muted-foreground/80">
            Digest: {error.digest}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button onClick={() => reset()} className="btn-primary inline-flex items-center gap-2">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>{locale === "hi" ? "पुनः प्रयास करें" : "Try Again"}</span>
          </button>

          <Link href="/" className="btn-secondary inline-flex items-center gap-2">
            <Home className="h-4 w-4" aria-hidden="true" />
            <span>{locale === "hi" ? "मुख्य पृष्ठ पर जाएं" : "Go to Home"}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
