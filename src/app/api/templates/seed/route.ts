import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/client";
import { authorizeApi, isApiError } from "@/lib/auth/api";
import { seedStarterTemplates } from "@/modules/templates/service";

export const dynamic = "force-dynamic";

export async function POST() {
  const auth = await authorizeApi("owner");
  if (isApiError(auth)) return auth.response;
  await connectDB();

  const created = await seedStarterTemplates();
  return NextResponse.json({ created });
}
