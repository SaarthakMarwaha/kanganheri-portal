import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  // Security: disable x-powered-by header
  poweredByHeader: false,

  // Compress responses
  compress: true,

  // React strict mode for catching potential issues early
  reactStrictMode: true,

  // Experimental features for Next.js 15
  experimental: {
    // Enable React 19 compiler optimizations
    reactCompiler: false,
    // Server Actions are stable in Next.js 15
    serverActions: {
      // Max body size for file uploads (10MB per photo)
      bodySizeLimit: "10mb",
      // Allow server actions from the same origin only
      allowedOrigins: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
        : ["localhost:3000"],
    },
    // Partial pre-rendering requires Next.js canary (disabled for stable 15.0.3)
    // ppr: 'incremental',
  },

  // Image optimization configuration
  images: {
    // Only allow images from trusted external domains
    remotePatterns: [
      {
        protocol: "https",
        hostname: "kanganheri.com",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "cdn.kanganheri.com",
        pathname: "/**",
      },
    ],
    // Serve modern formats; sharp handles WebP/AVIF conversion server-side too
    formats: ["image/avif", "image/webp"],
    // Device breakpoints matching our design system
    deviceSizes: [360, 480, 640, 768, 1024, 1280, 1600],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Minimize layout shift; always set width/height or use fill
    minimumCacheTTL: 86400, // 24 hours
  },

  // Webpack customization
  webpack: (config, { isServer }) => {
    // Suppress sharp binary warnings on client
    if (!isServer) {
      config.externals = [...(config.externals ?? []), { sharp: "sharp" }];
    }

    // Optimize SVGs
    config.module.rules.push({
      test: /\.svg$/i,
      use: ["@svgr/webpack"],
    });

    return config;
  },

  // Redirect www to apex
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.kanganheri.com" }],
        destination: "https://kanganheri.com/:path*",
        permanent: true,
      },
    ];
  },

  // Headers for additional security — primary headers injected in middleware
  // These are fallback defaults
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Prevent MIME type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Deny framing globally
          { key: "X-Frame-Options", value: "DENY" },
          // Minimal referrer leakage
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Permissions policy — restrict powerful browser APIs
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(self), payment=(), usb=(), interest-cohort=()",
          },
        ],
      },
      {
        // Allow service worker scope for offline emergency contacts
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript" },
        ],
      },
    ];
  },

  // Logging (Next.js 15 native log customization)
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === "development",
    },
  },
};

export default withNextIntl(nextConfig);
