import React from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { NoticeManagerClient } from "@/components/admin/notice-form";
import { Link } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";

interface AdminNoticeItem {
  id: string;
  titleEn: string;
  titleHi: string;
  isPinned: boolean;
  publishedAt: Date | null;
}

export default async function AdminNoticesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/admin/login");
  }

  let notices: AdminNoticeItem[] = [];
  try {
    notices = await db.notice.findMany({
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        titleEn: true,
        titleHi: true,
        isPinned: true,
        publishedAt: true,
      },
    });
  } catch (err) {
    console.warn("Notice: DB unreachable during AdminNoticesPage fetch:", err);
  }

  return (
    <div className="container mx-auto max-w-screen-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <Link
            href="/admin"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Dashboard</span>
          </Link>
          <h1 className="text-2xl font-black text-foreground">
            Village Noticeboard & Chaupal Announcements
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Publish public alerts, medical camps, and statutory notices for Village Kanganheri.
          </p>
        </div>
      </div>

      <NoticeManagerClient notices={notices} />
    </div>
  );
}
