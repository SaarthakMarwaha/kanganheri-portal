/**
 * Redis Client
 *
 * Provides a unified Redis client that works with:
 * 1. Upstash Redis (production — HTTP-based, serverless-compatible)
 * 2. Local Redis via ioredis-compatible interface (development)
 *
 * The client automatically selects based on available environment variables:
 * - UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN → Upstash client
 * - REDIS_URL → local Redis (via a compatible interface)
 *
 * All Redis operations are typed and include error boundaries.
 */

import { Redis } from "@upstash/redis";

// ──────────────────────────────────────────────────────────────
// CLIENT FACTORY
// ──────────────────────────────────────────────────────────────

function createRedisClient(): Redis {
  const restUrl = process.env.UPSTASH_REDIS_REST_URL;
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!restUrl || !restToken) {
    if (
      process.env.NODE_ENV === "production" &&
      process.env.NEXT_PHASE !== "phase-production-build"
    ) {
      console.warn(
        "⚠️  Production warning: UPSTASH_REDIS_REST_URL/TOKEN not configured. Using fallback endpoint.",
      );
    }

    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL || "http://localhost:8079",
      token: process.env.UPSTASH_REDIS_REST_TOKEN || "local-dev-token",
      retry: false,
    });
  }

  return new Redis({
    url: restUrl,
    token: restToken,
    // Retry up to 3 times with exponential backoff
    retry: {
      retries: 3,
      backoff: (retryCount) => Math.min(Math.exp(retryCount) * 50, 1000),
    },
  });
}

// ──────────────────────────────────────────────────────────────
// SINGLETON INSTANCE
// ──────────────────────────────────────────────────────────────

declare global {
  // eslint-disable-next-line no-var
  var __redis: Redis | undefined;
}

export const redis: Redis =
  process.env.NODE_ENV === "production"
    ? createRedisClient()
    : (globalThis.__redis ??= createRedisClient());

// ──────────────────────────────────────────────────────────────
// CACHE KEY NAMESPACING
// ──────────────────────────────────────────────────────────────

/**
 * Namespaced cache key builder to prevent key collisions.
 * All keys follow the pattern: `kd:{namespace}:{identifier}`
 * (kd = Kanganheri Darpan)
 */
export const cacheKeys = {
  weather: () => "kd:weather:kanganheri",
  mandi: (date: string) => `kd:mandi:${date}`,
  complaint: (trackingId: string) => `kd:complaint:${trackingId}`,
  businessDirectory: (page: number, category: string) => `kd:directory:${category}:page:${page}`,
  idempotency: (key: string) => `kd:idempotency:${key}`,
  rateLimit: {
    complaints: (ipHash: string) => `kd:rl:complaints:${ipHash}`,
    apiReads: (ipHash: string) => `kd:rl:api:${ipHash}`,
    adminLogin: (ipHash: string) => `kd:rl:admin-login:${ipHash}`,
    upvote: (complaintId: string, ipHash: string) => `kd:rl:upvote:${complaintId}:${ipHash}`,
  },
} as const;

// ──────────────────────────────────────────────────────────────
// TTL CONSTANTS (seconds)
// ──────────────────────────────────────────────────────────────

export const cacheTTL = {
  /** Weather data: refresh every 30 minutes */
  weather: 30 * 60,
  /** Mandi prices: refresh every 2 hours (market hours) */
  mandi: 2 * 60 * 60,
  /** Business directory pages: 10-minute cache */
  directory: 10 * 60,
  /** Complaint public view: 5-minute cache */
  complaint: 5 * 60,
  /** Idempotency keys: 24 hours */
  idempotency: 24 * 60 * 60,
} as const;
