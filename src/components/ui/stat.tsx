export function Stat({
  label,
  value,
  size = "default",
}: {
  label: string;
  value: string | number;
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
      <p
        className={
          size === "compact"
            ? "text-xs text-slate-500"
            : "text-sm text-slate-500"
        }
      >
        {label}
      </p>
      <p
        className={
          size === "compact"
            ? "mt-1 text-lg font-semibold text-slate-900"
            : "mt-1 text-2xl font-semibold text-slate-900"
        }
      >
        {value}
      </p>
    </div>
  );
}
