import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/client";
import { authorizeApi, isApiError } from "@/lib/auth/api";
import { Suppression } from "@/models/Suppression";
import { logAudit } from "@/lib/audit";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: Context) {
  const auth = await authorizeApi("owner");
  if (isApiError(auth)) return auth.response;
  await connectDB();

  const { id } = await context.params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json(
      { error: "Suppression record not found" },
      { status: 404 },
    );
  }
  const suppression = await Suppression.findById(id);
  if (!suppression) {
    return NextResponse.json(
      { error: "Suppression record not found" },
      { status: 404 },
    );
  }
  if (suppression.type === "bounce" || suppression.type === "complaint") {
    return NextResponse.json(
      {
        error:
          "Bounce and complaint suppressions cannot be removed to protect sender reputation",
      },
      { status: 409 },
    );
  }
  await Suppression.findByIdAndDelete(id);

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
