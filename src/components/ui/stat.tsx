import type { IconComponent } from "@/components/ui/icons";

export function Stat({
  label,
  value,
  hint,
  icon: Icon,
  size = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: IconComponent;
  size?: "default" | "compact";
}) {
  return (
    <div
      className={
        size === "compact"
          ? "card-hover rounded-lg border border-slate-200 bg-white px-4 py-3"
          : "card-hover rounded-lg border border-slate-200 bg-white p-5"
      }
    >
      {Icon ? (
        <div className="flex items-center gap-1.5">
          <Icon className="h-4 w-4 text-slate-400" />
          <p
            className={
              size === "compact"
                ? "text-xs text-slate-500"
                : "text-sm text-slate-500"
            }
          >
            {label}
          </p>
        </div>
      ) : (
        <p
          className={
            size === "compact"
              ? "text-xs text-slate-500"
              : "text-sm text-slate-500"
          }
        >
          {label}
        </p>
      )}
      <p
        className={
          size === "compact"
            ? "mt-1 text-lg font-semibold text-slate-900"
            : "mt-1 text-2xl font-semibold text-slate-900"
        }
      >
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-xs text-slate-400">{hint}</p>
      )}
    </div>
  );
}
