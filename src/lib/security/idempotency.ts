import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { redis, cacheKeys, cacheTTL } from "@/lib/redis";
import type { ApiResponse } from "@/types";

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates whether a provided string is a valid UUIDv4.
 */
export function isValidIdempotencyKey(key: string | null | undefined): boolean {
  if (!key) return false;
  return UUID_V4_REGEX.test(key.trim());
}

export interface CachedIdempotencyResponse {
  status: number;
  body: string; // JSON string
}

/**
 * Retrieves a previously cached response for an idempotency key.
 * Checks Redis first (low latency), falls back to PostgreSQL IdempotencyRecord table.
 */
export async function getCachedIdempotentResponse(
  key: string,
  endpoint: string,
): Promise<CachedIdempotencyResponse | null> {
  const sanitizedKey = key.trim();

  // 1. Check Redis
  try {
    const redisKey = cacheKeys.idempotency(sanitizedKey);
    const cached = await redis.get<CachedIdempotencyResponse>(redisKey);
    if (cached && typeof cached === "object" && cached.body) {
      return cached;
    }
  } catch (err) {
    // Redis down/offline, fall through to DB
    console.warn("Idempotency Redis read failed, falling back to DB:", err);
  }

  // 2. Check Database
  try {
    const record = await db.idempotencyRecord.findUnique({
      where: { key: sanitizedKey },
    });

    if (record) {
      // Check expiration
      if (record.expiresAt < new Date()) {
        // Expired, delete asynchronously
        db.idempotencyRecord.delete({ where: { id: record.id } }).catch(() => {});
        return null;
      }

      // Ensure endpoint matches to prevent cross-endpoint key collision
      if (record.endpoint === endpoint) {
        return {
          status: record.responseStatus,
          body: record.responseBody,
        };
      }
    }
  } catch (err) {
    console.error("Failed to query database for idempotency record:", err);
  }

  return null;
}

/**
 * Stores the response of an executed operation against its idempotency key.
 * Persists in both Redis (fast lookups) and PostgreSQL (durable 24h store).
 */
export async function saveIdempotentResponse(params: {
  key: string;
  endpoint: string;
  status: number;
  body: string;
  ipHash?: string | undefined;
}): Promise<void> {
  const { key, endpoint, status, body, ipHash } = params;
  const sanitizedKey = key.trim();
  const expiresAt = new Date(Date.now() + cacheTTL.idempotency * 1000);

  // 1. Cache in Redis
  try {
    const redisKey = cacheKeys.idempotency(sanitizedKey);
    await redis.set(redisKey, JSON.stringify({ status, body }), { ex: cacheTTL.idempotency });
  } catch (err) {
    console.warn("Failed to cache idempotency record in Redis:", err);
  }

  // 2. Persist in Database
  try {
    await db.idempotencyRecord.upsert({
      where: { key: sanitizedKey },
      update: {
        endpoint,
        responseStatus: status,
        responseBody: body,
        expiresAt,
        ipHash: ipHash ?? null,
      },
      create: {
        key: sanitizedKey,
        endpoint,
        responseStatus: status,
        responseBody: body,
        expiresAt,
        ipHash: ipHash ?? null,
      },
    });
  } catch (err) {
    console.error("Failed to persist idempotency record in DB:", err);
  }
}

/**
 * Executes a write handler with idempotency semantics.
 * If the key has already been processed, returns the previous response with header `X-Cache-Lookup: HIT`.
 */
export async function executeIdempotentRequest<T>(
  key: string | null | undefined,
  endpoint: string,
  ipHash: string | undefined,
  handler: () => Promise<NextResponse<ApiResponse<T>>>,
): Promise<NextResponse> {
  // If key is missing or invalid, reject immediately
  if (!isValidIdempotencyKey(key)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_IDEMPOTENCY_KEY",
          message:
            "A valid UUIDv4 'Idempotency-Key' header is required for this operation to prevent duplicate processing.",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 400 },
    );
  }

  const validKey = key!.trim();

  // Check for existing record
  const existing = await getCachedIdempotentResponse(validKey, endpoint);
  if (existing) {
    const parsedBody = JSON.parse(existing.body);
    return NextResponse.json(parsedBody, {
      status: existing.status,
      headers: {
        "X-Cache-Lookup": "HIT",
        "X-Idempotency-Key": validKey,
      },
    });
  }

  // Execute handler
  const response = await handler();
  const cloned = response.clone();
  const responseStatus = cloned.status;
  const responseBody = await cloned.text();

  // Save successful or deterministic error responses (e.g. 2xx, 4xx)
  // Avoid caching 5xx internal server errors so caller can retry
  if (responseStatus < 500) {
    await saveIdempotentResponse({
      key: validKey,
      endpoint,
      status: responseStatus,
      body: responseBody,
      ipHash,
    });
  }

  response.headers.set("X-Cache-Lookup", "MISS");
  response.headers.set("X-Idempotency-Key", validKey);
  return response;
}
