import { describe, it, expect } from "vitest";
import { checkRateLimit } from "@/lib/security/rate-limiter";

describe("Sliding Window Rate Limiter", () => {
  it("should permit requests within the limit", async () => {
    const testIpHash = "test-ip-hash-abc-1";
    const res = await checkRateLimit("complaints", testIpHash);
    expect(res.allowed).toBe(true);
    expect(res.remaining).toBe(4); // 5 - 1
  });

  it("should enforce limit when threshold is exceeded", async () => {
    const testIpHash = "test-ip-hash-burst";
    // Drain the limit (5 requests for complaints)
    for (let i = 0; i < 5; i++) {
      await checkRateLimit("complaints", testIpHash);
    }

    // 6th request should be blocked
    const blockedRes = await checkRateLimit("complaints", testIpHash);
    expect(blockedRes.allowed).toBe(false);
    expect(blockedRes.remaining).toBe(0);
    expect(blockedRes.retryAfterSeconds).toBeGreaterThan(0);
  });
});
