"use server";

import { db } from "@/lib/db";
import { BusinessCategory, VerificationStatus } from "@prisma/client";
import { getHashedClientIp } from "@/lib/security/ip-hasher";
import { checkRateLimit, verifyTurnstileToken } from "@/lib/security/rate-limiter";
import { processAndStoreImage } from "@/lib/image/pipeline";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export interface BusinessFormState {
  status: "idle" | "success" | "error";
  message?: string;
  slug?: string;
  fieldErrors?: Record<string, string[]>;
}

const businessFormSchema = z.object({
  nameEn: z
    .string()
    .min(2, "English name must be at least 2 characters.")
    .max(100, "English name cannot exceed 100 characters."),
  nameHi: z
    .string()
    .min(2, "Hindi name must be at least 2 characters.")
    .max(100, "Hindi name cannot exceed 100 characters."),
  category: z.nativeEnum(BusinessCategory, {
    errorMap: () => ({ message: "Please select a valid business category." }),
  }),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number."),
  phoneAlt: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit alternative mobile number.")
    .optional()
    .nullable()
    .or(z.literal("")),
  addressEn: z.string().max(200).optional().nullable(),
  addressHi: z.string().max(200).optional().nullable(),
  streetTag: z.string().max(100).optional().nullable(),
  descriptionEn: z.string().max(1000).optional().nullable(),
  descriptionHi: z.string().max(1000).optional().nullable(),
  turnstileToken: z.string().min(1, "Turnstile verification required."),
  idempotencyKey: z.string().uuid("Invalid idempotency key."),
});

function generateSlug(nameEn: string): string {
  const base = nameEn
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);

  const randomSuffix = Math.random().toString(36).substring(2, 7);
  return `${base || "business"}-${randomSuffix}`;
}

/**
 * Server Action for Business Listing Registration.
 * Supports progressive enhancement via native form action.
 */
export async function submitBusinessAction(
  _prevState: BusinessFormState,
  formData: FormData,
): Promise<BusinessFormState> {
  const headersList = await headers();
  const ipHash = getHashedClientIp(headersList);

  // Rate Limiting: 10 registrations per hour
  const rateLimit = await checkRateLimit("directorySubmission", ipHash);
  if (!rateLimit.allowed) {
    return {
      status: "error",
      message: `Registration limit reached. Please wait ${rateLimit.retryAfterSeconds} seconds before submitting again.`,
    };
  }

  const raw = {
    nameEn: formData.get("nameEn") as string,
    nameHi: formData.get("nameHi") as string,
    category: formData.get("category") as string,
    phone: formData.get("phone") as string,
    phoneAlt: formData.get("phoneAlt") as string,
    addressEn: formData.get("addressEn") as string,
    addressHi: formData.get("addressHi") as string,
    streetTag: formData.get("streetTag") as string,
    descriptionEn: formData.get("descriptionEn") as string,
    descriptionHi: formData.get("descriptionHi") as string,
    turnstileToken: formData.get("turnstileToken") as string,
    idempotencyKey: formData.get("idempotencyKey") as string,
  };

  const validation = businessFormSchema.safeParse(raw);
  if (!validation.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of validation.error.issues) {
      const field = issue.path[0] as string;
      fieldErrors[field] = fieldErrors[field] ?? [];
      fieldErrors[field].push(issue.message);
    }
    return {
      status: "error",
      message: "Please correct the highlighted form errors.",
      fieldErrors,
    };
  }

  const data = validation.data;

  // CAPTCHA verification
  const turnstile = await verifyTurnstileToken(data.turnstileToken, ipHash);
  if (!turnstile.success) {
    return {
      status: "error",
      message: "Security CAPTCHA verification failed. Please try again.",
    };
  }

  // Idempotency check
  const existing = await db.businessListing.findUnique({
    where: { idempotencyKey: data.idempotencyKey },
    select: { slug: true },
  });

  if (existing) {
    return {
      status: "success",
      slug: existing.slug,
      message: "Business listing has already been submitted for verification.",
    };
  }

  // Handle optional photo
  const photoFile = formData.get("photo");
  let photoStorageKey = "";
  let photoPublicUrl = "";

  if (photoFile instanceof File && photoFile.size > 0) {
    if (photoFile.size > 5 * 1024 * 1024) {
      return {
        status: "error",
        message: "Profile photo exceeds the 5MB size limit.",
      };
    }

    try {
      const buffer = Buffer.from(await photoFile.arrayBuffer());
      const processed = await processAndStoreImage(buffer, {
        maxWidth: 1200,
        quality: 85,
        prefix: "business",
      });
      photoStorageKey = processed.storageKey;
      photoPublicUrl = processed.publicUrl;
    } catch (imgErr) {
      return {
        status: "error",
        message: imgErr instanceof Error ? imgErr.message : "Failed to process photo.",
      };
    }
  }

  try {
    const slug = generateSlug(data.nameEn);

    const listing = await db.businessListing.create({
      data: {
        slug,
        nameEn: data.nameEn,
        nameHi: data.nameHi,
        category: data.category,
        descriptionEn: data.descriptionEn ?? null,
        descriptionHi: data.descriptionHi ?? null,
        phone: data.phone,
        phoneAlt: data.phoneAlt || null,
        addressEn: data.addressEn ?? null,
        addressHi: data.addressHi ?? null,
        streetTag: data.streetTag ?? null,
        photoStorageKey,
        photoPublicUrl,
        verificationStatus: VerificationStatus.PENDING,
        submitterIpHash: ipHash,
        idempotencyKey: data.idempotencyKey,
        isActive: true,
      },
    });

    revalidatePath("/[locale]/directory", "page");
    revalidatePath("/[locale]/admin/directory", "page");

    return {
      status: "success",
      slug: listing.slug,
      message:
        "Your business listing has been submitted successfully! It will become publicly visible once verified by our administration.",
    };
  } catch (err) {
    console.error("Failed to register business listing:", err);
    return {
      status: "error",
      message: "An unexpected error occurred while saving your business listing.",
    };
  }
}
