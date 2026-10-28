import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import type { PageProps } from "@/types";
import { TelemetrySection } from "@/components/telemetry/telemetry-section";
import { ComplaintTrackerWidget } from "@/components/complaints/complaint-tracker-widget";
import { DirectoryShowcase } from "@/components/directory/directory-showcase";
import { LandConverterWidget } from "@/components/tools/land-converter-widget";
import { NoticesTeaser } from "@/components/notices/notices-teaser";
import { HeritageTeaser } from "@/components/heritage/heritage-teaser";
import {
  FileCheck2,
  Store,
  PhoneCall,
  MapPin,
  ShieldCheck,
  Zap,
  Droplet,
  Hospital,
  ArrowRight,
} from "lucide-react";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "site" });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://kanganheri.com";

  return {
    title: `${t("name")} — ${t("tagline")}`,
    description: t("description"),
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        "hi-IN": `${baseUrl}/hi`,
        "en-IN": `${baseUrl}/en`,
        "x-default": `${baseUrl}/hi`,
      },
    },
  };
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "site" });

  const emergencyContacts = [
    {
      label: locale === "hi" ? "छावला पुलिस थाना" : "Chhawla Police Station",
      phone: "011-25303100",
      toll: "100",
      icon: ShieldCheck,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: locale === "hi" ? "राव तुला राम अस्पताल" : "RTRM Hospital (Jaffarpur)",
      phone: "011-25303000",
      toll: "102",
      icon: Hospital,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
    {
      label: locale === "hi" ? "BSES बिजली हेल्पलाइन" : "BSES Power Helpline",
      phone: "19123",
      toll: "1800-103-0808",
      icon: Zap,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      label: locale === "hi" ? "DJB पानी टैंकर / सप्लाई" : "DJB Water Tanker Helpline",
      phone: "1916",
      toll: "1800-111-212",
      icon: Droplet,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
    },
  ];

  return (
    <div className="flex flex-col gap-0">
      {/* ── 1. Hero Civic Banner ────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary-50/60 via-background to-background py-12 sm:py-16">
        {/* Subtle decorative background pattern */}
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(#f97316_1px,transparent_1px)] opacity-[0.03] [background-size:16px_16px]"
          aria-hidden="true"
        />

        <div className="container relative mx-auto max-w-screen-2xl px-4 text-center sm:px-6">
          {/* Civic Jurisdiction Pill */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary shadow-sm">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {locale === "hi"
                ? "गाँव कांगनहेड़ी (110071) • नजफगढ़ जोन • दक्षिण पश्चिम दिल्ली"
                : "Village Kanganheri (PIN 110071) • Najafgarh Zone • South West Delhi"}
            </span>
          </div>

          {/* Main Title */}
          <h1 className="mx-auto max-w-4xl text-3xl font-black leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {t("name")}
          </h1>

          {/* Subtitle / Tagline */}
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground sm:mt-4 sm:text-lg">
            {t("description")}
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:mt-8">
            <Link
              href="/complaints"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow transition-all hover:scale-[1.02] hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <FileCheck2 className="h-4 w-4" aria-hidden="true" />
              <span>
                {locale === "hi"
                  ? "नागरिक शिकायत दर्ज करें (बिना लॉगिन)"
                  : "File Civic Complaint (No Login)"}
              </span>
            </Link>

            <Link
              href="/directory"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-bold text-foreground shadow-sm transition-all hover:scale-[1.02] hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Store className="h-4 w-4 text-secondary" aria-hidden="true" />
              <span>
                {locale === "hi" ? "स्थानीय कारीगर एवं दुकानें" : "Verified Local Directory"}
              </span>
            </Link>

            <Link
              href="/emergency"
              className="inline-flex items-center gap-2 rounded-lg bg-danger-red px-6 py-3 text-sm font-bold text-white shadow transition-all hover:scale-[1.02] hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-red"
            >
              <PhoneCall className="h-4 w-4" aria-hidden="true" />
              <span>{locale === "hi" ? "आपातकालीन नंबर" : "Emergency Hub"}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 2. Live Telemetry Bar (Weather + Mandi Bhav) ───── */}
      <TelemetrySection />

      {/* ── 3. Quick Civic Utilities (Complaints + Converter) ── */}
      <section className="border-b border-border bg-card py-12">
        <div className="container mx-auto max-w-screen-2xl px-4 sm:px-6">
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
            {/* Complaint Tracker */}
            <ComplaintTrackerWidget />

            {/* North Indian Land Converter */}
            <LandConverterWidget />
          </div>
        </div>
      </section>

      {/* ── 4. Verified Directory Showcase ──────────────────── */}
      <DirectoryShowcase />

      {/* ── 5. Community Pulse (Notices & Heritage) ─────────── */}
      <section className="border-b border-border bg-muted/20 py-12">
        <div className="container mx-auto max-w-screen-2xl px-4 sm:px-6">
          <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-2">
            {/* Noticeboard */}
            <NoticesTeaser />

            {/* Heritage & Achievers Wall */}
            <HeritageTeaser />
          </div>
        </div>
      </section>

      {/* ── 6. Emergency Civic Hub Fast Cards ───────────────── */}
      <section className="bg-background py-12">
        <div className="container mx-auto max-w-screen-2xl px-4 sm:px-6">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                {locale === "hi"
                  ? "कांगनहेड़ी आपातकालीन एवं आवश्यक सेवाएँ"
                  : "Kanganheri Emergency & Utility Lifelines"}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {locale === "hi"
                  ? "इंटरनेट के बिना भी सीधे डायल करने योग्य महत्वपूर्ण हेल्पलाइन नंबर"
                  : "Essential offline-accessible helplines for Village Kanganheri"}
              </p>
            </div>

            <Link
              href="/emergency"
              className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-primary hover:underline"
            >
              <span>
                {locale === "hi"
                  ? "सभी आपातकालीन संपर्क देखें"
                  : "View Complete Emergency Directory"}
              </span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {emergencyContacts.map((contact, i) => {
              const Icon = contact.icon;
              return (
                <div
                  key={i}
                  className="card-base flex flex-col justify-between p-4 transition-colors hover:border-primary/50"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-lg ${contact.bg} ${contact.color} flex shrink-0 items-center justify-center`}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold leading-tight text-foreground">
                        {contact.label}
                      </h3>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        Toll-Free: {contact.toll}
                      </span>
                    </div>
                  </div>

                  <a
                    href={`tel:${contact.phone.replace(/[^0-9]/g, "")}`}
                    className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary-700"
                    aria-label={`Call ${contact.label} at ${contact.phone}`}
                  >
                    <PhoneCall className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{contact.phone}</span>
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
