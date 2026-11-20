import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getEnv } from "@/config/env";
import type { UserRole } from "@/models/User";

export const SESSION_COOKIE = "mailer_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

export interface SessionPayload {
  sub: string;
  name: string;
  email: string;
  role: UserRole;
}

function secretKey(): Uint8Array {
  return new TextEncoder().encode(getEnv().AUTH_SECRET);
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT({
    name: payload.name,
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secretKey());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: ["HS256"],
    });
    if (!payload.sub) return null;

    return {
      sub: payload.sub,
      name: String(payload.name ?? ""),
      email: String(payload.email ?? ""),
      role: payload.role as UserRole,
    };
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
