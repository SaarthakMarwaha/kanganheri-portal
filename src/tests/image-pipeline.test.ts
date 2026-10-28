import { describe, it, expect } from "vitest";
import { validateMagicBytes } from "@/lib/image/pipeline";

describe("Image Magic Bytes Validator", () => {
  it("should validate JPEG magic bytes (FF D8 FF)", () => {
    const jpegBuffer = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    ]);
    const res = validateMagicBytes(jpegBuffer);
    expect(res.valid).toBe(true);
    expect(res.detectedMime).toBe("image/jpeg");
  });

  it("should validate PNG magic bytes (89 50 4E 47 0D 0A 1A 0A)", () => {
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    ]);
    const res = validateMagicBytes(pngBuffer);
    expect(res.valid).toBe(true);
    expect(res.detectedMime).toBe("image/png");
  });

  it("should validate WebP magic bytes (RIFF .... WEBP)", () => {
    const webpBuffer = Buffer.from([
      0x52,
      0x49,
      0x46,
      0x46, // 'RIFF'
      0x20,
      0x00,
      0x00,
      0x00, // file size
      0x57,
      0x45,
      0x42,
      0x50, // 'WEBP'
    ]);
    const res = validateMagicBytes(webpBuffer);
    expect(res.valid).toBe(true);
    expect(res.detectedMime).toBe("image/webp");
  });

  it("should reject malicious/spoofed files (e.g. text or script disguised as image)", () => {
    const spoofedBuffer = Buffer.from("<?php echo 'malicious'; ?>");
    const res = validateMagicBytes(spoofedBuffer);
    expect(res.valid).toBe(false);
    expect(res.detectedMime).toBeUndefined();
  });

  it("should reject empty or tiny buffers", () => {
    const tinyBuffer = Buffer.from([0x01, 0x02]);
    const res = validateMagicBytes(tinyBuffer);
    expect(res.valid).toBe(false);
  });
});
