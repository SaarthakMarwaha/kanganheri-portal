import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { PageProps } from "@/types";
import { Landmark, ShieldCheck, Award, Trees, MapPin, Compass } from "lucide-react";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "heritage" });
  const siteT = await getTranslations({ locale, namespace: "site" });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://kanganheri.com";

  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
    alternates: {
      canonical: `${baseUrl}/${locale}/heritage`,
      languages: {
        "hi-IN": `${baseUrl}/hi/heritage`,
        "en-IN": `${baseUrl}/en/heritage`,
        "x-default": `${baseUrl}/hi/heritage`,
      },
    },
    openGraph: {
      title: `${t("pageTitle")} | ${siteT("name")}`,
      description: t("pageDescription"),
    },
  };
}

export default async function HeritagePage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "heritage" });

  return (
    <div className="container mx-auto max-w-screen-xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Header */}
      <div className="mx-auto mb-10 max-w-3xl border-b border-border/80 pb-6 text-center">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          <Landmark className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{locale === "hi" ? "विरासत, गौरव एवं परंपरा" : "Heritage & Pride"}</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-5xl">
          {t("pageTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">{t("pageDescription")}</p>
      </div>

      <div className="mx-auto max-w-4xl space-y-12">
        {/* Section 1: History */}
        <section className="card-base space-y-4 p-6 sm:p-10">
          <div className="flex items-center gap-2 border-b border-border/70 pb-3 text-lg font-bold text-primary">
            <Landmark className="h-5 w-5" aria-hidden="true" />
            <h2>{t("history")}</h2>
          </div>
          <div className="prose-content space-y-4 text-sm leading-relaxed text-foreground/90 sm:text-base">
            {locale === "hi" ? (
              <>
                <p>
                  गाँव कांगनहेड़ी (Kanganheri), दक्षिण पश्चिम दिल्ली की नजफगढ़ तहसील में स्थित एक
                  ऐतिहासिक ग्रामीण बस्ती है। दिल्ली और हरियाणा की सीमा के समीप स्थित यह गाँव सदियों
                  से अपने कृषि गौरव, सामुदायिक एकता और देश सेवा के लिए जाना जाता है।
                </p>
                <p>
                  गाँव की भौगोलिक अवस्थिति इसे विशेष बनाती है — पूर्व में छावला और दक्षिण में नजफगढ़
                  के बीच बसा कांगनहेड़ी राव तुला राम मेमोरियल अस्पताल (जाफरपुर कलां) के निकटवर्ती
                  स्वास्थ्य परिक्षेत्र में आता है। यहाँ की मिट्टी उपजाऊ है जहाँ गेहूँ, सरसों, धान और
                  बाजरे की उत्कृष्ट फसलें लहलहाती हैं।
                </p>
              </>
            ) : (
              <>
                <p>
                  Village Kanganheri (PIN 110071) is a historic settlement located in the Najafgarh
                  Tehsil of South West Delhi. Situated close to the Delhi-Haryana border, the
                  village is renowned for its rich agricultural heritage, community chaupals, and
                  generations of service in national defense.
                </p>
                <p>
                  The village lies within the primary service area of Rao Tula Ram Memorial Hospital
                  (Jaffarpur Kalan) and Chhawla Police jurisdiction. Known for productive
                  agricultural land, its farmers actively contribute to the Najafgarh and Narela
                  grain mandis.
                </p>
              </>
            )}
          </div>
        </section>

        {/* Section 2: Martyrs Wall */}
        <section className="card-base space-y-4 border-l-4 border-l-danger-red p-6 sm:p-10">
          <div className="flex items-center gap-2 border-b border-border/70 pb-3 text-lg font-bold text-danger-red">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            <h2>{t("martyrs")}</h2>
          </div>
          <div className="prose-content space-y-3 text-sm leading-relaxed text-foreground/90 sm:text-base">
            <p>
              {locale === "hi"
                ? "कांगनहेड़ी के वीर सपूतों ने भारतीय सेना, सीमा सुरक्षा बल (BSF) और केंद्रीय सशस्त्र पुलिस बलों में अपनी सेवाएँ देकर मातृभूमि की रक्षा में सर्वोच्च बलिदान दिया है।"
                : "The valiant sons of Kanganheri have proudly served in the Indian Armed Forces, Border Security Force, and central police organisations, laying down their lives in service of the nation."}
            </p>
            <div className="rounded-lg border border-danger-red/20 bg-danger-red/5 p-4 text-xs font-medium text-foreground">
              🕊️{" "}
              {locale === "hi"
                ? "गाँव के शहीद स्मारक पर प्रतिवर्ष राष्ट्रीय पर्वों पर श्रद्धांजलि अर्पित की जाती है।"
                : "Annual remembrance ceremonies are held at the village memorial on national holidays."}
            </div>
          </div>
        </section>

        {/* Section 3: Achievers */}
        <section className="card-base space-y-4 border-l-4 border-l-amber-500 p-6 sm:p-10">
          <div className="flex items-center gap-2 border-b border-border/70 pb-3 text-lg font-bold text-amber-600 dark:text-amber-400">
            <Award className="h-5 w-5" aria-hidden="true" />
            <h2>{t("achievers")}</h2>
          </div>
          <div className="prose-content space-y-3 text-sm leading-relaxed text-foreground/90 sm:text-base">
            <p>
              {locale === "hi"
                ? "गाँव के युवाओं ने कुश्ती, कबड्डी, एथलेटिक्स और शैक्षणिक क्षेत्रों में राष्ट्रीय एवं राज्य स्तर पर दिल्ली का नाम रोशन किया है। गाँव की अखाड़ा संस्कृति और खेल मैदान युवाओं को अनुशासन और स्वस्थ जीवन की प्रेरणा देते हैं।"
                : "Youth from Kanganheri have excelled in wrestling, kabaddi, athletics, and academia, representing Delhi at state and national levels. The local akhada and sports grounds continue to mentor future champions."}
            </p>
          </div>
        </section>

        {/* Section 4: Eco-Tourism & Infrastructure */}
        <section className="card-base space-y-4 border-l-4 border-l-secondary p-6 sm:p-10">
          <div className="flex items-center gap-2 border-b border-border/70 pb-3 text-lg font-bold text-secondary">
            <Trees className="h-5 w-5" aria-hidden="true" />
            <h2>{t("infrastructure")} & Eco-Tourism</h2>
          </div>
          <div className="prose-content space-y-3 text-sm leading-relaxed text-foreground/90 sm:text-base">
            <p>
              {locale === "hi"
                ? "कांगनहेड़ी एडवेंचर पार्क एवं इको-टूरिज्म पार्क दिल्ली पर्यटन (DTTDC) की एक प्रमुख पहल रही है, जहाँ ग्रामीण परिवेश के बीच जलक्रीड़ा, बोटिंग और प्राकृतिक सौंदर्य का आनंद लिया जा सकता है।"
                : "The Kanganheri Adventure & Eco-Tourism Park, developed by DTTDC, represents an eco-recreation destination bringing urban visitors closer to rural wetlands and open nature."}
            </p>
          </div>
        </section>

        {/* Section 5: Geographical & Demographic Profile */}
        <section className="card-base space-y-6 border-l-4 border-l-primary p-6 sm:p-10">
          <div className="flex items-center gap-2 border-b border-border/70 pb-3 text-lg font-bold text-primary">
            <Compass className="h-5 w-5" aria-hidden="true" />
            <h2>
              {locale === "hi" ? "भौगोलिक एवं नागरिक परिदृश्य" : "Geographic & Civic Profile"}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2 md:grid-cols-3">
            <div className="space-y-1 rounded-lg border border-border/70 bg-background/60 p-3.5">
              <span className="block font-medium text-muted-foreground">
                {locale === "hi" ? "भौगोलिक निर्देशांक" : "Coordinates"}
              </span>
              <span className="flex items-center gap-1 font-mono text-sm font-bold text-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                28.5468° N, 76.9883° E
              </span>
            </div>

            <div className="space-y-1 rounded-lg border border-border/70 bg-background/60 p-3.5">
              <span className="block font-medium text-muted-foreground">
                {locale === "hi" ? "नागरिक क्षेत्राधिकार" : "Civic Jurisdiction"}
              </span>
              <span className="text-sm font-bold text-foreground">
                {locale === "hi" ? "नजफगढ़ जोन • MCD" : "Najafgarh Zone • MCD"}
              </span>
            </div>

            <div className="space-y-1 rounded-lg border border-border/70 bg-background/60 p-3.5">
              <span className="block font-medium text-muted-foreground">
                {locale === "hi" ? "डाक पिन कोड" : "Postal PIN Code"}
              </span>
              <span className="font-mono text-sm font-bold text-primary">110071 (Chhawla SO)</span>
            </div>

            <div className="space-y-1 rounded-lg border border-border/70 bg-background/60 p-3.5">
              <span className="block font-medium text-muted-foreground">
                {locale === "hi" ? "निकटतम पुलिस स्टेशन" : "Nearest Police Station"}
              </span>
              <span className="text-sm font-bold text-foreground">
                {locale === "hi" ? "छावला थाना (2.4 किमी)" : "Chhawla PS (~2.4 km)"}
              </span>
            </div>

            <div className="space-y-1 rounded-lg border border-border/70 bg-background/60 p-3.5">
              <span className="block font-medium text-muted-foreground">
                {locale === "hi" ? "मुख्य जिला अस्पताल" : "District Hospital"}
              </span>
              <span className="text-sm font-bold text-foreground">
                {locale === "hi" ? "RTRM अस्पताल जाफरपुर" : "RTRM Hospital, Jaffarpur"}
              </span>
            </div>

            <div className="space-y-1 rounded-lg border border-border/70 bg-background/60 p-3.5">
              <span className="block font-medium text-muted-foreground">
                {locale === "hi" ? "प्रमुख कृषि मंडियाँ" : "Primary Mandis"}
              </span>
              <span className="text-sm font-bold text-secondary">
                {locale === "hi" ? "नजफगढ़, नरेला, झज्जर" : "Najafgarh, Narela, Jhajjar"}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
