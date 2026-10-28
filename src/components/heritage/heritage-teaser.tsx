import React from "react";
import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { Landmark, Award, ShieldCheck, Heart, ArrowRight } from "lucide-react";

export function HeritageTeaser() {
  const t = useTranslations("heritage");
  const locale = useLocale();

  return (
    <div className="dark:to-primary-950/10 card-base flex flex-col justify-between bg-gradient-to-br from-card via-card to-primary-50/20 p-6">
      <div>
        <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" aria-hidden="true" />
            <h3 className="text-lg font-bold text-foreground">{t("pageTitle")}</h3>
          </div>
          <Link
            href="/heritage"
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <span>{locale === "hi" ? "पूरा इतिहास देखें" : "Explore History"}</span>
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>

        <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
          {locale === "hi"
            ? "गाँव कांगनहेड़ी (110071) दक्षिण पश्चिम दिल्ली के नजफगढ़ परिक्षेत्र में स्थित एक ऐतिहासिक गाँव है। देशभक्ति, सेना में सेवा, खेल प्रतिभा एवं कृषि गौरव की समृद्ध परंपरा का प्रतीक।"
            : "Village Kanganheri (110071) is a historic settlement in the Najafgarh zone of South West Delhi, renowned for its heritage of national defense service, sports achievements, and agricultural resilience."}
        </p>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-danger-red/10 text-danger-red">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <span className="block text-xs font-bold text-foreground">{t("martyrs")}</span>
              <span className="text-[11px] text-muted-foreground">
                {locale === "hi" ? "शहीद वीर जवान" : "Brave Martyrs"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-border bg-background p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
              <Award className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <span className="block text-xs font-bold text-foreground">{t("achievers")}</span>
              <span className="text-[11px] text-muted-foreground">
                {locale === "hi" ? "खेल एवं शिक्षा गौरव" : "Sports & Academics"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
        <span>Najafgarh Tehsil • PIN 110071</span>
        <span className="flex items-center gap-1 font-semibold text-primary">
          <Heart className="h-3 w-3 fill-current text-rose-500" aria-hidden="true" />
          <span>Village Pride</span>
        </span>
      </div>
    </div>
  );
}
