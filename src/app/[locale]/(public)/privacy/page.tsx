import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import type { PageProps } from "@/types";
import { ShieldCheck, ArrowRight } from "lucide-react";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://kanganheri.com";

  return {
    title: `${t("pageTitle")} — DPDP Act 2023 Compliant`,
    description: t("pageDescription"),
    alternates: {
      canonical: `${baseUrl}/${locale}/privacy`,
      languages: {
        "hi-IN": `${baseUrl}/hi/privacy`,
        "en-IN": `${baseUrl}/en/privacy`,
        "x-default": `${baseUrl}/hi/privacy`,
      },
    },
  };
}

export default async function PrivacyPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });

  return (
    <div className="container mx-auto max-w-screen-lg px-4 py-8 sm:px-6 sm:py-12">
      {/* Header */}
      <div className="mb-8 border-b border-border/80 pb-6">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-civic-green/10 px-3 py-1 text-xs font-bold text-civic-green">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          <span>India DPDP Act 2023 Compliant</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
          {t("pageTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("pageDescription")}</p>
      </div>

      <div className="prose-content card-base space-y-8 p-6 text-sm leading-relaxed text-foreground/90 sm:p-10 sm:text-base">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            {locale === "hi"
              ? "1. डेटा न्यूनीकरण सिद्धांत (Data Minimization)"
              : "1. Principle of Data Minimization"}
          </h2>
          <p>
            {locale === "hi"
              ? "कांगनहेड़ी दर्पण पोर्टल केवल न्यूनतम आवश्यक परिचालन डेटा एकत्र करता है। नागरिक शिकायत दर्ज करते समय कोई अनिवार्य खाता या पासवर्ड आवश्यक नहीं है। फोन नंबर वैकल्पिक है और इसका उपयोग केवल शिकायत की स्थिति अपडेट करने के लिए किया जाता है।"
              : "Kanganheri Darpan collects only the minimum necessary operational data required to deliver public civic utility services. No login or password is required for residents to file grievances. Phone numbers are optional and solely utilized for status notifications."}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            {locale === "hi" ? "2. आईपी पता अनामीकरण (IP Hashing)" : "2. IP Address Anonymization"}
          </h2>
          <p>
            {locale === "hi"
              ? "हम कभी भी कच्चा (raw) आईपी पता डेटाबेस में संग्रहीत नहीं करते हैं। सभी आईपी पते HMAC-SHA-256 और दैनिक बदलते सॉल्ट (daily-rotating salt) द्वारा हैश किए जाते हैं ताकि किसी उपयोगकर्ता की पहचान को स्थायी रूप से ट्रैक न किया जा सके।"
              : "We never store raw IP addresses in persistent storage. All incoming IP addresses are cryptographically hashed using HMAC-SHA-256 combined with a daily-rotating secret salt, guaranteeing that online activity cannot be historically linked to a resident."}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            {locale === "hi" ? "3. कुकी नीति (Cookie Policy)" : "3. Cookie Usage"}
          </h2>
          <p>
            {locale === "hi"
              ? "यह पोर्टल किसी भी तीसरे पक्ष (third-party) ट्रैकिंग या विज्ञापन कुकी का उपयोग नहीं करता है। कुकीज़ का उपयोग केवल प्रशासनिक सत्र प्रबंधन के लिए HttpOnly, Secure, SameSite=Strict ध्वजों के साथ किया जाता है।"
              : "This portal does not deploy any third-party tracking or advertising cookies. Cookies are strictly restricted to authenticated administrative session management using HttpOnly, Secure, and SameSite=Strict security flags."}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">
            {locale === "hi"
              ? "4. डेटा मिटाने का अधिकार (Right to Erasure)"
              : "4. Right to Erasure & Correction"}
          </h2>
          <p>
            {locale === "hi"
              ? "भारत के डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम (DPDP Act 2023) के तहत किसी भी निवासी या दुकानदार को अपना डेटा पोर्टल से स्थायी रूप से हटाने या गुमनाम करने का पूर्ण अधिकार है।"
              : "Under India's Digital Personal Data Protection Act 2023, every citizen or listed business owner holds the unalienable right to request permanent anonymization or erasure of their personal details."}
          </p>
          <div className="pt-2">
            <Link
              href="/privacy/data-request"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
            >
              <span>
                {locale === "hi"
                  ? "डेटा मिटाने का ऑनलाइन अनुरोध दर्ज करें"
                  : "Submit Self-Service Data Erasure Request"}
              </span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section className="space-y-3 border-t border-border pt-4">
          <h2 className="text-lg font-bold text-foreground">
            {locale === "hi"
              ? "5. शिकायत अधिकारी (Data Grievance Officer)"
              : "5. Grievance Officer Contact"}
          </h2>
          <div className="space-y-1 rounded-lg border border-border bg-muted/30 p-4 text-xs sm:text-sm">
            <p className="font-bold text-foreground">Kanganheri Civic Data Governance Office</p>
            <p>Email: grievance@kanganheri.com</p>
            <p>Jurisdiction: Village Chaupal, Kanganheri, Najafgarh, New Delhi - 110071</p>
            <p>Response Timeline: Within 30 days as mandated by DPDP Act 2023</p>
          </div>
        </section>
      </div>
    </div>
  );
}
