import "server-only";
import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "@/lib/auth/session";
import type { UserRole } from "@/models/User";

export async function requireUser(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireRole(...roles: UserRole[]): Promise<SessionPayload> {
  const session = await requireUser();
  if (!roles.includes(session.role)) {
    redirect("/dashboard");
  }
  return session;
}

export function hasRole(
  session: SessionPayload | null,
  ...roles: UserRole[]
): boolean {
  return !!session && roles.includes(session.role);
}
