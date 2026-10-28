import React from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ComplaintStatus, VerificationStatus, AuditLog } from "@prisma/client";
import { Link } from "@/i18n/routing";
import { FileText, Clock, CheckCircle2, Building2, History, ArrowRight } from "lucide-react";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/admin/login");
  }

  // Query high-level civic telemetry & counts in parallel with graceful error boundary
  let totalComplaints = 0;
  let pendingComplaints = 0;
  let inProgressComplaints = 0;
  let resolvedComplaints = 0;
  let verifiedBusinesses = 0;
  let pendingBusinesses = 0;
  let recentAuditLogs: AuditLog[] = [];

  try {
    const res = await Promise.all([
      db.complaint.count(),
      db.complaint.count({ where: { status: ComplaintStatus.PENDING } }),
      db.complaint.count({ where: { status: ComplaintStatus.IN_PROGRESS } }),
      db.complaint.count({ where: { status: ComplaintStatus.RESOLVED } }),
      db.businessListing.count({ where: { verificationStatus: VerificationStatus.VERIFIED } }),
      db.businessListing.count({ where: { verificationStatus: VerificationStatus.PENDING } }),
      db.auditLog.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
      }),
    ]);
    totalComplaints = res[0];
    pendingComplaints = res[1];
    inProgressComplaints = res[2];
    resolvedComplaints = res[3];
    verifiedBusinesses = res[4];
    pendingBusinesses = res[5];
    recentAuditLogs = res[6];
  } catch (err) {
    console.warn("Notice: DB unreachable during AdminDashboard query:", err);
  }

  return (
    <div className="container mx-auto max-w-screen-2xl px-4 py-8 sm:px-6">
      {/* Welcome header */}
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Village Kanganheri Civic Command Center
          </span>
          <h1 className="text-3xl font-black text-foreground">Administration Dashboard</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Logged in as <span className="font-semibold text-foreground">{user.displayName}</span> (
            {user.email})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/complaints"
            className="rounded-md bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow transition-colors hover:bg-primary-700"
          >
            Moderate Complaints
          </Link>
          <Link
            href="/admin/directory"
            className="rounded-md bg-secondary px-4 py-2 text-xs font-bold text-secondary-foreground shadow transition-colors hover:bg-secondary/90"
          >
            Review Directory ({pendingBusinesses})
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Complaints */}
        <div className="card-base border-l-4 border-l-primary p-5">
          <div className="mb-2 flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase">Total Complaints</span>
            <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
          </div>
          <span className="text-3xl font-black text-foreground">{totalComplaints}</span>
          <p className="mt-1 text-[11px] text-muted-foreground">All-time civic issues filed</p>
        </div>

        {/* Pending Triage */}
        <div className="card-base border-l-4 border-l-amber-500 p-5">
          <div className="mb-2 flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase">Pending Triage</span>
            <Clock className="h-4 w-4 text-amber-500" aria-hidden="true" />
          </div>
          <span className="text-3xl font-black text-amber-600 dark:text-amber-400">
            {pendingComplaints}
          </span>
          <p className="mt-1 text-[11px] text-muted-foreground">Awaiting moderator review</p>
        </div>

        {/* In Progress */}
        <div className="card-base border-l-4 border-l-blue-500 p-5">
          <div className="mb-2 flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase">In Progress / Escalated</span>
            <Clock className="h-4 w-4 text-blue-500" aria-hidden="true" />
          </div>
          <span className="text-3xl font-black text-blue-600 dark:text-blue-400">
            {inProgressComplaints}
          </span>
          <p className="mt-1 text-[11px] text-muted-foreground">Sent to MCD / BSES / DJB</p>
        </div>

        {/* Resolved */}
        <div className="card-base border-l-4 border-l-civic-green p-5">
          <div className="mb-2 flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase">Resolved Issues</span>
            <CheckCircle2 className="h-4 w-4 text-civic-green" aria-hidden="true" />
          </div>
          <span className="text-3xl font-black text-civic-green">{resolvedComplaints}</span>
          <p className="mt-1 text-[11px] text-muted-foreground">Verified resolved</p>
        </div>
      </div>

      {/* Directory & Audit Log Split */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Left: Quick Actions & Pending Businesses (6 cols) */}
        <div className="space-y-6 lg:col-span-6">
          <div className="card-base p-6">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-secondary" aria-hidden="true" />
                <h3 className="text-base font-bold text-foreground">
                  Business Directory Verification
                </h3>
              </div>
              <Link
                href="/admin/directory"
                className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                <span>View All</span>
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-civic-green/20 bg-civic-green/10 p-4">
                <span className="block text-xs font-bold uppercase text-civic-green">
                  Verified Active
                </span>
                <span className="text-2xl font-black text-foreground">{verifiedBusinesses}</span>
              </div>

              <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
                <span className="block text-xs font-bold uppercase text-amber-600 dark:text-amber-400">
                  Pending Approvals
                </span>
                <span className="text-2xl font-black text-foreground">{pendingBusinesses}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Immutable Audit Trail Preview (6 cols) */}
        <div className="space-y-6 lg:col-span-6">
          <div className="card-base p-6">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" aria-hidden="true" />
                <h3 className="text-base font-bold text-foreground">
                  Recent Cryptographic Audit Logs
                </h3>
              </div>
              <Link
                href="/admin/audit-log"
                className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                <span>Full Audit Trail</span>
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </Link>
            </div>

            <div className="space-y-3">
              {recentAuditLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-border/80 bg-background/50 p-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-foreground">{log.action}</span>
                    <span className="block text-[11px] text-muted-foreground">
                      Entity: {log.entityType} {log.entityId ? `(#${log.entityId.slice(-6)})` : ""}
                    </span>
                  </div>
                  <span className="whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
