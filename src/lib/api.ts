import "server-only";
import { AppError } from "@/lib/errors";

export async function readJson<T = unknown>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new AppError("Invalid JSON body", 400);
  }
}
