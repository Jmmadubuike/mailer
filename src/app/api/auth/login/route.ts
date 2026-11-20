import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/client";
import { User } from "@/models/User";
import { verifyPassword } from "@/lib/security/password";
import { createSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";
import { readJson } from "@/lib/api";
import { AppError } from "@/lib/errors";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

const attempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  await connectDB();

  const parsed = loginSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 },
    );
  }

  const { email, password } = parsed.data;
  const now = Date.now();
  const record = attempts.get(email);

  if (record && record.lockedUntil > now) {
    return NextResponse.json(
      { error: "Too many failed attempts. Try again later." },
      { status: 429 },
    );
  }

  const user = await User.findOne({ email }).select("+passwordHash");
  const passwordOk = user ? await verifyPassword(password, user.passwordHash) : false;

  if (!user || !passwordOk || !user.isActive) {
    const count = record ? record.count + 1 : 1;
    const lockedUntil =
      count >= MAX_ATTEMPTS ? now + WINDOW_MS : record?.lockedUntil ?? 0;
    attempts.set(email, { count, lockedUntil });

    throw new AppError("Invalid email or password", 401);
  }

  attempts.delete(email);
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
}
