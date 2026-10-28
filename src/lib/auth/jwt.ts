import { SignJWT, jwtVerify } from "jose";
import type { JwtAccessPayload, JwtRefreshPayload } from "@/types";
import { UserRole } from "@prisma/client";

const ACCESS_SECRET = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET ?? "kanganheri-access-secret-minimum-32-chars-long!",
);

const REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET ?? "kanganheri-refresh-secret-minimum-32-chars-long!",
);

const ACCESS_EXPIRY = `${process.env.JWT_ACCESS_EXPIRY_SECONDS ?? "900"}s`; // 15m default
const REFRESH_EXPIRY = `${process.env.JWT_REFRESH_EXPIRY_SECONDS ?? "2592000"}s`; // 30d default

/**
 * Signs a short-lived access JWT (15 minutes).
 */
export async function signAccessToken(payload: {
  sub: string;
  role: UserRole;
  sessionId: string;
}): Promise<string> {
  return await new SignJWT({
    role: payload.role,
    sessionId: payload.sessionId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(ACCESS_EXPIRY)
    .sign(ACCESS_SECRET);
}

/**
 * Verifies and decodes an access JWT.
 */
export async function verifyAccessToken(token: string): Promise<JwtAccessPayload | null> {
  try {
    const { payload } = await jwtVerify(token, ACCESS_SECRET);
    return {
      sub: payload.sub as string,
      role: (payload.role as UserRole) ?? UserRole.MODERATOR,
      sessionId: payload.sessionId as string,
      iat: payload.iat ?? Math.floor(Date.now() / 1000),
      exp: payload.exp ?? Math.floor(Date.now() / 1000) + 900,
    };
  } catch {
    return null;
  }
}

/**
 * Signs a long-lived refresh JWT (30 days).
 */
export async function signRefreshToken(payload: {
  sub: string;
  sessionId: string;
  familyId: string;
}): Promise<string> {
  return await new SignJWT({
    sessionId: payload.sessionId,
    familyId: payload.familyId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(REFRESH_EXPIRY)
    .sign(REFRESH_SECRET);
}

/**
 * Verifies and decodes a refresh JWT.
 */
export async function verifyRefreshToken(token: string): Promise<JwtRefreshPayload | null> {
  try {
    const { payload } = await jwtVerify(token, REFRESH_SECRET);
    return {
      sub: payload.sub as string,
      sessionId: payload.sessionId as string,
      familyId: payload.familyId as string,
      iat: payload.iat ?? Math.floor(Date.now() / 1000),
      exp: payload.exp ?? Math.floor(Date.now() / 1000) + 2592000,
    };
  } catch {
    return null;
  }
}
