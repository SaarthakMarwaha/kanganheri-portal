import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/redis";
import type { RateLimitResult } from "@/types";

/**
 * In-memory fallback sliding window store when Redis is unavailable
 * (e.g. during offline local development or Redis outages).
 */
class MemorySlidingWindow {
  private records = new Map<string, number[]>();

  public check(key: string, limit: number, windowMs: number): RateLimitResult {
    const now = Date.now();
    const timestamps = (this.records.get(key) ?? []).filter((ts) => now - ts < windowMs);

    const allowed = timestamps.length < limit;
    if (allowed) {
      timestamps.push(now);
      this.records.set(key, timestamps);
    }

    const resetAt = new Date(
      timestamps.length > 0 ? (timestamps[0] ?? now) + windowMs : now + windowMs,
    );
    const retryAfterSeconds = Math.max(0, Math.ceil((resetAt.getTime() - now) / 1000));

    return {
      allowed,
      remaining: Math.max(0, limit - timestamps.length),
      resetAt,
      retryAfterSeconds,
    };
  }

  public cleanup(): void {
    const now = Date.now();
    for (const [key, timestamps] of this.records.entries()) {
      const active = timestamps.filter((ts) => now - ts < 3600000);
      if (active.length === 0) {
        this.records.delete(key);
      } else {
        this.records.set(key, active);
      }
    }
  }
}

const memoryStore = new MemorySlidingWindow();
// Run periodic cleanup every 10 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => memoryStore.cleanup(), 10 * 60 * 1000).unref?.();
}

/**
 * Creates an Upstash sliding window rate limiter instance if Redis credentials are available.
 */
function createUpstashLimiter(
  requests: number,
  windowStr: `${number} s` | `${number} m` | `${number} h`,
) {
  const isUpstashConfigured =
    Boolean(process.env.UPSTASH_REDIS_REST_URL) && Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

  if (!isUpstashConfigured) {
    return null;
  }

  try {
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requests, windowStr),
      prefix: "kd:ratelimit",
      analytics: false,
    });
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────────────────────
// RATE LIMIT PROFILES
// ──────────────────────────────────────────────────────────────

const limiters = {
  // Max 5 complaints per hour per IP hash
  complaints: createUpstashLimiter(5, "1 h"),
  // Max 10 directory submissions per hour per IP hash
  directorySubmission: createUpstashLimiter(10, "1 h"),
  // Max 60 API reads per minute per IP hash
  apiReads: createUpstashLimiter(60, "1 m"),
  // Max 5 admin login attempts per 15 minutes per IP hash
  adminLogin: createUpstashLimiter(5, "15 m"),
  // Max 30 upvotes per hour per IP hash
  upvotes: createUpstashLimiter(30, "1 h"),
};

export type RateLimitAction =
  "complaints" | "directorySubmission" | "apiReads" | "adminLogin" | "upvotes";

const windowMsMap: Record<RateLimitAction, { limit: number; windowMs: number }> = {
  complaints: { limit: 5, windowMs: 3600 * 1000 },
  directorySubmission: { limit: 10, windowMs: 3600 * 1000 },
  apiReads: { limit: 60, windowMs: 60 * 1000 },
  adminLogin: { limit: 5, windowMs: 15 * 60 * 1000 },
  upvotes: { limit: 30, windowMs: 3600 * 1000 },
};

/**
 * Evaluates sliding-window rate limit for a given action and hashed IP.
 * Gracefully falls back to local memory store if Redis is unavailable.
 */
export async function checkRateLimit(
  action: RateLimitAction,
  ipHash: string,
): Promise<RateLimitResult> {
  const limiter = limiters[action];

  if (limiter) {
    try {
      const res = await limiter.limit(`${action}:${ipHash}`);
      return {
        allowed: res.success,
        remaining: res.remaining,
        resetAt: new Date(res.reset),
        retryAfterSeconds: Math.max(0, Math.ceil((res.reset - Date.now()) / 1000)),
      };
    } catch (err) {
      console.warn(`Upstash rate limiter failed for ${action}, falling back to memory:`, err);
    }
  }

  // In-memory fallback
  const cfg = windowMsMap[action];
  return memoryStore.check(`${action}:${ipHash}`, cfg.limit, cfg.windowMs);
}

/**
 * Verifies a Cloudflare Turnstile token server-side.
 * Required for public forms to eliminate bot submissions.
 *
 * @param token - Turnstile token generated in the browser
 * @param remoteIp - Optional remote client IP or hash for verification
 */
export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string,
): Promise<{ success: boolean; errorCodes?: string[] }> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // In development, if secret key is not set, permit mock tokens
  if (!secretKey) {
    if (process.env.NODE_ENV === "development") {
      return { success: true };
    }
    console.error("TURNSTILE_SECRET_KEY is missing in production.");
    return { success: false, errorCodes: ["missing-secret-key"] };
  }

  if (!token) {
    return { success: false, errorCodes: ["missing-input-response"] };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (remoteIp) {
      formData.append("remoteip", remoteIp);
    }

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const outcome = (await res.json()) as {
      success: boolean;
      "error-codes"?: string[];
    };

    const result: { success: boolean; errorCodes?: string[] } = {
      success: outcome.success,
    };
    if (outcome["error-codes"]) {
      result.errorCodes = outcome["error-codes"];
    }
    return result;
  } catch (err) {
    console.error("Turnstile verification request failed:", err);
    // Fail closed on security check errors
    return { success: false, errorCodes: ["internal-verification-error"] };
  }
}
