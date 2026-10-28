"use server";

import { db } from "@/lib/db";
import { ComplaintCategory, ComplaintStatus, Prisma } from "@prisma/client";
import { getHashedClientIp } from "@/lib/security/ip-hasher";
import { checkRateLimit, verifyTurnstileToken } from "@/lib/security/rate-limiter";
import { processAndStoreImage } from "@/lib/image/pipeline";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import type { ProcessedImage } from "@/types";
import { z } from "zod";

export interface ComplaintFormState {
  status: "idle" | "success" | "error";
  message?: string;
  trackingId?: string;
  fieldErrors?: Record<string, string[]>;
}

const complaintFormSchema = z.object({
  category: z.nativeEnum(ComplaintCategory, {
    errorMap: () => ({ message: "Please select a valid complaint category." }),
  }),
  streetTag: z
    .string()
    .min(3, "Street/locality name must be at least 3 characters.")
    .max(120, "Street/locality name cannot exceed 120 characters."),
  wardTag: z.string().max(50).optional().nullable(),
  descriptionHi: z
    .string()
    .min(15, "Please describe the issue in Hindi (at least 15 characters).")
    .max(2000, "Description cannot exceed 2000 characters."),
  descriptionEn: z.string().max(2000).optional().nullable(),
  contactPhone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number.")
    .optional()
    .nullable()
    .or(z.literal("")),
  turnstileToken: z.string().min(1, "Security verification required. Please complete the CAPTCHA."),
  idempotencyKey: z.string().uuid("Invalid idempotency key."),
});

async function generateUniqueTrackingId(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `KH-${currentYear}-`;

  const count = await db.complaint.count({
    where: { trackingId: { startsWith: yearPrefix } },
  });

  let nextSeq = count + 1;
  let candidate = `${yearPrefix}${String(nextSeq).padStart(4, "0")}`;

  let attempts = 0;
  while (attempts < 10) {
    const existing = await db.complaint.findUnique({
      where: { trackingId: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;

    nextSeq += 1;
    candidate = `${yearPrefix}${String(nextSeq).padStart(4, "0")}`;
    attempts += 1;
  }

  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${yearPrefix}${randomSuffix}`;
}

/**
 * Server Action for Complaint Submission.
 * Fully compatible with progressive enhancement via <form action={...}>.
 */
export async function submitComplaintAction(
  _prevState: ComplaintFormState,
  formData: FormData,
): Promise<ComplaintFormState> {
  const headersList = await headers();
  const ipHash = getHashedClientIp(headersList);

  // Rate Limiting: 5 complaints/hr
  const rateLimit = await checkRateLimit("complaints", ipHash);
  if (!rateLimit.allowed) {
    return {
      status: "error",
      message: `Submission limit reached. Please wait ${rateLimit.retryAfterSeconds} seconds before submitting again.`,
    };
  }

  // Parse fields
  const rawCategory = formData.get("category") as string;
  const rawStreetTag = formData.get("streetTag") as string;
  const rawWardTag = formData.get("wardTag") as string;
  const rawDescHi = formData.get("descriptionHi") as string;
  const rawDescEn = formData.get("descriptionEn") as string;
  const rawPhone = formData.get("contactPhone") as string;
  const turnstileToken = formData.get("turnstileToken") as string;
  const idempotencyKey = formData.get("idempotencyKey") as string;

  const validation = complaintFormSchema.safeParse({
    category: rawCategory,
    streetTag: rawStreetTag,
    wardTag: rawWardTag || null,
    descriptionHi: rawDescHi,
    descriptionEn: rawDescEn || null,
    contactPhone: rawPhone || null,
    turnstileToken,
    idempotencyKey,
  });

  if (!validation.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of validation.error.issues) {
      const field = issue.path[0] as string;
      fieldErrors[field] = fieldErrors[field] ?? [];
      fieldErrors[field].push(issue.message);
    }
    return {
      status: "error",
      message: "Please correct the highlighted errors.",
      fieldErrors,
    };
  }

  const data = validation.data;

  // Verify Turnstile
  const turnstileResult = await verifyTurnstileToken(data.turnstileToken, ipHash);
  if (!turnstileResult.success) {
    return {
      status: "error",
      message: "Security CAPTCHA verification failed. Please try again.",
    };
  }

  // Check Idempotency (prevent duplicate submissions on double-clicks)
  const existingComplaint = await db.complaint.findUnique({
    where: { idempotencyKey: data.idempotencyKey },
    select: { trackingId: true },
  });

  if (existingComplaint) {
    return {
      status: "success",
      trackingId: existingComplaint.trackingId,
      message: "Complaint has already been recorded.",
    };
  }

  // Handle uploaded photo files (max 3)
  const photoFiles = formData
    .getAll("photos")
    .filter((item): item is File => item instanceof File && item.size > 0);

  if (photoFiles.length > 3) {
    return {
      status: "error",
      message: "A maximum of 3 photos is allowed per complaint.",
    };
  }

  const processedPhotos: ProcessedImage[] = [];
  for (const file of photoFiles) {
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return {
        status: "error",
        message: `Photo "${file.name}" exceeds the 5MB size limit.`,
      };
    }

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const processed = await processAndStoreImage(buffer, {
        maxWidth: 1600,
        quality: 80,
        prefix: "complaint",
      });
      processedPhotos.push(processed);
    } catch (imgErr) {
      return {
        status: "error",
        message: imgErr instanceof Error ? imgErr.message : "Failed to process photo upload.",
      };
    }
  }

  try {
    const trackingId = await generateUniqueTrackingId();

    const created = await db.$transaction(async (tx) => {
      const complaint = await tx.complaint.create({
        data: {
          trackingId,
          category: data.category,
          streetTag: data.streetTag,
          wardTag: data.wardTag ?? null,
          descriptionHi: data.descriptionHi,
          descriptionEn: data.descriptionEn ?? null,
          contactPhone: data.contactPhone || null,
          submitterIpHash: ipHash,
          idempotencyKey: data.idempotencyKey,
          status: ComplaintStatus.PENDING,
          photos: {
            create: processedPhotos.map((p) => ({
              storageKey: p.storageKey,
              publicUrl: p.publicUrl,
              mimeType: p.mimeType,
              fileSizeBytes: p.fileSizeBytes,
              width: p.width,
              height: p.height,
            })),
          },
          statusHistory: {
            create: {
              fromStatus: null,
              toStatus: ComplaintStatus.PENDING,
              publicNote: "शिकायत सफलतापूर्वक दर्ज की गई (Complaint registered)",
              actorId: "system",
            },
          },
        },
      });

      return complaint;
    });

    // Revalidate paths
    revalidatePath("/[locale]/complaints", "page");
    revalidatePath("/[locale]/admin/complaints", "page");

    return {
      status: "success",
      trackingId: created.trackingId,
      message: "Complaint registered successfully! Please save your Tracking ID.",
    };
  } catch (err) {
    console.error("Failed to submit complaint:", err);
    return {
      status: "error",
      message: "An unexpected error occurred while saving your complaint. Please try again.",
    };
  }
}

/**
 * Server Action for Complaint Upvoting.
 */
export async function upvoteComplaintAction(
  trackingId: string,
): Promise<{ success: boolean; upvoteCount?: number; message?: string }> {
  const headersList = await headers();
  const ipHash = getHashedClientIp(headersList);

  const rateLimit = await checkRateLimit("upvotes", ipHash);
  if (!rateLimit.allowed) {
    return {
      success: false,
      message: "Upvote rate limit exceeded. Please wait before upvoting again.",
    };
  }

  const normalizedId = trackingId.trim().toUpperCase();

  try {
    const complaint = await db.complaint.findUnique({
      where: { trackingId: normalizedId },
      select: { id: true, upvoteCount: true },
    });

    if (!complaint) {
      return { success: false, message: "Complaint not found." };
    }

    try {
      const updated = await db.$transaction(async (tx) => {
        await tx.complaintUpvote.create({
          data: {
            complaintId: complaint.id,
            ipHash,
          },
        });

        const c = await tx.complaint.update({
          where: { id: complaint.id },
          data: { upvoteCount: { increment: 1 } },
          select: { upvoteCount: true },
        });

        return c;
      });

      revalidatePath(`/[locale]/complaints/${normalizedId}`, "page");
      return {
        success: true,
        upvoteCount: updated.upvoteCount,
        message: "Upvote recorded.",
      };
    } catch (txErr) {
      if (txErr instanceof Prisma.PrismaClientKnownRequestError && txErr.code === "P2002") {
        return {
          success: true,
          upvoteCount: complaint.upvoteCount,
          message: "You have already upvoted this complaint.",
        };
      }
      throw txErr;
    }
  } catch (err) {
    console.error("Failed to upvote complaint:", err);
    return { success: false, message: "Failed to record upvote." };
  }
}
