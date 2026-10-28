"use client";

import React, { useState, useTransition } from "react";
import { updateComplaintStatusAction } from "@/actions/admin-actions";
import { ComplaintStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Loader2, Check } from "lucide-react";

interface ComplaintRowProps {
  complaint: {
    id: string;
    trackingId: string;
    status: ComplaintStatus;
    category: string;
    streetTag: string;
    descriptionHi: string;
    createdAt: Date;
    adminNotes: string | null;
  };
}

export function ComplaintModeratorRow({ complaint }: ComplaintRowProps) {
  const [status, setStatus] = useState<ComplaintStatus>(complaint.status);
  const [publicNote, setPublicNote] = useState("");
  const [adminNotes, setAdminNotes] = useState(complaint.adminNotes || "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const handleUpdate = () => {
    startTransition(async () => {
      const res = await updateComplaintStatusAction({
        complaintId: complaint.id,
        toStatus: status,
        publicNote: publicNote.trim() || undefined,
        adminNotes: adminNotes.trim() || undefined,
      });

      if (res.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    });
  };

  return (
    <tr className="border-b border-border/80 transition-colors hover:bg-muted/20">
      {/* Tracking ID & Date */}
      <td className="whitespace-nowrap p-4 align-top">
        <span className="block font-mono text-xs font-bold text-primary">
          {complaint.trackingId}
        </span>
        <span className="text-[11px] text-muted-foreground">
          {new Date(complaint.createdAt).toLocaleDateString()}
        </span>
      </td>

      {/* Category & Street */}
      <td className="p-4 align-top">
        <span className="block text-xs font-bold text-foreground">{complaint.category}</span>
        <span className="text-[11px] text-muted-foreground">📍 {complaint.streetTag}</span>
      </td>

      {/* Description */}
      <td className="max-w-xs p-4 align-top">
        <p className="line-clamp-2 text-xs text-foreground">{complaint.descriptionHi}</p>
      </td>

      {/* Status selector */}
      <td className="whitespace-nowrap p-4 align-top">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ComplaintStatus)}
          className="rounded-md border border-input bg-background p-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
        >
          {Object.values(ComplaintStatus).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </td>

      {/* Public Note & Admin Notes */}
      <td className="min-w-[200px] p-4 align-top">
        <input
          type="text"
          value={publicNote}
          onChange={(e) => setPublicNote(e.target.value)}
          placeholder="Public timeline note..."
          className="mb-1 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
        />
        <input
          type="text"
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Internal notes (private)..."
          className="w-full rounded-md border border-input bg-muted/40 px-2 py-1 text-[11px]"
        />
      </td>

      {/* Action */}
      <td className="whitespace-nowrap p-4 text-right align-top">
        <Button
          type="button"
          size="sm"
          onClick={handleUpdate}
          disabled={isPending}
          className="h-8 bg-primary px-3 text-xs font-semibold hover:bg-primary-700"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : saved ? (
            <Check className="h-3.5 w-3.5 text-white" aria-hidden="true" />
          ) : (
            <span>Save</span>
          )}
        </Button>
      </td>
    </tr>
  );
}
