import "server-only";
import { ApplicationSetting } from "@/models/ApplicationSetting";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function countKey(email: string): string {
  return `login_fail_count:${email.toLowerCase()}`;
}

function lockKey(email: string): string {
  return `login_fail_lock:${email.toLowerCase()}`;
}

export async function isLoginLocked(email: string): Promise<boolean> {
  const doc = await ApplicationSetting.findOne({ key: lockKey(email) }).lean();
  const lockedUntil = Number(doc?.value ?? 0);
  return lockedUntil > Date.now();
}

export async function recordLoginFailure(email: string): Promise<void> {
  const countDoc = await ApplicationSetting.findOneAndUpdate(
    { key: countKey(email) },
    { $inc: { value: 1 } },
    { upsert: true, new: true },
  );
  const count = Number(countDoc?.value ?? 0);
  const lockedUntil =
    count >= MAX_ATTEMPTS ? Date.now() + WINDOW_MS : 0;
  await ApplicationSetting.findOneAndUpdate(
    { key: lockKey(email) },
    { $set: { value: lockedUntil } },
    { upsert: true },
  );
}

export async function clearLoginFailures(email: string): Promise<void> {
  await ApplicationSetting.deleteMany({
    key: { $in: [countKey(email), lockKey(email)] },
  });
}
