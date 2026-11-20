import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/client";
import { authorizeApi, isApiError } from "@/lib/auth/api";
import { readJson } from "@/lib/api";
import { setUserPassword } from "@/modules/users/service";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const auth = await authorizeApi("owner", "administrator");
  if (isApiError(auth)) return auth.response;
  await connectDB();

  const { id } = await context.params;
  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await setUserPassword(id, parsed.data.password);
  await logAudit({
    actorEmail: auth.session.email,
    actorId: auth.session.sub,
    action: "user.password_reset",
    targetType: "User",
    targetId: id,
  });
  return NextResponse.json({ ok: true });
}
