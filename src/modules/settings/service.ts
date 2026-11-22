import "server-only";
import { ApplicationSetting } from "@/models/ApplicationSetting";
import { AppError } from "@/lib/errors";
import {
  dailyCounterKey,
  reservationAccepted,
} from "@/modules/settings/limits";

export interface PlatformSettings {
  globalKillSwitch: boolean;
  dailySendLimit: number;
  testMode: boolean;
}

const DEFAULTS: PlatformSettings = {
  globalKillSwitch: false,
  dailySendLimit: 0,
  testMode: false,
};

const KEYS = Object.keys(DEFAULTS);

export async function getSettings(): Promise<PlatformSettings> {
  const docs = await ApplicationSetting.find({
    key: { $in: KEYS },
  }).lean();
  const map = Object.fromEntries(docs.map((doc) => [doc.key, doc.value]));

  return {
    globalKillSwitch: Boolean(
      map.globalKillSwitch ?? DEFAULTS.globalKillSwitch,
    ),
    dailySendLimit: Number(map.dailySendLimit ?? DEFAULTS.dailySendLimit),
    testMode: Boolean(map.testMode ?? DEFAULTS.testMode),
  };
}

export async function updateSettings(
  patch: Partial<PlatformSettings>,
): Promise<PlatformSettings> {
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined || !KEYS.includes(key)) continue;
    await ApplicationSetting.findOneAndUpdate(
      { key },
      { $set: { key, value } },
      { upsert: true },
    );
  }
  return getSettings();
}

export async function assertSendingEnabled(): Promise<void> {
  const settings = await getSettings();

  if (settings.globalKillSwitch) {
    throw new AppError("Sending is disabled by the global kill switch", 409);
  }
  if (settings.testMode) {
    throw new AppError("Sending is disabled while test mode is enabled", 409);
  }
}

export async function reserveDailySend(): Promise<{
  ok: boolean;
  key?: string;
}> {
  const settings = await getSettings();
  if (settings.dailySendLimit <= 0) return { ok: true };

  const key = dailyCounterKey(new Date());
  const doc = await ApplicationSetting.findOneAndUpdate(
    { key },
    { $inc: { value: 1 } },
    { upsert: true, new: true },
  );
  const used = Number(doc?.value ?? 0);

  if (!reservationAccepted(used, settings.dailySendLimit)) {
    await ApplicationSetting.updateOne({ key }, { $inc: { value: -1 } });
    return { ok: false };
  }
  return { ok: true, key };
}

export async function releaseDailySend(key?: string): Promise<void> {
  const settings = await getSettings();
  if (settings.dailySendLimit <= 0) return;
  if (!key) return;
  await ApplicationSetting.updateOne(
    { key },
    { $inc: { value: -1 } },
  );
}
