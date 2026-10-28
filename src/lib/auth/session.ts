import { createHash, randomUUID } from "crypto";
import { db } from "@/lib/db";
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from "./jwt";
import type { AuthUser } from "@/types";
import { AuditAction } from "@prisma/client";
import { recordAuditLog } from "@/lib/monitoring/audit-logger";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const SESSION_COOKIE_NAME =
  process.env.NODE_ENV === "production" ? "__Host-kanganheri-session" : "kanganheri-session";

export const REFRESH_COOKIE_NAME =
  process.env.NODE_ENV === "production" ? "__Host-kanganheri-refresh" : "kanganheri-refresh";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

/**
 * Creates a brand new authenticated session for a user.
 */
export async function createSession(params: {
  userId: string;
  ipHash?: string | undefined;
  userAgent?: string | undefined;
}): Promise<AuthTokens> {
  const { userId, ipHash, userAgent } = params;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) {
    throw new Error("User account is inactive or not found.");
  }

  const familyId = randomUUID();
  const rawSessionId = randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  // Generate tokens
  const refreshToken = await signRefreshToken({
    sub: user.id,
    sessionId: rawSessionId,
    familyId,
  });

  const tokenHash = hashToken(refreshToken);

  const session = await db.session.create({
    data: {
      id: rawSessionId,
      userId: user.id,
      tokenHash,
      familyId,
      ipHash: ipHash ?? null,
      userAgent: userAgent ?? null,
      expiresAt,
    },
  });

  const accessToken = await signAccessToken({
    sub: user.id,
    role: user.role,
    sessionId: session.id,
  });

  // Update user last login
  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await recordAuditLog({
    actorId: user.id,
    actorRole: user.role,
    action: AuditAction.ADMIN_LOGIN,
    entityType: "Session",
    entityId: session.id,
    ipHash,
    userAgent,
  });

  return {
    accessToken,
    refreshToken,
    sessionId: session.id,
  };
}

/**
 * Rotates an existing refresh token with automatic reuse detection.
 * If a revoked or replayed refresh token is presented, revokes all sessions in the family.
 */
export async function rotateSession(params: {
  rawRefreshToken: string;
  ipHash?: string;
  userAgent?: string;
}): Promise<AuthTokens | null> {
  const { rawRefreshToken, ipHash, userAgent } = params;

  const payload = await verifyRefreshToken(rawRefreshToken);
  if (!payload) {
    return null;
  }

  const tokenHash = hashToken(rawRefreshToken);

  const session = await db.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  // REUSE DETECTION: If token record is not found OR session is already revoked,
  // someone attempted to replay an old/compromised token.
  if (!session || session.isRevoked) {
    const familyToRevoke = payload.familyId;
    console.warn(`[SECURITY] Token reuse detected! Revoking token family: ${familyToRevoke}`);

    await db.session.updateMany({
      where: { familyId: familyToRevoke },
      data: { isRevoked: true },
    });

    await recordAuditLog({
      actorId: payload.sub,
      action: AuditAction.TOKEN_REVOKED,
      entityType: "SessionFamily",
      entityId: familyToRevoke,
      ipHash,
      userAgent,
      meta: { reason: "Token reuse detected" },
    });

    return null;
  }

  // Token is valid; revoke the old token
  await db.session.update({
    where: { id: session.id },
    data: { isRevoked: true },
  });

  // Issue new session in the same family
  const newSessionId = randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const newRefreshToken = await signRefreshToken({
    sub: session.user.id,
    sessionId: newSessionId,
    familyId: session.familyId,
  });

  const newTokenHash = hashToken(newRefreshToken);

  const newSession = await db.session.create({
    data: {
      id: newSessionId,
      userId: session.user.id,
      tokenHash: newTokenHash,
      familyId: session.familyId,
      ipHash: ipHash ?? null,
      userAgent: userAgent ?? null,
      expiresAt,
    },
  });

  const newAccessToken = await signAccessToken({
    sub: session.user.id,
    role: session.user.role,
    sessionId: newSession.id,
  });

  await recordAuditLog({
    actorId: session.user.id,
    actorRole: session.user.role,
    action: AuditAction.TOKEN_REFRESH,
    entityType: "Session",
    entityId: newSession.id,
    ipHash,
    userAgent,
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    sessionId: newSession.id,
  };
}

/**
 * Validates current session from incoming request cookies or Authorization header.
 * Automatically tries token refresh if access token expired but refresh token is valid.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (accessToken) {
    const payload = await verifyAccessToken(accessToken);
    if (payload) {
      const user = await db.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, displayName: true, role: true, isActive: true },
      });
      if (user && user.isActive) {
        return {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          sessionId: payload.sessionId,
        };
      }
    }
  }

  // Access token invalid or expired. Check for refresh token to rotate
  const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;
  if (!refreshToken) {
    return null;
  }

  const rotated = await rotateSession({ rawRefreshToken: refreshToken });
  if (!rotated) {
    return null;
  }

  // Fetch user for rotated session
  const payload = await verifyAccessToken(rotated.accessToken);
  if (!payload) return null;

  const user = await db.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, displayName: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) return null;

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    sessionId: payload.sessionId,
  };
}

/**
 * Attaches HttpOnly, Secure, SameSite=Strict cookies to a response.
 */
export function setSessionCookies(response: NextResponse, tokens: AuthTokens): void {
  const isProd = process.env.NODE_ENV === "production";

  // Access token (15 mins)
  response.cookies.set(SESSION_COOKIE_NAME, tokens.accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    maxAge: 15 * 60, // 15 minutes
  });

  // Refresh token (30 days)
  response.cookies.set(REFRESH_COOKIE_NAME, tokens.refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

/**
 * Clears authentication cookies upon logout.
 */
export function clearSessionCookies(response: NextResponse): void {
  const isProd = process.env.NODE_ENV === "production";

  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set(REFRESH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}
