import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/client";
import { authorizeApi, isApiError } from "@/lib/auth/api";
import { readJson } from "@/lib/api";
import { AppError } from "@/lib/errors";
import { changeOwnPassword } from "@/modules/users/service";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: Request) {
  const auth = await authorizeApi();
  if (isApiError(auth)) return auth.response;
  await connectDB();

  try {
    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    await changeOwnPassword(
      auth.session.sub,
      parsed.data.currentPassword,
      parsed.data.newPassword,
    );

    await logAudit({
      actorEmail: auth.session.email,
      actorId: auth.session.sub,
      action: "auth.password_change",
      targetType: "User",
      targetId: auth.session.sub,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    throw error;
  }
}
