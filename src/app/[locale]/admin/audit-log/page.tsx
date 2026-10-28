import React from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { Link } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type AuditLogWithActor = Prisma.AuditLogGetPayload<{
  include: {
    actor: {
      select: { displayName: true; email: true };
    };
  };
}>;

export default async function AdminAuditLogPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/admin/login");
  }

  let logs: AuditLogWithActor[] = [];
  try {
    logs = await db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        actor: {
          select: { displayName: true, email: true },
        },
      },
    });
  } catch (err) {
    console.warn("Notice: DB unreachable during AdminAuditLogPage fetch:", err);
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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-foreground">
              Immutable Cryptographic Audit Trail
            </h1>
            <Badge
              variant="outline"
              className="border-civic-green/30 text-[10px] font-bold uppercase text-civic-green"
            >
              Append-Only Table
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Tamper-evident logs of all administrative mutations, complaint status updates, and
            verification events.
          </p>
        </div>

        <span className="rounded bg-muted px-3 py-1 font-mono text-xs font-bold text-foreground">
          {logs.length} Entries
        </span>
      </div>

      {/* Table */}
      <div className="card-base overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/40 font-bold text-muted-foreground">
              <th className="p-4">Timestamp (IST)</th>
              <th className="p-4">Action</th>
              <th className="p-4">Actor</th>
              <th className="p-4">Entity</th>
              <th className="p-4">Anonymized IP Hash</th>
              <th className="p-4">State Snapshot</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {logs.map((log) => (
              <tr key={log.id} className="transition-colors hover:bg-muted/20">
                {/* Timestamp */}
                <td className="whitespace-nowrap p-4 align-top font-mono text-[11px] text-muted-foreground">
                  {new Date(log.createdAt).toLocaleString()}
                </td>

                {/* Action */}
                <td className="whitespace-nowrap p-4 align-top">
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-foreground text-primary">
                    {log.action}
                  </span>
                </td>

                {/* Actor */}
                <td className="whitespace-nowrap p-4 align-top">
                  <span className="block font-semibold text-foreground">
                    {log.actor?.displayName || "System / Public"}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {log.actorRole || "ANONYMOUS"}
                  </span>
                </td>

                {/* Entity */}
                <td className="whitespace-nowrap p-4 align-top">
                  <span className="block font-bold text-foreground">{log.entityType}</span>
                  {log.entityId && (
                    <span className="font-mono text-[10px] text-muted-foreground">
                      #{log.entityId.slice(-8)}
                    </span>
                  )}
                </td>

                {/* IP Hash */}
                <td className="whitespace-nowrap p-4 align-top font-mono text-[10px] text-muted-foreground">
                  {log.ipHash ? `${log.ipHash.slice(0, 12)}...` : "—"}
                </td>

                {/* State Snapshot */}
                <td className="max-w-sm p-4 align-top">
                  {log.newStateJson ? (
                    <pre className="max-h-24 overflow-x-auto rounded bg-muted/40 p-2 font-mono text-[10px]">
                      {JSON.stringify(log.newStateJson, null, 2)}
                    </pre>
                  ) : log.previousStateJson ? (
                    <pre className="max-h-24 overflow-x-auto rounded bg-muted/40 p-2 font-mono text-[10px]">
                      {JSON.stringify(log.previousStateJson, null, 2)}
                    </pre>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
