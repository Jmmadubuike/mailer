import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { connectDB } from "@/lib/db/client";
import { readJson } from "@/lib/api";
import { User } from "@/models/User";
import { hashPassword } from "@/lib/security/password";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  await connectDB();
  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
  const user = await User.findOne({
    resetTokenHash: tokenHash,
    resetTokenExpiresAt: { $gt: new Date() },
  });
  if (!user) {
    return NextResponse.json(
      { error: "This reset link is invalid or expired" },
      { status: 400 },
    );
  }

  user.passwordHash = await hashPassword(parsed.data.password);
  user.resetTokenHash = undefined;
  user.resetTokenExpiresAt = undefined;
  await user.save();

  await logAudit({
    actorEmail: user.email,
    actorId: user._id.toString(),
    action: "auth.password_reset",
    targetType: "User",
    targetId: user._id.toString(),
  });

  return NextResponse.json({ ok: true });
}
