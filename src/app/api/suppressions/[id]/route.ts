import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/client";
import { authorizeApi, isApiError } from "@/lib/auth/api";
import { Suppression } from "@/models/Suppression";
import { logAudit } from "@/lib/audit";
import { AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: Context) {
  const auth = await authorizeApi("owner");
  if (isApiError(auth)) return auth.response;
  await connectDB();

  const { id } = await context.params;
  const suppression = await Suppression.findByIdAndDelete(id);
  if (!suppression) throw new AppError("Suppression record not found", 404);

  await logAudit({
    actorEmail: auth.session.email,
    actorId: auth.session.sub,
    action: "suppression.removed",
    targetType: "Suppression",
    targetId: id,
    meta: { email: suppression.email, type: suppression.type },
  });

  return NextResponse.json({ ok: true });
}
