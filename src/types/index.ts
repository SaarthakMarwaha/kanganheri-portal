/**
 * Kanganheri Darpan — Shared TypeScript Type Definitions
 *
 * This file contains all shared application types, API envelopes,
 * domain model interfaces, and utility types used across the codebase.
 * Prisma-generated types are imported separately from @prisma/client.
 */

// ──────────────────────────────────────────────────────────────
// RE-EXPORTS from Prisma (domain enums)
// ──────────────────────────────────────────────────────────────

export type {
  User,
  Session,
  Complaint,
  ComplaintPhoto,
  ComplaintStatusHistory,
  ComplaintUpvote,
  BusinessListing,
  Notice,
  EmergencyContact,
  HeritagePage,
  AuditLog,
  IdempotencyRecord,
  DataDeletionRequest,
} from "@prisma/client";

export {
  UserRole,
  ComplaintStatus,
  ComplaintCategory,
  BusinessCategory,
  VerificationStatus,
  EmergencyContactType,
  AuditAction,
  DataRequestStatus,
} from "@prisma/client";

// ──────────────────────────────────────────────────────────────
// LOCALE TYPES
// ──────────────────────────────────────────────────────────────

export type Locale = "hi" | "en";

export const SUPPORTED_LOCALES: Locale[] = ["hi", "en"] as const;

export const DEFAULT_LOCALE: Locale = "hi";

// ──────────────────────────────────────────────────────────────
// STANDARD API RESPONSE ENVELOPE
// ──────────────────────────────────────────────────────────────

/**
 * All /api/v1/* endpoints return this standard JSON envelope.
 * Consumers should always check `success` before accessing `data`.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
  timestamp: string; // ISO 8601 UTC
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>; // Field-level validation errors
}

export interface ApiMeta {
  page?: number;
  pageSize?: number;
  totalCount?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  /** Cache age in seconds (if response was served from cache) */
  cacheAge?: number;
}

/** Helper to build a successful API response */
export function apiSuccess<T>(data: T, meta?: ApiMeta): ApiResponse<T> {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
  if (meta !== undefined) response.meta = meta;
  return response;
}

/** Helper to build an error API response */
export function apiError(
  code: string,
  message: string,
  details?: Record<string, string[]>,
): ApiResponse<never> {
  const apiErr: ApiError = { code, message };
  if (details !== undefined) apiErr.details = details;
  return {
    success: false,
    error: apiErr,
    timestamp: new Date().toISOString(),
  };
}

// ──────────────────────────────────────────────────────────────
// AUTH / SESSION TYPES
// ──────────────────────────────────────────────────────────────

export interface JwtAccessPayload {
  sub: string; // User.id (cuid)
  role: import("@prisma/client").UserRole;
  sessionId: string; // Session.id
  iat: number;
  exp: number;
}

export interface JwtRefreshPayload {
  sub: string; // User.id
  sessionId: string; // Session.id
  familyId: string; // Session.familyId (for rotation revocation)
  iat: number;
  exp: number;
}

/** Minimal user info attached to the request context (never full DB record) */
export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: import("@prisma/client").UserRole;
  sessionId: string;
}

// ──────────────────────────────────────────────────────────────
// COMPLAINT TYPES
// ──────────────────────────────────────────────────────────────

/** Public-facing complaint (excludes admin-only fields) */
export interface PublicComplaint {
  id: string;
  trackingId: string;
  status: import("@prisma/client").ComplaintStatus;
  category: import("@prisma/client").ComplaintCategory;
  streetTag: string;
  wardTag: string | null;
  descriptionHi: string;
  descriptionEn: string | null;
  upvoteCount: number;
  photos: PublicComplaintPhoto[];
  statusHistory: PublicStatusHistoryEntry[];
  createdAt: string; // ISO string for JSON serialization
  resolvedAt: string | null;
}

export interface PublicComplaintPhoto {
  id: string;
  publicUrl: string;
  width: number | null;
  height: number | null;
}

export interface PublicStatusHistoryEntry {
  toStatus: import("@prisma/client").ComplaintStatus;
  publicNote: string | null;
  createdAt: string;
}

// ──────────────────────────────────────────────────────────────
// COMPLAINT SUBMISSION (Server Action input)
// ──────────────────────────────────────────────────────────────

export interface ComplaintSubmission {
  idempotencyKey: string; // UUIDv4
  category: import("@prisma/client").ComplaintCategory;
  streetTag: string;
  wardTag?: string;
  descriptionHi: string;
  descriptionEn?: string;
  contactPhone?: string;
  /** Turnstile CAPTCHA response token */
  turnstileToken: string;
}

// ──────────────────────────────────────────────────────────────
// BUSINESS DIRECTORY TYPES
// ──────────────────────────────────────────────────────────────

export interface PublicBusinessListing {
  id: string;
  slug: string;
  nameEn: string;
  nameHi: string;
  category: import("@prisma/client").BusinessCategory;
  descriptionEn: string | null;
  descriptionHi: string | null;
  phone: string;
  phoneAlt: string | null;
  addressEn: string | null;
  addressHi: string | null;
  streetTag: string | null;
  photoPublicUrl: string | null;
  verificationStatus: import("@prisma/client").VerificationStatus;
  createdAt: string;
}

// ──────────────────────────────────────────────────────────────
// TELEMETRY / LIVE DATA TYPES
// ──────────────────────────────────────────────────────────────

/** Weather data fetched from Open-Meteo API */
export interface WeatherData {
  temperature: number; // °C
  feelsLike: number; // °C
  humidity: number; // %
  windSpeed: number; // km/h
  windDirection: number; // degrees
  weatherCode: number; // WMO code
  weatherDescription: string;
  weatherDescriptionHi: string;
  isDay: boolean;
  precipitation: number; // mm
  visibility: number; // km
  uvIndex: number;
  fetchedAt: string; // ISO timestamp
}

/** A single commodity price row from mandi data */
export interface MandiCommodityPrice {
  commodity: string; // e.g., "Wheat / गेहूँ"
  commodityHi: string;
  mandi: string; // e.g., "Najafgarh"
  minPrice: number; // ₹/quintal
  maxPrice: number; // ₹/quintal
  modalPrice: number; // ₹/quintal (most common traded price)
  mspPrice: number | null; // Minimum Support Price for comparison
  unit: "QUINTAL"; // standardized unit
  date: string; // YYYY-MM-DD
}

export interface MandiData {
  prices: MandiCommodityPrice[];
  fetchedAt: string;
  source: string;
}

export interface TelemetryResponse {
  weather: WeatherData | null;
  mandi: MandiData | null;
}

// ──────────────────────────────────────────────────────────────
// LAND UNIT CONVERTER TYPES
// ──────────────────────────────────────────────────────────────

export type LandUnit =
  "BIGHA" | "BISWA" | "KANAL" | "MARLA" | "GAJ" | "SQ_FT" | "ACRE" | "HECTARE" | "SQ_METER";

export interface LandConversionResult {
  fromUnit: LandUnit;
  fromValue: number;
  conversions: Record<LandUnit, number>;
}

// ──────────────────────────────────────────────────────────────
// NOTICE / NOTICEBOARD TYPES
// ──────────────────────────────────────────────────────────────

export interface PublicNotice {
  id: string;
  titleEn: string;
  titleHi: string;
  bodyEn: string | null;
  bodyHi: string;
  attachmentUrl: string | null;
  isPinned: boolean;
  publishedAt: string;
  expiresAt: string | null;
}

// ──────────────────────────────────────────────────────────────
// EMERGENCY CONTACT TYPES
// ──────────────────────────────────────────────────────────────

export interface PublicEmergencyContact {
  id: string;
  type: import("@prisma/client").EmergencyContactType;
  nameEn: string;
  nameHi: string;
  phone: string;
  phoneTollFree: string | null;
  phoneWhatsapp: string | null;
  descriptionEn: string | null;
  descriptionHi: string | null;
  addressEn: string | null;
  addressHi: string | null;
  sortOrder: number;
}

// ──────────────────────────────────────────────────────────────
// ADMIN / AUDIT TYPES
// ──────────────────────────────────────────────────────────────

export interface AuditLogEntry {
  id: string;
  actorId: string | null;
  actorRole: import("@prisma/client").UserRole | null;
  action: import("@prisma/client").AuditAction;
  entityType: string;
  entityId: string | null;
  ipHash: string | null;
  createdAt: string;
}

// ──────────────────────────────────────────────────────────────
// FORM ACTION STATE (useActionState compatible)
// ──────────────────────────────────────────────────────────────

export type ActionState<T = unknown> =
  | { status: "idle" }
  | { status: "success"; data: T; message?: string }
  | { status: "error"; error: string; fieldErrors?: Record<string, string[]> };

// ──────────────────────────────────────────────────────────────
// PAGINATION HELPERS
// ──────────────────────────────────────────────────────────────

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// ──────────────────────────────────────────────────────────────
// UTILITY TYPES
// ──────────────────────────────────────────────────────────────

/** Makes specified keys of T required */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/** Makes specified keys of T optional */
export type PartialFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Extracts the element type from an array type */
export type ArrayElement<T extends readonly unknown[]> =
  T extends ReadonlyArray<infer E> ? E : never;

/** Server component props always receive params as a Promise in Next.js 15 */
export interface PageProps {
  params: Promise<{ locale: Locale; [key: string]: string }>;
  searchParams?: Promise<Record<string, string | string[]>>;
}

/** Layout props always receive children */
export interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
}

// ──────────────────────────────────────────────────────────────
// RATE LIMITING
// ──────────────────────────────────────────────────────────────

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfterSeconds: number;
}

// ──────────────────────────────────────────────────────────────
// IMAGE PROCESSING
// ──────────────────────────────────────────────────────────────

export interface ProcessedImage {
  storageKey: string;
  publicUrl: string;
  mimeType: "image/webp" | "image/avif";
  fileSizeBytes: number;
  width: number;
  height: number;
}

// ──────────────────────────────────────────────────────────────
// HEALTH CHECK
// ──────────────────────────────────────────────────────────────

export interface HealthCheckResponse {
  status: "healthy" | "degraded" | "unhealthy";
  uptime: number; // seconds
  timestamp: string;
  checks: {
    database: HealthCheckItem;
    redis: HealthCheckItem;
    storage?: HealthCheckItem;
  };
  version: string;
}

export interface HealthCheckItem {
  status: "ok" | "error";
  latencyMs: number;
  message?: string;
}
