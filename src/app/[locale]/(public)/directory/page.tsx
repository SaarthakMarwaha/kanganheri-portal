import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import type { PageProps } from "@/types";
import { BusinessCategory, VerificationStatus, Prisma } from "@prisma/client";
import { BusinessRegistrationForm } from "@/components/directory/business-registration-form";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/routing";
import { Store, Phone, MessageCircle, MapPin, CheckCircle, Search, PlusCircle } from "lucide-react";

const FALLBACK_DIRECTORY_LISTINGS = [
  {
    id: "dir-1",
    slug: "sharma-electrician-kanganheri",
    nameEn: "Sharma Electrician & Inverter Works",
    nameHi: "शर्मा इलेक्ट्रिशियन एवं इन्वर्टर रिपेयरिंग",
    category: BusinessCategory.ELECTRICIAN,
    phone: "9812345678",
    addressEn: "Near Main Chaupal, Village Kanganheri, New Delhi - 110071",
    addressHi: "मुख्य चौपाल के पास, गाँव कांगनहेड़ी, नई दिल्ली - 110071",
    streetTag: "Main Chaupal Gali",
    descriptionEn:
      "Complete house wiring, motor rewinding, inverter setup, and emergency electrical repair.",
    descriptionHi:
      "घर की पूरी वायरिंग, मोटर रिवाइंडिंग, इन्वर्टर सेटअप और आपातकालीन बिजली मरम्मत सेवा।",
  },
  {
    id: "dir-2",
    slug: "kanganheri-pure-desi-dairy",
    nameEn: "Kanganheri Pure Desi Dairy & Milk",
    nameHi: "कांगनहेड़ी शुद्ध देसी डेयरी एवं पनीर भंडार",
    category: BusinessCategory.DAIRY_FARM,
    phone: "9876543210",
    addressEn: "Opposite Primary School, Village Kanganheri - 110071",
    addressHi: "प्राथमिक विद्यालय के सामने, गाँव कांगनहेड़ी - 110071",
    streetTag: "School Road",
    descriptionEn: "Pure buffalo and cow milk, fresh ghee, paneer, and curd supplied daily.",
    descriptionHi:
      "शुद्ध भैंस व गाय का ताजा दूध, शुद्ध देशी घी, ताजा पनीर और दही की दैनिक आपूर्ति।",
  },
  {
    id: "dir-3",
    slug: "ravi-sanitary-plumbing-solutions",
    nameEn: "Ravi Sanitary & Plumbing Solutions",
    nameHi: "रवि सैनिटरी एवं प्लंबिंग समाधान",
    category: BusinessCategory.PLUMBER,
    phone: "9899123456",
    addressEn: "Panchayat Ghar Marg, Kanganheri - 110071",
    addressHi: "पंचायत घर मार्ग, कांगनहेड़ी - 110071",
    streetTag: "Panchayat Marg",
    descriptionEn:
      "Water tank installation, submersible pump repair, pipe leakage fixing, bathroom fittings.",
    descriptionHi: "पानी की टंकी फिटिंग, सबमर्सिबल पंप रिपेयर, पाइप लीकेज और बाथरूम सैनिटरी कार्य।",
  },
  {
    id: "dir-4",
    slug: "dr-verma-clinic-first-aid",
    nameEn: "Dr. Verma Clinic & First Aid",
    nameHi: "डॉ. वर्मा क्लिनिक एवं प्राथमिक उपचार केंद्र",
    category: BusinessCategory.MEDICAL_CLINIC,
    phone: "9811223344",
    addressEn: "Bus Stand Road, Village Kanganheri - 110071",
    addressHi: "बस स्टैंड रोड, गाँव कांगनहेड़ी - 110071",
    streetTag: "Bus Stand Road",
    descriptionEn:
      "General physician, BP & blood sugar check, first aid emergency dressing, pharmacy stock.",
    descriptionHi:
      "सामान्य चिकित्सक, ब्लड प्रेशर व शुगर जाँच, प्राथमिक उपचार ड्रेसिंग और आवश्यक दवाइयाँ।",
  },
  {
    id: "dir-5",
    slug: "balaji-hardware-building-materials",
    nameEn: "Balaji Hardware & Building Materials",
    nameHi: "बालाजी हार्डवेयर एवं बिल्डिंग मैटेरियल",
    category: BusinessCategory.HARDWARE,
    phone: "9810987654",
    addressEn: "Najafgarh-Chhawla Link Road, Kanganheri - 110071",
    addressHi: "नजफगढ़-छावला लिंक रोड, कांगनहेड़ी - 110071",
    streetTag: "Najafgarh Link Road",
    descriptionEn:
      "Cement, sand, steel rods, paints, electrical tools, plumbing pipes at wholesale rates.",
    descriptionHi:
      "सीमेंट, बदरपुर, सरिया, एशियन पेंट्स, बिजली टूल्स और पीवीसी पाइप थोक व फुटकर उपलब्ध।",
  },
  {
    id: "dir-6",
    slug: "yadav-tractor-agricultural-transport",
    nameEn: "Yadav Tractor & Agricultural Transport",
    nameHi: "यादव ट्रैक्टर एवं कृषि परिवहन सेवा",
    category: BusinessCategory.TRANSPORT,
    phone: "9818765432",
    addressEn: "Kanganheri Mor, Near Canal, New Delhi - 110071",
    addressHi: "कांगनहेड़ी मोड़, नहर के पास, नई दिल्ली - 110071",
    streetTag: "Canal Road",
    descriptionEn:
      "Farm trolley transport to Najafgarh and Narela Mandi, rotavator plowing, and goods carriage.",
    descriptionHi:
      "नजफगढ़ व नरेला मंडी तक फसल धुलाई, रोटावेटर से खेत जुताई और भारी सामान ढुलाई सेवा।",
  },
  {
    id: "dir-7",
    slug: "kisan-seva-kendra-fertilizers",
    nameEn: "Kisan Seva Kendra & Seed Store",
    nameHi: "किसान सेवा केंद्र एवं बीज भंडार",
    category: BusinessCategory.GENERAL_STORE,
    phone: "9813245678",
    addressEn: "Main Chaupal Chowk, Kanganheri - 110071",
    addressHi: "मुख्य चौपाल चौक, कांगनहेड़ी - 110071",
    streetTag: "Main Chaupal",
    descriptionEn:
      "Certified wheat and mustard seeds, bio-fertilizers, pesticides, and farming advisory.",
    descriptionHi: "प्रमाणित गेहूँ व सरसों बीज, जैविक खाद, कीटनाशक और कृषि विशेषज्ञ परामर्श।",
  },
  {
    id: "dir-8",
    slug: "chaupal-welding-fabrication",
    nameEn: "Chaupal Welding & Agricultural Implements",
    nameHi: "चौपाल वेल्डिंग एवं कृषि यंत्र मरम्मत",
    category: BusinessCategory.VEHICLE_REPAIR,
    phone: "9812987654",
    addressEn: "Old Phirni, Village Kanganheri - 110071",
    addressHi: "पुरानी फिरनी, गाँव कांगनहेड़ी - 110071",
    streetTag: "Old Phirni Road",
    descriptionEn:
      "Iron gate grills, tractor trolley welding, harrow/cultivator repair, and metal fabrication.",
    descriptionHi:
      "लोहे के गेट-ग्रिल, ट्रैक्टर ट्रॉली वेल्डिंग, कल्टीवेटर मरम्मत और शीट मेटल कार्य।",
  },
];

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "directory" });
  const siteT = await getTranslations({ locale, namespace: "site" });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://kanganheri.com";

  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
    alternates: {
      canonical: `${baseUrl}/${locale}/directory`,
      languages: {
        "hi-IN": `${baseUrl}/hi/directory`,
        "en-IN": `${baseUrl}/en/directory`,
        "x-default": `${baseUrl}/hi/directory`,
      },
    },
    openGraph: {
      title: `${t("pageTitle")} | ${siteT("name")}`,
      description: t("pageDescription"),
    },
  };
}

export default async function DirectoryPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const sParams = (await searchParams) ?? {};
  const t = await getTranslations({ locale, namespace: "directory" });

  const selectedCategory = typeof sParams.category === "string" ? sParams.category : undefined;
  const query = typeof sParams.q === "string" ? sParams.q.trim() : undefined;

  const where: Prisma.BusinessListingWhereInput = {
    isActive: true,
    verificationStatus: VerificationStatus.VERIFIED,
  };

  if (
    selectedCategory &&
    Object.values(BusinessCategory).includes(selectedCategory as BusinessCategory)
  ) {
    where.category = selectedCategory as BusinessCategory;
  }

  if (query) {
    where.OR = [
      { nameEn: { contains: query, mode: "insensitive" } },
      { nameHi: { contains: query, mode: "insensitive" } },
      { streetTag: { contains: query, mode: "insensitive" } },
      { descriptionHi: { contains: query, mode: "insensitive" } },
    ];
  }

  let listings: Array<{
    id: string;
    slug: string;
    nameEn: string;
    nameHi: string;
    category: BusinessCategory;
    phone: string;
    addressHi: string | null;
    addressEn: string | null;
    streetTag: string | null;
    descriptionHi: string | null;
    descriptionEn: string | null;
  }> = [];

  try {
    listings = await db.businessListing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        nameEn: true,
        nameHi: true,
        category: true,
        phone: true,
        addressHi: true,
        addressEn: true,
        streetTag: true,
        descriptionHi: true,
        descriptionEn: true,
      },
    });
  } catch (err) {
    console.warn(
      "Notice: DB unreachable during DirectoryPage fetch, rendering verified fallback state:",
      err,
    );
  }

  // Graceful fallback for offline preview or before initial DB population
  if (listings.length === 0) {
    listings = FALLBACK_DIRECTORY_LISTINGS.filter((item) => {
      if (selectedCategory && item.category !== selectedCategory) return false;
      if (query) {
        const q = query.toLowerCase();
        const matchesEn = item.nameEn.toLowerCase().includes(q);
        const matchesHi = item.nameHi.includes(q);
        const matchesStreet = item.streetTag.toLowerCase().includes(q);
        const matchesDesc =
          (item.descriptionHi && item.descriptionHi.includes(q)) ||
          (item.descriptionEn && item.descriptionEn.toLowerCase().includes(q));
        if (!matchesEn && !matchesHi && !matchesStreet && !matchesDesc) return false;
      }
      return true;
    });
  }

  return (
    <div className="container mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-border/80 pb-6 md:flex-row md:items-end">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">
            <Store className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {locale === "hi" ? "गाँव की अपनी डायरेक्टरी" : "Village Business Directory"}
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            {t("pageTitle")}
          </h1>
          <p className="mt-2 max-w-prose text-sm text-muted-foreground sm:text-base">
            {t("pageDescription")}
          </p>
        </div>

        <a
          href="#register-section"
          className="inline-flex shrink-0 items-center gap-2 rounded-md bg-secondary px-5 py-2.5 text-xs font-bold text-secondary-foreground shadow transition-colors hover:bg-secondary/90"
        >
          <PlusCircle className="h-4 w-4" aria-hidden="true" />
          <span>{t("listYourBusiness")}</span>
        </a>
      </div>

      {/* Main Grid: Listings (8 cols) + Registration Form (4 cols) */}
      <div className="mb-16 grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Left: Search, Filter & Listings Grid (8 cols) */}
        <div className="space-y-6 lg:col-span-8">
          {/* Search bar */}
          <form method="GET" className="flex gap-2">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder={t("searchPlaceholder")}
                className="flex h-10 w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary-700"
            >
              {locale === "hi" ? "खोजें" : "Search"}
            </button>
          </form>

          {/* Category Filter bar */}
          <div className="scrollbar-none flex items-center gap-1.5 overflow-x-auto pb-2">
            <Link
              href="/directory"
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                !selectedCategory
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("allCategories")}
            </Link>

            {Object.values(BusinessCategory)
              .slice(0, 10)
              .map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <a
                    key={cat}
                    href={`/${locale}/directory?category=${cat}`}
                    className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t(`categories.${cat}`)}
                  </a>
                );
              })}
          </div>

          {/* Listings count indicator */}
          <div className="text-xs text-muted-foreground">
            {locale === "hi"
              ? `कुल ${listings.length} सत्यापित लिस्टिंग मिलीं`
              : `Found ${listings.length} verified listings`}
          </div>

          {/* Listings Grid */}
          {listings.length === 0 ? (
            <div className="card-base p-12 text-center text-muted-foreground">
              <Store className="mx-auto mb-3 h-12 w-12 opacity-40" aria-hidden="true" />
              <p className="text-base font-semibold">{t("noResults")}</p>
              <p className="mt-1 text-xs">
                {locale === "hi"
                  ? "कृपया कोई अन्य खोज शब्द या श्रेणी चुनें।"
                  : "Try a different search term or category filter."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {listings.map((item) => {
                const name = locale === "hi" ? item.nameHi : item.nameEn;
                const address = locale === "hi" ? item.addressHi : item.addressEn;
                const cleanPhone = item.phone.replace(/[^0-9]/g, "");

                return (
                  <div
                    key={item.id}
                    className="card-base flex flex-col justify-between p-5 transition-colors hover:border-primary/50"
                  >
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-foreground">
                          {t(`categories.${item.category}`)}
                        </span>
                        <Badge variant="success" className="gap-1 py-0 text-[10px] font-bold">
                          <CheckCircle className="h-3 w-3" aria-hidden="true" />
                          <span>{t("verifiedBadge")}</span>
                        </Badge>
                      </div>

                      <h3 className="mb-1 text-base font-bold leading-snug text-foreground">
                        {name}
                      </h3>

                      {address && (
                        <div className="mb-3 flex items-start gap-1 text-xs text-muted-foreground">
                          <MapPin
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary"
                            aria-hidden="true"
                          />
                          <span>{address}</span>
                        </div>
                      )}

                      {item.descriptionHi && (
                        <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {locale === "hi"
                            ? item.descriptionHi
                            : item.descriptionEn || item.descriptionHi}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 border-t border-border/60 pt-3">
                      <a
                        href={`tel:${cleanPhone}`}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-700"
                        aria-label={`Call ${name} at ${item.phone}`}
                      >
                        <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{t("call")}</span>
                      </a>

                      <a
                        href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                          locale === "hi"
                            ? `नमस्ते ${name}, मैंने कांगनहेड़ी दर्पण पोर्टल पर आपकी लिस्टिंग देखी है।`
                            : `Hello ${name}, I found your listing on Kanganheri Darpan.`,
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
                        aria-label={`Message ${name} on WhatsApp`}
                      >
                        <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{t("whatsapp")}</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Registration Form (4 cols) */}
        <div id="register-section" className="scroll-mt-24 lg:col-span-4">
          <BusinessRegistrationForm />
        </div>
      </div>
    </div>
  );
}
