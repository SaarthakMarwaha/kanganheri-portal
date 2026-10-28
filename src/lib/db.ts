/**
 * Pooled Prisma Client
 *
 * Implements the singleton pattern to prevent connection pool exhaustion
 * in Next.js development hot-reload and serverless environments.
 *
 * Configuration:
 * - DATABASE_URL → connection pooler (PgBouncer / Supabase Supavisor)
 *   with `?pgbouncer=true&connection_limit=10` query params
 * - DIRECT_URL   → direct PostgreSQL connection (migrations only)
 *
 * Connection limits:
 * - Dev: 5 connections (local PostgreSQL)
 * - Production: 10 connections (PgBouncer manages the actual pool)
 */

import { PrismaClient } from "@prisma/client";

// Type augmentation for global singleton
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    // Error formatting: minimal in production, pretty in development
    errorFormat: process.env.NODE_ENV === "development" ? "pretty" : "minimal",
  });
}

/**
 * Singleton Prisma client instance.
 *
 * In development, we attach the client to `globalThis` to prevent
 * creating new connections on every hot-reload cycle.
 *
 * In production (serverless / Edge), a new instance is always created
 * since globalThis is ephemeral per invocation.
 */
const db: PrismaClient =
  process.env.NODE_ENV === "production"
    ? createPrismaClient()
    : (globalThis.__prisma ??= createPrismaClient());

export default db;

// Named export for tests
export { db };
