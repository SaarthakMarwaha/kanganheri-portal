import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { Link } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/seo/json-ld";
import { Phone, MessageCircle, MapPin, CheckCircle, ArrowLeft } from "lucide-react";

interface BusinessProfileProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: BusinessProfileProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://kanganheri.com";

  const listing = await db.businessListing.findUnique({
    where: { slug },
    select: { nameEn: true, nameHi: true, descriptionEn: true, descriptionHi: true },
  });

  if (!listing) return { title: "Listing Not Found" };

  const name = locale === "hi" ? listing.nameHi : listing.nameEn;
  const desc = locale === "hi" ? listing.descriptionHi : listing.descriptionEn;

  return {
    title: `${name} — Verified Business in Kanganheri (110071)`,
    description:
      desc || `Contact information and verified listing for ${name} in Village Kanganheri.`,
    alternates: {
      canonical: `${baseUrl}/${locale}/directory/${slug}`,
      languages: {
        "hi-IN": `${baseUrl}/hi/directory/${slug}`,
        "en-IN": `${baseUrl}/en/directory/${slug}`,
        "x-default": `${baseUrl}/hi/directory/${slug}`,
      },
    },
  };
}

export default async function BusinessProfilePage({ params }: BusinessProfileProps) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "directory" });

  let listing = null;
  try {
    listing = await db.businessListing.findUnique({
      where: { slug },
    });
  } catch (err) {
    console.warn(`Notice: Failed to query business with slug ${slug}:`, err);
  }

  if (!listing || !listing.isActive) {
    notFound();
  }

  const name = locale === "hi" ? listing.nameHi : listing.nameEn;
  const address = locale === "hi" ? listing.addressHi : listing.addressEn;
  const desc =
    locale === "hi" ? listing.descriptionHi : listing.descriptionEn || listing.descriptionHi;
  const cleanPhone = listing.phone.replace(/[^0-9]/g, "");

  const localBusinessSchema = {
    type: "LocalBusiness" as const,
    name,
    description: desc || undefined,
    telephone: listing.phone,
    image: listing.photoPublicUrl || undefined,
    address: {
      streetAddress: address || "Village Kanganheri",
      addressLocality: "Kanganheri, Najafgarh",
      postalCode: "110071",
      addressCountry: "IN",
    },
  };

  const breadcrumbs = {
    type: "BreadcrumbList" as const,
    itemListElement: [
      { position: 1, name: "Home", item: `/${locale}` },
      { position: 2, name: "Directory", item: `/${locale}/directory` },
      { position: 3, name, item: `/${locale}/directory/${slug}` },
    ],
  };

  return (
    <div className="container mx-auto max-w-screen-xl px-4 py-8 sm:px-6 sm:py-12">
      <JsonLd data={localBusinessSchema} />
      <JsonLd data={breadcrumbs} />

      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/directory"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>{locale === "hi" ? "व्यापार सूची पर वापस जाएँ" : "Back to Directory"}</span>
        </Link>
      </div>

      <div className="card-base mx-auto max-w-3xl space-y-8 p-6 sm:p-10">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 pb-6">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-foreground">
                {t(`categories.${listing.category}`)}
              </span>
              <Badge variant="success" className="gap-1 px-3 py-1 text-xs">
                <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t("verifiedBadge")}</span>
              </Badge>
            </div>
            <h1 className="text-2xl font-black text-foreground sm:text-3xl">{name}</h1>
          </div>
        </div>

        {/* Location & Details */}
        <div className="space-y-4 text-sm">
          {address && (
            <div className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>{address}</span>
            </div>
          )}

          {listing.streetTag && (
            <div className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Gali/Street:</span>{" "}
              {listing.streetTag}
            </div>
          )}

          {desc && (
            <div className="pt-2">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {locale === "hi" ? "विवरण" : "About this Service"}
              </h3>
              <p className="rounded-md border border-border/60 bg-muted/20 p-4 text-sm leading-relaxed text-foreground">
                {desc}
              </p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col items-center gap-3 border-t border-border pt-6 sm:flex-row">
          <a
            href={`tel:${cleanPhone}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary-700 sm:flex-1"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            <span>
              {t("call")}: {listing.phone}
            </span>
          </a>

          <a
            href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
              locale === "hi"
                ? `नमस्ते ${name}, मैंने कांगनहेड़ी दर्पण पोर्टल पर आपकी लिस्टिंग देखी है।`
                : `Hello ${name}, I found your listing on Kanganheri Darpan.`,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 sm:flex-1"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            <span>{t("whatsapp")}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
