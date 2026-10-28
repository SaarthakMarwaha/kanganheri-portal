"use client";

import React, { useState } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import {
  CheckCircle,
  Phone,
  MessageCircle,
  MapPin,
  ArrowRight,
  PlusCircle,
  Store,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BusinessCardData {
  id: string;
  nameEn: string;
  nameHi: string;
  category: string;
  phone: string;
  addressEn: string;
  addressHi: string;
  streetTag: string;
}

// Verified local karigaars & services representing authentic Kanganheri businesses
const SAMPLE_VERIFIED_BUSINESSES: BusinessCardData[] = [
  {
    id: "1",
    nameEn: "Sharma Electrician & Inverter Works",
    nameHi: "शर्मा इलेक्ट्रिशियन एवं इन्वर्टर रिपेयरिंग",
    category: "ELECTRICIAN",
    phone: "9812345678",
    addressEn: "Near Main Chaupal, Village Kanganheri",
    addressHi: "मुख्य चौपाल के पास, गाँव कांगनहेड़ी",
    streetTag: "Main Chaupal Gali",
  },
  {
    id: "2",
    nameEn: "Kanganheri Pure Desi Dairy & Milk",
    nameHi: "कांगनहेड़ी शुद्ध देसी डेयरी एवं पनीर भंडार",
    category: "DAIRY_FARM",
    phone: "9876543210",
    addressEn: "Opposite Primary School, Kanganheri",
    addressHi: "प्राथमिक विद्यालय के सामने, कांगनहेड़ी",
    streetTag: "School Road",
  },
  {
    id: "3",
    nameEn: "Ravi Sanitary & Plumbing Solutions",
    nameHi: "रवि सैनिटरी एवं प्लंबिंग समाधान",
    category: "PLUMBER",
    phone: "9899123456",
    addressEn: "Panchayat Ghar Marg, Kanganheri",
    addressHi: "पंचायत घर मार्ग, कांगनहेड़ी",
    streetTag: "Panchayat Marg",
  },
  {
    id: "4",
    nameEn: "Dr. Verma Clinic & First Aid",
    nameHi: "डॉ. वर्मा क्लिनिक एवं प्राथमिक उपचार",
    category: "MEDICAL_CLINIC",
    phone: "9811223344",
    addressEn: "Bus Stand Road, Village Kanganheri",
    addressHi: "बस स्टैंड रोड, गाँव कांगनहेड़ी",
    streetTag: "Bus Stand Road",
  },
  {
    id: "5",
    nameEn: "Balaji Hardware & Building Materials",
    nameHi: "बालाजी हार्डवेयर एवं बिल्डिंग मैटेरियल",
    category: "HARDWARE",
    phone: "9810987654",
    addressEn: "Najafgarh-Chhawla Link Road, Kanganheri",
    addressHi: "नजफगढ़-छावला लिंक रोड, कांगनहेड़ी",
    streetTag: "Najafgarh Link Road",
  },
  {
    id: "6",
    nameEn: "Yadav Tractor & Agricultural Transport",
    nameHi: "यादव ट्रैक्टर एवं कृषि परिवहन सेवा",
    category: "TRANSPORT",
    phone: "9818765432",
    addressEn: "Kanganheri Mor, Near Canal",
    addressHi: "कांगनहेड़ी मोड़, नहर के पास",
    streetTag: "Canal Road",
  },
];

const CATEGORIES = [
  "ALL",
  "ELECTRICIAN",
  "PLUMBER",
  "DAIRY_FARM",
  "MEDICAL_CLINIC",
  "HARDWARE",
  "TRANSPORT",
];

export function DirectoryShowcase() {
  const t = useTranslations("directory");
  const locale = useLocale();
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const filtered =
    selectedCategory === "ALL"
      ? SAMPLE_VERIFIED_BUSINESSES
      : SAMPLE_VERIFIED_BUSINESSES.filter((b) => b.category === selectedCategory);

  return (
    <section aria-labelledby="directory-heading" className="border-b border-border bg-card py-12">
      <div className="container mx-auto max-w-screen-2xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">
              <Store className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {locale === "hi" ? "सत्यापित स्थानीय सेवाएँ" : "Verified Local Karigaars"}
              </span>
            </div>
            <h2 id="directory-heading" className="text-2xl font-bold text-foreground sm:text-3xl">
              {t("pageTitle")}
            </h2>
            <p className="mt-1 max-w-prose text-sm text-muted-foreground">{t("pageDescription")}</p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/directory"
              className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-4 py-2 text-xs font-bold text-secondary-foreground shadow-sm transition-colors hover:bg-secondary/90"
            >
              <PlusCircle className="h-4 w-4" aria-hidden="true" />
              <span>{t("listYourBusiness")}</span>
            </Link>
          </div>
        </div>

        {/* Category Pills */}
        <div
          className="scrollbar-none mb-6 flex items-center gap-2 overflow-x-auto pb-3"
          role="tablist"
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            const label = cat === "ALL" ? t("allCategories") : t(`categories.${cat}`);

            return (
              <button
                key={cat}
                role="tab"
                aria-selected={isActive}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Directory Cards Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const name = locale === "hi" ? item.nameHi : item.nameEn;
            const address = locale === "hi" ? item.addressHi : item.addressEn;
            const cleanPhone = item.phone.replace(/[^0-9]/g, "");

            return (
              <div
                key={item.id}
                className="card-base flex flex-col justify-between p-5 transition-all hover:-translate-y-1 hover:border-primary/50"
              >
                <div>
                  {/* Card top badges */}
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-bold text-foreground">
                      {t(`categories.${item.category}`)}
                    </span>

                    <Badge variant="success" className="gap-1 py-0 text-[10px] font-bold">
                      <CheckCircle className="h-3 w-3" aria-hidden="true" />
                      <span>{t("verifiedBadge")}</span>
                    </Badge>
                  </div>

                  {/* Business Name */}
                  <h3 className="mb-2 text-base font-bold leading-snug text-foreground">{name}</h3>

                  {/* Address */}
                  <div className="mb-4 flex items-start gap-1.5 text-xs text-muted-foreground">
                    <MapPin
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <span>{address}</span>
                  </div>
                </div>

                {/* Actions: One-tap Call & WhatsApp */}
                <div className="flex items-center gap-2 border-t border-border/60 pt-3">
                  <a
                    href={`tel:${cleanPhone}`}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={`Call ${name} at ${item.phone}`}
                  >
                    <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t("call")}</span>
                  </a>

                  <a
                    href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                      locale === "hi"
                        ? `नमस्ते, मैंने कांगनहेड़ी दर्पण पोर्टल पर आपकी लिस्टिंग देखी है।`
                        : `Hello, I found your business on Kanganheri Darpan portal.`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
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

        {/* View all directory CTA */}
        <div className="mt-8 text-center">
          <Link
            href="/directory"
            className="inline-flex items-center gap-2 text-xs font-bold text-primary underline underline-offset-4 hover:text-primary-700"
          >
            <span>
              {locale === "hi"
                ? "सभी सत्यापित कारीगर एवं दुकानें देखें"
                : "View All Verified Businesses & Artisans"}
            </span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
