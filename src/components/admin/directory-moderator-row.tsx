"use client";

import React, { useTransition } from "react";
import { verifyBusinessAction } from "@/actions/admin-actions";
import { VerificationStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Loader2 } from "lucide-react";

interface DirectoryRowProps {
  business: {
    id: string;
    slug: string;
    nameEn: string;
    nameHi: string;
    category: string;
    phone: string;
    streetTag: string | null;
    verificationStatus: VerificationStatus;
    createdAt: Date;
  };
}

export function DirectoryModeratorRow({ business }: DirectoryRowProps) {
  const [isPending, startTransition] = useTransition();

  const handleVerify = (status: VerificationStatus) => {
    startTransition(async () => {
      await verifyBusinessAction({
        businessId: business.id,
        status,
      });
    });
  };

  return (
    <tr className="border-b border-border/80 transition-colors hover:bg-muted/20">
      {/* Name */}
      <td className="p-4 align-top">
        <span className="block text-xs font-bold text-foreground">{business.nameEn}</span>
        <span className="block text-[11px] text-muted-foreground">{business.nameHi}</span>
        <span className="mt-0.5 block font-mono text-[10px] text-primary">/{business.slug}</span>
      </td>

      {/* Category */}
      <td className="whitespace-nowrap p-4 align-top">
        <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">
          {business.category}
        </span>
      </td>

      {/* Contact */}
      <td className="whitespace-nowrap p-4 align-top">
        <span className="block font-mono text-xs font-semibold text-foreground">
          {business.phone}
        </span>
        <span className="text-[11px] text-muted-foreground">
          📍 {business.streetTag || "Village Kanganheri"}
        </span>
      </td>

      {/* Status */}
      <td className="whitespace-nowrap p-4 align-top">
        <Badge
          variant={
            business.verificationStatus === "VERIFIED"
              ? "success"
              : business.verificationStatus === "REJECTED"
                ? "destructive"
                : "warning"
          }
        >
          {business.verificationStatus}
        </Badge>
      </td>

      {/* Actions */}
      <td className="whitespace-nowrap p-4 text-right align-top">
        {isPending ? (
          <Loader2 className="inline-block h-4 w-4 animate-spin text-primary" aria-hidden="true" />
        ) : (
          <div className="flex items-center justify-end gap-1.5">
            {business.verificationStatus !== "VERIFIED" && (
              <Button
                type="button"
                size="sm"
                onClick={() => handleVerify(VerificationStatus.VERIFIED)}
                className="h-8 gap-1 bg-civic-green px-2.5 text-xs font-semibold text-white hover:bg-civic-green/90"
              >
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Approve</span>
              </Button>
            )}

            {business.verificationStatus !== "REJECTED" && (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => handleVerify(VerificationStatus.REJECTED)}
                className="h-8 gap-1 px-2.5 text-xs font-semibold"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Reject</span>
              </Button>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}
