import React from "react";
import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { MapPin, ShieldAlert, Building, Heart, FileCheck, Scale } from "lucide-react";

export function Footer() {
  const t = useTranslations("footer");
  const siteT = useTranslations("site");
  const locale = useLocale();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-border bg-card text-card-foreground transition-colors">
      {/* Upper footer */}
      <div className="container mx-auto max-w-screen-2xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {/* Column 1: Village Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-white shadow-sm">
                क
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">
                {siteT("name")}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("aboutText")}</p>
            <div className="flex flex-col gap-1.5 pt-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                <span>{t("coordinates")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5 shrink-0 text-secondary" aria-hidden="true" />
                <span>{t("mcdZone")} • PIN 110071</span>
              </div>
            </div>
          </div>

          {/* Column 2: Civic Lifelines & Jurisdiction */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">
              {locale === "hi" ? "नागरिक क्षेत्राधिकार" : "Civic Jurisdiction"}
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-start gap-1.5">
                <span className="font-medium text-foreground">Police Station:</span>
                <span>Chhawla Police Station (011-25303100)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="font-medium text-foreground">District Hospital:</span>
                <span>RTRM Hospital, Jaffarpur Kalan</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="font-medium text-foreground">Sub-Division:</span>
                <span>SDM Najafgarh / Kapashera</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="font-medium text-foreground">Power Utility:</span>
                <span>BSES Rajdhani Power Ltd (19123)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="font-medium text-foreground">Water Supply:</span>
                <span>Delhi Jal Board (DJB Helpline 1916)</span>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Navigation */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">
              {t("quickLinks")}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/complaints"
                  className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-primary"
                >
                  <FileCheck className="h-3 w-3 text-primary" aria-hidden="true" />
                  <span>
                    {locale === "hi"
                      ? "शिकायत दर्ज करें (बिना लॉगिन)"
                      : "File Complaint (No Login)"}
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/directory"
                  className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-primary"
                >
                  <Building className="h-3 w-3 text-secondary" aria-hidden="true" />
                  <span>
                    {locale === "hi" ? "स्थानीय कारीगर एवं व्यापार" : "Karigaar & Local Directory"}
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/emergency"
                  className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-primary"
                >
                  <ShieldAlert className="h-3 w-3 text-danger-red" aria-hidden="true" />
                  <span>{locale === "hi" ? "आपातकालीन संपर्क सूची" : "Emergency SOS Hub"}</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/tools/land-converter"
                  className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-primary"
                >
                  <Scale className="h-3 w-3 text-amber-500" aria-hidden="true" />
                  <span>
                    {locale === "hi"
                      ? "जमीन यूनिट कनवर्टर (बीघा, बिस्वा)"
                      : "North Indian Land Converter"}
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/heritage"
                  className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-primary"
                >
                  <Heart className="h-3 w-3 text-rose-500" aria-hidden="true" />
                  <span>
                    {locale === "hi"
                      ? "कांगनहेड़ी इतिहास एवं शहीद स्मारक"
                      : "Village History & Achievers"}
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Compliance & Grievance */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">
              {t("legal")}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/privacy"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  {t("privacy")} (DPDP Act 2023)
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  {t("terms")}
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy/data-request"
                  className="inline-flex items-center gap-1 font-semibold text-primary transition-colors hover:underline"
                >
                  <span>{t("dataRequest")}</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </li>
            </ul>

            <div className="border-t border-border/60 pt-2">
              <span className="mb-1 block text-xs font-semibold text-foreground">
                {t("grievanceOfficer")}:
              </span>
              <p className="text-xs text-muted-foreground">
                Email: grievance@kanganheri.com
                <br />
                Office: Chaupal, Village Kanganheri, New Delhi - 110071
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border bg-muted/40 px-4 py-4 text-xs text-muted-foreground sm:px-6">
        <div className="container mx-auto flex max-w-screen-2xl flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
          <div>
            {t("copyright", { year: currentYear.toString() })} • {t("dpdpNote")}
          </div>
          <div className="flex items-center gap-1 font-medium text-primary">
            <span>{t("poweredBy")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
