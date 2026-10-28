import { describe, it, expect } from "vitest";
import { hashIp, getHashedClientIp } from "@/lib/security/ip-hasher";

describe("IP Hasher (DPDP Act 2023 Compliance)", () => {
  it("should generate a consistent 64-character SHA-256 hex string", () => {
    const rawIp = "192.168.1.100";
    const hashed = hashIp(rawIp, "test-secret-salt");
    expect(hashed).toHaveLength(64);
    expect(hashed).toMatch(/^[0-9a-f]{64}$/);
  });

  it("should produce the same hash for the same IP within the same day", () => {
    const ip = "103.25.44.12";
    const hash1 = hashIp(ip, "salt-abc");
    const hash2 = hashIp(ip, "salt-abc");
    expect(hash1).toBe(hash2);
  });

  it("should produce different hashes for different IPs", () => {
    const hashA = hashIp("103.25.44.12", "salt-abc");
    const hashB = hashIp("103.25.44.13", "salt-abc");
    expect(hashA).not.toBe(hashB);
  });

  it("should prioritize Cloudflare CF-Connecting-IP header", () => {
    const headers = new Headers();
    headers.set("cf-connecting-ip", "203.0.113.195");
    headers.set("x-forwarded-for", "198.51.100.1, 192.0.2.1");
    headers.set("x-real-ip", "198.51.100.1");

    const expectedHash = hashIp("203.0.113.195");
    const resultHash = getHashedClientIp(headers);
    expect(resultHash).toBe(expectedHash);
  });

  it("should fall back to X-Forwarded-For if CF-Connecting-IP is missing", () => {
    const headers = new Headers();
    headers.set("x-forwarded-for", "198.51.100.42, 192.0.2.1");

    const expectedHash = hashIp("198.51.100.42");
    const resultHash = getHashedClientIp(headers);
    expect(resultHash).toBe(expectedHash);
  });
});
