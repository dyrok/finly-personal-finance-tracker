import { formatMoney } from "../lib/format";

const TONES = {
  brand: "from-brand-600 via-brand-700 to-brand-900 dark:from-brand-700 dark:via-brand-800 dark:to-brand-950",
  success: "from-emerald-600 via-emerald-700 to-emerald-900 dark:from-emerald-700 dark:via-emerald-800 dark:to-emerald-950",
  danger: "from-rose-600 via-rose-700 to-rose-900 dark:from-rose-700 dark:via-rose-800 dark:to-rose-950",
  warn: "from-amber-500 via-amber-600 to-amber-800 dark:from-amber-600 dark:via-amber-700 dark:to-amber-900",
  slate: "from-slate-500 via-slate-600 to-slate-800 dark:from-gray-600 dark:via-gray-700 dark:to-gray-900",
};

export default function StatCard({ label, value, icon: Icon, tone = "brand", sub, currency }) {
  return (
    <div
      className={`rounded-[20px] bg-gradient-to-br ${TONES[tone] || TONES.brand} text-white p-5 shadow-lg relative overflow-hidden`}
    >
      <div className="absolute -right-6 -top-6 opacity-[0.07]">
        {Icon ? <Icon className="w-28 h-28" /> : null}
      </div>
      <div className="relative">
        <div className="text-xs font-medium uppercase tracking-wider opacity-80">{label}</div>
        <div className="text-2xl sm:text-3xl font-bold mt-1.5 tabular-nums tracking-tight">
          {typeof value === "number" ? formatMoney(value, currency) : value}
        </div>
        {sub ? <div className="text-xs opacity-80 mt-1">{sub}</div> : null}
      </div>
    </div>
  );
}
