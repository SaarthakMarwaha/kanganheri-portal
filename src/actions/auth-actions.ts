"use server";

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createSession, SESSION_COOKIE_NAME, REFRESH_COOKIE_NAME } from "@/lib/auth/session";
import { getHashedClientIp } from "@/lib/security/ip-hasher";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { recordAuditLog } from "@/lib/monitoring/audit-logger";
import { AuditAction } from "@prisma/client";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

export interface LoginFormState {
  status: "idle" | "error";
  message?: string;
}

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

/**
 * Server Action for Admin Login.
 */
export async function adminLoginAction(
  _prevState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const headersList = await headers();
  const ipHash = getHashedClientIp(headersList);
  const userAgent = headersList.get("user-agent") ?? undefined;

  // Rate Limiting: 5 attempts per 15 min per IP hash
  const rateLimit = await checkRateLimit("adminLogin", ipHash);
  if (!rateLimit.allowed) {
    return {
      status: "error",
      message: `Too many login attempts. Please retry in ${rateLimit.retryAfterSeconds} seconds.`,
    };
  }

  const rawEmail = (formData.get("email") as string)?.toLowerCase().trim();
  const rawPassword = formData.get("password") as string;

  const validation = loginSchema.safeParse({
    email: rawEmail,
    password: rawPassword,
  });

  if (!validation.success) {
    return {
      status: "error",
      message: validation.error.issues[0]?.message || "Invalid email or password.",
    };
  }

  const { email, password } = validation.data;

  try {
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      await recordAuditLog({
        action: AuditAction.ADMIN_LOGIN_FAILED,
        entityType: "User",
        ipHash,
        userAgent,
        meta: { email, reason: "User not found or inactive" },
      });

      return {
        status: "error",
        message: "Invalid email or password.",
      };
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      await recordAuditLog({
        actorId: user.id,
        actorRole: user.role,
        action: AuditAction.ADMIN_LOGIN_FAILED,
        entityType: "User",
        entityId: user.id,
        ipHash,
        userAgent,
        meta: { email, reason: "Password mismatch" },
      });

      return {
        status: "error",
        message: "Invalid email or password.",
      };
    }

    // Authentication successful: create session
    const tokens = await createSession({
      userId: user.id,
      ipHash,
      userAgent,
    });

    // Set HttpOnly, Secure, SameSite=Strict cookies
    const cookieStore = await cookies();
    const isProd = process.env.NODE_ENV === "production";

    cookieStore.set(SESSION_COOKIE_NAME, tokens.accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "strict",
      path: "/",
      maxAge: 15 * 60, // 15 mins
    });

    cookieStore.set(REFRESH_COOKIE_NAME, tokens.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "strict",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });
  } catch (err) {
    console.error("Admin login error:", err);
    return {
      status: "error",
      message: "An unexpected error occurred during authentication.",
    };
  }

  // Redirect to Admin dashboard
  redirect("/admin");
}

/**
 * Server Action for Admin Logout.
 */
export async function adminLogoutAction(): Promise<void> {
  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === "production";

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  cookieStore.set(REFRESH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  redirect("/admin/login");
}
