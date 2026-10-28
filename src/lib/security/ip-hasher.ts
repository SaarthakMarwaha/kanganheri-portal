import { createHmac } from "crypto";
import type { NextRequest } from "next/server";

/**
 * IP Hasher utility complying with DPDP Act 2023.
 *
 * Requirements:
 * 1. Never store raw IP addresses in the database.
 * 2. Hash IP addresses using HMAC-SHA-256 with a secret salt.
 * 3. Incorporate date-based salt derivation (daily rotating salt component)
 *    so IP hashes cannot be linked across extended historical periods.
 */

/**
 * Generates the active daily salt component formatted as YYYY-MM-DD.
 */
function getDailySaltSuffix(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
}

/**
 * Computes an anonymized, daily-salted HMAC-SHA-256 hash of an IP address.
 *
 * @param rawIp - The raw IP string extracted from request headers.
 * @param customSalt - Optional base secret salt. Defaults to process.env.IP_HASH_SALT.
 * @returns 64-character hex string representing the hashed IP.
 */
export function hashIp(rawIp: string, customSalt?: string): string {
  const baseSalt =
    customSalt ?? process.env.IP_HASH_SALT ?? "kanganheri-default-salt-rotate-in-production";
  const dailySalt = `${baseSalt}:${getDailySaltSuffix()}`;

  // Sanitize input IP string
  const sanitizedIp = (rawIp || "127.0.0.1").trim().toLowerCase();

  return createHmac("sha256", dailySalt).update(sanitizedIp).digest("hex");
}

/**
 * Extracts client IP from incoming NextRequest or generic Headers,
 * prioritizing trusted Cloudflare headers and reverse proxy headers.
 *
 * @param request - NextRequest or standard Headers
 * @returns Hashed IP string (never raw IP)
 */
export function getHashedClientIp(request: NextRequest | Headers): string {
  const headers = "headers" in request ? request.headers : request;

  // Header prioritization:
  // 1. CF-Connecting-IP (Cloudflare WAF / edge proxy)
  // 2. X-Real-IP (Nginx / Load Balancer)
  // 3. X-Forwarded-For (First IP in chain is client)
  const cfIp = headers.get("cf-connecting-ip");
  const realIp = headers.get("x-real-ip");
  const forwardedFor = headers.get("x-forwarded-for");

  let rawIp = cfIp;

  if (!rawIp && forwardedFor) {
    const parts = forwardedFor.split(",");
    rawIp = parts[0]?.trim();
  }

  if (!rawIp) {
    rawIp = realIp;
  }

  // Pre-hashed header passed by middleware (if available)
  const preHashed = headers.get("x-ip-hash");
  if (preHashed && preHashed.length === 64) {
    return preHashed;
  }

  return hashIp(rawIp ?? "127.0.0.1");
}
