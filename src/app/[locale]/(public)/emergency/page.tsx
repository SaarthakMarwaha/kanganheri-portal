import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import type { PageProps } from "@/types";
import { ShieldAlert, PhoneCall, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "emergency" });
  const siteT = await getTranslations({ locale, namespace: "site" });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://kanganheri.com";

  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
    alternates: {
      canonical: `${baseUrl}/${locale}/emergency`,
      languages: {
        "hi-IN": `${baseUrl}/hi/emergency`,
        "en-IN": `${baseUrl}/en/emergency`,
        "x-default": `${baseUrl}/hi/emergency`,
      },
    },
    openGraph: {
      title: `${t("pageTitle")} | ${siteT("name")}`,
      description: t("pageDescription"),
    },
  };
}

const FALLBACK_EMERGENCY_CONTACTS = [
  {
    id: "em-1",
    type: "POLICE" as const,
    nameEn: "Chhawla Police Station",
    nameHi: "छावला पुलिस थाना",
    phone: "011-25303100",
    phoneTollFree: "100",
    descriptionEn: "Nearest police station serving Village Kanganheri",
    descriptionHi: "कांगनहेड़ी गांव की सेवा करने वाला निकटतम पुलिस थाना",
    addressEn: "Chhawla, New Delhi - 110071",
    addressHi: "छावला, नई दिल्ली - 110071",
    sortOrder: 1,
  },
  {
    id: "em-2",
    type: "HOSPITAL" as const,
    nameEn: "Rao Tula Ram Memorial Hospital",
    nameHi: "राव तुला राम मेमोरियल अस्पताल (जाफरपुर कलां)",
    phone: "011-25318555",
    phoneTollFree: "102",
    descriptionEn: "Nearest Delhi Govt Multi-Speciality Hospital with 24x7 Emergency Trauma",
    descriptionHi: "24x7 आपातकालीन ट्रॉमा और एम्बुलेंस सुविधा वाला निकटतम सरकारी अस्पताल",
    addressEn: "Jaffarpur Kalan, New Delhi - 110073",
    addressHi: "जाफरपुर कलां, नई दिल्ली - 110073",
    sortOrder: 2,
  },
  {
    id: "em-3",
    type: "FIRE_BRIGADE" as const,
    nameEn: "Delhi Fire Service (Najafgarh/Dwarka)",
    nameHi: "दिल्ली अग्निशमन सेवा",
    phone: "101",
    phoneTollFree: "101",
    descriptionEn: "24x7 Emergency Fire Rescue Services",
    descriptionHi: "24x7 आपातकालीन अग्निशामक सहायता",
    addressEn: "Najafgarh Zone, South West Delhi",
    addressHi: "नजफगढ़ जोन, दक्षिण-पश्चिम दिल्ली",
    sortOrder: 3,
  },
  {
    id: "em-4",
    type: "POWER_UTILITY" as const,
    nameEn: "BSES Rajdhani Power Outage & Fault Helpline",
    nameHi: "बीएसईएस राजधानी बिजली ब्रेकडाउन हेल्पलाइन",
    phone: "19123",
    phoneTollFree: "19123",
    descriptionEn: "24x7 BSES electricity breakdown & fuse off call center",
    descriptionHi: "24x7 बिजली कटौती एवं फॉल्ट निवारण सेवा",
    addressEn: "Najafgarh Division, BSES Rajdhani",
    addressHi: "नजफगढ़ मंडल, बीएसईएस",
    sortOrder: 4,
  },
  {
    id: "em-5",
    type: "WATER_UTILITY" as const,
    nameEn: "Delhi Jal Board (DJB) Water Tanker Helpline",
    nameHi: "दिल्ली जल बोर्ड टैंकर एवं पेयजल हेल्पलाइन",
    phone: "1916",
    phoneTollFree: "1916",
    descriptionEn: "Drinking water emergency tanker request & pipeline breakdown helpline",
    descriptionHi: "पेयजल टैंकर आपूर्ति एवं पाइपलाइन लीकेज शिकायत निवारण",
    addressEn: "DJB Najafgarh Zone, Delhi",
    addressHi: "दिल्ली जल बोर्ड, नजफगढ़",
    sortOrder: 5,
  },
  {
    id: "em-6",
    type: "GOVERNMENT_OFFICE" as const,
    nameEn: "Delhi Commission for Women (DCW) Helpline",
    nameHi: "महिला सुरक्षा एवं सहायता हेल्पलाइन",
    phone: "181",
    phoneTollFree: "1091",
    descriptionEn: "24x7 Women Distress & Safety Helpline",
    descriptionHi: "24x7 संकटकालीन महिला सहायता एवं कानूनी परामर्श",
    addressEn: "Govt of NCT of Delhi",
    addressHi: "दिल्ली सरकार",
    sortOrder: 6,
  },
];

export default async function EmergencyPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "emergency" });

  let contacts = FALLBACK_EMERGENCY_CONTACTS;
  try {
    const dbContacts = await db.emergencyContact.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    if (dbContacts.length > 0) {
      contacts = dbContacts as typeof FALLBACK_EMERGENCY_CONTACTS;
    }
  } catch (err) {
    console.warn(
      "Notice: DB unreachable during EmergencyPage fetch, displaying verified offline lifelines:",
      err,
    );
  }

  return (
    <div className="container mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Header */}
      <div className="mb-8 border-b border-border/80 pb-6">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-danger-red/10 px-3 py-1 text-xs font-bold text-danger-red">
          <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{locale === "hi" ? "आपातकालीन सेवाएँ" : "Emergency Lifelines"}</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
          {t("pageTitle")}
        </h1>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground sm:text-base">
          {t("pageDescription")}
        </p>

        {/* Offline Notice banner */}
        <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:text-amber-200">
          <WifiOff
            className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
            aria-hidden="true"
          />
          <span>
            {locale === "hi"
              ? "यह हेल्पलाइन डायरेक्टरी ऑफ़लाइन भी सुलभ है। कमजोर 2G/3G नेटवर्क या इंटरनेट बंद होने पर भी ये नंबर सीधे डायल किए जा सकते हैं।"
              : "This directory is cached for offline use. All contact numbers can be dialed directly over mobile cellular networks even without active data connection."}
          </span>
        </div>
      </div>

      {/* Grid of Emergency Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {contacts.map((contact) => {
          const name = locale === "hi" ? contact.nameHi : contact.nameEn;
          const desc = locale === "hi" ? contact.descriptionHi : contact.descriptionEn;
          const address = locale === "hi" ? contact.addressHi : contact.addressEn;
          const cleanPhone = contact.phone.replace(/[^0-9]/g, "");

          return (
            <div
              key={contact.id}
              className="card-base flex flex-col justify-between border-t-4 border-t-danger-red p-6 transition-all hover:shadow-lg"
            >
              <div>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <Badge
                    variant="destructive"
                    className="text-[10px] font-bold uppercase tracking-wider"
                  >
                    {t(`types.${contact.type}`)}
                  </Badge>

                  {contact.phoneTollFree && (
                    <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary">
                      Toll-Free: {contact.phoneTollFree}
                    </span>
                  )}
                </div>

                <h3 className="mb-2 text-lg font-bold leading-tight text-foreground">{name}</h3>

                {desc && (
                  <p className="mb-3 text-xs leading-relaxed text-muted-foreground">{desc}</p>
                )}

                {address && <p className="mb-4 text-[11px] text-muted-foreground">📍 {address}</p>}
              </div>

              {/* Action */}
              <div className="flex items-center gap-2 border-t border-border pt-4">
                <a
                  href={`tel:${cleanPhone}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-danger-red px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-red-700"
                  aria-label={`Call ${name} at ${contact.phone}`}
                >
                  <PhoneCall className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {t("callNow")}: {contact.phone}
                  </span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
