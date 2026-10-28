import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Devanagari } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { headers } from "next/headers";
import { Toaster } from "sonner";
import { EmergencyBar } from "@/components/layout/emergency-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { JsonLd } from "@/components/seo/json-ld";

import "@/app/globals.css";

// ──────────────────────────────────────────────────────────────
// FONT LOADING
// ──────────────────────────────────────────────────────────────

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  preload: true,
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  display: "swap",
  variable: "--font-noto-devanagari",
  weight: ["400", "500", "600", "700"],
  preload: true,
  fallback: ["sans-serif"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f97316" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1208" },
  ],
  colorScheme: "light dark",
};

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "site" });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://kanganheri.com";

  return {
    title: {
      default: t("name"),
      template: `%s | ${t("name")}`,
    },
    description: t("description"),
    keywords: [
      "Kanganheri",
      "कांगनहेड़ी",
      "Village Kanganheri",
      "Najafgarh",
      "South West Delhi",
      "110071",
      "Civic Portal",
      "Gram Panchayat",
      "Mandi Bhav",
      "Shikayat",
      "Village News",
      "RTRM Hospital",
      "Chhawla Police Station",
    ],
    authors: [{ name: "Kanganheri Darpan" }],
    creator: "Kanganheri Darpan",
    publisher: "Kanganheri Darpan",
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        "hi-IN": `${baseUrl}/hi`,
        "en-IN": `${baseUrl}/en`,
        "x-default": `${baseUrl}/hi`,
      },
    },
    openGraph: {
      type: "website",
      locale: locale === "hi" ? "hi_IN" : "en_IN",
      alternateLocale: locale === "hi" ? "en_IN" : "hi_IN",
      url: `${baseUrl}/${locale}`,
      siteName: t("name"),
      title: `${t("name")} — ${t("tagline")}`,
      description: t("description"),
      images: [
        {
          url: `${baseUrl}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: `${t("name")} — ${t("tagline")}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${t("name")} — ${t("tagline")}`,
      description: t("description"),
      images: [`${baseUrl}/og-image.jpg`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    icons: {
      icon: [
        { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
        { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
        { url: "/icons/favicon-192.png", sizes: "192x192", type: "image/png" },
      ],
      apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
    },
    manifest: "/manifest.json",
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages({ locale });
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") ?? "";

  const isHindi = locale === "hi";

  // Village Kanganheri Schema.org Place / AdministrativeArea
  const kanganheriSchema = {
    type: "AdministrativeArea" as const,
    name: "Village Kanganheri",
    alternateName: "कांगनहेड़ी",
    description:
      "Historic village in Najafgarh Tehsil, South West Delhi (PIN 110071), served by MCD Najafgarh Zone, Chhawla Police Station, and Rao Tula Ram Memorial Hospital.",
    postalCode: "110071",
    latitude: 28.5468,
    longitude: 76.9883,
    containedInPlace: "Najafgarh Tehsil, South West Delhi, NCT of Delhi",
  };

  return (
    <html
      lang={locale}
      dir="ltr"
      className={`${inter.variable} ${notoSansDevanagari.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="csp-nonce" content={nonce} />
        {/* Inject Schema.org Place / AdministrativeArea JSON-LD */}
        <JsonLd data={kanganheriSchema} />
      </head>
      <body
        className={`flex min-h-screen flex-col ${
          isHindi ? "font-devanagari antialiased leading-devanagari" : "font-sans antialiased"
        }`}
      >
        {/* ── Skip to main content (WCAG 2.1 AA) ───────────── */}
        <a href="#main-content" className="skip-to-content">
          {isHindi ? "मुख्य सामग्री पर जाएँ" : "Skip to main content"}
        </a>

        {/* ── next-intl Provider ────────────────────────────── */}
        <NextIntlClientProvider messages={messages} locale={locale}>
          {/* Top Emergency Lifeline Banner */}
          <EmergencyBar />

          {/* Main Navigation Header */}
          <Header />

          {/* Content landmark */}
          <div className="flex-1" id="main-content" tabIndex={-1}>
            {children}
          </div>

          {/* Civic & Compliance Footer */}
          <Footer />

          {/* Global toast notifications */}
          <Toaster
            position="bottom-right"
            richColors
            closeButton
            duration={5000}
            toastOptions={{
              classNames: {
                toast: "font-sans text-sm",
                error: "bg-danger-red text-white",
                success: "bg-civic-green text-white",
              },
            }}
          />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
