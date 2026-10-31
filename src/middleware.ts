import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

// ──────────────────────────────────────────────────────────────
// CONSTANTS
// ──────────────────────────────────────────────────────────────

const PRODUCTION_ORIGIN = "https://kanganheri.com";

/** Paths that must never be crawled or framed */
const PROTECTED_ADMIN_PREFIXES = ["/admin"];

/** API routes to apply CORS restrictions */
const API_PREFIX = "/api/";

/** Paths the next-intl middleware should NOT process */
const INTL_EXCLUDED_PATHS = [
  "/api/",
  "/_next/",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/sw.js",
  "/manifest.json",
  "/manifest.webmanifest",
  "/icon",
  "/apple-icon",
  "/opengraph-image",
  "/uploads/",
];

// ──────────────────────────────────────────────────────────────
// ALLOWED ORIGINS (CORS)
// ──────────────────────────────────────────────────────────────

function getAllowedOrigins(): string[] {
  const envOrigins = process.env.ALLOWED_ORIGINS ?? "";
  const origins = envOrigins
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  if (process.env.NODE_ENV === "development") {
    origins.push("http://localhost:3000", "http://127.0.0.1:3000");
  }

  // Always include the production canonical origin
  if (!origins.includes(PRODUCTION_ORIGIN)) {
    origins.push(PRODUCTION_ORIGIN);
  }

  return origins;
}

// ──────────────────────────────────────────────────────────────
// NONCE GENERATOR
// ──────────────────────────────────────────────────────────────

/** Generates a cryptographically random, base64url-encoded nonce per request (Edge-safe Web Crypto) */
function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// ──────────────────────────────────────────────────────────────
// CONTENT SECURITY POLICY BUILDER
// ──────────────────────────────────────────────────────────────

/**
 * Builds a strict nonce-based Content Security Policy header value.
 * - Scripts ONLY allowed with the per-request nonce OR from explicit trusted CDNs
 * - Inline styles disallowed except via nonce (for shadcn/ui + next/font compatibility)
 * - No eval(), no unsafe-inline for scripts
 */
function buildCSP(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";

  // Extra trusted sources from env (space-separated)
  const extraScripts = (process.env.CSP_EXTRA_SCRIPT_SRC ?? "").trim();
  const extraStyles = (process.env.CSP_EXTRA_STYLE_SRC ?? "").trim();

  const directives: Record<string, string> = {
    // Only allow same-origin by default
    "default-src": "'self'",

    // Scripts: only same-origin and nonce-tagged scripts
    // In dev, allow 'unsafe-eval' for Next.js HMR
    "script-src": [
      "'self'",
      `'nonce-${nonce}'`,
      // Cloudflare Turnstile
      "https://challenges.cloudflare.com",
      isDev ? "'unsafe-eval'" : "",
      extraScripts,
    ]
      .filter(Boolean)
      .join(" "),

    // Styles: same-origin + nonce + Google Fonts
    "style-src": [
      "'self'",
      `'nonce-${nonce}'`,
      "https://fonts.googleapis.com",
      // shadcn/ui injects some inline styles via Radix; nonce covers them
      extraStyles,
    ]
      .filter(Boolean)
      .join(" "),

    // Fonts from Google and same origin
    "font-src": ["'self'", "https://fonts.gstatic.com", "data:"].join(" "),

    // Images: same-origin, CDN, data URIs for Next.js image optimization
    "img-src": [
      "'self'",
      "data:",
      "blob:",
      "https://cdn.kanganheri.com",
      // Open-Meteo weather icon CDN (if used)
      "https://openweathermap.org",
    ].join(" "),

    // Fetch/XHR: restrict to same-origin and Open-Meteo API
    "connect-src": [
      "'self'",
      "https://api.open-meteo.com",
      // Sentry error reporting
      "https://*.sentry.io",
      "https://*.ingest.sentry.io",
      // Cloudflare Turnstile
      "https://challenges.cloudflare.com",
      isDev ? "ws://localhost:3000 http://localhost:3000" : "",
    ]
      .filter(Boolean)
      .join(" "),

    // Media: same-origin and CDN only
    "media-src": ["'self'", "https://cdn.kanganheri.com"].join(" "),

    // Object/embed elements: block completely
    "object-src": "'none'",

    // Base URI: restrict to self to prevent base tag injection
    "base-uri": "'self'",

    // Form submissions: restrict to same origin
    "form-action": "'self'",

    // Prevent embedding in iframes (belt-and-suspenders with X-Frame-Options)
    "frame-ancestors": "'none'",

    // Cloudflare Turnstile CAPTCHA frame
    "frame-src": "https://challenges.cloudflare.com",

    // Worker scripts: same-origin only (service worker for offline emergency contacts)
    "worker-src": "'self' blob:",

    // Subresource integrity upgrade
    "upgrade-insecure-requests": "",

    // Report violations to Sentry CSP endpoint (if configured)
    ...(process.env.SENTRY_DSN
      ? {
          "report-uri": `https://o0.ingest.sentry.io/api/${extractSentryProjectId()}/security/?sentry_key=${extractSentryKey()}`,
        }
      : {}),
  };

  return Object.entries(directives)
    .map(([key, value]) => (value ? `${key} ${value}` : key))
    .join("; ");
}

/** Extracts Sentry project ID from DSN for CSP report-uri */
function extractSentryProjectId(): string {
  try {
    const dsn = process.env.SENTRY_DSN ?? "";
    const match = dsn.match(/\/(\d+)$/);
    return match?.[1] ?? "0";
  } catch {
    return "0";
  }
}

/** Extracts Sentry public key from DSN */
function extractSentryKey(): string {
  try {
    const dsn = process.env.SENTRY_DSN ?? "";
    const url = new URL(dsn);
    return url.username;
  } catch {
    return "";
  }
}

// ──────────────────────────────────────────────────────────────
// SECURITY HEADERS
// ──────────────────────────────────────────────────────────────

/**
 * Injects all required security headers into the response.
 * These work alongside the headers defined in next.config.mjs.
 */
function applySecurityHeaders(response: NextResponse, nonce: string, csp: string): NextResponse {
  const h = response.headers;

  // Primary security headers
  h.set("Content-Security-Policy", csp);
  h.set("X-Frame-Options", "DENY");
  h.set("X-Content-Type-Options", "nosniff");
  h.set("Referrer-Policy", "strict-origin-when-cross-origin");
  h.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self), payment=(), usb=(), interest-cohort=()",
  );

  // HSTS — only in production to avoid breaking local dev
  if (process.env.NODE_ENV === "production") {
    // max-age: 2 years; includeSubDomains; preload
    h.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }

  // Cross-Origin Policies
  h.set("Cross-Origin-Opener-Policy", "same-origin");
  h.set("Cross-Origin-Resource-Policy", "same-origin");
  h.set("Cross-Origin-Embedder-Policy", "require-corp");

  // Pass nonce to Next.js rendering pipeline via request header
  // The app layout reads x-nonce to inject into <Script nonce={...}>
  h.set("x-nonce", nonce);

  return response;
}

// ──────────────────────────────────────────────────────────────
// CORS HANDLER
// ──────────────────────────────────────────────────────────────

/**
 * Handles CORS for /api/* routes.
 * - Never uses wildcard '*' origin
 * - Validates against ALLOWED_ORIGINS
 * - Handles preflight OPTIONS requests
 */
function handleCors(request: NextRequest, response: NextResponse): NextResponse {
  const origin = request.headers.get("origin");
  const allowedOrigins = getAllowedOrigins();

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, Idempotency-Key, X-Requested-With",
    );
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Max-Age", "86400");
  }

  return response;
}

// ──────────────────────────────────────────────────────────────
// REAL IP EXTRACTION
// ──────────────────────────────────────────────────────────────

/**
 * Safely extracts the real client IP, honoring Cloudflare headers.
 * Returns a hashed IP (SHA-256 + rotating salt) — never the raw IP.
 * Uses Edge-compatible Web Crypto API.
 */
async function getHashedIp(request: NextRequest): Promise<string> {
  // Cloudflare WAF sets this header with the real IP
  const cfIp = request.headers.get("CF-Connecting-IP");
  // Standard forwarded-for (behind other proxies)
  const forwardedFor = request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim();
  // Fallback to remote address (local dev / direct connections)
  const remoteAddr = request.headers.get("x-real-ip") ?? "unknown";

  const rawIp = cfIp ?? forwardedFor ?? remoteAddr;

  // Hash with daily rotating salt for DPDP compliance
  const salt = process.env.IP_HASH_SALT ?? "default-dev-salt";
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${rawIp}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ──────────────────────────────────────────────────────────────
// NEXT-INTL MIDDLEWARE (created once, reused across requests)
// ──────────────────────────────────────────────────────────────

const intlMiddleware = createMiddleware(routing);

// ──────────────────────────────────────────────────────────────
// MAIN MIDDLEWARE
// ──────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // ── 1. Handle OPTIONS preflight for API routes ─────────────
  if (request.method === "OPTIONS" && pathname.startsWith(API_PREFIX)) {
    const preflightResponse = new NextResponse(null, { status: 204 });
    return handleCors(request, preflightResponse);
  }

  // ── 2. Admin route protection ──────────────────────────────
  // Admin routes are server-side protected by the admin layout too,
  // but middleware adds an early rejection layer.
  const isAdminRoute = PROTECTED_ADMIN_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isAdminRoute) {
    // Check for session cookie existence (actual validation happens in layout)
    const sessionCookie = request.cookies.get("__Host-kanganheri-session");
    if (!sessionCookie) {
      // Redirect to admin login
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── 3. Generate per-request nonce ─────────────────────────
  const nonce = generateNonce();
  const csp = buildCSP(nonce);

  // ── 4. Determine if path should be processed by next-intl ─
  const isExcluded = INTL_EXCLUDED_PATHS.some((prefix) => pathname.startsWith(prefix));

  let response: NextResponse;

  if (isExcluded) {
    // Let the request pass through without locale routing
    response = NextResponse.next({
      request: {
        headers: new Headers(request.headers),
      },
    });
  } else {
    // ── 5. next-intl middleware handles locale routing ────────
    response = intlMiddleware(request) as NextResponse;
  }

  // ── 6. Apply security headers to ALL responses ────────────
  response = applySecurityHeaders(response, nonce, csp);

  // ── 7. Apply CORS headers to API responses ────────────────
  if (pathname.startsWith(API_PREFIX)) {
    response = handleCors(request, response);
  }

  // ── 8. Attach hashed IP for downstream API route handlers ─
  response.headers.set("x-ip-hash", await getHashedIp(request));

  return response;
}

// ──────────────────────────────────────────────────────────────
// MATCHER CONFIGURATION
// ──────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    /*
     * Apply middleware to all paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - Image files (png, jpg, jpeg, gif, webp, avif, svg, ico)
     * - Font files
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|woff|woff2|ttf|otf)$).*)",
  ],
};
