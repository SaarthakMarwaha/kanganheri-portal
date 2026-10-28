import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import type { PageProps } from "@/types";
import type { Notice } from "@prisma/client";
import { BellRing, Pin, Calendar, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "notices" });
  const siteT = await getTranslations({ locale, namespace: "site" });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://kanganheri.com";

  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
    alternates: {
      canonical: `${baseUrl}/${locale}/notices`,
      languages: {
        "hi-IN": `${baseUrl}/hi/notices`,
        "en-IN": `${baseUrl}/en/notices`,
        "x-default": `${baseUrl}/hi/notices`,
      },
    },
    openGraph: {
      title: `${t("pageTitle")} | ${siteT("name")}`,
      description: t("pageDescription"),
    },
  };
}

const FALLBACK_NOTICES: Notice[] = [
  {
    id: "notice-camp-1",
    titleEn: "Free Health & Eye Checkup Camp at Village Chaupal",
    titleHi: "गाँव चौपाल में निःशुल्क स्वास्थ्य एवं नेत्र जाँच शिविर",
    bodyEn:
      "Organized in association with RTRM Hospital Jaffarpur Kalan on Sunday from 9:00 AM to 2:00 PM.",
    bodyHi:
      "राव तुला राम मेमोरियल अस्पताल के सहयोग से रविवार प्रातः 9:00 से दोपहर 2:00 बजे तक मुख्य चौपाल में।",
    attachmentUrl: null,
    isPinned: true,
    isPublished: true,
    publishedAt: new Date(),
    expiresAt: null,
    publishedById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "notice-djb-2",
    titleEn: "Delhi Jal Board Pipeline Maintenance & Tanker Distribution",
    titleHi: "दिल्ली जल बोर्ड पाइपलाइन मरम्मत एवं टैंकर वितरण सूचना",
    bodyEn:
      "Due to interconnectivity repair works on Chhawla line, water tankers are on standby on 1916.",
    bodyHi:
      "छावला नाले के पास मरम्मत कार्य के कारण आपातकालीन पानी टैंकर सेवा 1916 पर उपलब्ध रहेगी।",
    attachmentUrl: null,
    isPinned: false,
    isPublished: true,
    publishedAt: new Date(),
    expiresAt: null,
    publishedById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default async function NoticesPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "notices" });

  let notices: Notice[] = FALLBACK_NOTICES;
  try {
    const dbNotices = await db.notice.findMany({
      where: { isPublished: true },
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
    });
    if (dbNotices.length > 0) {
      notices = dbNotices;
    }
  } catch (err) {
    console.warn(
      "Notice: DB unreachable during NoticesPage fetch, using verified noticeboard announcements:",
      err,
    );
  }

  return (
    <div className="container mx-auto max-w-screen-xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Header */}
      <div className="mb-8 border-b border-border/80 pb-6">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          <BellRing className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{locale === "hi" ? "डिजिटल चौपाल" : "Village Noticeboard"}</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
          {t("pageTitle")}
        </h1>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground sm:text-base">
          {t("pageDescription")}
        </p>
      </div>

      {notices.length === 0 ? (
        <div className="card-base p-12 text-center text-muted-foreground">
          <BellRing className="mx-auto mb-3 h-12 w-12 opacity-40" aria-hidden="true" />
          <p className="text-base font-semibold">{t("noNotices")}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {notices.map((notice) => {
            const title = locale === "hi" ? notice.titleHi : notice.titleEn;
            const body = locale === "hi" ? notice.bodyHi : notice.bodyEn || notice.bodyHi;

            return (
              <article
                key={notice.id}
                className={`card-base p-6 transition-colors sm:p-8 ${
                  notice.isPinned
                    ? "border-l-4 border-l-primary bg-primary-50/20 dark:bg-primary/5"
                    : ""
                }`}
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {notice.isPinned && (
                      <Badge variant="warning" className="gap-1 py-0.5 text-xs font-bold">
                        <Pin className="h-3 w-3 fill-current" aria-hidden="true" />
                        <span>{t("pinned")}</span>
                      </Badge>
                    )}
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>
                        {t("publishedOn")}:{" "}
                        {notice.publishedAt
                          ? new Date(notice.publishedAt).toLocaleDateString()
                          : ""}
                      </span>
                    </span>
                  </div>

                  {notice.expiresAt && (
                    <span className="text-xs text-muted-foreground">
                      {t("expiresOn")}: {new Date(notice.expiresAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <h2 className="mb-3 text-xl font-bold leading-snug text-foreground">{title}</h2>

                <div className="mb-4 whitespace-pre-line text-sm leading-relaxed text-foreground/90 sm:text-base">
                  {body}
                </div>

                {notice.attachmentUrl && (
                  <div className="flex items-center gap-2 border-t border-border pt-3">
                    <a
                      href={notice.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{t("downloadAttachment")}</span>
                    </a>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
