# ==============================================================================
# Kanganheri Darpan (कांगनहेड़ी दर्पण) — Production Multi-Stage Dockerfile
# Optimized for Next.js 15 Standalone Mode with Non-Root Security
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Base Alpine Environment
# ------------------------------------------------------------------------------
FROM node:20-alpine AS base

# Install libc6-compat for compatibility with native binaries (Sharp, Prisma)
RUN apk add --no-cache libc6-compat dumb-init
WORKDIR /app

# ------------------------------------------------------------------------------
# Stage 2: Dependencies Installation
# ------------------------------------------------------------------------------
FROM base AS deps

# Copy dependency manifests
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install exact dependencies with npm ci (cleans cache to reduce layer size)
RUN npm ci --no-audit --prefer-offline

# ------------------------------------------------------------------------------
# Stage 3: Build & Static Asset Generation
# ------------------------------------------------------------------------------
FROM base AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Provide build-time fallback environment variables for Prisma client and static analysis
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DATABASE_URL="postgresql://kanganheri_app:buildtime_placeholder@localhost:5432/kanganheri_db"
ENV DIRECT_URL="postgresql://kanganheri_app:buildtime_placeholder@localhost:5432/kanganheri_db"

# Generate Prisma Client for the alpine runtime target
RUN npx prisma generate

# Build Next.js application in standalone mode
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 4: Production Runner (Least Privilege, Non-Root)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Install minimal runtime dependencies (dumb-init for PID 1 signal forwarding)
RUN apk add --no-cache dumb-init wget curl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create unprivileged system group and user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set up uploads directory with appropriate write permissions
RUN mkdir -p /app/uploads && chown -R nextjs:nodejs /app/uploads

# Copy public assets
COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema and generated engines for runtime migrations
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Switch to unprivileged non-root user
USER nextjs

# Expose HTTP port
EXPOSE 3000

# Container healthcheck using Kanganheri civic health API
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/v1/health || exit 1

# Use dumb-init to properly handle UNIX signals (SIGTERM, SIGINT) in container
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "server.js"]
