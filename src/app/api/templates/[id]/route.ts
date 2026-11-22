import { NextResponse } from "next/server";
import { authorizeApi, isApiError } from "@/lib/auth/api";
import { getTemplate } from "@/modules/templates/service";
import { AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const auth = await authorizeApi(
    "owner",
    "administrator",
    "campaign_manager",
    "viewer",
  );
  if (isApiError(auth)) return auth.response;

  const { id } = await context.params;
  try {
    const template = await getTemplate(id);
    return NextResponse.json({ template });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
