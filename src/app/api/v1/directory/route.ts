import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, apiError, type PublicBusinessListing } from "@/types";
import { getHashedClientIp } from "@/lib/security/ip-hasher";
import { checkRateLimit, verifyTurnstileToken } from "@/lib/security/rate-limiter";
import { executeIdempotentRequest, isValidIdempotencyKey } from "@/lib/security/idempotency";
import { BusinessCategory, VerificationStatus, Prisma } from "@prisma/client";
import { processAndStoreImage } from "@/lib/image/pipeline";
import { z } from "zod";

export const dynamic = "force-dynamic";

// ──────────────────────────────────────────────────────────────
// SLUG GENERATOR
// ──────────────────────────────────────────────────────────────

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

// ──────────────────────────────────────────────────────────────
// ZOD VALIDATION SCHEMA
// ──────────────────────────────────────────────────────────────

const directorySubmissionSchema = z.object({
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
  descriptionEn: z.string().max(1000).optional().nullable(),
  descriptionHi: z.string().max(1000).optional().nullable(),
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
  turnstileToken: z.string().min(1, "Turnstile security verification required."),
});

// ──────────────────────────────────────────────────────────────
// GET /api/v1/directory
// ──────────────────────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  const ipHash = getHashedClientIp(request);

  const rateLimit = await checkRateLimit("apiReads", ipHash);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      apiError(
        "RATE_LIMITED",
        `Too many requests. Please retry in ${rateLimit.retryAfterSeconds} seconds.`,
      ),
      { status: 429 },
    );
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") ?? "12", 10)));
  const category = searchParams.get("category") as BusinessCategory | null;
  const search = searchParams.get("search")?.trim();
  const streetTag = searchParams.get("streetTag")?.trim();

  const where: Prisma.BusinessListingWhereInput = {
    isActive: true,
    verificationStatus: VerificationStatus.VERIFIED,
  };

  if (category && Object.values(BusinessCategory).includes(category)) {
    where.category = category;
  }

  if (streetTag) {
    where.streetTag = { contains: streetTag, mode: "insensitive" };
  }

  if (search) {
    where.OR = [
      { nameEn: { contains: search, mode: "insensitive" } },
      { nameHi: { contains: search, mode: "insensitive" } },
      { descriptionEn: { contains: search, mode: "insensitive" } },
      { descriptionHi: { contains: search, mode: "insensitive" } },
      { addressEn: { contains: search, mode: "insensitive" } },
      { addressHi: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const [totalCount, listings] = await Promise.all([
      db.businessListing.count({ where }),
      db.businessListing.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ verifiedAt: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          slug: true,
          nameEn: true,
          nameHi: true,
          category: true,
          descriptionEn: true,
          descriptionHi: true,
          phone: true,
          phoneAlt: true,
          addressEn: true,
          addressHi: true,
          streetTag: true,
          photoPublicUrl: true,
          verificationStatus: true,
          createdAt: true,
        },
      }),
    ]);

    const formatted: PublicBusinessListing[] = listings.map((item) => ({
      id: item.id,
      slug: item.slug,
      nameEn: item.nameEn,
      nameHi: item.nameHi,
      category: item.category,
      descriptionEn: item.descriptionEn,
      descriptionHi: item.descriptionHi,
      phone: item.phone,
      phoneAlt: item.phoneAlt,
      addressEn: item.addressEn,
      addressHi: item.addressHi,
      streetTag: item.streetTag,
      photoPublicUrl: item.photoPublicUrl,
      verificationStatus: item.verificationStatus,
      createdAt: item.createdAt.toISOString(),
    }));

    const totalPages = Math.ceil(totalCount / pageSize);

    return NextResponse.json(
      apiSuccess(formatted, {
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      }),
      {
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
        },
      },
    );
  } catch (err) {
    console.error("Failed to query business directory:", err);
    return NextResponse.json(apiError("DATABASE_ERROR", "Failed to retrieve business directory."), {
      status: 500,
    });
  }
}

// ──────────────────────────────────────────────────────────────
// POST /api/v1/directory
// ──────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ipHash = getHashedClientIp(request);
  const idempotencyKey =
    request.headers.get("Idempotency-Key") ?? request.headers.get("idempotency-key");

  if (!isValidIdempotencyKey(idempotencyKey)) {
    return NextResponse.json(
      apiError("MISSING_IDEMPOTENCY_KEY", "A valid UUIDv4 'Idempotency-Key' header is required."),
      { status: 400 },
    );
  }

  // Rate Limiting: Max 10 business registrations per hour
  const rateLimit = await checkRateLimit("directorySubmission", ipHash);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      apiError(
        "RATE_LIMITED",
        `You have exceeded the submission limit. Please retry in ${rateLimit.retryAfterSeconds} seconds.`,
      ),
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

  return executeIdempotentRequest(idempotencyKey, "POST:/api/v1/directory", ipHash, async () => {
    let rawData: Record<string, unknown> = {};
    let photoBuffer: Buffer | null = null;

    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      for (const [key, val] of formData.entries()) {
        if (val instanceof File && key === "photo") {
          const buf = Buffer.from(await val.arrayBuffer());
          if (buf.length > 0) {
            photoBuffer = buf;
          }
        } else if (typeof val === "string") {
          rawData[key] = val;
        }
      }
    } else {
      rawData = (await request.json()) as Record<string, unknown>;
    }

    const parseResult = directorySubmissionSchema.safeParse(rawData);
    if (!parseResult.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parseResult.error.issues) {
        const path = issue.path.join(".");
        fieldErrors[path] = fieldErrors[path] ?? [];
        fieldErrors[path].push(issue.message);
      }
      return NextResponse.json(
        apiError("VALIDATION_ERROR", "Invalid business submission.", fieldErrors),
        { status: 422 },
      );
    }

    const validated = parseResult.data;

    // Turnstile CAPTCHA verification
    const turnstile = await verifyTurnstileToken(validated.turnstileToken, ipHash);
    if (!turnstile.success) {
      return NextResponse.json(
        apiError("CAPTCHA_FAILED", "Security verification failed. Please refresh and try again."),
        { status: 400 },
      );
    }

    // Process photo if uploaded
    let photoStorageKey = "";
    let photoPublicUrl = "";

    if (photoBuffer) {
      try {
        const processed = await processAndStoreImage(photoBuffer, {
          maxWidth: 1200,
          quality: 85,
          prefix: "business",
        });
        photoStorageKey = processed.storageKey;
        photoPublicUrl = processed.publicUrl;
      } catch (imgErr) {
        return NextResponse.json(
          apiError(
            "IMAGE_PROCESSING_FAILED",
            imgErr instanceof Error ? imgErr.message : "Failed to process business photo.",
          ),
          { status: 400 },
        );
      }
    }

    const slug = generateSlug(validated.nameEn);

    const listing = await db.businessListing.create({
      data: {
        slug,
        nameEn: validated.nameEn,
        nameHi: validated.nameHi,
        category: validated.category,
        descriptionEn: validated.descriptionEn ?? null,
        descriptionHi: validated.descriptionHi ?? null,
        phone: validated.phone,
        phoneAlt: validated.phoneAlt || null,
        addressEn: validated.addressEn ?? null,
        addressHi: validated.addressHi ?? null,
        streetTag: validated.streetTag ?? null,
        photoStorageKey,
        photoPublicUrl,
        verificationStatus: VerificationStatus.PENDING,
        submitterIpHash: ipHash,
        idempotencyKey,
        isActive: true,
      },
    });

    return NextResponse.json(
      apiSuccess({
        id: listing.id,
        slug: listing.slug,
        nameEn: listing.nameEn,
        nameHi: listing.nameHi,
        category: listing.category,
        status: listing.verificationStatus,
        message:
          "Your listing has been submitted for admin verification. It will become publicly visible once verified.",
      }),
      { status: 201 },
    );
  });
}
