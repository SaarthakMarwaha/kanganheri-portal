import React from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ComplaintStatus } from "@prisma/client";
import { ComplaintModeratorRow } from "@/components/admin/complaint-moderator-row";
import { Link } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";

interface AdminComplaintItem {
  id: string;
  trackingId: string;
  status: ComplaintStatus;
  category: string;
  streetTag: string;
  descriptionHi: string;
  createdAt: Date;
  adminNotes: string | null;
}

export default async function AdminComplaintsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/admin/login");
  }

  let complaints: AdminComplaintItem[] = [];
  try {
    complaints = await db.complaint.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        trackingId: true,
        status: true,
        category: true,
        streetTag: true,
        descriptionHi: true,
        createdAt: true,
        adminNotes: true,
      },
      take: 50,
    });
  } catch (err) {
    console.warn("Notice: DB unreachable during AdminComplaintsPage fetch:", err);
  }

  return (
    <div className="container mx-auto max-w-screen-2xl px-4 py-8 sm:px-6">
      {/* Header */}
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
            Complaint Triage & Status Moderation
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Update civic issue statuses and publish timeline updates. All updates are
            cryptographically recorded in the AuditLog.
          </p>
        </div>

        <span className="rounded bg-muted px-3 py-1 font-mono text-xs font-bold text-foreground">
          Showing {complaints.length} Records
        </span>
      </div>

      {/* Table */}
      <div className="card-base overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/40 font-bold text-muted-foreground">
              <th className="p-4">Tracking ID / Date</th>
              <th className="p-4">Category / Locality</th>
              <th className="p-4">Description</th>
              <th className="p-4">Status</th>
              <th className="p-4">Notes (Timeline / Private)</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {complaints.map((c) => (
              <ComplaintModeratorRow key={c.id} complaint={c} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
