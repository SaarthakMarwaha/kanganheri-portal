"use client";

import { useEffect } from "react";

/**
 * Global error boundary — catches errors in the root layout.
 * Sentry integration captures unhandled errors.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report to Sentry in production
    if (process.env.NODE_ENV === "production") {
      // Dynamic import to avoid bundle size impact
      import("@sentry/nextjs")
        .then(({ captureException }) => {
          captureException(error);
        })
        .catch(() => {
          // Sentry unavailable — fail silently
        });
    }
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="hi" dir="ltr">
      <body className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md text-center">
          <div className="mb-6 text-6xl" role="img" aria-label="Error">
            ⚠️
          </div>
          <h1 className="mb-2 text-2xl font-bold text-foreground">
            कुछ गलत हो गया / Something went wrong
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">
            An unexpected error occurred. Our team has been notified.
            <br />
            एक अप्रत्याशित त्रुटि उत्पन्न हुई।
          </p>
          {error.digest && (
            <p className="mb-4 font-mono text-xs text-muted-foreground">Error ID: {error.digest}</p>
          )}
          <button
            onClick={reset}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Try Again / पुनः प्रयास करें
          </button>
        </div>
      </body>
    </html>
  );
}
