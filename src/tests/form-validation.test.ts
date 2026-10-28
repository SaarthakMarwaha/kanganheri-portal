import { describe, it, expect } from "vitest";
import { ComplaintCategory } from "@prisma/client";
import { z } from "zod";

const testComplaintSchema = z.object({
  category: z.nativeEnum(ComplaintCategory),
  streetTag: z.string().min(3).max(120),
  wardTag: z.string().max(50).optional().nullable(),
  descriptionHi: z.string().min(15).max(2000),
  contactPhone: z
    .string()
    .regex(/^[6-9]\d{9}$/)
    .optional()
    .nullable()
    .or(z.literal("")),
  idempotencyKey: z.string().uuid(),
});

describe("Server Action Form Validation Schemas", () => {
  it("should validate well-formed complaint inputs", () => {
    const validData = {
      category: ComplaintCategory.WATERLOGGING,
      streetTag: "Chaupal Gali No. 3",
      wardTag: "Ward 42",
      descriptionHi: "गली में भारी जलभराव है, पानी की निकासी नहीं हो रही है।",
      contactPhone: "9876543210",
      idempotencyKey: "123e4567-e89b-12d3-a456-426614174000",
    };

    const res = testComplaintSchema.safeParse(validData);
    expect(res.success).toBe(true);
  });

  it("should reject descriptions that are too short (under 15 chars)", () => {
    const invalidData = {
      category: ComplaintCategory.POTHOLE,
      streetTag: "Main Road",
      descriptionHi: "सड़क खराब है", // only 12 chars
      idempotencyKey: "123e4567-e89b-12d3-a456-426614174000",
    };

    const res = testComplaintSchema.safeParse(invalidData);
    expect(res.success).toBe(false);
  });

  it("should reject invalid mobile phone numbers", () => {
    const invalidPhoneData = {
      category: ComplaintCategory.BROKEN_STREETLIGHT,
      streetTag: "Near Primary School",
      descriptionHi: "स्ट्रीट लाइट पिछले तीन दिनों से बंद पड़ी है।",
      contactPhone: "12345", // invalid format
      idempotencyKey: "123e4567-e89b-12d3-a456-426614174000",
    };

    const res = testComplaintSchema.safeParse(invalidPhoneData);
    expect(res.success).toBe(false);
  });
});
