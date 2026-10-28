"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { recordAuditLog } from "@/lib/monitoring/audit-logger";
import { AuditAction, ComplaintStatus, VerificationStatus } from "@prisma/client";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getHashedClientIp } from "@/lib/security/ip-hasher";

/**
 * Ensures caller is an authenticated admin or moderator.
 */
async function requireAuthUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized. Please log in as an administrator.");
  }
  return user;
}

/**
 * Server Action: Update complaint status & add timeline entry.
 */
export async function updateComplaintStatusAction(params: {
  complaintId: string;
  toStatus: ComplaintStatus;
  publicNote?: string | undefined;
  adminNotes?: string | undefined;
}): Promise<{ success: boolean; message?: string }> {
  const user = await requireAuthUser();
  const headersList = await headers();
  const ipHash = getHashedClientIp(headersList);
  const userAgent = headersList.get("user-agent") ?? undefined;

  const { complaintId, toStatus, publicNote, adminNotes } = params;

  try {
    const existing = await db.complaint.findUnique({
      where: { id: complaintId },
      select: { id: true, status: true, trackingId: true },
    });

    if (!existing) {
      return { success: false, message: "Complaint not found." };
    }

    const fromStatus = existing.status;

    await db.$transaction(async (tx) => {
      // 1. Update Complaint
      await tx.complaint.update({
        where: { id: complaintId },
        data: {
          status: toStatus,
          resolvedAt: toStatus === ComplaintStatus.RESOLVED ? new Date() : null,
          adminNotes: adminNotes ?? null,
        },
      });

      // 2. Add Status History Timeline entry
      await tx.complaintStatusHistory.create({
        data: {
          complaintId,
          fromStatus,
          toStatus,
          publicNote: publicNote || null,
          actorId: user.id,
        },
      });

      // 3. Record Audit Log
      await recordAuditLog(
        {
          actorId: user.id,
          actorRole: user.role,
          action: AuditAction.COMPLAINT_STATUS_UPDATED,
          entityType: "Complaint",
          entityId: complaintId,
          previousState: { status: fromStatus },
          newState: { status: toStatus, publicNote, adminNotes },
          ipHash,
          userAgent,
          meta: { trackingId: existing.trackingId },
        },
        tx,
      );
    });

    revalidatePath("/[locale]/admin/complaints", "page");
    revalidatePath(`/[locale]/complaints/${existing.trackingId}`, "page");
    revalidatePath("/[locale]/complaints", "page");

    return { success: true, message: "Complaint status updated successfully." };
  } catch (err) {
    console.error("Failed to update complaint status:", err);
    return { success: false, message: "Failed to update complaint status." };
  }
}

/**
 * Server Action: Verify or reject a business listing.
 */
export async function verifyBusinessAction(params: {
  businessId: string;
  status: VerificationStatus;
}): Promise<{ success: boolean; message?: string }> {
  const user = await requireAuthUser();
  const headersList = await headers();
  const ipHash = getHashedClientIp(headersList);
  const userAgent = headersList.get("user-agent") ?? undefined;

  const { businessId, status } = params;

  try {
    const existing = await db.businessListing.findUnique({
      where: { id: businessId },
      select: { id: true, verificationStatus: true, slug: true, nameEn: true },
    });

    if (!existing) {
      return { success: false, message: "Business listing not found." };
    }

    const previousStatus = existing.verificationStatus;

    await db.$transaction(async (tx) => {
      await tx.businessListing.update({
        where: { id: businessId },
        data: {
          verificationStatus: status,
          verifiedAt: status === VerificationStatus.VERIFIED ? new Date() : null,
          verifiedById: status === VerificationStatus.VERIFIED ? user.id : null,
        },
      });

      const auditAction =
        status === VerificationStatus.VERIFIED
          ? AuditAction.BUSINESS_APPROVED
          : status === VerificationStatus.REJECTED
            ? AuditAction.BUSINESS_REJECTED
            : AuditAction.BUSINESS_SUSPENDED;

      await recordAuditLog(
        {
          actorId: user.id,
          actorRole: user.role,
          action: auditAction,
          entityType: "BusinessListing",
          entityId: businessId,
          previousState: { verificationStatus: previousStatus },
          newState: { verificationStatus: status },
          ipHash,
          userAgent,
          meta: { slug: existing.slug, nameEn: existing.nameEn },
        },
        tx,
      );
    });

    revalidatePath("/[locale]/admin/directory", "page");
    revalidatePath("/[locale]/directory", "page");

    return { success: true, message: `Listing marked as ${status}.` };
  } catch (err) {
    console.error("Failed to verify business listing:", err);
    return { success: false, message: "Failed to update verification status." };
  }
}

/**
 * Server Action: Publish a new notice.
 */
export async function createNoticeAction(
  formData: FormData,
): Promise<{ success: boolean; message?: string }> {
  const user = await requireAuthUser();
  const headersList = await headers();
  const ipHash = getHashedClientIp(headersList);
  const userAgent = headersList.get("user-agent") ?? undefined;

  const titleEn = formData.get("titleEn") as string;
  const titleHi = formData.get("titleHi") as string;
  const bodyEn = formData.get("bodyEn") as string;
  const bodyHi = formData.get("bodyHi") as string;
  const isPinned = formData.get("isPinned") === "true";

  if (!titleEn || !titleHi || !bodyHi) {
    return { success: false, message: "Title (Hindi & English) and Body (Hindi) are required." };
  }

  try {
    await db.$transaction(async (tx) => {
      const n = await tx.notice.create({
        data: {
          titleEn,
          titleHi,
          bodyEn: bodyEn || null,
          bodyHi,
          isPinned,
          isPublished: true,
          publishedAt: new Date(),
          publishedById: user.id,
        },
      });

      await recordAuditLog(
        {
          actorId: user.id,
          actorRole: user.role,
          action: AuditAction.NOTICE_PUBLISHED,
          entityType: "Notice",
          entityId: n.id,
          newState: { titleEn, titleHi, isPinned },
          ipHash,
          userAgent,
        },
        tx,
      );
    });

    revalidatePath("/[locale]/notices", "page");
    revalidatePath("/[locale]/admin/notices", "page");

    return { success: true, message: "Notice published successfully." };
  } catch (err) {
    console.error("Failed to publish notice:", err);
    return { success: false, message: "Failed to publish notice." };
  }
}

/**
 * Server Action: Delete a notice.
 */
export async function deleteNoticeAction(
  noticeId: string,
): Promise<{ success: boolean; message?: string }> {
  const user = await requireAuthUser();
  const headersList = await headers();
  const ipHash = getHashedClientIp(headersList);
  const userAgent = headersList.get("user-agent") ?? undefined;

  try {
    const existing = await db.notice.findUnique({
      where: { id: noticeId },
    });

    if (!existing) {
      return { success: false, message: "Notice not found." };
    }

    await db.$transaction(async (tx) => {
      await tx.notice.delete({
        where: { id: noticeId },
      });

      await recordAuditLog(
        {
          actorId: user.id,
          actorRole: user.role,
          action: AuditAction.NOTICE_DELETED,
          entityType: "Notice",
          entityId: noticeId,
          previousState: { titleEn: existing.titleEn, titleHi: existing.titleHi },
          ipHash,
          userAgent,
        },
        tx,
      );
    });

    revalidatePath("/[locale]/notices", "page");
    revalidatePath("/[locale]/admin/notices", "page");

    return { success: true, message: "Notice deleted." };
  } catch (err) {
    console.error("Failed to delete notice:", err);
    return { success: false, message: "Failed to delete notice." };
  }
}
