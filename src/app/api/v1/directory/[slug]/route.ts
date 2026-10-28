import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, apiError, type PublicBusinessListing } from "@/types";
import { getHashedClientIp } from "@/lib/security/ip-hasher";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { VerificationStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
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

  const { slug } = await params;
  if (!slug) {
    return NextResponse.json(apiError("INVALID_SLUG", "Business slug is required."), {
      status: 400,
    });
  }

  try {
    const listing = await db.businessListing.findUnique({
      where: { slug: slug.toLowerCase().trim() },
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
        isActive: true,
        createdAt: true,
      },
    });

    if (!listing || !listing.isActive) {
      return NextResponse.json(apiError("NOT_FOUND", "Business listing not found."), {
        status: 404,
      });
    }

    // Only allow verified listings or pending with note
    const formatted: PublicBusinessListing = {
      id: listing.id,
      slug: listing.slug,
      nameEn: listing.nameEn,
      nameHi: listing.nameHi,
      category: listing.category,
      descriptionEn: listing.descriptionEn,
      descriptionHi: listing.descriptionHi,
      phone: listing.phone,
      phoneAlt: listing.phoneAlt,
      addressEn: listing.addressEn,
      addressHi: listing.addressHi,
      streetTag: listing.streetTag,
      photoPublicUrl: listing.photoPublicUrl,
      verificationStatus: listing.verificationStatus,
      createdAt: listing.createdAt.toISOString(),
    };

    return NextResponse.json(apiSuccess(formatted), {
      headers: {
        "Cache-Control":
          listing.verificationStatus === VerificationStatus.VERIFIED
            ? "public, s-maxage=600, stale-while-revalidate=1200"
            : "no-store",
      },
    });
  } catch (err) {
    console.error("Failed to query business listing by slug:", err);
    return NextResponse.json(apiError("DATABASE_ERROR", "Failed to retrieve business details."), {
      status: 500,
    });
  }
}
