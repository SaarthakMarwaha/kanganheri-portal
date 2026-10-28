import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { dispatchAlert } from "@/lib/monitoring/alerts";

/**
 * GET /api/v1/health
 *
 * Lightweight health check endpoint used by:
 * - Container orchestration readiness/liveness probes
 * - Blue-green deployment readiness checks
 * - Uptime monitoring (Betterstack, UptimeRobot, etc.)
 *
 * Returns HTTP 200 if all critical services are reachable within 100ms.
 * Returns HTTP 503 if any critical service is unavailable.
 */

const HEALTH_TIMEOUT_MS = 2000;

async function checkDatabase(): Promise<{
  status: "ok" | "error";
  latencyMs: number;
  message?: string;
}> {
  const start = Date.now();
  try {
    const { default: db } = await import("@/lib/db");
    await db.$queryRaw`SELECT 1`;
    return { status: "ok", latencyMs: Date.now() - start };
  } catch (err) {
    return {
      status: "error",
      latencyMs: Date.now() - start,
      message: err instanceof Error ? err.message : "Database unreachable",
    };
  }
}

async function checkRedis(): Promise<{
  status: "ok" | "error";
  latencyMs: number;
  message?: string;
}> {
  const start = Date.now();
  try {
    const { redis } = await import("@/lib/redis");
    await redis.ping();
    return { status: "ok", latencyMs: Date.now() - start };
  } catch (err) {
    return {
      status: "error",
      latencyMs: Date.now() - start,
      message: err instanceof Error ? err.message : "Redis unreachable",
    };
  }
}

export async function GET(_request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Health check timeout")), HEALTH_TIMEOUT_MS),
  );

  const [dbCheck, redisCheck] = await Promise.all([
    Promise.race([checkDatabase(), timeoutPromise]).catch((err: Error) => ({
      status: "error" as const,
      latencyMs: HEALTH_TIMEOUT_MS,
      message: err.message,
    })),
    Promise.race([checkRedis(), timeoutPromise]).catch((err: Error) => ({
      status: "error" as const,
      latencyMs: HEALTH_TIMEOUT_MS,
      message: err.message,
    })),
  ]);

  const allHealthy = dbCheck.status === "ok" && redisCheck.status === "ok";
  const anyError = dbCheck.status === "error" || redisCheck.status === "error";

  const overallStatus = allHealthy ? "healthy" : anyError ? "unhealthy" : "degraded";
  const httpStatus = allHealthy ? 200 : 503;

  if (!allHealthy && process.env.NODE_ENV === "production") {
    dispatchAlert({
      level: "CRITICAL",
      title: "Production Healthcheck Failure",
      message: `Health check returned ${overallStatus} (${httpStatus})`,
      context: { database: dbCheck, redis: redisCheck },
    }).catch(() => {});
  }

  const response = {
    status: overallStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    checks: {
      database: dbCheck,
      redis: redisCheck,
    },
    version: process.env.npm_package_version ?? "1.0.0",
    latencyMs: Date.now() - startTime,
  };

  return NextResponse.json(response, {
    status: httpStatus,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Content-Type": "application/json",
    },
  });
}
