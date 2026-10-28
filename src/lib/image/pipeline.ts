import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { ProcessedImage } from "@/types";

/**
 * Validates image buffer magic bytes to ensure uploaded files
 * match permitted raster formats (JPEG, PNG, WebP, AVIF, HEIC).
 * Blocks spoofed file extensions.
 */
export function validateMagicBytes(buffer: Buffer): { valid: boolean; detectedMime?: string } {
  if (buffer.length < 12) {
    return { valid: false };
  }

  // 1. JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, detectedMime: "image/jpeg" };
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, detectedMime: "image/png" };
  }

  // 3. WebP: RIFF ... WEBP
  const isRiff =
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
  const isWebp =
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;

  if (isRiff && isWebp) {
    return { valid: true, detectedMime: "image/webp" };
  }

  // 4. ISO Base Media File Format (AVIF, HEIC, HEIF) -> 'ftyp' at offset 4
  const isFtyp =
    buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70;

  if (isFtyp) {
    const brand = buffer.subarray(8, 12).toString("ascii").toLowerCase();
    if (brand.includes("avif")) {
      return { valid: true, detectedMime: "image/avif" };
    }
    if (brand.includes("heic") || brand.includes("heix") || brand.includes("mif1")) {
      return { valid: true, detectedMime: "image/heic" };
    }
  }

  return { valid: false };
}

export interface ImageProcessingOptions {
  maxWidth?: number;
  quality?: number;
  format?: "webp" | "avif";
  prefix?: string;
}

/**
 * Server-side image sanitization, optimization, and persistence pipeline.
 *
 * 1. Checks magic bytes.
 * 2. Parses with sharp.
 * 3. Rotates according to EXIF orientation, then completely strips all metadata (GPS, device info).
 * 4. Resizes to max width (default 1600px) with aspect ratio preserved.
 * 5. Compresses into modern WebP format with quality 80.
 * 6. Stores to local upload path (or cloud storage).
 */
export async function processAndStoreImage(
  inputBuffer: Buffer,
  options: ImageProcessingOptions = {},
): Promise<ProcessedImage> {
  const { maxWidth = 1600, quality = 80, format = "webp", prefix = "complaints" } = options;

  // 1. Magic bytes validation
  const validation = validateMagicBytes(inputBuffer);
  if (!validation.valid) {
    throw new Error(
      "Invalid or unsupported image file. Allowed formats are JPEG, PNG, WebP, AVIF, HEIC.",
    );
  }

  // 2. Initialize Sharp pipeline
  // .rotate() without args auto-rotates based on EXIF orientation and discards EXIF tags
  const transformer = sharp(inputBuffer, { failOnError: false }).rotate().resize({
    width: maxWidth,
    withoutEnlargement: true,
    fit: "inside",
  });

  let outputBuffer: Buffer;
  let mimeType: "image/webp" | "image/avif";

  if (format === "avif") {
    outputBuffer = await transformer.avif({ quality, effort: 4 }).toBuffer();
    mimeType = "image/avif";
  } else {
    outputBuffer = await transformer.webp({ quality, effort: 4 }).toBuffer();
    mimeType = "image/webp";
  }

  // Extract dimensions of optimized output
  const metadata = await sharp(outputBuffer).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  // 3. Generate secure random filename
  const fileId = randomUUID();
  const ext = format === "avif" ? "avif" : "webp";
  const filename = `${prefix}-${fileId}.${ext}`;

  // 4. Persistence
  // Write to public/uploads directory for local development or fallback
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });

  const destinationPath = path.join(uploadsDir, filename);
  await fs.writeFile(destinationPath, outputBuffer);

  const storageKey = `uploads/${filename}`;
  const publicUrl = `/uploads/${filename}`;

  return {
    storageKey,
    publicUrl,
    mimeType,
    fileSizeBytes: outputBuffer.length,
    width,
    height,
  };
}
