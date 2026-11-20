import { NextResponse } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import { connectDB } from "@/lib/db/client";
import { getEnv } from "@/config/env";
import { readJson } from "@/lib/api";
import { User } from "@/models/User";
import { sendThroughDomain } from "@/lib/resend/send";
import { SendingDomain } from "@/models/SendingDomain";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json({ ok: true });
  }

  await connectDB();
  const user = await User.findOne({ email: parsed.data.email });
  if (user) {
    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await User.findByIdAndUpdate(user._id, {
      $set: {
        resetTokenHash: tokenHash,
        resetTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const resetUrl = `${getEnv().APP_URL}/reset?token=${token}`;
    await sendResetEmail(user.email, resetUrl);
  }

  // Always return success to avoid leaking account existence.
  return NextResponse.json({ ok: true });
}

async function sendResetEmail(to: string, resetUrl: string): Promise<void> {
  const domain = await SendingDomain.findOne({
    isActive: true,
    emergencyKillSwitch: { $ne: true },
    verificationStatus: "verified",
  }).lean();
  if (!domain) {
    console.log(`Password reset for ${to}: ${resetUrl}`);
    return;
  }

  await sendThroughDomain({
    domainId: domain._id.toString(),
    to,
    subject: "Reset your password",
    html: `<p>Reset your password by visiting <a href="${resetUrl}">${resetUrl}</a>. This link expires in one hour.</p>`,
  });
}
