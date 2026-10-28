import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, apiError, type PublicComplaint, type ProcessedImage } from "@/types";
import { getHashedClientIp } from "@/lib/security/ip-hasher";
import { checkRateLimit, verifyTurnstileToken } from "@/lib/security/rate-limiter";
import { executeIdempotentRequest, isValidIdempotencyKey } from "@/lib/security/idempotency";
import { ComplaintCategory, ComplaintStatus, Prisma } from "@prisma/client";
import { processAndStoreImage } from "@/lib/image/pipeline";
import { z } from "zod";

export const dynamic = "force-dynamic";

// ──────────────────────────────────────────────────────────────
// TRACKING ID GENERATOR (KH-YYYY-XXXX)
// ──────────────────────────────────────────────────────────────

async function generateTrackingId(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `KH-${currentYear}-`;

  // Count existing complaints for this year to determine next sequential number
  const count = await db.complaint.count({
    where: {
      trackingId: {
        startsWith: yearPrefix,
      },
    },
  });

  let nextSequence = count + 1;
  let candidate = `${yearPrefix}${String(nextSequence).padStart(4, "0")}`;

  // Collision safety loop
  let attempts = 0;
  while (attempts < 10) {
    const existing = await db.complaint.findUnique({
      where: { trackingId: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;

    nextSequence += 1;
    candidate = `${yearPrefix}${String(nextSequence).padStart(4, "0")}`;
    attempts += 1;
  }

  // Fallback random suffix if sequence collisions occur
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${yearPrefix}${randomSuffix}`;
}

// ──────────────────────────────────────────────────────────────
// ZOD VALIDATION SCHEMA
// ──────────────────────────────────────────────────────────────

const complaintSchema = z.object({
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
    .min(15, "Please provide a detailed description in Hindi (at least 15 characters).")
    .max(2000, "Description cannot exceed 2000 characters."),
  descriptionEn: z.string().max(2000).optional().nullable(),
  contactPhone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number.")
    .optional()
    .nullable()
    .or(z.literal("")),
  turnstileToken: z.string().min(1, "Turnstile CAPTCHA verification required."),
});

// ──────────────────────────────────────────────────────────────
// GET /api/v1/complaints
// ──────────────────────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  const ipHash = getHashedClientIp(request);

  // Rate limiting check
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
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") ?? "10", 10)));
  const status = searchParams.get("status") as ComplaintStatus | null;
  const category = searchParams.get("category") as ComplaintCategory | null;
  const search = searchParams.get("search")?.trim();

  const where: Prisma.ComplaintWhereInput = {};

  if (status && Object.values(ComplaintStatus).includes(status)) {
    where.status = status;
  }

  if (category && Object.values(ComplaintCategory).includes(category)) {
    where.category = category;
  }

  if (search) {
    where.OR = [
      { trackingId: { contains: search, mode: "insensitive" } },
      { streetTag: { contains: search, mode: "insensitive" } },
      { descriptionHi: { contains: search, mode: "insensitive" } },
      { descriptionEn: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    const [totalCount, items] = await Promise.all([
      db.complaint.count({ where }),
      db.complaint.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          trackingId: true,
          status: true,
          category: true,
          streetTag: true,
          wardTag: true,
          descriptionHi: true,
          descriptionEn: true,
          upvoteCount: true,
          createdAt: true,
          resolvedAt: true,
          photos: {
            select: {
              id: true,
              publicUrl: true,
              width: true,
              height: true,
            },
          },
          statusHistory: {
            orderBy: { createdAt: "asc" },
            select: {
              toStatus: true,
              publicNote: true,
              createdAt: true,
            },
          },
        },
      }),
    ]);

    const formattedComplaints: PublicComplaint[] = items.map((c) => ({
      id: c.id,
      trackingId: c.trackingId,
      status: c.status,
      category: c.category,
      streetTag: c.streetTag,
      wardTag: c.wardTag,
      descriptionHi: c.descriptionHi,
      descriptionEn: c.descriptionEn,
      upvoteCount: c.upvoteCount,
      photos: c.photos,
      statusHistory: c.statusHistory.map((s) => ({
        toStatus: s.toStatus,
        publicNote: s.publicNote,
        createdAt: s.createdAt.toISOString(),
      })),
      createdAt: c.createdAt.toISOString(),
      resolvedAt: c.resolvedAt?.toISOString() ?? null,
    }));

    const totalPages = Math.ceil(totalCount / pageSize);

    return NextResponse.json(
      apiSuccess(formattedComplaints, {
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      }),
    );
  } catch (err) {
    console.error("Failed to fetch complaints:", err);
    return NextResponse.json(apiError("DATABASE_ERROR", "Failed to retrieve complaints list."), {
      status: 500,
    });
  }
}

// ──────────────────────────────────────────────────────────────
// POST /api/v1/complaints
// ──────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ipHash = getHashedClientIp(request);
  const idempotencyKey =
    request.headers.get("Idempotency-Key") ?? request.headers.get("idempotency-key");

  // Enforce idempotency header
  if (!isValidIdempotencyKey(idempotencyKey)) {
    return NextResponse.json(
      apiError("MISSING_IDEMPOTENCY_KEY", "A valid UUIDv4 'Idempotency-Key' header is required."),
      { status: 400 },
    );
  }

  // Rate Limiting: Max 5 complaints per hour per IP hash
  const rateLimit = await checkRateLimit("complaints", ipHash);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      apiError(
        "RATE_LIMITED",
        `You have exceeded the hourly complaint submission limit. Please retry in ${rateLimit.retryAfterSeconds} seconds.`,
      ),
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

  return executeIdempotentRequest(idempotencyKey, "POST:/api/v1/complaints", ipHash, async () => {
    let rawData: Record<string, unknown> = {};
    const uploadedFiles: Buffer[] = [];

    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      for (const [key, val] of formData.entries()) {
        if (val instanceof File && key === "photos") {
          const buf = Buffer.from(await val.arrayBuffer());
          if (buf.length > 0) {
            uploadedFiles.push(buf);
          }
        } else if (typeof val === "string") {
          rawData[key] = val;
        }
      }
    } else {
      rawData = (await request.json()) as Record<string, unknown>;
    }

    // Validate inputs
    const parseResult = complaintSchema.safeParse(rawData);
    if (!parseResult.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of parseResult.error.issues) {
        const path = issue.path.join(".");
        fieldErrors[path] = fieldErrors[path] ?? [];
        fieldErrors[path].push(issue.message);
      }
      return NextResponse.json(
        apiError("VALIDATION_ERROR", "Invalid complaint submission.", fieldErrors),
        { status: 422 },
      );
    }

    const validated = parseResult.data;

    // Cloudflare Turnstile Verification
    const turnstile = await verifyTurnstileToken(validated.turnstileToken, ipHash);
    if (!turnstile.success) {
      return NextResponse.json(
        apiError("CAPTCHA_FAILED", "Security verification failed. Please refresh and try again."),
        { status: 400 },
      );
    }

    // Process uploaded photos (max 3)
    if (uploadedFiles.length > 3) {
      return NextResponse.json(
        apiError("TOO_MANY_FILES", "You can upload a maximum of 3 photos."),
        { status: 400 },
      );
    }

    const processedPhotos: ProcessedImage[] = [];
    for (const fileBuf of uploadedFiles) {
      try {
        const processed = await processAndStoreImage(fileBuf, {
          maxWidth: 1600,
          quality: 80,
          prefix: "complaint",
        });
        processedPhotos.push(processed);
      } catch (imgErr) {
        console.error("Photo processing failed:", imgErr);
        return NextResponse.json(
          apiError(
            "IMAGE_PROCESSING_FAILED",
            imgErr instanceof Error
              ? imgErr.message
              : "Failed to process uploaded photo. Please ensure it is a valid JPEG, PNG, or WebP.",
          ),
          { status: 400 },
        );
      }
    }

    // Generate tracking ID
    const trackingId = await generateTrackingId();

    // Database transaction: create Complaint + Photos + initial StatusHistory
    const createdComplaint = await db.$transaction(async (tx) => {
      const complaint = await tx.complaint.create({
        data: {
          trackingId,
          category: validated.category,
          streetTag: validated.streetTag,
          wardTag: validated.wardTag ?? null,
          descriptionHi: validated.descriptionHi,
          descriptionEn: validated.descriptionEn ?? null,
          contactPhone: validated.contactPhone || null,
          submitterIpHash: ipHash,
          idempotencyKey,
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
        include: {
          photos: true,
          statusHistory: true,
        },
      });

      return complaint;
    });

    return NextResponse.json(
      apiSuccess({
        trackingId: createdComplaint.trackingId,
        status: createdComplaint.status,
        category: createdComplaint.category,
        streetTag: createdComplaint.streetTag,
        createdAt: createdComplaint.createdAt.toISOString(),
        message: "Complaint registered successfully.",
      }),
      { status: 201 },
    );
  });
}
