import { Link } from "@/i18n/routing";

/**
 * Locale-aware 404 page.
 * next-intl locale is inferred from the URL segment.
 */
export default function NotFoundPage() {
  // Note: In Next.js App Router, not-found.tsx does not receive params.
  // Locale is handled by the parent [locale] layout via middleware.
  // We render bilingual content as a safe fallback.
  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-col items-center justify-center bg-background p-8 text-center"
    >
      <div className="mb-6 text-8xl font-black text-primary/20">404</div>
      <h1 className="mb-3 text-3xl font-bold text-foreground">पृष्ठ नहीं मिला / Page Not Found</h1>
      <p className="mb-8 max-w-md text-muted-foreground">
        आप जिस पृष्ठ की तलाश कर रहे हैं वह मौजूद नहीं है।
        <br />
        The page you&apos;re looking for doesn&apos;t exist or has been removed.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        होम पर जाएँ / Go to Home
      </Link>
    </main>
  );
}
