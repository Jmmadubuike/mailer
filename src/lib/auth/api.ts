import "server-only";
import { NextResponse } from "next/server";
import { getSession, type SessionPayload } from "@/lib/auth/session";
import type { UserRole } from "@/models/User";

export type ApiAuthResult =
  | { session: SessionPayload }
  | { response: NextResponse };

export async function authorizeApi(...roles: UserRole[]): Promise<ApiAuthResult> {
  const session = await getSession();
  if (!session) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (roles.length > 0 && !roles.includes(session.role)) {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { session };
}

export function isApiError(result: ApiAuthResult): result is { response: NextResponse } {
  return "response" in result;
}
