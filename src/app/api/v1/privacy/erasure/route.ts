import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, apiError } from "@/types";
import { getHashedClientIp } from "@/lib/security/ip-hasher";
import { checkRateLimit, verifyTurnstileToken } from "@/lib/security/rate-limiter";
import { executeIdempotentRequest, isValidIdempotencyKey } from "@/lib/security/idempotency";
import { DataRequestStatus, AuditAction } from "@prisma/client";
import { recordAuditLog } from "@/lib/monitoring/audit-logger";
import { z } from "zod";

export const dynamic = "force-dynamic";

const erasureRequestSchema = z.object({
  entityType: z.enum(["complaint", "business_listing"], {
    errorMap: () => ({ message: "Entity type must be either 'complaint' or 'business_listing'." }),
  }),
  entityIdentifier: z.string().min(3, "Identifier must be at least 3 characters.").max(100),
  reason: z.string().max(500).optional(),
  contactPhone: z
    .string()
    .regex(
      /^[6-9]\d{9}$/,
      "Please enter a valid 10-digit mobile number for ownership verification.",
    )
    .optional(),
  turnstileToken: z.string().min(1, "Turnstile verification required."),
});

// ──────────────────────────────────────────────────────────────
// GET /api/v1/privacy/erasure
// ──────────────────────────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse> {
  const ipHash = getHashedClientIp(request);

  const rateLimit = await checkRateLimit("apiReads", ipHash);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      apiError(
        "RATE_LIMITED",
        `Too many requests. Please retry in ${rateLimit.retryAfterSeconds}s.`,
      ),
      { status: 429 },
    );
  }

  const { searchParams } = new URL(request.url);
  const requestId = searchParams.get("requestId")?.trim();

  if (!requestId) {
    return NextResponse.json(apiError("MISSING_REQUEST_ID", "requestId parameter is required."), {
      status: 400,
    });
  }

  try {
    const record = await db.dataDeletionRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        status: true,
        entityType: true,
        entityIdentifier: true,
        createdAt: true,
        completedAt: true,
      },
    });

    if (!record) {
      return NextResponse.json(apiError("NOT_FOUND", "Data deletion request not found."), {
        status: 404,
      });
    }

    return NextResponse.json(
      apiSuccess({
        requestId: record.id,
        status: record.status,
        entityType: record.entityType,
        entityIdentifier: record.entityIdentifier,
        createdAt: record.createdAt.toISOString(),
        completedAt: record.completedAt?.toISOString() ?? null,
      }),
    );
  } catch (err) {
    console.error("Failed to query erasure request:", err);
    return NextResponse.json(
      apiError("DATABASE_ERROR", "Failed to retrieve deletion request status."),
      { status: 500 },
    );
  }
}

// ──────────────────────────────────────────────────────────────
// POST /api/v1/privacy/erasure
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

  const rateLimit = await checkRateLimit("complaints", ipHash);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      apiError(
        "RATE_LIMITED",
        `Too many requests. Please retry in ${rateLimit.retryAfterSeconds}s.`,
      ),
      { status: 429 },
    );
  }

  return executeIdempotentRequest(
    idempotencyKey,
    "POST:/api/v1/privacy/erasure",
    ipHash,
    async () => {
      const body = (await request.json()) as Record<string, unknown>;
      const parseResult = erasureRequestSchema.safeParse(body);

      if (!parseResult.success) {
        const fieldErrors: Record<string, string[]> = {};
        for (const issue of parseResult.error.issues) {
          const path = issue.path.join(".");
          fieldErrors[path] = fieldErrors[path] ?? [];
          fieldErrors[path].push(issue.message);
        }
        return NextResponse.json(
          apiError("VALIDATION_ERROR", "Invalid data deletion request.", fieldErrors),
          { status: 422 },
        );
      }

      const { entityType, entityIdentifier, reason, turnstileToken } = parseResult.data;

      const turnstile = await verifyTurnstileToken(turnstileToken, ipHash);
      if (!turnstile.success) {
        return NextResponse.json(
          apiError("CAPTCHA_FAILED", "Security verification failed. Please try again."),
          { status: 400 },
        );
      }

      // Verify whether the target entity exists
      let targetFound = false;

      if (entityType === "complaint") {
        const c = await db.complaint.findUnique({
          where: { trackingId: entityIdentifier.trim().toUpperCase() },
          select: { id: true },
        });
        targetFound = Boolean(c);
      } else if (entityType === "business_listing") {
        const b = await db.businessListing.findUnique({
          where: { slug: entityIdentifier.trim().toLowerCase() },
          select: { id: true },
        });
        targetFound = Boolean(b);
      }

      if (!targetFound) {
        return NextResponse.json(
          apiError(
            "TARGET_NOT_FOUND",
            `No matching record found for ${entityType} '${entityIdentifier}'. Please verify your identifier.`,
          ),
          { status: 404 },
        );
      }

      // Create DPDP Data Deletion Request
      const deletionRequest = await db.dataDeletionRequest.create({
        data: {
          entityType,
          entityIdentifier: entityIdentifier.trim(),
          status: DataRequestStatus.PENDING,
          processingNotes: reason ? `Reason provided: ${reason}` : null,
          requesterIpHash: ipHash,
        },
      });

      await recordAuditLog({
        action: AuditAction.DATA_ERASURE_INITIATED,
        entityType: "DataDeletionRequest",
        entityId: deletionRequest.id,
        ipHash,
        meta: {
          targetEntityType: entityType,
          targetIdentifier: entityIdentifier,
        },
      });

      return NextResponse.json(
        apiSuccess({
          requestId: deletionRequest.id,
          status: deletionRequest.status,
          message:
            "Your data deletion request has been registered under India's DPDP Act 2023. Our Grievance Officer will review and fulfill this request within 30 days.",
        }),
        { status: 201 },
      );
    },
  );
}
