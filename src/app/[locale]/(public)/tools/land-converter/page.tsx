import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { PageProps } from "@/types";
import { LandConverterWidget } from "@/components/tools/land-converter-widget";
import { Scale, BookOpen } from "lucide-react";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tools.landConverter" });
  const siteT = await getTranslations({ locale, namespace: "site" });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://kanganheri.com";

  return {
    title: `${t("pageTitle")} — Bigha, Biswa, Gaj, Acre, Kanal, Marla`,
    description: t("pageDescription"),
    alternates: {
      canonical: `${baseUrl}/${locale}/tools/land-converter`,
      languages: {
        "hi-IN": `${baseUrl}/hi/tools/land-converter`,
        "en-IN": `${baseUrl}/en/tools/land-converter`,
        "x-default": `${baseUrl}/hi/tools/land-converter`,
      },
    },
    openGraph: {
      title: `${t("pageTitle")} | ${siteT("name")}`,
      description: t("pageDescription"),
    },
  };
}

export default async function LandConverterPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tools.landConverter" });

  const referenceTable = [
    {
      unit: "1 बीघा (Bigha, Delhi)",
      equivalent: "20 बिस्वा (Biswa) = 1,008 वर्ग गज (Gaj) = 9,072 वर्ग फीट = 842.8 वर्ग मीटर",
    },
    {
      unit: "1 बिस्वा (Biswa, Delhi)",
      equivalent: "50.4 वर्ग गज (Gaj) = 453.6 वर्ग फीट = 42.14 वर्ग मीटर",
    },
    {
      unit: "1 एकड़ (Acre)",
      equivalent: "4.8 बीघा (Delhi) = 4,840 वर्ग गज = 43,560 वर्ग फीट = 4,046.86 वर्ग मीटर",
    },
    {
      unit: "1 हेक्टेयर (Hectare)",
      equivalent: "11.86 बीघा (Delhi) = 10,000 वर्ग मीटर = 1,07,639 वर्ग फीट = 2.471 एकड़",
    },
    {
      unit: "1 कनाल (Kanal)",
      equivalent: "605 वर्ग गज = 5,445 वर्ग फीट = 505.86 वर्ग मीटर = 20 मरला",
    },
    { unit: "1 मरला (Marla)", equivalent: "30.25 वर्ग गज = 272.25 वर्ग फीट = 25.29 वर्ग मीटर" },
    { unit: "1 गज (Gaj / Sq. Yard)", equivalent: "9 वर्ग फीट = 0.836 वर्ग मीटर" },
  ];

  return (
    <div className="container mx-auto max-w-screen-xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Header */}
      <div className="mb-8 border-b border-border/80 pb-6">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">
          <Scale className="h-3.5 w-3.5" aria-hidden="true" />
          <span>
            {locale === "hi" ? "राजस्व भूमि मापन उपकरण" : "Revenue Land Measurement Tool"}
          </span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
          {t("pageTitle")}
        </h1>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground sm:text-base">
          {t("pageDescription")}
        </p>
      </div>

      <div className="mx-auto max-w-4xl space-y-10">
        {/* Interactive Converter */}
        <LandConverterWidget />

        {/* Official Revenue Measurement Reference */}
        <div className="card-base p-6 sm:p-8">
          <div className="mb-4 flex items-center gap-2 border-b border-border/70 pb-3">
            <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-lg font-bold text-foreground">
              {locale === "hi"
                ? "दिल्ली एवं नजफगढ़ तहसील मानक मापन तालिका"
                : "Delhi & Najafgarh Tehsil Official Measurement Reference"}
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                  <th className="px-4 py-2.5">{locale === "hi" ? "इकाई (Unit)" : "Unit"}</th>
                  <th className="px-4 py-2.5">
                    {locale === "hi" ? "मानक समतुल्य (Equivalent)" : "Standard Equivalent"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {referenceTable.map((row, idx) => (
                  <tr key={idx} className="hover:bg-muted/20">
                    <td className="whitespace-nowrap px-4 py-3 font-bold text-foreground">
                      {row.unit}
                    </td>
                    <td className="px-4 py-3 leading-relaxed text-muted-foreground">
                      {row.equivalent}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 border-t border-border/60 pt-3 text-xs text-muted-foreground">
            <p>
              {locale === "hi"
                ? "📌 नोट: दिल्ली राजस्व विभाग (Najafgarh & Kapashera Sub-Division) के अनुसार 1 बीघा 1,008 वर्ग गज (20 बिस्वा) का होता है, जो उत्तर प्रदेश व हरियाणा के कुछ अन्य जिलों से भिन्न हो सकता है।"
                : "📌 Note: In Delhi Revenue jurisdiction (Najafgarh Tehsil), 1 Bigha equals exactly 1,008 Square Yards (20 Biswa), which may differ from regional standards in neighboring UP or Punjab."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
