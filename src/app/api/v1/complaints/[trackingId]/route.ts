import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, apiError, type PublicComplaint } from "@/types";
import { getHashedClientIp } from "@/lib/security/ip-hasher";
import { checkRateLimit } from "@/lib/security/rate-limiter";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ trackingId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
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

  const { trackingId } = await params;
  if (!trackingId) {
    return NextResponse.json(apiError("INVALID_TRACKING_ID", "Tracking ID is required."), {
      status: 400,
    });
  }

  const normalizedId = trackingId.trim().toUpperCase();

  try {
    const complaint = await db.complaint.findUnique({
      where: { trackingId: normalizedId },
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
    });

    if (!complaint) {
      return NextResponse.json(
        apiError("NOT_FOUND", `Complaint with tracking ID '${normalizedId}' was not found.`),
        { status: 404 },
      );
    }

    const formatted: PublicComplaint = {
      id: complaint.id,
      trackingId: complaint.trackingId,
      status: complaint.status,
      category: complaint.category,
      streetTag: complaint.streetTag,
      wardTag: complaint.wardTag,
      descriptionHi: complaint.descriptionHi,
      descriptionEn: complaint.descriptionEn,
      upvoteCount: complaint.upvoteCount,
      photos: complaint.photos,
      statusHistory: complaint.statusHistory.map((s) => ({
        toStatus: s.toStatus,
        publicNote: s.publicNote,
        createdAt: s.createdAt.toISOString(),
      })),
      createdAt: complaint.createdAt.toISOString(),
      resolvedAt: complaint.resolvedAt?.toISOString() ?? null,
    };

    return NextResponse.json(apiSuccess(formatted));
  } catch (err) {
    console.error("Failed to query complaint by tracking ID:", err);
    return NextResponse.json(apiError("DATABASE_ERROR", "Failed to retrieve complaint details."), {
      status: 500,
    });
  }
}
