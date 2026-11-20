import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/client";
import { authorizeApi, isApiError } from "@/lib/auth/api";
import { readJson } from "@/lib/api";
import { USER_ROLES } from "@/models/User";
import { deleteUser, updateUser } from "@/modules/users/service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  role: z.enum(USER_ROLES).optional(),
  isActive: z.boolean().optional(),
});

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const auth = await authorizeApi("owner");
  if (isApiError(auth)) return auth.response;
  await connectDB();

  const { id } = await context.params;
  const parsed = updateSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const user = await updateUser(id, parsed.data);
  return NextResponse.json({
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    },
  });
}

export async function DELETE(_request: Request, context: Context) {
  const auth = await authorizeApi("owner");
  if (isApiError(auth)) return auth.response;
  await connectDB();

  const { id } = await context.params;
  try {
    await deleteUser(id, auth.session.sub);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete" },
      { status: 409 },
    );
  }
}
