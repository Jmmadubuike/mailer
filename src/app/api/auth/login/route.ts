import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/client";
import { User } from "@/models/User";
import { verifyPassword } from "@/lib/security/password";
import { createSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { readJson } from "@/lib/api";
import { AppError } from "@/lib/errors";
import {
  clearLoginFailures,
  isLoginLocked,
  recordLoginFailure,
} from "@/lib/auth/throttle";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  await connectDB();

  try {
  const parsed = loginSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 },
    );
  }

  const { email, password } = parsed.data;

  if (await isLoginLocked(email)) {
    return NextResponse.json(
      { error: "Too many failed attempts. Try again later." },
      { status: 429 },
    );
  }

  const user = await User.findOne({ email }).select("+passwordHash");
  const passwordOk = user ? await verifyPassword(password, user.passwordHash) : false;

  if (!user || !passwordOk || !user.isActive) {
    await recordLoginFailure(email);
    throw new AppError("Invalid email or password", 401);
  }

  await clearLoginFailures(email);
  await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

  await createSession({
    sub: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  });

  await logAudit({
    actorEmail: user.email,
    actorId: user._id.toString(),
    action: "auth.login",
    targetType: "User",
    targetId: user._id.toString(),
  });

  return NextResponse.json({
    ok: true,
    user: { name: user.name, email: user.email, role: user.role },
  });
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
