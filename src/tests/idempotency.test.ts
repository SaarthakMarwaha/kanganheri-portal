import { describe, it, expect } from "vitest";
import { isValidIdempotencyKey } from "@/lib/security/idempotency";

describe("Idempotency Key Validator", () => {
  it("should accept valid UUIDv4 strings", () => {
    expect(isValidIdempotencyKey("c3b9b4f4-5f21-4f99-906d-74d12c8b74f0")).toBe(true);
    expect(isValidIdempotencyKey("6ba7b810-9dad-41d4-80b4-00c04fd430c8")).toBe(true);
    expect(isValidIdempotencyKey("00000000-0000-4000-8000-000000000000")).toBe(true);
  });

  it("should reject null, undefined, or empty keys", () => {
    expect(isValidIdempotencyKey(null)).toBe(false);
    expect(isValidIdempotencyKey(undefined)).toBe(false);
    expect(isValidIdempotencyKey("")).toBe(false);
    expect(isValidIdempotencyKey("   ")).toBe(false);
  });

  it("should reject non-UUIDv4 formats (e.g. arbitrary strings or invalid version bits)", () => {
    expect(isValidIdempotencyKey("not-a-uuid")).toBe(false);
    expect(isValidIdempotencyKey("12345")).toBe(false);
    // UUID v1 (not v4) -> 3rd group starts with '1', not '4'
    expect(isValidIdempotencyKey("6ba7b810-9dad-11d1-80b4-00c04fd430c8")).toBe(false);
  });
});
