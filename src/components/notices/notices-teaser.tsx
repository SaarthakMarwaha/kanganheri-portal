import React from "react";
import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { BellRing, Pin, ArrowRight, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SAMPLE_NOTICES = [
  {
    id: "notice-1",
    titleEn: "Free Health & Eye Checkup Camp at Village Chaupal",
    titleHi: "गाँव चौपाल में निःशुल्क स्वास्थ्य एवं नेत्र जाँच शिविर",
    bodyEn:
      "Organized in association with RTRM Hospital Jaffarpur Kalan on Sunday from 9:00 AM to 2:00 PM.",
    bodyHi:
      "राव तुला राम मेमोरियल अस्पताल के सहयोग से रविवार प्रातः 9:00 से दोपहर 2:00 बजे तक मुख्य चौपाल में।",
    date: "2026-11-02",
    isPinned: true,
  },
  {
    id: "notice-2",
    titleEn: "DJB Pipeline Maintenance & Tanker Schedule Notice",
    titleHi: "दिल्ली जल बोर्ड पाइपलाइन मरम्मत एवं टैंकर वितरण सूचना",
    bodyEn:
      "Due to interconnection works near Chhawla drain, water pressure will be low on Thursday morning.",
    bodyHi:
      "छावला नाले के पास मरम्मत कार्य के कारण गुरुवार सुबह पानी का दबाव कम रहेगा। आपातकालीन टैंकर 1916 पर उपलब्ध हैं।",
    date: "2026-10-30",
    isPinned: false,
  },
  {
    id: "notice-3",
    titleEn: "Delhi e-District Camp: OBC/SC Certificate & Income Attestation",
    titleHi: "दिल्ली ई-डिस्ट्रिक्ट शिविर: जाति, आय एवं निवास प्रमाण पत्र",
    bodyEn:
      "SDM Najafgarh mobile camp at Kanganheri Government School for on-spot document verification.",
    bodyHi:
      "एसडीएम नजफगढ़ मोबाइल कैंप राजकीय सर्वोदय विद्यालय कांगनहेड़ी में प्रमाण पत्र सत्यापन हेतु आयोजित होगा।",
    date: "2026-10-25",
    isPinned: false,
  },
];

export function NoticesTeaser() {
  const t = useTranslations("notices");
  const locale = useLocale();

  return (
    <div className="card-base flex flex-col justify-between p-6">
      <div>
        <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-primary" aria-hidden="true" />
            <h3 className="text-lg font-bold text-foreground">{t("pageTitle")}</h3>
          </div>
          <Link
            href="/notices"
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <span>{locale === "hi" ? "सभी देखें" : "View All"}</span>
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>

        <div className="space-y-3">
          {SAMPLE_NOTICES.map((notice) => {
            const title = locale === "hi" ? notice.titleHi : notice.titleEn;
            const body = locale === "hi" ? notice.bodyHi : notice.bodyEn;

            return (
              <div
                key={notice.id}
                className="rounded-lg border border-border/80 bg-background/60 p-3.5 transition-colors hover:bg-muted/40"
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {notice.isPinned && (
                      <Badge variant="warning" className="gap-1 px-1.5 py-0 text-[10px] font-bold">
                        <Pin className="h-2.5 w-2.5 fill-current" aria-hidden="true" />
                        <span>{t("pinned")}</span>
                      </Badge>
                    )}
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Calendar className="h-3 w-3" aria-hidden="true" />
                      <span>{notice.date}</span>
                    </span>
                  </div>
                </div>

                <h4 className="mb-1 text-sm font-bold text-foreground">{title}</h4>
                <p className="line-clamp-2 text-xs text-muted-foreground">{body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
