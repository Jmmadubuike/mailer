"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "@/components/ui/toast";
import { SettingsIcon } from "@/components/ui/icons";
import { ChangePasswordForm } from "@/components/settings/change-password-form";

interface PlatformSettings {
  globalKillSwitch: boolean;
  dailySendLimit: number;
  testMode: boolean;
}

export function SettingsManager({
  settings: initialSettings,
  canEdit,
}: {
  settings: PlatformSettings;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [toast, setToast] = useState<string | null>(null);

  async function save(patch: Partial<PlatformSettings>) {
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!response.ok) {
      setToast("Failed to save settings");
      return;
    }
    const body = await response.json();
    setSettings(body.settings);
    router.refresh();
    setToast("Settings saved");
  }

  return (
    <div className="max-w-2xl">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
          <SettingsIcon className="h-5 w-5 text-slate-400" />
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Platform-wide sending safeguards.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        <SettingRow
          label="Test mode"
          description="Block delivery to real audiences. Use for development and staging."
        >
          <Toggle
            checked={settings.testMode}
            disabled={!canEdit}
            onChange={(value) => save({ testMode: value })}
          />
        </SettingRow>

        <SettingRow
          label="Global kill switch"
          description="Immediately stop all campaign sending across every domain."
        >
          <Toggle
            checked={settings.globalKillSwitch}
            disabled={!canEdit}
            onChange={(value) => save({ globalKillSwitch: value })}
          />
        </SettingRow>

        <SettingRow
          label="Daily sending limit"
          description="Maximum accepted deliveries per day. 0 means unlimited."
        >
          <input
            type="number"
            min={0}
            aria-label="Daily sending limit"
            disabled={!canEdit}
            value={settings.dailySendLimit}
            onChange={(event) =>
              setSettings({
                ...settings,
                dailySendLimit: Number(event.target.value),
              })
            }
            onBlur={() => save({ dailySendLimit: settings.dailySendLimit })}
            className="w-32 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 disabled:bg-slate-100"
          />
        </SettingRow>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900">Password</h2>
        <p className="mt-1 text-sm text-slate-500">
          Update the password you use to sign in.
        </p>
        <div className="mt-4">
          <ChangePasswordForm />
        </div>
      </div>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5">
      <div>
        <p className="font-medium text-slate-900">{label}</p>
        <p className="mt-0.5 text-sm text-slate-500">{description}</p>
      </div>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
        checked ? "bg-slate-900" : "bg-slate-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}
