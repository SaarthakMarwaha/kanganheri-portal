import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { PageProps } from "@/types";
import { Scale } from "lucide-react";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "terms" });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://kanganheri.com";

  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
    alternates: {
      canonical: `${baseUrl}/${locale}/terms`,
      languages: {
        "hi-IN": `${baseUrl}/hi/terms`,
        "en-IN": `${baseUrl}/en/terms`,
        "x-default": `${baseUrl}/hi/terms`,
      },
    },
  };
}

export default async function TermsPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "terms" });

  return (
    <div className="container mx-auto max-w-screen-lg px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 border-b border-border/80 pb-6">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          <Scale className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Civic Utility Terms</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
          {t("pageTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("pageDescription")}</p>
      </div>

      <div className="prose-content card-base space-y-6 p-6 text-sm leading-relaxed text-foreground/90 sm:p-10 sm:text-base">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">
            {locale === "hi" ? "1. पोर्टल का उद्देश्य (Purpose)" : "1. Purpose of Portal"}
          </h2>
          <p>
            {locale === "hi"
              ? "कांगनहेड़ी दर्पण (kanganheri.com) गाँव कांगनहेड़ी (दक्षिण पश्चिम दिल्ली) के निवासियों के लिए एक स्वतंत्र नागरिक उपयोगिता और सूचना मंच है। इसका उद्देश्य नागरिक शिकायतों का पारदर्शी दस्तावेजीकरण, आपातकालीन संपर्क सुविधा और स्थानीय व्यापार को बढ़ावा देना है।"
              : "Kanganheri Darpan (kanganheri.com) is an open civic utility and information portal serving residents of Village Kanganheri, South West Delhi. It facilitates transparent civic grievance tracking, offline emergency lifelines, and local trade connectivity."}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">
            {locale === "hi"
              ? "2. सत्य एवं मर्यादित रिपोर्टिंग (Authentic Reporting)"
              : "2. Truthful & Respectful Use"}
          </h2>
          <p>
            {locale === "hi"
              ? "उपयोगकर्ताओं से अनुरोध है कि वे केवल वास्तविक नागरिक समस्याओं (जलभराव, गड्ढे, स्ट्रीट लाइट, कूड़ा आदि) की रिपोर्ट करें। किसी भी प्रकार की भ्रामक, व्यक्तिगत विद्वेषपूर्ण या अभद्र सामग्री को तुरंत अस्वीकार और मॉडरेट किया जाएगा।"
              : "Residents must submit genuine civic concerns (waterlogging, potholes, broken lights, sanitation). Submitting defamatory, abusive, or intentionally fabricated content is strictly prohibited and subject to immediate moderation."}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">
            {locale === "hi" ? "3. अस्वीकरण (Disclaimer)" : "3. Disclaimer"}
          </h2>
          <p>
            {locale === "hi"
              ? "कांगनहेड़ी दर्पण एक नागरिक सहायता सेतु है। समस्याओं के अंतिम भौतिक समाधान की जिम्मेदारी संबंधित सरकारी विभागों (MCD, BSES, DJB) की है।"
              : "Kanganheri Darpan operates as a civic transparency facilitation bridge. Physical resolution and civic enforcement rest with respective statutory authorities (MCD, BSES, DJB)."}
          </p>
        </section>
      </div>
    </div>
  );
}
