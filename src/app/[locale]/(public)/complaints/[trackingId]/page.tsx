import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/seo/json-ld";
import {
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

const DEMO_COMPLAINTS_DETAIL: Record<
  string,
  {
    id: string;
    trackingId: string;
    status: string;
    category: string;
    streetTag: string;
    descriptionHi: string;
    descriptionEn: string;
    createdAt: Date;
    photos: Array<{ id: string; publicUrl: string }>;
    statusHistory: Array<{ toStatus: string; createdAt: Date; publicNote: string | null }>;
  }
> = {
  "KH-2026-0001": {
    id: "comp-sample-1",
    trackingId: "KH-2026-0001",
    status: "IN_PROGRESS",
    category: "WATERLOGGING",
    streetTag: "Primary School Road, Ward 42",
    descriptionHi:
      "स्कूल के सामने मुख्य रास्ते पर 2 फीट बारिश का पानी जमा है। बच्चों और ग्रामीणों का निकलना मुश्किल हो रहा है।",
    descriptionEn:
      "Severe water accumulation outside primary school entrance. Drainage blockage needs immediate pumping.",
    createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 2),
    photos: [],
    statusHistory: [
      {
        toStatus: "PENDING",
        createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 2),
        publicNote: "शिकायत ऑनलाइन दर्ज हुई (Grievance logged via public portal).",
      },
      {
        toStatus: "REVIEWING",
        createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 1.5),
        publicNote:
          "कांगनहेड़ी ग्राम मॉडरेटर द्वारा समस्या सत्यापित की गई (Verified by village moderator).",
      },
      {
        toStatus: "IN_PROGRESS",
        createdAt: new Date(Date.now() - 3600 * 1000 * 12),
        publicNote:
          "MCD नजफगढ़ वार्ड 42 ड्रेनेज टीम को पंपिंग एवं नाली सफाई हेतु भेजा गया (MCD squad dispatched).",
      },
    ],
  },
  "KH-2026-0002": {
    id: "comp-sample-2",
    trackingId: "KH-2026-0002",
    status: "RESOLVED",
    category: "BROKEN_STREETLIGHT",
    streetTag: "Main Chaupal Marg",
    descriptionHi:
      "चौपाल के पास पोल नंबर 14 पर लगी LED लाइट पिछले 4 दिनों से बंद थी। अंधेरे के कारण वरिष्ठ नागरिकों को परेशानी थी।",
    descriptionEn:
      "Streetlight on pole #14 near Chaupal was non-functional. MCD electrical squad replaced the LED fixture.",
    createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 4),
    photos: [],
    statusHistory: [
      {
        toStatus: "PENDING",
        createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 4),
        publicNote: "शिकायत दर्ज (Report registered).",
      },
      {
        toStatus: "IN_PROGRESS",
        createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 2),
        publicNote:
          "BSES / MCD स्ट्रीटलाइट मेंटेनेंस टीम को प्रेषित (Escalated to lighting division).",
      },
      {
        toStatus: "RESOLVED",
        createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 1),
        publicNote:
          "LED बल्ब और वायरिंग बदल दी गई है। लाइट सुचारू रूप से चालू है (Replaced & functional).",
      },
    ],
  },
  "KH-2026-0003": {
    id: "comp-sample-3",
    trackingId: "KH-2026-0003",
    status: "REVIEWING",
    category: "POTHOLE",
    streetTag: "Najafgarh-Chhawla Link Mor",
    descriptionHi:
      "लिंक रोड पर बड़ा गड्ढा हो गया है, दोपहिया वाहन चालकों के गिरने का खतरा बना रहता है। पैचवर्क की आवश्यकता है।",
    descriptionEn:
      "Deep pothole developed on main link road bend posing risk to two-wheelers. PWD/MCD patch repair requested.",
    createdAt: new Date(Date.now() - 3600 * 1000 * 18),
    photos: [],
    statusHistory: [
      {
        toStatus: "PENDING",
        createdAt: new Date(Date.now() - 3600 * 1000 * 18),
        publicNote: "शिकायत ऑनलाइन दर्ज हुई (Grievance registered).",
      },
      {
        toStatus: "REVIEWING",
        createdAt: new Date(Date.now() - 3600 * 1000 * 6),
        publicNote:
          "सड़क निरीक्षण हेतु पीडब्ल्यूडी नजफगढ़ को सूचना प्रेषित (Inspection scheduled).",
      },
    ],
  },
};

interface ComplaintDetailProps {
  params: Promise<{ locale: string; trackingId: string }>;
}

export async function generateMetadata({ params }: ComplaintDetailProps): Promise<Metadata> {
  const { locale, trackingId } = await params;
  const normalizedId = trackingId.toUpperCase();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://kanganheri.com";

  return {
    title: `Complaint ${normalizedId} Status Timeline`,
    description: `Track real-time resolution timeline for complaint ${normalizedId} in Village Kanganheri (110071).`,
    alternates: {
      canonical: `${baseUrl}/${locale}/complaints/${normalizedId}`,
      languages: {
        "hi-IN": `${baseUrl}/hi/complaints/${normalizedId}`,
        "en-IN": `${baseUrl}/en/complaints/${normalizedId}`,
        "x-default": `${baseUrl}/hi/complaints/${normalizedId}`,
      },
    },
  };
}

export default async function ComplaintDetailPage({ params }: ComplaintDetailProps) {
  const { locale, trackingId } = await params;
  const t = await getTranslations({ locale, namespace: "complaints" });
  const normalizedId = trackingId.toUpperCase();

  let complaint = null;
  try {
    complaint = await db.complaint.findUnique({
      where: { trackingId: normalizedId },
      include: {
        photos: true,
        statusHistory: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  } catch (err) {
    console.warn(`Notice: Failed to query complaint ${normalizedId}:`, err);
  }

  if (!complaint && DEMO_COMPLAINTS_DETAIL[normalizedId]) {
    complaint = DEMO_COMPLAINTS_DETAIL[normalizedId];
  }

  if (!complaint) {
    notFound();
  }

  const desc =
    locale === "hi" ? complaint.descriptionHi : complaint.descriptionEn || complaint.descriptionHi;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RESOLVED":
        return (
          <Badge variant="success" className="gap-1 px-3 py-1 text-xs">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            <span>{t(`status.${status}`)}</span>
          </Badge>
        );
      case "IN_PROGRESS":
      case "REVIEWING":
        return (
          <Badge variant="default" className="gap-1 bg-blue-600 px-3 py-1 text-xs">
            <Clock className="h-4 w-4" aria-hidden="true" />
            <span>{t(`status.${status}`)}</span>
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="destructive" className="gap-1 px-3 py-1 text-xs">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <span>{t(`status.${status}`)}</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="warning" className="gap-1 px-3 py-1 text-xs">
            <Clock className="h-4 w-4" aria-hidden="true" />
            <span>{t(`status.PENDING`)}</span>
          </Badge>
        );
    }
  };

  const breadcrumbs = {
    type: "BreadcrumbList" as const,
    itemListElement: [
      { position: 1, name: "Home", item: `/${locale}` },
      { position: 2, name: "Complaints", item: `/${locale}/complaints` },
      { position: 3, name: normalizedId, item: `/${locale}/complaints/${normalizedId}` },
    ],
  };

  return (
    <div className="container mx-auto max-w-screen-xl px-4 py-8 sm:px-6 sm:py-12">
      <JsonLd data={breadcrumbs} />

      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/complaints"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>{locale === "hi" ? "शिकायत सूची पर वापस जाएँ" : "Back to Complaints"}</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Main Details (8 cols) */}
        <div className="space-y-6 lg:col-span-8">
          <div className="card-base p-6 sm:p-8">
            {/* Header info */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border/70 pb-4">
              <div>
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {locale === "hi" ? "ट्रैकिंग कोड" : "Complaint Tracking ID"}
                </span>
                <h1 className="font-mono text-2xl font-black text-primary sm:text-3xl">
                  {complaint.trackingId}
                </h1>
              </div>

              <div>{getStatusBadge(complaint.status)}</div>
            </div>

            {/* Meta attributes */}
            <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg border border-border/60 bg-muted/20 p-4 text-xs sm:grid-cols-3">
              <div>
                <span className="mb-0.5 block text-muted-foreground">{t("category")}</span>
                <span className="font-bold text-foreground">
                  {t(`categories.${complaint.category}`)}
                </span>
              </div>

              <div>
                <span className="mb-0.5 block text-muted-foreground">{t("streetTag")}</span>
                <span className="flex items-center gap-1 font-bold text-foreground">
                  <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  <span>{complaint.streetTag}</span>
                </span>
              </div>

              <div>
                <span className="mb-0.5 block text-muted-foreground">{t("submittedOn")}</span>
                <span className="flex items-center gap-1 font-bold text-foreground">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                  <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-foreground">
                {locale === "hi" ? "समस्या का विवरण" : "Issue Description"}
              </h3>
              <p className="rounded-md border border-border bg-background p-4 text-sm leading-relaxed text-foreground sm:text-base">
                {desc}
              </p>
            </div>

            {/* Photos */}
            {complaint.photos && complaint.photos.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-foreground">
                  {locale === "hi" ? "संलग्न तस्वीरें" : "Attached Evidence Photos"}
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {complaint.photos.map((p) => (
                    <div
                      key={p.id}
                      className="relative h-60 overflow-hidden rounded-lg border border-border bg-muted shadow-sm"
                    >
                      <Image
                        src={p.publicUrl}
                        alt={`Complaint photo for ${complaint.trackingId}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 400px"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Timeline & Actions Sidebar (4 cols) */}
        <div className="space-y-6 lg:col-span-4">
          {/* Status Timeline */}
          <div className="card-base p-6">
            <h3 className="mb-4 border-b border-border/70 pb-2 text-base font-bold uppercase tracking-wider text-foreground">
              {t("timeline")}
            </h3>

            <ol className="relative ml-3 space-y-6 border-l-2 border-primary/40">
              {complaint.statusHistory.map((step, idx) => (
                <li key={idx} className="relative pl-6">
                  <span
                    className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full border-2 border-background bg-primary"
                    aria-hidden="true"
                  />
                  <div className="space-y-1">
                    <span className="block text-sm font-bold text-foreground">
                      {t(`status.${step.toStatus}`)}
                    </span>
                    <span className="block font-mono text-[11px] text-muted-foreground">
                      {new Date(step.createdAt).toLocaleString()}
                    </span>
                    {step.publicNote && (
                      <p className="rounded bg-muted/40 p-2 pt-1 text-xs text-muted-foreground">
                        {step.publicNote}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Civic Help Box */}
          <div className="card-base space-y-2 border-primary/20 bg-primary-50/40 p-5 text-xs text-muted-foreground dark:bg-primary/5">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>
                {locale === "hi" ? "MCD नजफगढ़ जोन निगरानी" : "MCD Najafgarh Zone Supervision"}
              </span>
            </div>
            <p>
              {locale === "hi"
                ? "यह शिकायत कांगनहेड़ी नागरिक पोर्टल के माध्यम से सीधे संबंधित अधिकारियों के संज्ञान में है।"
                : "This grievance is tracked publicly for transparency under South West Delhi civic supervision."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
