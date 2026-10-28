import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, apiError } from "@/types";
import { getHashedClientIp } from "@/lib/security/ip-hasher";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ trackingId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const ipHash = getHashedClientIp(request);

  // Rate Limiting: Max 30 upvotes per hour
  const rateLimit = await checkRateLimit("upvotes", ipHash);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      apiError(
        "RATE_LIMITED",
        `You have reached the upvote limit. Please retry in ${rateLimit.retryAfterSeconds} seconds.`,
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
      select: { id: true, upvoteCount: true },
    });

    if (!complaint) {
      return NextResponse.json(
        apiError("NOT_FOUND", `Complaint with tracking ID '${normalizedId}' was not found.`),
        { status: 404 },
      );
    }

    // Attempt to register upvote with unique (complaintId, ipHash) constraint
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

      return NextResponse.json(
        apiSuccess({
          trackingId: normalizedId,
          upvoteCount: updated.upvoteCount,
          hasUpvoted: true,
          message: "Upvote registered successfully.",
        }),
      );
    } catch (txErr) {
      // Prisma P2002 is Unique constraint violation
      if (txErr instanceof Prisma.PrismaClientKnownRequestError && txErr.code === "P2002") {
        return NextResponse.json(
          apiSuccess({
            trackingId: normalizedId,
            upvoteCount: complaint.upvoteCount,
            hasUpvoted: true,
            message: "You have already upvoted this complaint.",
          }),
        );
      }
      throw txErr;
    }
  } catch (err) {
    console.error("Failed to register upvote:", err);
    return NextResponse.json(apiError("DATABASE_ERROR", "Failed to register upvote."), {
      status: 500,
    });
  }
}
